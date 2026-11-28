import type { Camera, Object3D, Scene, WebGLRenderer } from 'three';

/** Measure the visible model in the current camera without counting the stage grid or either floor shadow. */
export function measureViewCoverage(renderer: WebGLRenderer, scene: Scene, camera: Camera, stage: Object3D[]) {
  const sample = document.createElement('canvas');
  sample.width = 320;
  sample.height = 240;
  const ctx = sample.getContext('2d');
  if (!ctx) throw new Error('Cannot sample the viewport.');
  const alpha = renderer.getClearAlpha();
  const visibility = stage.map(object => object.visible);
  try {
    for (const object of stage) object.visible = false;
    renderer.setClearAlpha(0);
    renderer.render(scene, camera);
    ctx.drawImage(renderer.domElement, 0, 0, sample.width, sample.height);
  } finally {
    stage.forEach((object, i) => { object.visible = visibility[i] ?? false; });
    renderer.setClearAlpha(alpha);
    renderer.render(scene, camera);
  }
  return alphaCoverage(ctx.getImageData(0, 0, sample.width, sample.height));
}

export function alphaCoverage({ data, width, height }: Pick<ImageData, 'data' | 'width' | 'height'>) {
  let pixels = 0;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!data[4 * (y * width + x) + 3]) continue;
      pixels++;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  const clippedEdges: string[] = [];
  if (pixels) {
    if (minX <= 1) clippedEdges.push('left');
    if (maxX >= width - 2) clippedEdges.push('right');
    if (minY <= 1) clippedEdges.push('top');
    if (maxY >= height - 2) clippedEdges.push('bottom');
  }
  const round = (v: number) => Number(v.toFixed(3));
  return {
    coveragePct: Number((100 * pixels / (width * height)).toFixed(2)),
    bounds: pixels ? {
      minX: round(minX / width), maxX: round((maxX + 1) / width),
      minY: round(minY / height), maxY: round((maxY + 1) / height),
    } : null,
    clippedEdges,
  };
}
