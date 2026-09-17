import * as THREE from 'three';

import type { PhoneStage } from './scene.js';

/**
 * Named camera presets for the shot contract.
 *
 * Each preset is a stand-off distance plus the height of body the frame should
 * span, and the field of view is derived from those two. Framing is therefore
 * an output of the lens choice rather than an input, so a preset cannot quietly
 * crop the body on an unusual viewport. Straight-on views use a long stand-off
 * so they read as near-orthographic, the way product shots are made.
 *
 * Targets and bounds are both in floor space — the phone floats, leaning back
 * 8 degrees, with its lowest point 25 mm up — so the presets never have to know
 * how the presentation is posed.
 *
 * Axis convention every preset is built around: the screen faces +Z, the back
 * faces -Z. In `back`, world +X appears on the left of frame, so the lenses
 * (+X half) read as the left column and the flash/LiDAR (-X half) as the right
 * column. `right` is the +X edge (power + Camera Control) and `left` the -X
 * edge (Action + volume).
 */

export type ViewKey =
  | 'hero'
  | 'front'
  | 'back'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'camera-closeup';

export const VIEW_KEYS: readonly ViewKey[] = [
  'hero',
  'front',
  'back',
  'left',
  'right',
  'top',
  'bottom',
  'camera-closeup',
];

export const DEFAULT_VIEW: ViewKey = 'hero';

export function isViewKey(value: string | null | undefined): value is ViewKey {
  return typeof value === 'string' && (VIEW_KEYS as readonly string[]).includes(value);
}

/** Camera never pulls back further than this for the whole-body fit. */
const FIT_CAP = 200;

interface ViewFrame {
  /** Unit vector from the target towards the camera. */
  readonly direction: THREE.Vector3Tuple;
  /** Target point in floor space. Ignored when `fitBody` is set. */
  readonly target: THREE.Vector3Tuple;
  /** Where to aim inside the model, offset from the body box's centre: the
   *  plateau for the closeup, the ports for the edge closeups. */
  readonly aim?: THREE.Vector3Tuple;
  /** Millimetres of body the frame's long axis should span. */
  readonly frameHeight: number;
  /** Millimetres from the target to the camera. */
  readonly distance: number;
  /** Pull back further if the whole body would not otherwise be in frame. */
  readonly fitBody: boolean;
}

const FRAMES: Record<ViewKey, ViewFrame> = {
  // Body-relative offsets for the feature closeups. The body box's centre is
  // at world y ≈ 100 while the phone floats, so these keep aiming at the same
  // part of the phone whatever the presentation does.
  // The money shot: three-quarter from the back-right-top, so the plateau's
  // lenses, the logo and the +X edge (power + Camera Control) are all in one
  // frame. Seen from behind, +X is on the left of frame, which is where the
  // lens triangle belongs.
  hero: {
    direction: [0.46, 0.32, -0.83],
    target: [0, 0, 0],
    aim: [0, -2, 0],
    frameHeight: 162,
    distance: 720,
    fitBody: true,
  },
  // Straight-on front, long lens: the screen, the island and the hairline
  // bezel, with the phone's left edge (-X) on the left of frame.
  front: {
    direction: [0, 0.035, 1],
    target: [0, 0, 0],
    frameHeight: 150,
    distance: 1500,
    fitBody: true,
  },
  // Straight-on back, long lens: lenses left, flash/LiDAR right, logo below.
  back: {
    direction: [0, 0.035, -1],
    target: [0, 0, 0],
    frameHeight: 150,
    distance: 1500,
    fitBody: true,
  },
  // Edge profiles. The direction is built from the body's own side axis (the
  // body leans back 8 degrees, so a world-X direction is 14 degrees off a true
  // profile and shows too much of the panel), plus a small sideways offset so
  // the pill buttons still catch an edge instead of vanishing edge-on.
  left: {
    direction: [-0.955, 0.04, 0.293],
    target: [0, 0, 0],
    frameHeight: 142,
    distance: 1700,
    fitBody: true,
  },
  right: {
    direction: [0.955, 0.04, 0.293],
    target: [0, 0, 0],
    frameHeight: 142,
    distance: 1700,
    fitBody: true,
  },
  // Close and high on the top edge: the antenna straps and the mic bore in
  // profile, with the back falling away below them and the floor far beyond.
  top: {
    direction: [-0.14, 0.8, -0.58],
    target: [0, 0, 0],
    aim: [0, 55, -4],
    frameHeight: 46,
    distance: 190,
    fitBody: false,
  },
  // Low and close on the bottom edge. The phone floats 25 mm up, so this is a
  // real under-view: USB-C, six speaker bores and four mic bores all read.
  bottom: {
    direction: [0.06, -0.3, 0.95],
    target: [0, 0, 0],
    aim: [0, -72, 1],
    frameHeight: 62,
    distance: 170,
    fitBody: false,
  },
  // Close on the plateau, almost straight down the lens axis (10 degrees
  // above it) and centred between the lens triangle and the sensor stack. The
  // near-axial angle is deliberate: at a steep angle the polished rings are
  // seen edge-on and collapse to a sliver, so the plateau reads as three black
  // holes. Down the axis they read as rings.
  'camera-closeup': {
    direction: [0.09, 0.17, -0.98],
    target: [0, 0, 0],
    aim: [0, 53, 0],
    frameHeight: 62,
    distance: 240,
    fitBody: false,
  },
};

/**
 * Places the camera so `frameHeight` millimetres span the frame's long axis,
 * backing off only as far as `fitBody` demands.
 *
 * The fit is measured by projecting the body box's eight corners through the
 * actual projection matrix rather than by enclosing it in a sphere: the
 * bounding sphere of a 150 x 72 x 30 mm box is 38% larger than the box, which
 * is enough to leave a whole-body preset framing a phone that fills a third of
 * the frame.
 */
export function applyView(stage: PhoneStage, view: ViewKey, bounds: THREE.Box3): void {
  const frame = FRAMES[view];
  const direction = new THREE.Vector3(...frame.direction).normalize();
  const target = new THREE.Vector3(...frame.target);
  if (frame.aim !== undefined) {
    // Aim from the model's own centre, so a closeup keeps framing the same
    // part of the phone no matter how the presentation poses it.
    target.copy(bounds.getCenter(new THREE.Vector3())).add(new THREE.Vector3(...frame.aim));
  } else if (frame.fitBody) {
    target.copy(bounds.getCenter(new THREE.Vector3()));
  }

  const camera = stage.camera;
  const aspect = Math.max(camera.aspect, 0.2);
  const halfAngle = Math.atan(frame.frameHeight * 0.5 / frame.distance);
  const fov = halfAngle * 2;
  let distance = frame.distance;

  if (frame.fitBody) {
    const vertical = Math.tan(halfAngle);
    const horizontal = vertical * aspect;
    // The enclosing sphere of the fit box: every projected corner lies inside
    // the cone of this half-angle, so seeding from it can never clip.
    const centre = bounds.getCenter(new THREE.Vector3());
    const radius = Math.min(centre.distanceTo(bounds.max), FIT_CAP);
    distance = radius / Math.sin(Math.atan(Math.min(vertical, horizontal)));
    for (let pass = 0; pass < 12; pass += 1) {
      const scale = neededScale(camera, bounds, target, direction, distance, vertical, horizontal);
      distance = Math.min(frame.distance * 3, Math.max(frame.distance * 0.25, distance * scale));
    }
  }

  camera.fov = THREE.MathUtils.radToDeg(fov);
  // Depth precision is claimed by the *ratio* of far to near, and the phone's
  // own surfaces are 0.6 mm apart: a near plane at 40 mm in front of a 40000 mm
  // far plane banded the screen with z-fighting stripes.
  camera.near = Math.max(1, distance * 0.08);
  camera.far = 20000;
  camera.updateProjectionMatrix();
  camera.position.copy(target).addScaledVector(direction, distance);
  camera.lookAt(target);

  const controls = stage.controls;
  controls.target.copy(target);
  controls.minDistance = distance * 0.5;
  controls.maxDistance = distance * 3;
  controls.update();
  // update() re-derives the pose from its own spherical state and clamps it to
  // min/max distance; re-asserting the pose keeps the preset exact and the
  // spherical state (used by the next user interaction) consistent with it.
  camera.position.copy(target).addScaledVector(direction, distance);
  camera.lookAt(target);
  controls.saveState();
}

/** How much further back the camera must sit for the whole body box to land
 *  inside the frame. 1 means the current stand-off already fits. */
function neededScale(
  camera: THREE.PerspectiveCamera,
  bounds: THREE.Box3,
  target: THREE.Vector3,
  direction: THREE.Vector3,
  distance: number,
  vertical: number,
  horizontal: number,
): number {
  camera.position.copy(target).addScaledVector(direction, distance);
  camera.lookAt(target);
  camera.updateMatrixWorld(true);
  const view = camera.matrixWorldInverse;
  let scale = 1;
  for (let corner = 0; corner < 8; corner += 1) {
    const point = new THREE.Vector3(
      (corner & 1) === 0 ? bounds.min.x : bounds.max.x,
      (corner & 2) === 0 ? bounds.min.y : bounds.max.y,
      (corner & 4) === 0 ? bounds.min.z : bounds.max.z,
    );
    const local = point.clone().applyMatrix4(view).negate();
    scale = Math.max(scale, local.y / (vertical * -local.z), local.x / (horizontal * -local.z));
  }
  return scale;
}
