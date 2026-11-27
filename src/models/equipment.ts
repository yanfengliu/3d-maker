import * as T from 'three'
import { box, group, light, rotationTrack, shell, spinTrack, strut, tube } from './parts'
import type { Finish } from './parts'
import { cargoDetails, fastener, roverDetails, towerDetails } from './hd-detail'

export function rover(root: T.Group, p: Finish, detail: boolean) {
  const chassis = group(root, 'Chassis')
  shell(chassis, [0, 0.58, 0], [1.21, 0.43, 2.04], p.dark, 0.4)
  shell(chassis, [0, 0.78, 0], [1.51, 0.27, 2.27], p.primary, 0.43)
  shell(chassis, [0, 0.98, 0.25], [1.38, 0.29, 1.47], p.primary, 0.48)
  shell(chassis, [0, 1.13, 0.64], [1.08, 0.062, 0.47], p.accent, 0.44)
  shell(chassis, [0, 0.983, -0.805], [1.14, 0.19, 0.41], p.dark, 0.38)
  if (detail) {
    for (const x of [-0.44, -0.22, 0, 0.22, 0.44]) box(chassis, [x, 1.09, -0.802], [0.095, 0.032, 0.32], p.edge)
    for (const x of [-0.23, -0.115, 0, 0.115, 0.23]) box(chassis, [x, 0.77, 1.144], [0.068, 0.11, 0.015], p.inset)
  }
  const wheelTracks: T.KeyframeTrack[] = []
  for (const side of [-1, 1]) {
    for (const [i, z] of [-0.79, 0, 0.79].entries()) {
      const x = side * 0.766
      const name = 'Wheel' + (side < 0 ? 'L' : 'R') + String(i)
      const wheel = group(chassis, name, [x, 0.38, z])
      const axle = group(wheel, '')
      axle.rotation.z = -side * Math.PI / 2
      tube(axle, [0, 0, 0], 0.324, 0.324, 0.289, p.tire, 14)
      tube(axle, [0, 0.15, 0], 0.227, 0.246, 0.063, p.edge, 12)
      tube(axle, [0, 0.194, 0], 0.14, 0.173, 0.046, p.primary, 8)
      tube(axle, [0, 0.225, 0], 0.071, 0.071, 0.031, p.dark, 6)
      if (detail) {
        if (p.hd) {
          for (let k = 0; k < 6; k++) {
            const a = Math.PI * k / 3
            fastener(axle, [0.102 * Math.sin(a), 0.22, 0.102 * Math.cos(a)], p, 0.022)
          }
        }
        for (let k = 0; k < 12; k++) {
          const angle = k * Math.PI / 6
          const lug = group(axle, '', [Math.sin(angle) * 0.325, 0, Math.cos(angle) * 0.325])
          lug.rotation.y = angle
          box(lug, [0, 0, 0], [0.106, 0.295, 0.038], p.tire)
        }
      }
      wheelTracks.push(spinTrack(name, 'x', 3, 2))
      strut(chassis, [side * 0.59, 0.58, z + 0.18], [x, 0.4, z], 0.06, p.alloy)
    }
    light(chassis, [side * 0.463, 0.889, 1.092], [0.22, 0.096, 0.064], p)
    box(chassis, [side * 0.664, 0.91, -0.27], [0.074, 0.095, 0.34], p.accent)
  }
  tube(chassis, [0, 1.16, -0.236], 0.228, 0.287, 0.12, p.dark)
  tube(chassis, [0, 1.408, -0.236], 0.11, 0.13, 0.43, p.edge)
  const turret = group(chassis, 'SurveyHead', [0, 1.666, -0.236])
  shell(turret, [0, 0, 0], [0.65, 0.32, 0.37], p.accent, 0.55)
  shell(turret, [0, 0, 0.182], [0.52, 0.226, 0.078], p.dark, 0.37)
  for (const x of [-0.132, 0.132]) tube(turret, [x, 0, 0.228], 0.079, 0.079, 0.035, p.optic).rotation.x = Math.PI / 2
  if (p.hd && detail) roverDetails(chassis, turret, p)
  root.animations = [
    new T.AnimationClip('Traverse', 3, wheelTracks),
    new T.AnimationClip('Survey', 4, [rotationTrack('SurveyHead', 'y', [0, 1, 3, 4], [0, 1.2, -1.2, 0])]),
  ]
}

export function cargo(root: T.Group, p: Finish, detail: boolean) {
  const base = group(root, 'Case')
  shell(base, [0, 0.23, 0], [1.84, 0.36, 1.12], p.dark, 0.38)
  shell(base, [0, 0.646, 0], [1.94, 0.83, 1.23], p.primary, 0.35)
  shell(base, [0, 0.704, 0], [1.98, 0.49, 1.26], p.primary, 0.27)
  for (const x of [-0.754, 0.754]) {
    for (const z of [-0.507, 0.507]) {
      shell(base, [x, 0.166, z], [0.32, 0.267, 0.3], p.dark, 0.43)
      shell(base, [x, 0.626, z], [0.24, 0.92, 0.31], p.edge, 0.36)
    }
    if (detail) {
      for (const z of [-0.646, 0.646]) {
        box(base, [x, 0.535, z], [0.156, 0.48, 0.046], p.dark)
        box(base, [x, 0.665, z * 1.05], [0.182, 0.144, 0.052], p.accent)
      }
    }
  }
  shell(base, [0, 1.023, 0], [1.99, 0.083, 1.27], p.tire, 0.39)
  // Recessed inner tray appears when the lid lifts.
  shell(base, [0, 1.06, 0], [1.71, 0.081, 1.02], p.inset, 0.37)
  for (const x of [-0.47, 0, 0.47]) shell(base, [x, 1.107, 0], [0.377, 0.116, 0.77], p.edge, 0.37)
  const lid = group(base, 'CaseLid', [0, 1.074, -0.589])
  shell(lid, [0, 0.103, 0.586], [2.022, 0.218, 1.306], p.primary, 0.36)
  shell(lid, [0, 0.213, 0.586], [1.74, 0.063, 1.04], p.accent, 0.45)
  for (const x of [-0.752, 0.752]) shell(lid, [x, 0.125, 0.584], [0.24, 0.259, 1.326], p.dark, 0.43)
  if (detail) {
    for (const z of [0.28, 0.47, 0.66, 0.85]) box(lid, [0, 0.25, z], [0.89, 0.027, 0.075], p.primary)
    box(base, [-0.07, 0.71, 0.644], [0.654, 0.244, 0.039], p.dark)
    for (const x of [-0.239, -0.166, -0.096]) box(base, [x, 0.71, 0.666], [0.041, 0.139, 0.009], p.accent).rotation.z = -0.26
    box(base, [0.093, 0.73, 0.666], [0.092, 0.042, 0.009], p.stencil)
  }
  if (p.hd && detail) cargoDetails(base, lid, p)
  root.animations = [
    new T.AnimationClip('Open case', 3, [rotationTrack('CaseLid', 'x', [0, 0.7, 2.25, 3], [0, -1.25, -1.25, 0])]),
  ]
}

export function tower(root: T.Group, p: Finish, detail: boolean) {
  const base = group(root, 'Beacon')
  shell(base, [0, 0.199, 0], [1.28, 0.315, 1.12], p.dark, 0.66)
  shell(base, [0, 0.415, 0], [1.1, 0.24, 0.94], p.primary, 0.63)
  shell(base, [0, 0.697, 0], [0.74, 0.46, 0.66], p.primary, 0.42)
  tube(base, [0, 1.452, 0], 0.082, 0.131, 1.2, p.alloy, 10)
  tube(base, [0, 1.069, 0], 0.142, 0.204, 0.47, p.dark, 10)
  for (const side of [-1, 1]) {
    for (const front of [-1, 1]) {
      strut(base, [side * 0.56, 0.235, front * 0.49], [side * 0.117, 1.34, front * 0.087], 0.034, p.edge)
      shell(base, [side * 0.57, 0.12, front * 0.49], [0.28, 0.218, 0.242], p.accent)
    }
  }
  const dishMount = group(base, 'DishMount', [0, 1.967, 0])
  shell(dishMount, [0, 0.06, -0.064], [0.32, 0.2, 0.286], p.dark, 0.44)
  strut(dishMount, [0, 0.108, -0.067], [0, 0.253, -0.026], 0.098, p.edge)
  const dish = group(dishMount, 'DishTilt', [0, 0.381, 0.157])
  dish.rotation.x = 0.94
  const profile = [[0.003, -0.2], [0.19, -0.181], [0.39, -0.117], [0.62, 0.008], [0.765, 0.125], [0.771, 0.167], [0.731, 0.151], [0.598, 0.055], [0.37, -0.069], [0.172, -0.128], [0.003, -0.143]] as const
  const surface = p.hd
    ? [
      ...Array.from({length: 20}, (_, i) => new T.Vector2(0.003 + i * 0.04, -0.2 + 0.34 * (i / 19) ** 2)),
      new T.Vector2(0.771, 0.154), new T.Vector2(0.768, 0.166),
      ...Array.from({length: 20}, (_, i) => new T.Vector2(0.757 - i * 0.0397, -0.143 + 0.305 * (1 - i / 19) ** 2)),
    ]
    : profile.map(([radius, height]) => new T.Vector2(radius, height))
  const geometry = new T.LatheGeometry(surface, p.hd ? 80 : 20)
  geometry.normalizeNormals()
  const reflector = new T.Mesh(geometry, p.primary)
  reflector.castShadow = true
  reflector.receiveShadow = true
  dish.add(reflector)
  for (let i = 0; i < 3; i++) {
    const angle = i * Math.PI * 2 / 3
    strut(dish, [Math.sin(angle) * 0.639, 0.073, Math.cos(angle) * 0.639], [0, 0.386, 0], 0.017, p.edge, 6)
  }
  tube(dish, [0, 0.386, 0], 0.093, 0.066, 0.117, p.accent, 8)
  if (detail) {
    for (const y of [0.56, 0.67, 0.78]) box(base, [0, y, 0.335], [0.41, 0.044, 0.023], p.dark)
    tube(base, [0, 1.596, 0], 0.127, 0.127, 0.082, p.accent, 10)
  }
  if (p.hd && detail) towerDetails(base, dish, p)
  root.animations = [
    new T.AnimationClip('Sweep', 5, [spinTrack('DishMount', 'y', 5)]),
    new T.AnimationClip('Acquire signal', 4, [rotationTrack('DishTilt', 'x', [0, 1, 3, 4], [0.94, 1.32, 0.47, 0.94])]),
  ]
}
