import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as T from 'three';
import { describe, expect, it } from 'vitest';
import { parseCapabilities } from '../capabilities/schema';
import { validatePaint } from '../imports/paint';
import { buildPolyforkCapabilities, parseDetailResponse } from './polyfork-detail';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const localCorpusPath = resolve(repoRoot, 'dataset/polyfork/free-assets.json');

interface RawCorpusAsset {
  id: string;
  title?: string;
  kit?: string | null;
  size_m?: { x: number; y: number; z: number } | null;
  origin_y?: number | null;
  mass_kg?: number | null;
  has_ik?: boolean;
  ik_type?: string | null;
  class?: string;
}

describe('PolyFork capability parsing across adversarial fixtures and local corpus', () => {
  it('handles real-world upstream schema quirks safely and produces valid capability manifests', () => {
    const group = new T.Group();
    const door = new T.Group(); door.name = 'door'; group.add(door);
    const lantern = new T.Group(); lantern.name = 'lantern'; group.add(lantern);

    const edgeCases: { id: string; raw: Record<string, unknown>; params: unknown }[] = [
      {
        id: 'quirky-shop-01',
        raw: {
          id: 'quirky-shop-01',
          title: 'Quirky Shop',
          kit: 'village-kit',
          size_m: { x: 4, y: 3, z: 4.2 },
          origin_y: 0,
          physics: { body: 'static', mass_kg: 15000, material: 'stone' },
          rigged_parts: {
            door: { axis: 'y', range: [0, 85] },
            zeroSpan: { axis: 'x', range: [10, 10] },
            badAxis: { axis: 'w', range: [0, 45] },
          },
          detachable_parts: ['lantern', '', 'missing'],
          night: {
            hiddenGlow: { color: '#ffaa44', intensity: 1, albedo: '#222222', findable: false },
            windowPane: { color: '#ffbb55', intensity: 0.9, albedo: '#333333', findable: true },
          },
        },
        params: {
          params: {
            paint_wall: { type: 'color', default: '#dcd8ce', label: 'Wall' },
            'invalid space': { type: 'color', default: '#112233' },
            ['k'.repeat(81)]: { type: 'color', default: '#445566' },
          },
          presets: {
            sunset: { paint_wall: '#e08963', 'invalid space': '#ffffff' },
          },
        },
      },
      {
        id: 'walker-ik-02',
        raw: {
          id: 'walker-ik-02',
          title: 'Walker Bot',
          has_ik: true,
          ik_type: 'legs',
          size_m: { x: 1.2, y: 2.1, z: 0.9 },
          origin_y: 0,
        },
        params: null,
      },
      {
        id: 'unknown-ik-03',
        raw: {
          id: 'unknown-ik-03',
          title: 'Unknown IK',
          has_ik: true,
          ik_type: 'tentacles',
          size_m: { x: 1, y: 1, z: 1 },
        },
        params: undefined,
      },
    ];

    for (const item of edgeCases) {
      const detail = parseDetailResponse(item.id, item.raw, item.params);
      expect(detail).not.toBeNull();
      const caps = buildPolyforkCapabilities(group, item.id, detail?.title ?? item.id, detail);
      const roundTripped = parseCapabilities(JSON.parse(JSON.stringify(caps)));
      expect(roundTripped).not.toBeNull();
      for (const zone of roundTripped?.colorZones ?? []) {
        expect(validatePaint({ ['zone-' + zone.name]: zone.color })).toBeDefined();
      }
      if (item.id === 'quirky-shop-01') {
        expect(roundTripped?.riggedParts.map(p => p.name)).toEqual(['door']);
        expect(roundTripped?.detachableParts.map(p => p.name)).toEqual(['lantern']);
        expect(roundTripped?.nightZones.map(z => z.name)).toEqual(['windowPane']);
        expect(roundTripped?.colorZones?.map(z => z.name)).toEqual(['paint_wall']);
      }
      if (item.id === 'walker-ik-02') expect(roundTripped?.ik?.type).toBe('legs');
      if (item.id === 'unknown-ik-03') expect(roundTripped?.ik).toBeUndefined();
    }
  });

  it('validates all cached local dataset/polyfork/free-assets.json records when snapshot is present', () => {
    if (!existsSync(localCorpusPath)) return;
    const records = JSON.parse(readFileSync(localCorpusPath, 'utf8')) as RawCorpusAsset[];
    expect(records.length).toBeGreaterThan(3000);
    const emptyGroup = new T.Group();
    let withDimensions = 0;
    let withIk = 0;
    for (const row of records) {
      const detail = parseDetailResponse(row.id, row, null);
      expect(detail, `Failed to parse corpus record "${row.id}"`).not.toBeNull();
      const caps = buildPolyforkCapabilities(emptyGroup, row.id, row.title ?? row.id, detail);
      const parsed = parseCapabilities(JSON.parse(JSON.stringify(caps)));
      expect(parsed, `parseCapabilities rejected corpus record "${row.id}"`).not.toBeNull();
      if (parsed?.dimensions) withDimensions++;
      if (parsed?.ik) withIk++;
    }
    expect(withDimensions).toBeGreaterThan(3000);
    expect(withIk).toBeGreaterThan(0);
  });
});
