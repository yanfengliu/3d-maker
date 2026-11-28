import { InstancedMesh, Matrix4, Mesh, Vector3, type Box3, type BufferAttribute, type BufferGeometry, type InterleavedBufferAttribute, type Object3D } from 'three';

/** Visit rendered instance vertices in the supplied reference frame, reusing a scratch vector. */
export function visitMeshVerticesInFrame(mesh: Object3D, frame: Matrix4, visit: (v: Vector3) => void) {
  if (!(mesh instanceof Mesh)) return;
  const geometry = mesh.geometry as BufferGeometry;
  const position = geometry.getAttribute('position') as BufferAttribute | InterleavedBufferAttribute | undefined;
  if (!position) return;
  const instanced = mesh instanceof InstancedMesh;
  const index = instanced ? geometry.index : null;
  const referenced = index ? Array.from(new Set(index.array)) : null;
  const count = referenced?.length ?? position.count;
  const vertex = new Vector3();
  const matrix = instanced ? new Matrix4() : frame;
  for (let instance = 0; instance < (instanced ? mesh.count : 1); instance++) {
    if (instanced) {
      mesh.getMatrixAt(instance, matrix);
      matrix.premultiply(frame);
    }
    for (let i = 0; i < count; i++) {
      vertex.fromBufferAttribute(position, referenced?.[i] ?? i).applyMatrix4(matrix);
      if (Number.isFinite(vertex.x) && Number.isFinite(vertex.y) && Number.isFinite(vertex.z)) visit(vertex);
    }
  }
}

/** Rotating the prototype's AABB overestimates a sloped or tapered member. */
export function expandInstancedBounds(box: Box3, mesh: Object3D) {
  visitMeshVerticesInFrame(mesh, mesh.matrixWorld, vertex => box.expandByPoint(vertex));
}
