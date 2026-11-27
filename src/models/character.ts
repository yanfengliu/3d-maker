import * as T from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { box, mesh, rotationTrack, shell, strut, tube } from './parts'
import type { Finish, Point } from './parts'
import { botGear, pilotGear, suitJoints } from './hd-suit'

function joint(parent: T.Object3D, name: string, position: Point) {
  const bone = new T.Bone()
  bone.name = name
  bone.position.set(...position)
  parent.add(bone)
  return bone
}

// The part positions are authored in joint-local coordinates. Bake them into one
// skinned mesh in bind pose; every rigid panel follows its actual skeleton joint.
function bindSuit(root: T.Group, frame: T.Group, hips: T.Bone) {
  frame.updateMatrixWorld(true)
  const bones: T.Bone[] = []
  const parts = new Map<T.Material, T.BufferGeometry[]>()
  hips.traverse(object => {
    if (object instanceof T.Bone) bones.push(object as T.Bone)
    if (!(object instanceof T.Mesh)) return
    let bone = object.parent
    while (bone && !(bone instanceof T.Bone)) bone = bone.parent
    if (!(bone instanceof T.Bone)) throw new Error('Suit component requires a joint')
    const index = bones.indexOf(bone as T.Bone)
    const source = object.geometry as T.BufferGeometry
    const geometry = source.clone()
    if (!geometry.index) geometry.setIndex(Array.from({ length: geometry.getAttribute('position').count }, (_, i) => i))
    geometry.applyMatrix4(object.matrixWorld)
    const count = geometry.getAttribute('position').count
    const indices = new Uint16Array(count * 4)
    const weights = new Float32Array(count * 4)
    for (let i = 0; i < count; i++) {
      indices[i * 4] = index
      weights[i * 4] = 1
    }
    geometry.deleteAttribute('uv')
    geometry.setAttribute('skinIndex', new T.Uint16BufferAttribute(indices, 4))
    geometry.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4))
    const material = object.material as T.Material
    const batch = parts.get(material) ?? []
    batch.push(geometry)
    parts.set(material, batch)
    source.dispose()
  })
  const geometryGroups = Array.from(parts.values(), batch => {
    const merged = mergeGeometries(batch)
    for (const item of batch) item.dispose()
    return merged
  })
  const geometry = mergeGeometries(geometryGroups, true)
  for (const item of geometryGroups) item.dispose()
  for (const bone of bones) {
    for (const child of [...bone.children]) if (!(child instanceof T.Bone)) bone.remove(child)
  }
  const skin = new T.SkinnedMesh(geometry, [...parts.keys()])
  skin.name = 'Suit'
  skin.castShadow = true
  skin.receiveShadow = true
  skin.add(hips)
  root.add(skin)
  skin.bind(new T.Skeleton(bones))
  skin.computeBoundingBox()
  skin.computeBoundingSphere()
}

function torso(hips: T.Bone, spine: T.Bone, chest: T.Bone, p: Finish, pilot: boolean, detail: boolean) {
  shell(hips, [0, 0, 0], [0.49, 0.23, 0.3], p.dark, 0.49)
  shell(hips, [0, 0.077, 0.005], [0.53, 0.095, 0.337], p.edge, 0.29)
  box(hips, [0, 0.078, 0.179], [0.117, 0.084, 0.021], p.accent)
  shell(spine, [0, 0.058, 0], [0.452, 0.239, 0.3], pilot ? p.primary : p.edge, 0.49)
  shell(chest, [0, 0, 0], [0.62, 0.359, 0.378], p.primary, 0.43)
  shell(chest, [0, 0.031, 0.17], [0.483, 0.231, 0.098], p.accent, 0.46)
  shell(chest, [0, -0.036, -0.234], [0.414, 0.412, 0.207], p.dark, 0.43)
  shell(chest, [0, -0.008, -0.334], [0.323, 0.334, 0.093], p.primary, 0.37)
  if (detail) {
    if (pilot) {
      for (const side of [-1, 1]) box(chest, [side * 0.194, 0.024, 0.216], [0.052, 0.28, 0.039], p.dark).rotation.z = side * 0.25
      for (const x of [-0.16, 0.16]) shell(hips, [x, 0.017, 0.161], [0.113, 0.141, 0.09], p.accent)
    } else {
      shell(chest, [0.107, 0.053, 0.226], [0.139, 0.089, 0.033], p.dark)
      box(chest, [0.107, 0.053, 0.247], [0.093, 0.041, 0.011], p.optic)
      for (const y of [-0.008, 0.036, 0.08]) box(chest, [-0.095, y, 0.225], [0.14, 0.016, 0.015], p.dark)
    }
  }
}

function helmet(head: T.Bone, p: Finish, pilot: boolean, detail: boolean) {
  if (pilot) {
    const dome = mesh(head, new T.SphereGeometry(1, p.hd ? 40 : 12, p.hd ? 24 : 7), p.accent, [0, 0.085, 0])
    dome.scale.set(0.249, 0.248, 0.238)
    if (p.hd) {
      const center = Math.PI / 2
      const gasket = mesh(head, new T.SphereGeometry(1, 44, 16, center - 1.08, 2.16, center - 0.53, 1.06), p.dark, [0, 0.087, 0.009])
      gasket.scale.set(0.259, 0.25, 0.257)
      const glass = mesh(head, new T.SphereGeometry(1, 44, 16, center - 0.97, 1.94, center - 0.4, 0.8), p.optic, [0, 0.087, 0.009])
      glass.scale.set(0.265, 0.254, 0.265)
    } else {
      shell(head, [0, 0.079, 0.116], [0.454, 0.26, 0.293], p.dark, 0.69)
      shell(head, [0, 0.099, 0.179], [0.382, 0.181, 0.188], p.optic, 0.65)
    }
    shell(head, [0, -0.05, 0.128], [0.397, 0.109, 0.237], p.accent, 0.63)
    for (const s of [-1, 1]) {
      tube(head, [s * 0.239, 0.06, -0.018], 0.088, 0.103, 0.072, p.dark).rotation.z = s * Math.PI / 2
      tube(head, [s * 0.275, 0.06, -0.018], 0.059, 0.068, 0.022, p.primary).rotation.z = s * Math.PI / 2
    }
  } else {
    shell(head, [0, 0.071, 0], [0.49, 0.293, 0.358], p.accent, 0.49)
    shell(head, [0, 0.156, -0.021], [0.51, 0.147, 0.372], p.primary, 0.52)
    shell(head, [0, 0.064, 0.16], [0.443, 0.184, 0.11], p.dark, 0.61)
    for (const s of [-1, 1]) {
      tube(head, [s * 0.104, 0.071, 0.222], 0.062, 0.062, 0.032, p.edge).rotation.x = Math.PI / 2
      tube(head, [s * 0.104, 0.071, 0.24], 0.043, 0.043, 0.015, p.optic).rotation.x = Math.PI / 2
    }
    if (detail) {
      strut(head, [-0.177, 0.162, -0.11], [-0.205, 0.405, -0.12], 0.012, p.edge)
      tube(head, [-0.205, 0.405, -0.12], 0.027, 0.027, 0.057, p.dark)
    }
  }
}

function limbs(hips: T.Bone, chest: T.Bone, side: number, p: Finish, pilot: boolean, detail: boolean) {
  const prefix = side < 0 ? 'Right' : 'Left'
  const shoulder = joint(chest, prefix + 'Shoulder', [side * 0.233, 0.097, 0])
  const arm = joint(shoulder, prefix + 'Arm', [side * 0.118, 0, 0])
  const forearm = joint(arm, prefix + 'ForeArm', [side * 0.047, -0.302, 0])
  const hand = joint(forearm, prefix + 'Hand', [side * 0.014, -0.285, 0.018])
  const upperLeg = joint(hips, prefix + 'UpLeg', [side * 0.146, -0.082, 0])
  const shin = joint(upperLeg, prefix + 'Leg', [side * 0.018, -0.382, 0.011])
  const foot = joint(shin, prefix + 'Foot', [side * 0.009, -0.373, 0])
  shell(arm, [0, -0.03, 0], [0.242, 0.201, 0.264], p.accent, 0.65)
  shell(arm, [side * 0.023, -0.172, 0], [0.176, 0.242, 0.202], p.primary, 0.49)
  tube(forearm, [0, 0, 0], 0.094, 0.094, 0.171, p.dark, 10).rotation.z = Math.PI / 2
  shell(forearm, [0, -0.141, 0], [0.17, 0.249, 0.209], pilot ? p.primary : p.accent, 0.47)
  shell(forearm, [0, -0.24, 0.014], [0.167, 0.071, 0.201], p.edge, 0.48)
  shell(hand, [0, -0.043, 0], [0.144, 0.131, 0.162], p.dark, 0.55)
  box(hand, [-side * 0.069, -0.04, 0.06], [0.04, 0.078, 0.059], p.tire)
  shell(upperLeg, [0, -0.163, 0], [0.234, 0.318, 0.268], p.primary, 0.46)
  shell(shin, [0, 0.002, 0.05], [0.213, 0.171, 0.219], pilot ? p.dark : p.accent, 0.58)
  shell(shin, [0, -0.187, 0], [0.193, 0.273, 0.198], pilot ? p.primary : p.edge, 0.59)
  shell(foot, [0, -0.018, 0.059], [0.236, 0.156, 0.371], p.dark, 0.5)
  shell(foot, [0, -0.085, 0.057], [0.251, 0.06, 0.389], p.tire, 0.47)
  if (detail) {
    if (p.hd) suitJoints(arm, forearm, shin, foot, side, p, pilot)
    box(shin, [0, -0.173, 0.103], [0.088, 0.114, 0.017], p.accent)
    box(arm, [side * 0.104, -0.151, 0], [0.016, 0.045, 0.127], p.dark)
    if (pilot) shell(upperLeg, [side * 0.117, -0.167, 0.015], [0.063, 0.151, 0.157], p.accent)
  }
}

export function character(root: T.Group, p: Finish, pilot: boolean, detail: boolean) {
  const frame = new T.Group()
  const hips = joint(frame, 'Hips', [0, 0.957, 0])
  const spine = joint(hips, 'Spine', [0, 0.137, 0])
  const chest = joint(spine, 'Chest', [0, 0.242, 0])
  const neck = joint(chest, 'Neck', [0, 0.187, 0])
  const head = joint(neck, 'Head', [0, 0.128, 0])
  tube(neck, [0, 0.048, 0], 0.121, 0.108, 0.156, p.dark)
  torso(hips, spine, chest, p, pilot, detail)
  helmet(head, p, pilot, detail)
  if (p.hd && detail) {
    if (pilot) pilotGear(head, chest, p)
    else botGear(head, chest, p)
  }
  for (const side of [-1, 1]) limbs(hips, chest, side, p, pilot, detail)
  bindSuit(root, frame, hips)
  root.userData.studioRig = true
  const walk: T.KeyframeTrack[] = []
  const beats = [0, 0.32, 0.64, 0.96, 1.28]
  for (const [side, direction] of [['Left', 1], ['Right', -1]] as const) {
    const swing = [-0.38, 0, 0.38, 0, -0.38].map(v => v * direction)
    const bend = direction > 0 ? [0.13, 0.46, 0.09, 0.08, 0.13] : [0.09, 0.08, 0.13, 0.46, 0.09]
    walk.push(rotationTrack(side + 'UpLeg', 'x', beats, swing))
    walk.push(rotationTrack(side + 'Leg', 'x', beats, bend))
    walk.push(rotationTrack(side + 'Arm', 'x', beats, swing.map(v => -v * 0.77)))
    walk.push(rotationTrack(side + 'ForeArm', 'x', beats, swing.map(v => -0.25 + v * 0.26)))
  }
  const rest = [0, 1, 2.5, 4]
  const idle = [
    rotationTrack('Chest', 'x', rest, [0, 0.019, -0.018, 0]),
    rotationTrack('Head', 'y', rest, [0, 0.21, -0.13, 0]),
    rotationTrack('LeftArm', 'z', rest, [0, 0.041, 0.014, 0]),
  ]
  root.animations = [new T.AnimationClip('Idle', 4, idle), new T.AnimationClip('Walk', 1.28, walk)]
}
