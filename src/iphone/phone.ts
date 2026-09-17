import * as THREE from 'three';

import { BODY } from './dims.js';
import { applyColorway, type ColorKey, type PhoneMaterials } from './materials.js';
import {
  buildAntennas,
  buildBack,
  buildBottom,
  buildControls,
  buildFront,
  buildHousing,
  buildPlateau,
  buildTop,
} from './parts.js';
import { isPhoneMesh } from './types.js';
/**
 * The iPhone 17 Pro: assembles one part builder per external surface and owns
 * the two things every caller needs — the model's bounds, and live recolouring.
 *
 * Nothing is fetched at runtime: every detail is a primitive, and the only
 * load-bearing data is the Apple logo path in `parts.ts`.
 */

export interface Phone {
  /** Model space, already leaning and floating. Origin at the floor. */
  readonly object: THREE.Group;
  readonly materials: PhoneMaterials;
  readonly bounds: THREE.Box3;
  setMaterials(materials: PhoneMaterials): void;
  setColor(key: ColorKey): void;
  dispose(): void;
}

/**
 * The phone is presented floating upright with a slight lean back, its lowest
 * point `FLOAT_HEIGHT` above the floor. Standing it on the floor made the
 * bottom edge unshootable and let the port geometry collide with the plane.
 *
 * Because the lean is baked into the model's vertices, `bounds` is a plain
 * world-space box measured from the floor, which is the frame every camera
 * preset works in.
 */
export const FLOAT_HEIGHT = 25;
export const LEAN_DEG = 8;

/** Lowest corner of the leaning body, relative to the body centre, in mm. */
function lowestOffset(): number {
  const halfHeight = BODY.height / 2;
  const halfDepth = BODY.halfDepth;
  const lean = (LEAN_DEG * Math.PI) / 180;
  return Math.min(
    -halfHeight * Math.cos(lean) - halfDepth * Math.sin(lean),
    -halfHeight * Math.cos(lean) + halfDepth * Math.sin(lean),
    halfHeight * Math.cos(lean) - halfDepth * Math.sin(lean),
    halfHeight * Math.cos(lean) + halfDepth * Math.sin(lean),
  );
}

function disposeTree(root: THREE.Object3D): void {
  root.traverse((node: THREE.Object3D) => {
    if (!isPhoneMesh(node)) return;
    node.geometry.dispose();
  });
}

/** Resolves the material a part asked for by its tag, so a swapped-in material
 *  set can be restored without relying on traversal order. */
function materialFor(materials: PhoneMaterials, tag: unknown): THREE.Material {
  if (typeof tag === 'string' && Object.hasOwn(materials, tag)) {
    return materials[tag as keyof PhoneMaterials];
  }
  return materials.aluminum;
}

export function createPhone(materials: PhoneMaterials): Phone {
  const root = new THREE.Group();
  root.name = 'iphone-17-pro';
  root.add(buildHousing(materials));
  root.add(buildFront(materials));
  root.add(buildBack(materials));
  root.add(buildPlateau(materials));
  root.add(buildControls(materials));
  root.add(buildBottom(materials));
  root.add(buildTop(materials));
  root.add(buildAntennas(materials));

  // Floating clear of the floor, upright and leaning back ~8 degrees the way a
  // phone on a stand does. The model is *not* turned: the screen faces +Z and
  // the plateau faces -Z, exactly as `dims.ts` documents, so a camera on -Z is
  // the back view.
  root.rotation.x = THREE.MathUtils.degToRad(-LEAN_DEG);
  root.position.y = FLOAT_HEIGHT - lowestOffset();
  root.updateWorldMatrix(true, true);
  const bounds = new THREE.Box3().setFromObject(root);

  applyColorway(materials, 'cosmic-orange');

  return {
    object: root,
    materials,
    bounds,
    setMaterials: (next: PhoneMaterials) => {
      root.traverse((node: THREE.Object3D) => {
        if (!isPhoneMesh(node)) return;
        node.material = materialFor(next, node.userData['material']);
      });
    },
    setColor: (key: ColorKey) => {
      applyColorway(materials, key);
    },
    dispose: () => {
      disposeTree(root);
    },
  };
}


