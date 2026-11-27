import * as T from 'three';
import { traverseOwnSubtree } from './compose-tree';
import type { DecalSlotSpec, NightZoneSpec } from './schema';

export interface NightOverlay {
  mesh: T.Mesh;
  geometry: T.BufferGeometry;
  material: T.MeshBasicMaterial;
}

export interface DecalOverlay {
  mesh: T.Mesh;
  dispose: () => void;
}

// Compare vertex albedo in sRGB space so dark panes (#34322d) do not falsely match black trim/ironwork.
const nightSrgbTolerance = 0.045;

function srgbClose(
  srgb: { r: number; g: number; b: number },
  target: { r: number; g: number; b: number },
): boolean {
  return (
    Math.abs(srgb.r - target.r) <= nightSrgbTolerance &&
    Math.abs(srgb.g - target.g) <= nightSrgbTolerance &&
    Math.abs(srgb.b - target.b) <= nightSrgbTolerance
  );
}

export function buildNightOverlays(root: T.Object3D, zones: NightZoneSpec[]): NightOverlay[] {
  if (!zones.length) return [];
  const targets = zones.map(zone => {
    const srgb = { r: 0, g: 0, b: 0 };
    new T.Color(zone.albedo).getRGB(srgb, T.SRGBColorSpace);
    return { zone, srgb };
  });
  const overlays: NightOverlay[] = [];
  const hosts: T.Mesh[] = [];
  traverseOwnSubtree(root, node => {
    if (node.userData.studioOverlay) return;
    if (node instanceof T.Mesh && !(node instanceof T.SkinnedMesh)) hosts.push(node as T.Mesh);
  });
  const scratch = new T.Color();
  const v0 = { r: 0, g: 0, b: 0 }, v1 = { r: 0, g: 0, b: 0 }, v2 = { r: 0, g: 0, b: 0 };
  for (const mesh of hosts) {
    const geometry = mesh.geometry;
    const position = geometry.getAttribute('position') as T.BufferAttribute | T.InterleavedBufferAttribute | undefined;
    const colorAttr = geometry.getAttribute('color') as T.BufferAttribute | T.InterleavedBufferAttribute | undefined;
    if (!position || !colorAttr) continue;
    const index = geometry.getIndex();
    const triCount = index ? Math.floor(index.count / 3) : Math.floor(position.count / 3);
    for (const { zone, srgb } of targets) {
      const positions: number[] = [];
      for (let t = 0; t < triCount; t++) {
        const i0 = index ? index.getX(t * 3) : t * 3;
        const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
        const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;
        scratch.setRGB(colorAttr.getX(i0), colorAttr.getY(i0), colorAttr.getZ(i0)).getRGB(v0, T.SRGBColorSpace);
        if (!srgbClose(v0, srgb)) continue;
        scratch.setRGB(colorAttr.getX(i1), colorAttr.getY(i1), colorAttr.getZ(i1)).getRGB(v1, T.SRGBColorSpace);
        if (!srgbClose(v1, srgb)) continue;
        scratch.setRGB(colorAttr.getX(i2), colorAttr.getY(i2), colorAttr.getZ(i2)).getRGB(v2, T.SRGBColorSpace);
        if (!srgbClose(v2, srgb)) continue;
        positions.push(
          position.getX(i0), position.getY(i0), position.getZ(i0),
          position.getX(i1), position.getY(i1), position.getZ(i1),
          position.getX(i2), position.getY(i2), position.getZ(i2),
        );
      }
      if (!positions.length) continue;
      const glowGeo = new T.BufferGeometry();
      glowGeo.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
      const glowColor = new T.Color(zone.color).multiplyScalar(Math.max(0.35, Math.min(2, zone.intensity)));
      const glowMat = new T.MeshBasicMaterial({
        color: glowColor,
        toneMapped: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
      const overlay = new T.Mesh(glowGeo, glowMat);
      overlay.name = 'night-' + zone.name;
      overlay.userData.studioOverlay = true;
      overlay.visible = false;
      overlay.castShadow = false;
      overlay.receiveShadow = false;
      mesh.add(overlay);
      overlays.push({ mesh: overlay, geometry: glowGeo, material: glowMat });
    }
  }
  return overlays;
}

function makeDecalTexture(label: string, aspect: number): T.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const width = 512;
  const height = Math.max(96, Math.round(width / Math.max(0.5, Math.min(8, aspect))));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(255, 250, 238, 0.92)';
  ctx.fillRect(4, 4, width - 8, height - 8);
  ctx.strokeStyle = '#d96a3b';
  ctx.lineWidth = Math.max(4, Math.round(height * 0.05));
  ctx.setLineDash([14, 8]);
  ctx.strokeRect(8, 8, width - 16, height - 16);
  ctx.setLineDash([]);
  ctx.fillStyle = '#252b22';
  const fontSize = Math.max(22, Math.min(Math.round(height * 0.56), Math.round((width * 0.84) / Math.max(4, label.length * 0.62))));
  ctx.font = `700 ${String(fontSize)}px "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, width / 2, height / 2 + 1, width - 32);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}

export function buildDecalMesh(slot: DecalSlotSpec, text: string): DecalOverlay {
  const geo = new T.PlaneGeometry(slot.size[0], slot.size[1]);
  const texture = makeDecalTexture(text || slot.name.toUpperCase(), slot.size[0] / slot.size[1]);
  const mat = new T.MeshBasicMaterial({
    color: texture ? 0xffffff : 0xd96a3b,
    map: texture,
    transparent: true,
    opacity: texture ? 0.96 : 0.4,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
    depthWrite: false,
  });
  const mesh = new T.Mesh(geo, mat);
  mesh.name = 'decal-preview-' + slot.name;
  mesh.userData.studioOverlay = true;
  const normal = new T.Vector3(...slot.normal);
  if (normal.lengthSq() < 1e-10) normal.set(0, 0, 1);
  else normal.normalize();
  const up = new T.Vector3(...slot.up);
  if (up.lengthSq() < 1e-10) up.set(0, 1, 0);
  else up.normalize();
  const right = new T.Vector3().crossVectors(up, normal);
  if (right.lengthSq() < 1e-8) {
    const fallback = Math.abs(normal.y) < 0.9 ? new T.Vector3(0, 1, 0) : new T.Vector3(1, 0, 0);
    right.crossVectors(fallback, normal);
  }
  right.normalize();
  const orthoUp = new T.Vector3().crossVectors(normal, right).normalize();
  const basis = new T.Matrix4().makeBasis(right, orthoUp, normal);
  mesh.quaternion.setFromRotationMatrix(basis);
  mesh.position.set(...slot.at).addScaledVector(normal, 0.006);
  return {
    mesh,
    dispose: () => {
      geo.dispose();
      texture?.dispose();
      mat.dispose();
    },
  };
}
