import * as THREE from 'three';

/**
 * `@types/three` declares `Mesh` with `any` defaults for both parameters, so a
 * namespace import narrows every mesh to `Mesh<any, any, any>` and the strict
 * lint rules then flag perfectly ordinary geometry and material access.
 * Walking a model therefore goes through these explicitly parameterised types.
 */

export type PhoneMesh = THREE.Mesh<THREE.BufferGeometry, THREE.Material>;

/** Narrows an Object3D to a mesh with real geometry and material types. */
export function isPhoneMesh(node: THREE.Object3D): node is PhoneMesh {
  return node instanceof THREE.Mesh;
}
