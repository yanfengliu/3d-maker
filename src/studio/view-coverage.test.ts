import { expect, it } from 'vitest';
import { alphaCoverage } from './view-coverage';

it('scores translucent or background-colored model pixels and detects real silhouette clipping', () => {
  const width = 10, height = 10;
  const data = new Uint8ClampedArray(width * height * 4).fill(231);
  for (let i = 3; i < data.length; i += 4) data[i] = 0;
  const sample = { data, width, height };
  expect(alphaCoverage(sample)).toEqual({ coveragePct: 0, bounds: null, clippedEdges: [] });
  data[4 * 55 + 3] = 128;
  expect(alphaCoverage(sample)).toEqual({
    coveragePct: 1, bounds: { minX: 0.5, minY: 0.5, maxX: 0.6, maxY: 0.6 }, clippedEdges: [],
  });
  data[4 * 90 + 3] = 255;
  expect(alphaCoverage(sample).clippedEdges).toEqual(['left', 'bottom']);
});
