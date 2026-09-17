import * as THREE from 'three';

/**
 * The procedural maps the phone's materials carry: the frame's brushed grain
 * and the lens hotspot sprite. Nothing here is fetched — both textures are
 * painted into canvases at module scope, which is what keeps the page
 * self-contained under the GitHub Pages base path.
 */

/** A one-axis grain: every pixel in a row carries the same X tangent, and the
 *  rows walk a deterministic hash, so the map is horizontal streaks and nothing
 *  else. Where it lands is decided by the UVs the geometry supplies, not here:
 *  `slabGeometry` gives the frame a UV in millimetres, about 146 across the
 *  body, so at `normalScale` 0.12 the tilts are a fraction of a degree and read
 *  as a fine matte grain rather than as ridges. The plateau shell is a raw
 *  buffer with no UV attribute at all, so this map does not touch the bump. */
export function brushedNormalMap(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (context !== null) {
    const image = context.createImageData(size, size);
    // Deterministic hash: same streaks on every load, no Math.random.
    for (let y = 0; y < size; y += 1) {
      const hashed = Math.sin(y * 127.1 + 311.7) * 43758.5453;
      const value = 128 + (hashed - Math.floor(hashed) - 0.5) * 10;
      for (let x = 0; x < size; x += 1) {
        const index = (y * size + x) * 4;
        image.data[index] = value;
        image.data[index + 1] = 128;
        image.data[index + 2] = 255;
        image.data[index + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 2);
  return texture;
}

/** Soft round falloff used as a lens hotspot. */
export function glowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (context !== null) {
    const gradient = context.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, 'rgba(255,255,255,0.85)');
    gradient.addColorStop(0.35, 'rgba(200,225,255,0.35)');
    gradient.addColorStop(1, 'rgba(120,150,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
