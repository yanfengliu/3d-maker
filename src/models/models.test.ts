import * as T from 'three'
import { describe, expect, it } from 'vitest'
import { characterRig } from '../animation/rig'
import { inspectAsset } from '../capabilities/runtime'
import { catalog } from '../data/recipe'
import { extraAssets } from './collections'
import { buildModel } from './index'

type PaintedMesh = T.Mesh<T.BufferGeometry, T.MeshStandardMaterial | T.MeshStandardMaterial[]>

function meshes(root: T.Object3D) {
  const result: PaintedMesh[] = []
  root.traverse(part => { if (part instanceof T.Mesh) result.push(part as PaintedMesh) })
  return result
}

describe.each(catalog)('$recipe.name', ({ recipe, category }) => {
  it('builds finite geometry that uses both requested paint colors', () => {
    const scene = buildModel({ ...recipe, primary: '#ed5a19', accent: '#b6e623' })
    const colors = meshes(scene).flatMap(mesh => [mesh.material].flat().map(material => material.color.getHexString()))
    expect(colors).toEqual(expect.arrayContaining(['ed5a19', 'b6e623']))
    const bounds = new T.Box3().setFromObject(scene)
    const size = bounds.getSize(new T.Vector3()).toArray()
    expect(size.every(v => Number.isFinite(v) && v > 0.5 && v < 5)).toBe(true)
    expect(bounds.min.y).toBeGreaterThan(-0.025)
  })
  it('supports live dimensions and simplified geometry', () => {
    const normal = buildModel(recipe)
    const changed = buildModel({ ...recipe, scale: 1.25, proportion: 1.4, detail: false })
    expect(changed.scale.toArray()).toEqual([1.75, 1.25, 1.25])
    function vertices(model: T.Group) {
      return meshes(model).reduce((count, mesh) => count + mesh.geometry.getAttribute('position').count, 0)
    }
    expect(vertices(changed)).toBeLessThan(vertices(normal))
    for (const clip of normal.animations) {
      for (const track of clip.tracks) {
        expect(changed.getObjectByName(T.PropertyBinding.parseTrackName(track.name).nodeName)).toBeDefined()
      }
    }
  })
  it('preserves the standard recipe format and all clip bindings across HD rebuilds', () => {
    const legacy = { ...recipe }
    delete legacy.quality
    const standard = buildModel({ ...recipe, quality: 'standard' })
    const hd = buildModel({ ...recipe, quality: 'hd' })
    const triangles = (model: T.Group) => meshes(model).reduce((sum, mesh) => {
      const count = mesh.geometry.index?.count ?? mesh.geometry.getAttribute('position').count
      return sum + count / 3
    }, 0)
    expect(triangles(buildModel(legacy))).toBe(triangles(standard))
    expect(triangles(hd)).toBeGreaterThan(triangles(standard) * 2)
    const bindings = (model: T.Group) => model.animations.map(clip => [clip.name, ...clip.tracks.map(track => track.name)])
    expect(bindings(hd)).toEqual(bindings(standard))
    for (const clip of hd.animations) {
      for (const track of clip.tracks) expect(hd.getObjectByName(T.PropertyBinding.parseTrackName(track.name).nodeName)).toBeDefined()
    }
  })
  it('plays every clip through the three.js mixer, targeting stable exportable properties', () => {
    const scene = buildModel(recipe)
    expect(scene.animations.length).toBeGreaterThan(0)
    for (const clip of scene.animations) {
      const mixer = new T.AnimationMixer(scene)
      const tracks = clip.tracks.map(track => {
        const { nodeName, propertyName } = T.PropertyBinding.parseTrackName(track.name)
        expect(['quaternion', 'position', 'scale']).toContain(propertyName)
        const node = scene.getObjectByName(nodeName)
        if (!node) throw new Error('Missing joint ' + nodeName)
        return { node, original: node.matrix.clone() }
      })
      scene.updateMatrixWorld(true)
      for (const tracked of tracks) tracked.original.copy(tracked.node.matrix)
      mixer.clipAction(clip).play()
      mixer.update(clip.duration * 0.193)
      scene.updateMatrixWorld(true)
      expect(tracks.some(({ node, original }) => !node.matrix.equals(original))).toBe(true)
      mixer.stopAllAction()
    }
  })
  it('exposes valid capabilities whose rigged and detachable nodes exist at both detail levels', () => {
    const detailed = buildModel(recipe)
    const simple = buildModel({ ...recipe, detail: false })
    const caps = inspectAsset(detailed)
    const def = extraAssets.find(asset => asset.id === recipe.template)
    if (def) {
      expect(caps.riggedParts.map(p => p.name)).toEqual(def.riggedParts.map(p => p.name))
      expect(caps.detachableParts.map(p => p.name)).toEqual((def.detachableParts ?? []).map(p => p.name))
      expect(caps.physics?.body).toBe(def.physicsBody)
    }
    for (const part of caps.riggedParts) {
      expect(detailed.getObjectByName(part.name)).toBeDefined()
      expect(simple.getObjectByName(part.name)).toBeDefined()
    }
    for (const part of caps.detachableParts) {
      expect(detailed.getObjectByName(part.name)).toBeDefined()
      expect(simple.getObjectByName(part.name)).toBeDefined()
    }
  })
  if (category === 'Character') {
    it('deforms weighted suit vertices when the upper arm moves', () => {
      const scene = buildModel(recipe)
      expect(characterRig(scene)).not.toBeNull()
      const skin = scene.getObjectByName('Suit')
      if (!(skin instanceof T.SkinnedMesh)) throw new Error('Missing skinned suit')
      const armIndex = skin.skeleton.bones.findIndex(bone => bone.name === 'LeftArm')
      expect(armIndex).toBeGreaterThan(0)
      const geometry = skin.geometry as T.BufferGeometry
      const indices = geometry.getAttribute('skinIndex')
      const weights = geometry.getAttribute('skinWeight')
      const vertex = Array.from({ length: indices.count }, (_, i) => i).find(i => indices.getX(i) === armIndex)
      if (vertex === undefined) throw new Error('Upper arm has no bound geometry')
      expect(weights.getX(vertex)).toBe(1)
      scene.updateMatrixWorld(true)
      const rest = skin.getVertexPosition(vertex, new T.Vector3())
      const bone = skin.skeleton.bones[armIndex]
      if (!bone) throw new Error('Missing upper arm')
      bone.rotation.z = 0.6
      scene.updateMatrixWorld(true)
      expect(rest.distanceTo(skin.getVertexPosition(vertex, new T.Vector3()))).toBeGreaterThan(0.01)
    })
  }
})
