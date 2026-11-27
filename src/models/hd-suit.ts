import * as T from 'three'
import { box, group, mesh, ring, shell, strut, tube } from './parts'
import { fastener } from './hd-detail'
import type { Finish } from './parts'

export function pilotGear(head: T.Bone, chest: T.Bone, p: Finish) {
  for (const side of [-1, 1]) {
    fastener(head, [side * 0.29, 0.061, -0.017], p, 0.036).rotation.z = -side * Math.PI / 2
    const clip = group(chest, '', [side * 0.175, -0.043, 0.239])
    shell(clip, [0, 0, 0], [0.093, 0.096, 0.033], p.edge, 0.49)
    box(clip, [0, 0.007, 0.019], [0.053, 0.039, 0.014], p.tire)
    tube(chest, [side * 0.151, -0.033, -0.329], 0.078, 0.078, 0.331, p.edge, 16)
    for (const y of [-0.149, 0.087]) tube(chest, [side * 0.151, y, -0.329], 0.085, 0.085, 0.032, p.tire, 16)
  }
  const collar = ring(chest, [0, 0.186, 0.006], 0.168, 0.042, 0.065, p.edge)
  collar.scale.z = 0.87
  // Independent chest connection keeps the flight suit animatable at the neck.
  const path = new T.CatmullRomCurve3([new T.Vector3(-0.124, 0.144, 0.115), new T.Vector3(-0.227, 0.113, 0.227), new T.Vector3(-0.274, -0.005, 0.222), new T.Vector3(-0.224, -0.12, 0.179)])
  mesh(chest, new T.TubeGeometry(path, 28, 0.022, 8), p.tire, [0, 0, 0])
  for (const t of [0.14, 0.25, 0.36, 0.47, 0.58, 0.69, 0.8, 0.91]) {
    const pos = path.getPointAt(t)
    const cuff = tube(chest, pos.toArray(), 0.026, 0.026, 0.011, p.edge, 12)
    cuff.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), path.getTangentAt(t))
  }
}

export function botGear(head: T.Bone, chest: T.Bone, p: Finish) {
  for (const s of [-1, 1]) {
    tube(head, [s * 0.104, 0.071, 0.252], 0.024, 0.027, 0.016, p.inset, 16).rotation.x = Math.PI / 2
    fastener(head, [s * 0.172, 0.125, 0.203], p, 0.016).rotation.x = Math.PI / 2
    const radiator = group(chest, '', [s * 0.297, -0.011, -0.07])
    for (let k = 0; k < 5; k++) box(radiator, [0, 0.08 - k * 0.038, 0], [0.042, 0.016, 0.111], p.edge)
  }
  for (const x of [-0.035, 0.014, 0.063]) box(chest, [x, -0.05, 0.228], [0.027, 0.019, 0.01], p.optic)
  for (const x of [-0.152, 0.152]) fastener(chest, [x, 0.108, 0.216], p, 0.014).rotation.x = Math.PI / 2
}

export function suitJoints(arm: T.Bone, forearm: T.Bone, shin: T.Bone, foot: T.Bone, side: number, p: Finish, pilot: boolean) {
  const elbow = group(forearm, '', [side * 0.087, 0, 0])
  elbow.rotation.z = -side * Math.PI / 2
  tube(elbow, [0, 0.006, 0], 0.064, 0.073, 0.019, p.edge, 16)
  fastener(elbow, [0, 0.019, 0], p, 0.031)
  if (pilot) {
    shell(arm, [side * 0.108, -0.079, 0.017], [0.023, 0.105, 0.116], p.primary)
    for (const y of [-0.062, -0.089]) box(arm, [side * 0.123, y, 0.017], [0.009, 0.012, 0.076], p.accent)
    shell(forearm, [0, -0.179, 0.11], [0.115, 0.129, 0.038], p.dark)
    box(forearm, [0, -0.177, 0.131], [0.077, 0.06, 0.016], side > 0 ? p.optic : p.edge)
  } else {
    strut(shin, [side * 0.085, -0.059, -0.035], [side * 0.091, -0.294, -0.042], 0.022, p.alloy, 12)
    shell(arm, [side * 0.11, -0.03, 0.012], [0.034, 0.094, 0.115], p.edge)
    for (const z of [-0.031, 0.056]) fastener(arm, [side * 0.131, -0.03, z], p, 0.013).rotation.z = -side * Math.PI / 2
  }
  for (const z of [-0.055, 0.023, 0.103, 0.183]) {
    shell(foot, [0, -0.104, z], [0.237, 0.026, 0.039], p.tire)
  }
}
