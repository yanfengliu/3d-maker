// Serialized into the metrics browser by Playwright, so all dependencies are imported here.
export async function inspectGlb(encoded) {
  const T = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const bin = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const loader = new GLTFLoader();
  const gltf = await new Promise((resolve, reject) => loader.parse(bin.buffer, '', resolve, reject));
  const root = gltf.scene;
  root.updateMatrixWorld(true);

  const overall = new T.Box3();
  const meshBoxes = [];
  const meshStats = new Map();
  let meshes = 0;
  let vertices = 0;
  let triangles = 0;
  let nonFinite = 0;
  let doubleSidedMeshes = 0;
  const faceArea = { front: 0, back: 0, left: 0, right: 0, top: 0, bottom: 0 };

  const a = new T.Vector3();
  const b = new T.Vector3();
  const c = new T.Vector3();
  const ab = new T.Vector3();
  const ac = new T.Vector3();
  const n = new T.Vector3();

  root.traverse((node) => {
    if (!(node instanceof T.Mesh)) return;
    const geom = node.geometry;
    const pos = geom.getAttribute('position');
    if (!pos || !pos.count) return;
    meshes++;
    const instanceCount = node.isInstancedMesh ? node.count : 1;
    const index = geom.getIndex();
    const referenced = node.isInstancedMesh && index ? Array.from(new Set(index.array)) : null;
    const vertexCount = referenced?.length ?? pos.count;
    vertices += vertexCount * instanceCount;
    const mats = Array.isArray(node.material) ? node.material : [node.material];
    const doubleSided = mats.some((m) => m && m.side === T.DoubleSide);
    if (doubleSided) doubleSidedMeshes++;

    const skinned = node instanceof T.SkinnedMesh;
    if (skinned) node.skeleton.update();
    const worldVerts = new Float32Array(pos.count * 3);
    const triCount = index ? Math.floor(index.count / 3) : Math.floor(pos.count / 3);
    triangles += triCount * instanceCount;
    const addDir = (nx, ny, nz, area) => {
      if (nz > 0.25) faceArea.front += area * nz;
      if (nz < -0.25) faceArea.back += area * -nz;
      if (nx > 0.25) faceArea.right += area * nx;
      if (nx < -0.25) faceArea.left += area * -nx;
      if (ny > 0.25) faceArea.top += area * ny;
      if (ny < -0.25) faceArea.bottom += area * -ny;
    };
    const nodeBox = new T.Box3();
    const world = new T.Matrix4().copy(node.matrixWorld);
    for (let instance = 0; instance < instanceCount; instance++) {
      if (node.isInstancedMesh) {
        node.getMatrixAt(instance, world);
        world.premultiply(node.matrixWorld);
      }
      const box = new T.Box3();
      for (let k = 0; k < vertexCount; k++) {
        const i = referenced ? referenced[k] : k;
        a.fromBufferAttribute(pos, i);
        if (skinned) node.applyBoneTransform(i, a);
        a.applyMatrix4(world);
        if (!Number.isFinite(a.x) || !Number.isFinite(a.y) || !Number.isFinite(a.z)) {
          worldVerts[i * 3] = NaN;
          nonFinite++;
          continue;
        }
        worldVerts[i * 3] = a.x;
        worldVerts[i * 3 + 1] = a.y;
        worldVerts[i * 3 + 2] = a.z;
        box.expandByPoint(a);
      }
      if (!box.isEmpty()) {
        nodeBox.union(box);
        meshBoxes.push({ name: node.name || `mesh-${meshes}`, box });
      }
      for (let t = 0; t < triCount; t++) {
        const i0 = index ? index.getX(t * 3) : t * 3;
        const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
        const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;
        a.set(worldVerts[i0 * 3], worldVerts[i0 * 3 + 1], worldVerts[i0 * 3 + 2]);
        b.set(worldVerts[i1 * 3], worldVerts[i1 * 3 + 1], worldVerts[i1 * 3 + 2]);
        c.set(worldVerts[i2 * 3], worldVerts[i2 * 3 + 1], worldVerts[i2 * 3 + 2]);
        ab.subVectors(b, a);
        ac.subVectors(c, a);
        n.crossVectors(ab, ac);
        const len = n.length();
        if (!Number.isFinite(len) || len < 1e-10) continue;
        const area = len * 0.5;
        n.divideScalar(len);
        addDir(n.x, n.y, n.z, area);
        if (doubleSided) addDir(-n.x, -n.y, -n.z, area);
      }
    }
    meshStats.set(node, { box: nodeBox, vertices: vertexCount * instanceCount });
    overall.union(nodeBox);
  });

  const size = overall.isEmpty() ? new T.Vector3() : overall.getSize(new T.Vector3());
  const radius = Math.max(0.01, size.length() / 2);
  const eps = Math.max(0.02, radius * 0.015);
  const parent = meshBoxes.map((_, i) => i);
  const weights = new Uint32Array(parent.length).fill(1);
  let components = parent.length;
  const find = (index) => {
    while (parent[index] !== index) {
      parent[index] = parent[parent[index]];
      index = parent[index];
    }
    return index;
  };
  const unite = (first, second) => {
    let a = find(first), b = find(second);
    if (a === b) return;
    if (weights[a] < weights[b]) [a, b] = [b, a];
    parent[b] = a;
    weights[a] += weights[b];
    components--;
  };
  const byMinX = meshBoxes.map((_, i) => i).sort((a, b) => meshBoxes[a].box.min.x - meshBoxes[b].box.min.x);
  for (let i = 0; i < byMinX.length && components > 1; i++) {
    const first = byMinX[i];
    const a = meshBoxes[first].box;
    for (let j = i + 1; j < byMinX.length; j++) {
      const second = byMinX[j];
      const b = meshBoxes[second].box;
      if (b.min.x > a.max.x + eps) break;
      if (a.min.y <= b.max.y + eps && a.max.y + eps >= b.min.y &&
          a.min.z <= b.max.z + eps && a.max.z + eps >= b.min.z) unite(first, second);
    }
  }
  const groups = new Map();
  for (let i = 0; i < meshBoxes.length; i++) {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, { count: 0, box: new T.Box3(), names: [] });
    const g = groups.get(r);
    g.count++;
    g.box.union(meshBoxes[i].box);
    if (g.names.length < 4) g.names.push(meshBoxes[i].name);
  }
  const sortedGroups = [...groups.values()].sort((x, y) => {
    const vx = x.box.getSize(new T.Vector3()).length();
    const vy = y.box.getSize(new T.Vector3()).length();
    return vy - vx;
  });
  const floatingComponents = sortedGroups
    .slice(1)
    .filter((g) => g.box.min.y > overall.min.y + Math.max(0.03, size.y * 0.02))
    .map((g) => ({
      meshes: g.count,
      names: g.names,
      minY: Number(g.box.min.y.toFixed(3)),
      size: g.box.getSize(new T.Vector3()).toArray().map((v) => Number(v.toFixed(3))),
    }));

  const round = (v) => Number(v.toFixed(4));
  const totalArea = Object.values(faceArea).reduce((s, v) => s + v, 0) || 1;

  // Build a hierarchical machine-readable trace (world bboxes, triangle/vertex/open-edge counts, materials, joints).
  const indexCount = (idx, pos) => (idx ? Math.floor(idx.count / 3) : Math.floor(pos.count / 3));
  const countOpenEdges = (geom) => {
    const pos = geom.getAttribute('position');
    if (!pos || pos.count < 3) return 0;
    const idx = geom.getIndex();
    const triCount = indexCount(idx, pos);
    const qKey = (i) => `${Math.round(pos.getX(i) * 1e4)},${Math.round(pos.getY(i) * 1e4)},${Math.round(pos.getZ(i) * 1e4)}`;
    const edgeCounts = new Map();
    const bump = (k1, k2) => {
      if (k1 === k2) return;
      const ek = k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
      edgeCounts.set(ek, (edgeCounts.get(ek) ?? 0) + 1);
    };
    for (let t = 0; t < triCount; t++) {
      const i0 = idx ? idx.getX(t * 3) : t * 3;
      const i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1;
      const i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
      const k0 = qKey(i0), k1 = qKey(i1), k2 = qKey(i2);
      bump(k0, k1); bump(k1, k2); bump(k2, k0);
    }
    let open = 0;
    for (const c of edgeCounts.values()) if (c === 1) open++;
    return open;
  };
  const buildTraceNode = (node) => {
    const children = node.children.map(buildTraceNode);
    const box = new T.Box3();
    for (const ch of children) {
      if (ch.bbox) {
        box.expandByPoint(new T.Vector3(...ch.bbox[0]));
        box.expandByPoint(new T.Vector3(...ch.bbox[1]));
      }
    }
    let triCount = 0;
    let vertCount = 0;
    let openEdges = null;
    let material = null;
    if (node instanceof T.Mesh) {
      const geom = node.geometry;
      const pos = geom.getAttribute('position');
      if (pos && pos.count) {
        const instances = node.isInstancedMesh ? node.count : 1;
        vertCount = meshStats.get(node).vertices;
        triCount = indexCount(geom.getIndex(), pos) * instances;
        openEdges = countOpenEdges(geom) * instances;
        box.union(meshStats.get(node).box);
      }
      const m = Array.isArray(node.material) ? node.material[0] : node.material;
      material = m?.name || m?.type || null;
    }
    return {
      name: node.name || node.type,
      type: node.type,
      bbox: box.isEmpty() ? null : [box.min.toArray().map(round), box.max.toArray().map(round)],
      ...(vertCount ? { vertices: vertCount, triangles: triCount, openEdges } : {}),
      ...(material ? { material } : {}),
      ...(node.userData.s3d_joint ? { s3dJoint: node.userData.s3d_joint } : {}),
      ...(children.length ? { children } : {}),
    };
  };
  const ffCaps = root.userData.formFoundry ?? root.children[0]?.userData?.formFoundry ?? null;
  const trace = {
    root: buildTraceNode(root),
    ...(ffCaps ? {
      capabilities: {
        name: ffCaps.name,
        riggedParts: ffCaps.riggedParts ?? [],
        detachableParts: ffCaps.detachableParts ?? [],
        surfaces: ffCaps.surfaces ?? [],
        dimensions: ffCaps.dimensions ?? null,
      },
    } : {}),
  };

  return {
    metrics: {
      meshes,
      vertices,
      triangles,
      doubleSidedMeshes,
      nonFinite,
      animations: gltf.animations.length,
      minY: overall.isEmpty() ? null : round(overall.min.y),
      size: size.toArray().map(round),
      connectedComponents: sortedGroups.length,
      floatingComponents,
      faceArea: Object.fromEntries(Object.entries(faceArea).map(([k, v]) => [k, round(v)])),
      bottomToTopRatio: faceArea.top > 1e-6 ? Number((faceArea.bottom / faceArea.top).toFixed(3)) : null,
      backToFrontRatio: faceArea.front > 1e-6 ? Number((faceArea.back / faceArea.front).toFixed(3)) : null,
      totalDirectionalArea: round(totalArea),
    },
    trace,
  };
}
