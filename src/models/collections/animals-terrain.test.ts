import * as T from 'three'
import { describe, expect, it } from 'vitest'
import { finishes } from '../parts'
import type { Recipe } from '../../data/recipe'
import { createAssetController } from '../../capabilities/runtime'
import type { AssetCapabilities } from '../../capabilities/schema'
import { animalsPack, type AnimalAssetDef } from './animals-pack'
import { terrainPack, type TerrainAssetDef } from './terrain-pack'

type PaintedMesh = T.Mesh<T.BufferGeometry, T.MeshStandardMaterial | T.MeshStandardMaterial[]>
type PackDef = AnimalAssetDef | TerrainAssetDef

const allModels: readonly PackDef[] = [...animalsPack, ...terrainPack]

function meshes(root: T.Object3D): PaintedMesh[] {
  const result: PaintedMesh[] = []
  root.traverse(part => { if (part instanceof T.Mesh) result.push(part as PaintedMesh) })
  return result
}

function vertices(root: T.Object3D): number {
  return meshes(root).reduce((sum, m) => sum + m.geometry.getAttribute('position').count, 0)
}

function triangles(root: T.Object3D): number {
  return meshes(root).reduce((sum, m) => {
    const count = m.geometry.index?.count ?? m.geometry.getAttribute('position').count
    return sum + count / 3
  }, 0)
}

function build(def: PackDef, opts: { primary?: string; accent?: string; detail?: boolean; quality?: 'standard' | 'hd' } = {}) {
  const recipe: Recipe = {
    version: 1,
    template: 'cargo-pod',
    name: def.name,
    primary: opts.primary ?? def.primary,
    accent: opts.accent ?? def.accent,
    scale: 1,
    proportion: 1,
    detail: opts.detail ?? true,
    quality: opts.quality ?? 'hd',
  }
  const root = new T.Group()
  root.name = 'Asset'
  def.build(root, finishes(recipe), recipe.detail)
  return root
}

describe('animals & terrain collection manifest', () => {
  it('declares 10 animals and 8 terrain setpieces with unique metadata', () => {
    expect(animalsPack).toHaveLength(10)
    expect(terrainPack).toHaveLength(8)
    expect(allModels).toHaveLength(18)
    expect(new Set(allModels.map(m => m.id)).size).toBe(18)
    expect(new Set(allModels.map(m => m.code)).size).toBe(18)
    expect(new Set(allModels.map(m => m.name)).size).toBe(18)
    for (const def of animalsPack) {
      expect(def.category).toBe('Object')
      expect(def.browseCategory).toBe('animal')
      expect(def.physicsBody).toBe('dynamic')
      expect(def.code).toMatch(/^AN-\d{2}$/)
    }
    for (const def of terrainPack) {
      expect(def.category).toBe('Object')
      expect(def.browseCategory).toBe('terrain')
      expect(def.physicsBody).toBe('static')
      expect(def.code).toMatch(/^TR-\d{2}$/)
    }
    for (const def of allModels) {
      expect(def.primary).toMatch(/^#[\da-f]{6}$/i)
      expect(def.accent).toMatch(/^#[\da-f]{6}$/i)
      expect(def.description.trim().length).toBeGreaterThan(15)
    }
  })
})

describe.each(allModels)('$code $name ($id)', def => {
  it('builds finite grounded geometry using both primary and accent colors', () => {
    const scene = build(def, { primary: '#ed5a19', accent: '#b6e623', detail: true, quality: 'hd' })
    const allMeshes = meshes(scene)
    expect(allMeshes.length).toBeGreaterThan(5)
    for (const m of allMeshes) {
      const pos = m.geometry.getAttribute('position')
      for (let i = 0; i < pos.count; i++) {
        expect(Number.isFinite(pos.getX(i))).toBe(true)
        expect(Number.isFinite(pos.getY(i))).toBe(true)
        expect(Number.isFinite(pos.getZ(i))).toBe(true)
      }
    }
    const colors = allMeshes.flatMap(m => [m.material].flat().map(mat => mat.color.getHexString()))
    expect(colors).toEqual(expect.arrayContaining(['ed5a19', 'b6e623']))
    const bounds = new T.Box3().setFromObject(scene)
    const size = bounds.getSize(new T.Vector3()).toArray()
    expect(size.every(v => Number.isFinite(v) && v > 0.5 && v < 5), `${def.id} size=${JSON.stringify(size)}`).toBe(true)
    expect(bounds.min.y, `${def.id} min.y`).toBeGreaterThan(-0.025)
    expect(bounds.min.y, `${def.id} floating`).toBeLessThan(0.08)
  })

  it('reduces vertices when detail is false while preserving every target node', () => {
    const detailed = build(def, { detail: true, quality: 'hd' })
    const simple = build(def, { detail: false, quality: 'hd' })
    expect(vertices(simple)).toBeLessThan(vertices(detailed))
    const simpleColors = meshes(simple).flatMap(m => [m.material].flat().map(mat => mat.color.getHexString()))
    expect(simpleColors).toEqual(expect.arrayContaining([def.primary.slice(1).toLowerCase(), def.accent.slice(1).toLowerCase()]))
    for (const clip of detailed.animations) {
      for (const track of clip.tracks) {
        expect(simple.getObjectByName(T.PropertyBinding.parseTrackName(track.name).nodeName)).toBeDefined()
      }
    }
    for (const part of def.riggedParts) expect(simple.getObjectByName(part.name)).toBeDefined()
    for (const part of def.detachableParts) expect(simple.getObjectByName(part.name)).toBeDefined()
  })

  it('exceeds 2x triangles in HD while preserving identical clip and track bindings', () => {
    const standard = build(def, { detail: true, quality: 'standard' })
    const hd = build(def, { detail: true, quality: 'hd' })
    expect(triangles(hd), `${def.id} hd=${String(triangles(hd))} std=${String(triangles(standard))}`).toBeGreaterThan(triangles(standard) * 2)
    const bindings = (model: T.Group) => model.animations.map(c => [c.name, ...c.tracks.map(t => t.name)])
    expect(bindings(hd)).toEqual(bindings(standard))
    for (const clip of hd.animations) {
      for (const track of clip.tracks) {
        expect(hd.getObjectByName(T.PropertyBinding.parseTrackName(track.name).nodeName)).toBeDefined()
      }
    }
  })

  it('animates exportable properties visibly at t = duration * 0.193', () => {
    const scene = build(def, { detail: true, quality: 'hd' })
    expect(scene.animations.length).toBeGreaterThan(0)
    for (const clip of scene.animations) {
      const mixer = new T.AnimationMixer(scene)
      const tracks = clip.tracks.map(track => {
        const { nodeName, propertyName } = T.PropertyBinding.parseTrackName(track.name)
        expect(['quaternion', 'position', 'scale']).toContain(propertyName)
        const node = scene.getObjectByName(nodeName)
        if (!node) throw new Error(`Missing animated node ${nodeName}`)
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

  it('wires every rigged and detachable part into the runtime controller', () => {
    const scene = build(def, { detail: true, quality: 'hd' })
    const caps: AssetCapabilities = {
      version: 1,
      name: def.name,
      riggedParts: [...def.riggedParts],
      detachableParts: [...def.detachableParts],
      nightZones: [],
      decals: [],
    }
    const controller = createAssetController(scene, caps)
    for (const part of def.riggedParts) {
      const node = scene.getObjectByName(part.name)
      expect(node, `Missing rigged part ${part.name}`).toBeDefined()
      expect(node ? meshes(node).length : 0).toBeGreaterThan(0)
      const target = Math.abs(part.range[1]) >= Math.abs(part.range[0]) ? part.range[1] : part.range[0]
      expect(controller.openPart(part.name)).toBe(target)
      controller.closePart(part.name)
    }
    for (const part of def.detachableParts) {
      const node = scene.getObjectByName(part.name)
      expect(node, `Missing detachable part ${part.name}`).toBeDefined()
      expect(node ? meshes(node).length : 0).toBeGreaterThan(0)
      controller.setVisible(part.name, false)
      expect(controller.isVisible(part.name)).toBe(false)
      controller.setVisible(part.name, true)
      expect(controller.isVisible(part.name)).toBe(true)
    }
    controller.dispose()
  })
})
