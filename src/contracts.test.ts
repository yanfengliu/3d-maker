import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { COLOR_ZONE_NAME_PATTERN, parseCapabilities } from './capabilities/schema';
import { parseDetailResponse } from './data/polyfork-detail';
import { validatePaint } from './imports/paint';
import * as sdk from './sdk';
import { createAgentApi, type StudioHost } from './studio/agent-api';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('cross-module schema, paint, SDK, and llms.txt contracts', () => {
  it('keeps color-zone identifiers accepted by schema.ts and polyfork-detail.ts 100% compatible with validatePaint', () => {
    const validNames = [
      'a',
      'limewash',
      'roof_trim-01',
      'Z'.repeat(64),
      'z'.repeat(80),
    ];
    const invalidNames = [
      '',
      ' ',
      '-leading-dash',
      '_leading_underscore',
      'has space',
      'path/slash',
      '../escape',
      'z'.repeat(81),
    ];

    for (const name of validNames) {
      expect(COLOR_ZONE_NAME_PATTERN.test(name), `Expected valid zone name "${name}"`).toBe(true);
      const parsed = parseCapabilities({
        version: 1,
        name: 'ZoneTest',
        colorZones: [{ name, label: 'Zone', color: '#aabbcc' }],
        presets: [{ name: 'p1', label: 'P1', colors: { [name]: '#112233' } }],
      });
      expect(parsed?.colorZones?.[0]?.name).toBe(name);
      expect(parsed?.presets?.[0]?.colors[name]).toBe('#112233');

      const detail = parseDetailResponse(
        'test-asset',
        { id: 'test-asset', title: 'Test' },
        { params: { [name]: { type: 'color', default: '#aabbcc' } }, presets: { p1: { [name]: '#112233' } } },
      );
      expect(detail?.colorZones[0]?.name).toBe(name);
      expect(detail?.presets[0]?.colors[name]).toBe('#112233');

      // Every zone accepted by schema.ts or polyfork-detail.ts MUST pass validatePaint when prefixed with `zone-`.
      expect(validatePaint({ ['zone-' + name]: '#445566' })).toEqual({ ['zone-' + name]: '#445566' });
    }

    for (const bad of invalidNames) {
      expect(COLOR_ZONE_NAME_PATTERN.test(bad), `Expected invalid zone name "${bad}"`).toBe(false);
      const parsed = parseCapabilities({
        version: 1,
        name: 'ZoneTest',
        colorZones: [{ name: bad, label: 'Bad', color: '#aabbcc' }],
        presets: [{ name: 'p1', label: 'P1', colors: { [bad]: '#112233' } }],
      });
      expect(parsed?.colorZones).toBeUndefined();
      expect(parsed?.presets).toBeUndefined();
      expect(() => validatePaint({ ['zone-' + bad]: '#445566' })).toThrow();
    }
  });

  it('keeps public/llms.txt in bi-directional sync with src/sdk.ts exports and window.forgeStudio methods', () => {
    const llms = readFileSync(resolve(repoRoot, 'public/llms.txt'), 'utf8');

    // 1. Self-describing GLB manifest location and keys documented in llms.txt.
    expect(llms).toContain('nodes[0].extras.formFoundry');
    for (const key of ['riggedParts', 'detachableParts', 'nightZones', 'decals', 'colorZones', 'presets', 'dimensions', 'physics', 'ik', 'colliders', 'clearanceZones', 'surfaces', 'clips', 'state']) {
      expect(llms, `public/llms.txt missing capability field "${key}"`).toContain(`\`${key}\``);
    }

    // 2. Every studio-sdk.js function documented in llms.txt is exported by src/sdk.ts.
    const sdkLine = llms.match(/studio-sdk\.js` exports ([^\n]+)/)?.[1] ?? '';
    const documentedSdkExports = [...sdkLine.matchAll(/`([a-zA-Z0-9_]+)(?:\([^)]*\))?`/g)]
      .map(m => m[1])
      .filter((v): v is string => Boolean(v));
    expect(documentedSdkExports.length).toBeGreaterThanOrEqual(3);
    for (const name of documentedSdkExports) {
      expect(name in sdk, `public/llms.txt documents studio-sdk.js export "${name}" which is missing from src/sdk.ts`).toBe(true);
    }

    // 3. Every window.forgeStudio method is documented in llms.txt, and every documented method exists on createAgentApi().
    const stubHost = {
      stage: { getProjection: () => 'perspective' },
      getRecipe: () => null,
      getImported: () => null,
      getController: () => null,
      applyRecipe: () => undefined,
      selectVariation: () => undefined,
      remix: () => undefined,
      save: () => Promise.resolve(''),
      exportGLB: () => Promise.resolve(new ArrayBuffer(0)),
      openPolyfork: () => Promise.resolve(),
      listPaintSlots: () => [],
      getImportEdits: () => null,
      setImportEdits: () => undefined,
      listClips: () => [],
      playClip: () => undefined,
      syncRigEdits: () => undefined,
      refreshRig: () => undefined,
      syncViewportTools: () => undefined,
      applyPreset: () => undefined,
      setProjection: () => undefined,
      setView: () => undefined,
    } as unknown as StudioHost;
    const apiMethods = Object.keys(createAgentApi(stubHost)).sort();

    const apiSection = llms.split('## Browser API')[1]?.split('## Upstream assets')[0] ?? '';
    const bulletLines = apiSection.split('\n').filter(line => line.startsWith('- '));
    const documentedMethods = new Set<string>();
    for (const line of bulletLines) {
      for (const match of line.matchAll(/\b([a-z][a-zA-Z0-9]*)\(/g)) {
        if (match[1]) documentedMethods.add(match[1]);
      }
    }

    const undocumented = apiMethods.filter(name => !documentedMethods.has(name));
    const stale = [...documentedMethods].filter(name => !apiMethods.includes(name));
    expect(undocumented, `Undocumented window.forgeStudio method(s) in public/llms.txt: ${undocumented.join(', ')}`).toEqual([]);
    expect(stale, `Stale method(s) documented in public/llms.txt but absent from createAgentApi(): ${stale.join(', ')}`).toEqual([]);
  });

  it('keeps public/agent-schema.json properties in sync with Recipe fields', () => {
    const schema = JSON.parse(readFileSync(resolve(repoRoot, 'public/agent-schema.json'), 'utf8')) as {
      properties: Record<string, unknown>;
    };
    expect(Object.keys(schema.properties).sort()).toEqual([
      'accent',
      'detail',
      'name',
      'primary',
      'proportion',
      'quality',
      'scale',
      'template',
      'variation',
      'version',
    ]);
  });
});
