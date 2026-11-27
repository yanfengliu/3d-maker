import * as T from 'three';

/**
 * Pure procedural vertex-color shader evaluated per vertex at merge/bake time.
 * Receives `(x, y, z)` position, outward unit normal `[nx, ny, nz]`, and the element's base `T.Color`
 * and returns either a `T.Color`, a CSS hex string (`"#rrggbb"`, sRGB), or a linear `[r, g, b]` triple in `[0, 1]`.
 */
export type VertexColorShader = (
  x: number,
  y: number,
  z: number,
  normal: readonly [number, number, number],
  base: T.Color,
) => T.Color | string | readonly [number, number, number];

export interface MergeStaticOptions {
  /** Node names whose subtrees must stay separate (rigged hinges, detachable parts, skins). */
  preserveNames?: ReadonlySet<string>;
  /** Subtle per-element vertex-color lightness/saturation variation in [0, 1]. Default 0.35. */
  tone?: number;
  /** Deterministic PRNG seed for per-element tonal variation. Default 1337. */
  seed?: number;
  /** Name prefix assigned to merged static meshes. Default 'Static'. */
  namePrefix?: string;
  /** Optional root-space procedural vertex-color shader baked across non-tintZone merged meshes. */
  colorFn?: VertexColorShader;
}

export interface MergeStaticReport {
  mergedMeshes: number;
  drawCalls: number;
  triangles: number;
  preservedMeshes: number;
}

interface PendingMesh {
  mesh: T.Mesh<T.BufferGeometry, T.MeshStandardMaterial>;
  material: T.MeshStandardMaterial;
  bucketKey: string;
  order: number;
}

interface MaterialBucket {
  key: string;
  label: string;
  tintHex?: number;
  transparent: boolean;
  opacity: number;
  emissiveHex: number;
  emissiveIntensity: number;
  roughnessSum: number;
  metalnessSum: number;
  items: PendingMesh[];
}

/** Deterministic unit-interval noise in [-1, 1] using splitmix32 bit mixing. */
export function seededNoise(seed: number, index: number): number {
  let x = (Math.imul(seed | 0, 0x9e3779b1) ^ Math.imul((index + 1) | 0, 0x85ebca6b)) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x21f0aaad) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 0x735a2d97) >>> 0;
  x = (x ^ (x >>> 15)) >>> 0;
  return (x / 0xffffffff) * 2 - 1;
}

function jitterColor(base: T.Color, tone: number, seed: number, index: number): T.Color {
  const clampedTone = Math.max(0, Math.min(1, Number.isFinite(tone) ? tone : 0));
  const out = base.clone();
  if (clampedTone <= 1e-4) return out;
  const hsl = { h: 0, s: 0, l: 0 };
  out.getHSL(hsl);
  // Scale lightness delta proportionally to available headroom so dark timbers never jump to pale tan.
  const headroom = Math.min(hsl.l, 1 - hsl.l);
  const maxDl = Math.min(0.055, Math.max(0.014, headroom * 0.24));
  const dh = seededNoise(seed, index * 3) * 0.008 * clampedTone;
  const ds = seededNoise(seed, index * 3 + 1) * 0.035 * clampedTone;
  const dl = seededNoise(seed, index * 3 + 2) * maxDl * clampedTone;
  const h = (hsl.h + dh + 1) % 1;
  const s = Math.max(0, Math.min(1, hsl.s + ds));
  const l = Math.max(0.05, Math.min(0.92, hsl.l + dl));
  out.setHSL(h, s, l);
  return out;
}

function evalShaderColor(
  shader: VertexColorShader,
  x: number,
  y: number,
  z: number,
  normal: readonly [number, number, number],
  base: T.Color,
  target: T.Color,
): T.Color {
  const res = shader(x, y, z, normal, base);
  if (res instanceof T.Color) return target.copy(res);
  if (typeof res === 'string') return target.set(res);
  const r = Number.isFinite(res[0]) ? Math.max(0, Math.min(1, res[0])) : base.r;
  const g = Number.isFinite(res[1]) ? Math.max(0, Math.min(1, res[1])) : base.g;
  const b = Number.isFinite(res[2]) ? Math.max(0, Math.min(1, res[2])) : base.b;
  return target.setRGB(r, g, b);
}

/** Paint deterministic vertex colors onto a cloned non-indexed geometry using tonal jitter and optional procedural `colorFn`. */
export function applyVertexColorTone(
  source: T.BufferGeometry,
  baseColor: T.Color | string | number,
  tone = 0.35,
  seed = 1337,
  index = 0,
  colorFn?: VertexColorShader,
): T.BufferGeometry {
  const geo = source.index ? source.toNonIndexed() : source.clone();
  const pos = geo.getAttribute('position') as T.BufferAttribute | undefined;
  if (!pos || pos.count === 0) return geo;
  let norm = geo.getAttribute('normal') as T.BufferAttribute | undefined;
  if (!norm) {
    geo.computeVertexNormals();
    norm = geo.getAttribute('normal') as T.BufferAttribute | undefined;
  }
  const base = baseColor instanceof T.Color ? baseColor : new T.Color(baseColor);
  const tinted = jitterColor(base, tone, seed, index);
  const colors = new Float32Array(pos.count * 3);
  const out = new T.Color();
  for (let i = 0; i < pos.count; i++) {
    if (colorFn) {
      const nx = norm ? norm.getX(i) : 0;
      const ny = norm ? norm.getY(i) : 1;
      const nz = norm ? norm.getZ(i) : 0;
      evalShaderColor(colorFn, pos.getX(i), pos.getY(i), pos.getZ(i), [nx, ny, nz], tinted, out);
      colors[i * 3] = out.r;
      colors[i * 3 + 1] = out.g;
      colors[i * 3 + 2] = out.b;
    } else {
      colors[i * 3] = tinted.r;
      colors[i * 3 + 1] = tinted.g;
      colors[i * 3 + 2] = tinted.b;
    }
  }
  geo.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  return geo;
}

function collectAnimatedTargets(root: T.Object3D): Set<string> {
  const targets = new Set<string>();
  const clips = root.animations;
  for (const clip of clips) {
    for (const track of clip.tracks) {
      const dot = track.name.indexOf('.');
      const targetName = dot > 0 ? track.name.slice(0, dot) : track.name;
      if (targetName) targets.add(targetName);
    }
  }
  return targets;
}

function bucketForMaterial(mat: T.MeshStandardMaterial): { key: string; label: string; tintHex?: number } {
  const emissiveHex = mat.emissive.getHex();
  const opacity = Math.round(mat.opacity * 100);
  const tintZone = typeof mat.userData.tintZone === 'string' ? mat.userData.tintZone.trim() : '';
  if (tintZone && !mat.transparent && opacity >= 99 && emissiveHex === 0) {
    const label = tintZone.charAt(0).toUpperCase() + tintZone.slice(1);
    return { key: `zone:${tintZone}:${mat.color.getHexString()}`, label, tintHex: mat.color.getHex() };
  }
  if (mat.transparent || opacity < 99) {
    const r = Math.round(mat.roughness * 10);
    return { key: `trans:${String(opacity)}:${String(r)}:${String(emissiveHex)}`, label: 'Glass' };
  }
  if (emissiveHex !== 0 && mat.emissiveIntensity > 0) {
    const ei = Math.round(mat.emissiveIntensity * 20);
    return { key: `emit:${String(emissiveHex)}:${String(ei)}`, label: 'Emissive' };
  }
  if (mat.metalness >= 0.2) {
    const r = Math.round(mat.roughness * 4);
    const m = Math.round(mat.metalness * 4);
    return { key: `metal:${String(r)}:${String(m)}`, label: 'Metal' };
  }
  return { key: 'matte', label: 'Matte' };
}

function pruneEmptyGroups(node: T.Object3D, protectedNodes: ReadonlySet<T.Object3D>): void {
  for (const child of [...node.children]) {
    pruneEmptyGroups(child, protectedNodes);
    if (
      child instanceof T.Group &&
      !protectedNodes.has(child) &&
      child.children.length === 0 &&
      !child.userData.preserveStatic
    ) {
      node.remove(child);
    }
  }
}

/**
 * Merge static sub-meshes under `root` into 1–4 compact vertex-colored draw calls while preserving
 * rigged, animated, detachable, and skinned subtrees intact. Applies deterministic per-element
 * vertex-color lightness/saturation variation controlled by `tone`.
 */
export function mergeStaticParts(root: T.Object3D, options: MergeStaticOptions = {}): MergeStaticReport {
  const tone = options.tone ?? 0.35;
  const seed = options.seed ?? 1337;
  const namePrefix = options.namePrefix ?? 'Static';

  const preserveNames = new Set<string>(options.preserveNames ?? []);
  for (const target of collectAnimatedTargets(root)) preserveNames.add(target);

  root.updateMatrixWorld(true);
  const invRoot = root.matrixWorld.clone().invert();

  const protectedNodes = new Set<T.Object3D>();
  const buckets = new Map<string, MaterialBucket>();
  let order = 0;
  let preservedMeshes = 0;

  const visit = (node: T.Object3D, ancestorProtected: boolean): void => {
    const isProtected =
      ancestorProtected ||
      Boolean(node.name && preserveNames.has(node.name)) ||
      node instanceof T.SkinnedMesh ||
      node instanceof T.Bone ||
      Boolean(node.userData.studioOverlay) ||
      Boolean(node.userData.preserveStatic);

    if (isProtected) protectedNodes.add(node);

    if (node instanceof T.Mesh) {
      if (isProtected || Array.isArray(node.material) || !(node.material instanceof T.MeshStandardMaterial)) {
        preservedMeshes++;
        return;
      }
      const mat = node.material;
      if (mat.map || mat.normalMap || mat.roughnessMap || mat.metalnessMap || mat.alphaMap) {
        preservedMeshes++;
        return;
      }
      const geo = node.geometry as T.BufferGeometry;
      const pos = geo.getAttribute('position') as T.BufferAttribute | undefined;
      if (!pos || pos.count < 3) return;
      const { key, label, tintHex } = bucketForMaterial(mat);
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = {
          key,
          label,
          ...(tintHex !== undefined ? { tintHex } : {}),
          transparent: mat.transparent,
          opacity: mat.opacity,
          emissiveHex: mat.emissive.getHex(),
          emissiveIntensity: mat.emissiveIntensity,
          roughnessSum: 0,
          metalnessSum: 0,
          items: [],
        };
        buckets.set(key, bucket);
      }
      bucket.roughnessSum += mat.roughness;
      bucket.metalnessSum += mat.metalness;
      const typedMesh = node as T.Mesh<T.BufferGeometry, T.MeshStandardMaterial>;
      bucket.items.push({ mesh: typedMesh, material: mat, bucketKey: key, order: order++ });
      return;
    }

    for (const child of [...node.children]) visit(child, isProtected);
  };

  for (const child of [...root.children]) visit(child, false);

  let mergedMeshes = 0;
  let drawCalls = 0;
  let totalTriangles = 0;
  const rel = new T.Matrix4();
  const normalMat = new T.Matrix3();
  const v = new T.Vector3();
  const n = new T.Vector3();
  const baseColor = new T.Color();
  const vertColor = new T.Color();
  const rootColorFn = options.colorFn;
  const vLocal = new T.Vector3();
  const nLocal = new T.Vector3();
  const shadedColor = new T.Color();
  const labelCounts = new Map<string, number>();

  for (const bucket of buckets.values()) {
    let vertTotal = 0;
    const prepared: {
      geo: T.BufferGeometry;
      relMatrix: T.Matrix4;
      flip: boolean;
      tint: T.Color;
      hasVertColor: boolean;
      localShader?: VertexColorShader;
      triCount: number;
      sourceMesh: T.Mesh;
    }[] = [];

    for (const item of bucket.items) {
      const geo = item.mesh.geometry;
      const pos = geo.getAttribute('position') as T.BufferAttribute | undefined;
      if (!pos || pos.count < 3) continue;
      const existingNormal = geo.getAttribute('normal') as T.BufferAttribute | undefined;
      if (!existingNormal) geo.computeVertexNormals();
      const idx = geo.getIndex();
      const triCount = Math.floor((idx ? idx.count : pos.count) / 3);
      if (triCount <= 0) continue;

      rel.multiplyMatrices(invRoot, item.mesh.matrixWorld);
      const flip = rel.determinant() < 0;
      let tint: T.Color;
      if (bucket.tintHex !== undefined) {
        // Store subtle relative luminance attenuation in vertex colors so material.color stays live and exact.
        const clampedTone = Math.max(0, Math.min(1, Number.isFinite(tone) ? tone : 0));
        const shade = 1 - ((seededNoise(seed, item.order * 3 + 2) + 1) * 0.5) * 0.1 * clampedTone;
        tint = new T.Color(shade, shade, shade);
      } else {
        baseColor.copy(item.material.color);
        tint = jitterColor(baseColor, bucket.key === 'matte' ? tone : tone * 0.45, seed, item.order);
      }
      const hasVertColor = Boolean(geo.getAttribute('color'));
      const meshFn = typeof item.mesh.userData.colorFn === 'function'
        ? (item.mesh.userData.colorFn as VertexColorShader)
        : typeof item.material.userData.colorFn === 'function'
          ? (item.material.userData.colorFn as VertexColorShader)
          : undefined;

      prepared.push({
        geo,
        relMatrix: rel.clone(),
        flip,
        tint,
        hasVertColor,
        ...(meshFn && bucket.tintHex === undefined ? { localShader: meshFn } : {}),
        triCount,
        sourceMesh: item.mesh,
      });
      vertTotal += triCount * 3;
      totalTriangles += triCount;
    }

    if (vertTotal === 0) continue;

    const positions = new Float32Array(vertTotal * 3);
    const normals = new Float32Array(vertTotal * 3);
    const colors = new Float32Array(vertTotal * 3);
    let cursor = 0;

    for (const part of prepared) {
      const posAttr = part.geo.getAttribute('position') as T.BufferAttribute;
      const normAttr = part.geo.getAttribute('normal') as T.BufferAttribute | undefined;
      const colAttr = part.hasVertColor ? (part.geo.getAttribute('color') as T.BufferAttribute | undefined) : undefined;
      const idx = part.geo.getIndex();
      normalMat.getNormalMatrix(part.relMatrix);

      for (let t = 0; t < part.triCount; t++) {
        const i0 = idx ? idx.getX(t * 3) : t * 3;
        const i1 = idx ? idx.getX(t * 3 + (part.flip ? 2 : 1)) : t * 3 + (part.flip ? 2 : 1);
        const i2 = idx ? idx.getX(t * 3 + (part.flip ? 1 : 2)) : t * 3 + (part.flip ? 1 : 2);
        const triIdx = [i0, i1, i2] as const;

        for (let k = 0; k < 3; k++) {
          const vi = triIdx[k] ?? 0;
          vLocal.fromBufferAttribute(posAttr, vi);
          v.copy(vLocal).applyMatrix4(part.relMatrix);
          positions[cursor] = v.x;
          positions[cursor + 1] = v.y;
          positions[cursor + 2] = v.z;

          if (normAttr) {
            nLocal.fromBufferAttribute(normAttr, vi).normalize();
            n.copy(nLocal).applyMatrix3(normalMat).normalize();
            normals[cursor] = n.x;
            normals[cursor + 1] = n.y;
            normals[cursor + 2] = n.z;
          } else {
            nLocal.set(0, 1, 0);
            n.set(0, 1, 0);
            normals[cursor] = 0;
            normals[cursor + 1] = 1;
            normals[cursor + 2] = 0;
          }

          if (colAttr) {
            vertColor.fromBufferAttribute(colAttr, vi).multiply(part.tint);
          } else {
            vertColor.copy(part.tint);
          }
          if (part.localShader) {
            evalShaderColor(part.localShader, vLocal.x, vLocal.y, vLocal.z, [nLocal.x, nLocal.y, nLocal.z], vertColor, shadedColor);
            vertColor.copy(shadedColor);
          }
          if (rootColorFn && bucket.tintHex === undefined) {
            evalShaderColor(rootColorFn, v.x, v.y, v.z, [n.x, n.y, n.z], vertColor, shadedColor);
            vertColor.copy(shadedColor);
          }
          colors[cursor] = vertColor.r;
          colors[cursor + 1] = vertColor.g;
          colors[cursor + 2] = vertColor.b;
          cursor += 3;
        }
      }

      part.sourceMesh.parent?.remove(part.sourceMesh);
      part.geo.dispose();
      mergedMeshes++;
    }

    const mergedGeo = new T.BufferGeometry();
    mergedGeo.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    mergedGeo.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
    mergedGeo.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    mergedGeo.computeBoundingBox();
    mergedGeo.computeBoundingSphere();

    const count = bucket.items.length;
    const avgRoughness = Math.max(0.16, Math.min(1, bucket.roughnessSum / count));
    const avgMetalness = Math.max(0, Math.min(1, bucket.metalnessSum / count));
    const isMatteBucket = bucket.key === 'matte' || bucket.tintHex !== undefined;
    const mat = new T.MeshStandardMaterial({
      name: `${namePrefix} ${bucket.label}`,
      color: bucket.tintHex ?? 0xffffff,
      vertexColors: true,
      roughness: isMatteBucket ? Math.max(0.8, avgRoughness) : avgRoughness,
      metalness: isMatteBucket ? 0 : avgMetalness,
      transparent: bucket.transparent,
      opacity: bucket.opacity,
      side: T.FrontSide,
      ...(bucket.emissiveHex !== 0
        ? { emissive: new T.Color(bucket.emissiveHex), emissiveIntensity: bucket.emissiveIntensity }
        : {}),
    });

    const seq = (labelCounts.get(bucket.label) ?? 0) + 1;
    labelCounts.set(bucket.label, seq);
    const mergedMesh = new T.Mesh(mergedGeo, mat);
    mergedMesh.name = seq === 1 ? `${namePrefix}${bucket.label}` : `${namePrefix}${bucket.label}${String(seq)}`;
    mergedMesh.castShadow = !bucket.transparent;
    mergedMesh.receiveShadow = true;
    root.add(mergedMesh);
    drawCalls++;
  }

  pruneEmptyGroups(root, protectedNodes);
  return { mergedMeshes, drawCalls, triangles: totalTriangles, preservedMeshes };
}
