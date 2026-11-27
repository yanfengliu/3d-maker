import * as T from 'three';
import type { AssetIkSpec, IkArmSegmentSpec, IkLimbSpec } from './ik-schema';
import type { RiggedPartSpec } from './schema';

const ARM_PART_PATTERN = /(arm|boom|crane|jib|grab|loader|claw|fork|hoist|scoop)/i;

function r3(n: number): number {
  return Math.round((n + 1e-9) * 1000) / 1000 || 0;
}

function collectBindPositionsInRoot(root: T.Object3D): Map<string, T.Vector3> {
  root.updateMatrixWorld(true);
  const invRoot = root.matrixWorld.clone().invert();
  const positions = new Map<string, T.Vector3>();
  const mat = new T.Matrix4();
  const pos = new T.Vector3();

  root.traverse(node => {
    if (!(node instanceof T.SkinnedMesh)) return;
    const skin = node as T.SkinnedMesh;
    const fromSkin = invRoot.clone().multiply(skin.matrixWorld).multiply(skin.bindMatrix.clone().invert());
    for (const [i, bone] of skin.skeleton.bones.entries()) {
      const name = typeof bone.userData.name === 'string' ? bone.userData.name : bone.name;
      const inverse = skin.skeleton.boneInverses[i];
      if (!name || !inverse || positions.has(name)) continue;
      mat.copy(inverse).invert().premultiply(fromSkin);
      pos.setFromMatrixPosition(mat);
      if (Number.isFinite(pos.x) && Number.isFinite(pos.y) && Number.isFinite(pos.z)) {
        positions.set(name, pos.clone());
      }
    }
  });

  // Fallback for non-skinned or partially skinned bone hierarchies: read live world positions.
  if (positions.size === 0) {
    root.traverse(node => {
      if (!(node instanceof T.Bone)) return;
      const name = typeof node.userData.name === 'string' ? node.userData.name : node.name;
      if (!name || positions.has(name)) return;
      pos.setFromMatrixPosition(node.matrixWorld).applyMatrix4(invRoot);
      if (Number.isFinite(pos.x) && Number.isFinite(pos.y) && Number.isFinite(pos.z)) {
        positions.set(name, pos.clone());
      }
    });
  }
  return positions;
}

function deriveBipedalLegsIk(root: T.Object3D): AssetIkSpec | undefined {
  const bones = collectBindPositionsInRoot(root);
  const hips = bones.get('Hips');
  if (!hips) return undefined;

  const limbs: IkLimbSpec[] = [];
  for (const side of ['Left', 'Right'] as const) {
    const up = bones.get(`${side}UpLeg`);
    const knee = bones.get(`${side}Leg`);
    const foot = bones.get(`${side}Foot`);
    if (!up || !knee || !foot) return undefined;
    const upperM = r3(up.distanceTo(knee));
    const lowerM = r3(knee.distanceTo(foot));
    if (upperM <= 0.01 || lowerM <= 0.01) return undefined;
    limbs.push({
      name: `${side}Leg`,
      upperM,
      lowerM,
      footOffset: [r3(foot.x - hips.x), 0, r3(foot.z - hips.z)],
    });
  }

  // Compute lowest vertex Y in root-local frame so hipHeightM reflects true height above ground contact.
  const invRoot = root.matrixWorld.clone().invert();
  const v = new T.Vector3();
  const rel = new T.Matrix4();
  let minY = Infinity;
  root.traverse(node => {
    if (!(node instanceof T.Mesh) || node.userData.studioOverlay) return;
    const geo = node.geometry as T.BufferGeometry;
    const posAttr = geo.getAttribute('position') as T.BufferAttribute | undefined;
    if (!posAttr || posAttr.count === 0) return;
    rel.multiplyMatrices(invRoot, node.matrixWorld);
    for (let i = 0; i < posAttr.count; i++) {
      v.fromBufferAttribute(posAttr, i).applyMatrix4(rel);
      if (Number.isFinite(v.y) && v.y < minY) minY = v.y;
    }
  });
  const groundY = Number.isFinite(minY) ? minY : 0;
  const hipHeightM = r3(Math.max(0.05, hips.y - groundY));
  const avgLeg = limbs.reduce((sum, limb) => sum + limb.upperM + limb.lowerM, 0) / limbs.length;
  const strideM = r3(Math.max(0.1, avgLeg * 0.78));
  const stepHeightM = r3(Math.max(0.03, avgLeg * 0.14));

  return {
    type: 'legs',
    summary: 'Bipedal skeleton with measured hip height, leg segments, and proportional walk stride.',
    legs: {
      hipHeightM,
      strideM,
      stepHeightM,
      duty: 0.6,
      phaseOrder: limbs.map(l => l.name),
      limbs,
    },
  };
}

function deriveArmIk(root: T.Object3D, riggedParts: readonly RiggedPartSpec[]): AssetIkSpec | undefined {
  const candidates = riggedParts
    .filter(part => ARM_PART_PATTERN.test(part.name))
    .map(part => ({ part, node: root.getObjectByName(part.name) }))
    .filter((entry): entry is { part: RiggedPartSpec; node: T.Object3D } => Boolean(entry.node));
  const first = candidates[0];
  if (!first) return undefined;

  root.updateMatrixWorld(true);
  const invRoot = root.matrixWorld.clone().invert();
  const basePos = new T.Vector3().setFromMatrixPosition(first.node.matrixWorld).applyMatrix4(invRoot);
  const segments: IkArmSegmentSpec[] = [];
  let maxReach = 0;
  const rel = new T.Matrix4();
  const pt = new T.Vector3();

  for (const { part, node } of candidates) {
    const pivot = new T.Vector3().setFromMatrixPosition(node.matrixWorld).applyMatrix4(invRoot);
    let segMax = 0;
    node.traverse(child => {
      if (!(child instanceof T.Mesh) || child.userData.studioOverlay) return;
      const geo = child.geometry as T.BufferGeometry;
      const posAttr = geo.getAttribute('position') as T.BufferAttribute | undefined;
      if (!posAttr) return;
      rel.multiplyMatrices(invRoot, child.matrixWorld);
      for (let i = 0; i < posAttr.count; i++) {
        pt.fromBufferAttribute(posAttr, i).applyMatrix4(rel);
        if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y) || !Number.isFinite(pt.z)) continue;
        const dPivot = pt.distanceTo(pivot);
        if (dPivot > segMax) segMax = dPivot;
        const dBase = pt.distanceTo(basePos);
        if (dBase > maxReach) maxReach = dBase;
      }
    });
    if (segMax > 0.02) segments.push({ name: part.name, lengthM: r3(segMax) });
  }

  if (!segments.length || maxReach <= 0.05) return undefined;
  return {
    type: 'arm',
    summary: `Articulated mechanical arm (${segments.map(s => s.name).join(' -> ')}) with measured reach envelope.`,
    arm: {
      baseAt: [r3(basePos.x), r3(basePos.y), r3(basePos.z)],
      reachM: r3(maxReach),
      segments,
    },
  };
}

/** Automatically measure leg/gait or articulated arm IK metadata from a Three.js asset hierarchy. */
export function deriveIkMetadata(
  root: T.Object3D,
  riggedParts: readonly RiggedPartSpec[] = [],
): AssetIkSpec | undefined {
  const legs = deriveBipedalLegsIk(root);
  if (legs) return legs;
  return deriveArmIk(root, riggedParts);
}
