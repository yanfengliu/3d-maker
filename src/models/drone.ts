import * as T from 'three'
import { box, group, light, mesh, motion, ring, rotationTrack, shell, spinTrack, strut, tube } from './parts'
import type { Finish } from './parts'
import { airfoil } from './hd-geometry'
import { droneHousing, ductDetails } from './hd-detail'

function blade(parent: T.Object3D, angle: number, p: Finish) {
  const paddle = group(parent, '', [0, 0, 0])
  paddle.rotation.y = angle
  if (p.hd) {
    mesh(paddle, airfoil(), p.dark, [0, 0, 0])
    return
  }
  const outline = new T.Shape()
  outline.moveTo(0.06, -0.035)
  outline.lineTo(0.29, -0.055)
  outline.lineTo(0.55, 0.025)
  outline.lineTo(0.53, 0.09)
  outline.lineTo(0.44, 0.125)
  outline.lineTo(0.23, 0.07)
  outline.lineTo(0.06, 0.035)
  outline.closePath()
  const geometry = new T.ExtrudeGeometry(outline, { depth: 0.024, bevelEnabled: false })
  geometry.rotateX(-Math.PI / 2)
  mesh(paddle, geometry, p.dark, [0, 0, 0])
  const tip = box(paddle, [0.458, 0.026, -0.06], [0.027, 0.007, 0.114], p.accent)
  tip.rotation.y = -0.19
}

function rotor(parent: T.Object3D, x: number, z: number, name: string, p: Finish, detail: boolean) {
  const duct = group(parent, name + 'Duct', [x, 0.93, z])
  ring(duct, [0, -0.055, 0], 0.679, 0.062, 0.11, p.dark)
  ring(duct, [0, 0.035, 0], 0.698, 0.071, 0.104, p.primary)
  for (let i = 0; i < 3; i++) {
    const r = i * 2 * Math.PI / 3 + 0.3
    strut(duct, [Math.sin(r) * 0.64, -0.065, Math.cos(r) * 0.64], [0, -0.13, 0], 0.024, p.edge)
  }
  tube(duct, [0, -0.03, 0], 0.152, 0.113, 0.2, p.dark)
  const rotary = group(duct, name, [0, 0.065, 0])
  for (let i = 0; i < 3; i++) blade(rotary, 2 * i * Math.PI / 3 + (z > 0 ? 0.6 : 0), p)
  tube(rotary, [0, 0.035, 0], 0.13, 0.148, 0.073, p.primary)
  tube(rotary, [0, 0.084, 0], 0.078, 0.104, 0.034, p.alloy)
  if (detail) {
    if (p.hd) ductDetails(duct, rotary, p)
    tube(rotary, [0, 0.105, 0], 0.041, 0.041, 0.013, p.inset, 6)
    for (const angle of [0.5, 0.62, 3.64, 3.76]) {
      const band = group(duct, '', [Math.sin(angle) * 0.661, 0.089, Math.cos(angle) * 0.661])
      band.rotation.y = angle
      box(band, [0, 0, 0], [0.041, 0.009, 0.057], p.dark)
    }
  }
}

function optic(parent: T.Object3D, p: Finish) {
  const gimbal = group(parent, 'CameraYaw', [0, 0.63, 0.73])
  for (const side of [-1, 1]) {
    shell(gimbal, [side * 0.288, -0.08, 0], [0.1, 0.34, 0.24], p.edge, 0.45)
    const pin = tube(gimbal, [side * 0.34, -0.13, 0], 0.069, 0.069, 0.03, p.alloy)
    pin.rotation.z = Math.PI / 2
  }
  const camera = group(gimbal, 'CameraPitch', [0, -0.12, 0])
  shell(camera, [0, 0, 0.06], [0.49, 0.35, 0.4], p.dark, 0.42)
  for (const [front, radius, depth, mat] of [
    [0.262, 0.146, 0.08, p.edge],
    [0.309, 0.114, 0.029, p.inset],
    [0.328, 0.089, 0.016, p.alloy],
    [0.339, 0.079, 0.012, p.inset],
  ] as const) {
    tube(camera, [0, 0, front], radius, radius, depth, mat, 16).rotation.x = Math.PI / 2
  }
  const glass = mesh(camera, new T.SphereGeometry(1, 16, 8), p.optic, [0, 0, 0.342])
  glass.scale.set(0.071, 0.071, 0.023)
  const sensor = tube(camera, [0, 0, 0.365], 0.035, 0.035, 0.005, p.inset, 16)
  sensor.rotation.x = Math.PI / 2
  const glint = mesh(camera, new T.SphereGeometry(1, 8, 5), p.stencil, [-0.029, 0.031, 0.361])
  glint.scale.set(0.014, 0.009, 0.005)
}

export function drone(root: T.Group, p: Finish, detail: boolean) {
  const body = group(root, 'Airframe')
  shell(body, [0, 0.86, 0], [1.24, 0.34, 1.63], p.dark, 0.48)
  shell(body, [0, 1.035, -0.01], [1.34, 0.22, 1.71], p.primary, 0.54)
  shell(body, [0, 1.18, -0.02], [1.18, 0.23, 1.54], p.primary, 0.57)
  shell(body, [0, 1.303, -0.11], [0.66, 0.065, 1.12], p.dark, 0.47)
  shell(body, [0, 1.345, -0.04], [0.588, 0.047, 0.79], p.accent, 0.38)
  for (const s of [-1, 1]) {
    // Long rocker fairings flank the removable top hatch.
    shell(body, [s * 0.473, 1.241, 0.055], [0.23, 0.15, 1.01], p.primary, 0.71)
    shell(body, [s * 0.48, 0.897, 0.702], [0.285, 0.214, 0.29], p.primary, 0.44)
    light(body, [s * 0.425, 0.93, 0.846], [0.179, 0.064, 0.022], p)
    for (const f of [-1, 1]) {
      const connector = group(body, '', [s * 0.76, 0.864, f * 0.58])
      connector.rotation.y = -s * f * 0.49
      shell(connector, [0, 0, 0], [0.85, 0.175, 0.235], p.dark, 0.4)
      shell(connector, [0.02 * s, 0.086, 0], [0.66, 0.061, 0.174], p.accent)
      // Skid pylons remain inside the four duct footprints.
      strut(body, [s * 0.477, 0.73, f * 0.435], [s * 0.59, 0.149, f * 0.59], 0.047, p.edge)
      strut(body, [s * 0.463, 0.714, f * 0.433], [s * 0.516, 0.501, f * 0.507], 0.077, p.dark)
    }
    const skid = group(body, '', [s * 0.59, 0.105, 0])
    shell(skid, [0, 0, 0], [0.12, 0.091, 1.65], p.dark, 0.65)
    for (const f of [-1, 1]) {
      strut(skid, [0, 0.01, f * 0.76], [0, 0.092, f * 0.91], 0.042, p.dark)
      box(skid, [0, 0.051, f * 0.6], [0.133, 0.044, 0.155], p.primary)
    }
    if (detail) {
      for (const z of [-0.31, -0.21, -0.11]) {
        box(body, [s * 0.467, 1.323, z], [0.112, 0.013, 0.028], p.dark)
      }
      for (const z of [-0.06, 0.15, 0.36]) {
        box(body, [s * 0.624, 0.884, z], [0.018, 0.092, 0.112], p.edge)
      }
      for (const z of [-0.303, 0.24]) {
        tube(body, [s * 0.219, 1.375, z], 0.022, 0.022, 0.008, p.edge, 6)
      }
    }
  }
  if (detail) {
    for (const z of [-0.582, -0.52, -0.46]) {
      box(body, [0, 1.342, z], [0.356, 0.016, 0.032], p.edge)
    }
    // Die-cut serial 01 on the hatch, with a separate pair of alignment marks.
    for (const z of [-0.177, 0.002]) box(body, [-0.042, 1.373, z], [0.115, 0.009, 0.03], p.dark)
    for (const x of [-0.099, 0.015]) box(body, [x, 1.373, -0.088], [0.029, 0.009, 0.144], p.dark)
    box(body, [0.102, 1.373, -0.089], [0.034, 0.009, 0.206], p.dark)
    box(body, [0.081, 1.373, -0.165], [0.054, 0.009, 0.031], p.dark).rotation.y = 0.53
    for (const x of [-0.086, -0.009]) box(body, [x, 1.373, 0.155], [0.039, 0.009, 0.115], p.dark).rotation.y = -0.4
    const antenna = group(body, 'Antenna', [0.25, 1.262, -0.59])
    tube(antenna, [0, 0.052, 0], 0.048, 0.065, 0.105, p.dark)
    strut(antenna, [0, 0.08, 0], [0, 0.435, -0.074], 0.017, p.edge)
    shell(antenna, [0, 0.449, -0.077], [0.071, 0.113, 0.071], p.dark)
  }
  if (p.hd && detail) droneHousing(body, p)
  optic(body, p)
  const rotors = [
    [-1.22, 0.883, 'RotorFL'], [1.22, 0.883, 'RotorFR'],
    [-1.22, -0.883, 'RotorRL'], [1.22, -0.883, 'RotorRR'],
  ] as const
  for (const [x, z, name] of rotors) rotor(body, x, z, name, p, detail)
  const spinning = rotors.map(([, , name], i) => spinTrack(name, 'y', 3, i === 0 || i === 3 ? 5 : -5))
  const scan = rotationTrack('CameraYaw', 'y', [0, 0.75, 2.25, 3], [0, 0.52, -0.52, 0])
  root.animations = [
    new T.AnimationClip('Hover', 3, [...spinning, motion('Airframe', 3, [0, 0.12, 0, -0.024, 0]), scan]),
    new T.AnimationClip('Rotor test', 3, spinning),
    new T.AnimationClip('Optics scan', 3, [scan]),
  ]
}
