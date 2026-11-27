import * as T from 'three'
import { box, group, mesh, ring, shell, strut, tube } from './parts'
import type { Finish, Point } from './parts'

export function fastener(parent: T.Object3D, at: Point, p: Finish, radius = 0.032) {
  const head = tube(parent, at, radius, radius * 1.1, radius * 0.41, p.alloy, 12)
  tube(head, [0, radius * 0.23, 0], radius * 0.53, radius * 0.53, radius * 0.1, p.inset, 6)
  return head
}

function hose(parent: T.Object3D, path: Point[], radius: number, color: T.Material) {
  const curve = new T.CatmullRomCurve3(path.map(point => new T.Vector3(...point)))
  return mesh(parent, new T.TubeGeometry(curve, 18, radius, 8), color, [0, 0, 0])
}

export function droneHousing(body: T.Group, p: Finish) {
  for (const s of [-1, 1]) {
    // A recessed cooling cassette lives in each side of the graphite chassis.
    const cassette = group(body, '', [s * 0.637, 0.911, -0.006])
    shell(cassette, [0, 0, 0], [0.048, 0.135, 0.687], p.inset, 0.51)
    for (let k = 0; k < 8; k++) {
      box(cassette, [s * 0.023, 0, 0.259 - k * 0.074], [0.026, 0.095, 0.022], p.edge).rotation.x = 0.26
    }
    shell(body, [s * 0.49, 1.315, 0.29], [0.111, 0.035, 0.186], p.dark, 0.5)
    for (const f of [-1, 1]) {
      const clamp = group(body, '', [s * 0.592, 0.166, f * 0.588])
      shell(clamp, [0, 0, 0], [0.152, 0.115, 0.139], p.edge)
      fastener(clamp, [s * 0.078, 0, 0], p, 0.033).rotation.z = -s * Math.PI / 2
      hose(body, [[s * 0.54, 0.81, f * 0.32], [s * 0.739, 0.763, f * 0.46], [s * 0.883, 0.815, f * 0.63]], 0.019, p.tire)
    }
  }
  // Recessed optics above the camera and anodized wheel on its gimbal.
  shell(body, [0, 1.019, 0.834], [0.42, 0.087, 0.053], p.dark, 0.46)
  for (const side of [-1, 1]) {
    const sensor = tube(body, [side * 0.122, 1.02, 0.871], 0.029, 0.033, 0.021, p.optic, 18)
    sensor.rotation.x = Math.PI / 2
  }
}

export function ductDetails(duct: T.Group, rotary: T.Group, p: Finish) {
  ring(duct, [0, 0.06, 0], 0.628, 0.019, 0.033, p.edge)
  for (const a of [0.56, 3.7]) {
    const lock = group(duct, '', [Math.sin(a) * 0.668, 0.091, Math.cos(a) * 0.668])
    lock.rotation.y = a
    shell(lock, [0, 0, 0], [0.082, 0.021, 0.077], p.dark)
    fastener(lock, [0, 0.013, 0], p, 0.015)
  }
  tube(rotary, [0, -0.037, 0], 0.159, 0.155, 0.034, p.edge, 24)
  for (const a of [0.1, 2.19, 4.29]) fastener(rotary, [0.089 * Math.sin(a), 0.076, 0.089 * Math.cos(a)], p, 0.014)
}

export function roverDetails(chassis: T.Group, turret: T.Group, p: Finish) {
  for (const side of [-1, 1]) {
    const rail = group(chassis, '', [side * 0.5, 0.963, -0.746])
    hose(rail, [[0, 0.015, -0.232], [0, 0.128, -0.194], [0, 0.13, 0.185], [0, 0.015, 0.224]], 0.024, p.alloy)
    for (const z of [0.51, 0.77]) fastener(chassis, [side * 0.422, 1.169, z], p, 0.024)
    const footstep = group(chassis, '', [side * 0.722, 0.803, -0.014])
    shell(footstep, [0, 0, 0], [0.153, 0.062, 0.716], p.edge)
    for (const z of [-0.25, -0.15, -0.05, 0.05, 0.15, 0.25]) box(footstep, [0, 0.034, z], [0.106, 0.009, 0.047], p.tire)
    tube(turret, [side * 0.132, 0, 0.248], 0.037, 0.037, 0.011, p.inset, 16).rotation.x = Math.PI / 2
  }
  for (const x of [-0.09, 0, 0.09]) box(chassis, [x, 1.169, 0.653], [0.033, 0.008, 0.181], p.dark).rotation.y = -0.37
}

export function cargoDetails(base: T.Group, lid: T.Group, p: Finish) {
  for (const face of [-1, 1]) {
    const frame = group(base, '', [0, 0.58, face * 0.652])
    frame.rotation.y = face < 0 ? Math.PI : 0
    const x = 0.433
    for (const side of [-1, 1]) {
      shell(frame, [side * x, 0, 0], [0.11, 0.161, 0.047], p.dark)
      fastener(frame, [side * x, 0.04, 0.027], p, 0.023).rotation.x = Math.PI / 2
    }
    hose(frame, [[-x, -0.011, 0.028], [-x, -0.064, 0.092], [-0.3, -0.076, 0.117], [0.29, -0.076, 0.117], [x, -0.064, 0.092], [x, -0.011, 0.028]], 0.026, p.edge)
    strut(frame, [-0.21, -0.076, 0.117], [0.21, -0.076, 0.117], 0.036, p.tire, 12)
    for (const side of [-1, 1]) {
      const latch = group(base, '', [side * 0.755, 0.793, face * 0.658])
      for (const x of [-0.068, 0.068]) strut(latch, [x, -0.082, 0], [x, 0.194, 0], 0.015, p.alloy)
      strut(latch, [-0.068, 0.194, 0], [0.068, 0.194, 0], 0.015, p.alloy)
      fastener(lid, [side * 0.752, 0.263, 0.59 + face * 0.51], p, 0.036)
    }
  }
}

export function towerDetails(base: T.Group, dish: T.Group, p: Finish) {
  // Coax follows the stationary mast; the azimuth and elevation mounts rotate separately.
  hose(base, [[-0.21, 0.89, -0.1], [-0.17, 1.16, -0.087], [-0.108, 1.47, -0.106], [-0.095, 1.89, -0.061]], 0.025, p.tire)
  for (const y of [1.35, 1.61, 1.86]) tube(base, [0, y, 0], 0.124, 0.124, 0.029, p.edge, 12)
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4
    const path: Point[] = [[0.11, -0.196], [0.35, -0.141], [0.56, -0.04], [0.737, 0.079]].map(([r = 0, y = 0]) => [Math.sin(a) * r, y, Math.cos(a) * r])
    hose(dish, path, 0.018, p.edge)
  }
  const feed = group(dish, '', [0, 0.456, 0])
  tube(feed, [0, 0, 0], 0.078, 0.052, 0.073, p.edge, 20)
  tube(feed, [0, 0.042, 0], 0.055, 0.063, 0.02, p.optic, 20)
}
