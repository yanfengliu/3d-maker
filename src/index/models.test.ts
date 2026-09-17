import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { MODELS } from './models.js';

/**
 * The registry is the single source for the index page, and its paths are plain
 * strings, so nothing but this file stops a typo shipping a card whose poster
 * 404s or whose link leads nowhere.
 *
 * The checks read the disk for the poster, because a path that exists on paper
 * and not under `public/` is exactly the defect a type cannot see. The bound:
 * vitest runs from the repo root, which is what makes this relative `public/`
 * lookup the real one — run from anywhere else, the poster check would fail on
 * every entry and say nothing about the registry.
 */

const PUBLIC_DIR = resolve(process.cwd(), 'public');

describe('the model registry', () => {
  it('ships at least one entry, so the checks below are not vacuous', () => {
    // An empty registry is a legal state for the page — it renders the
    // placeholder — but it would make every loop below pass without measuring
    // anything, which reads identically to a registry that is correct.
    expect(MODELS.length).toBeGreaterThan(0);
  });

  it('fills every required field on every entry', () => {
    for (const entry of MODELS) {
      for (const [field, value] of Object.entries(entry)) {
        expect(value, `${entry.id}: ${field} is empty`).not.toBe('');
      }
    }
  });

  it('gives every entry a unique id', () => {
    const ids = MODELS.map((entry) => entry.id);
    expect(new Set(ids).size, `duplicate id among ${ids.join(', ')}`).toBe(ids.length);
  });

  it('keeps every href a relative page that ends in .html', () => {
    // `./` is what makes one registry work on the dev server and under the
    // /3d-maker/ Pages prefix alike; an absolute path breaks one of the two.
    for (const entry of MODELS) {
      expect(entry.href, `${entry.id}: href is not ./-relative`).toMatch(/^\.\//);
      expect(entry.href, `${entry.id}: href is not a page`).toMatch(/\.html$/);
    }
  });

  it('points every poster at a file that exists under public/', () => {
    for (const entry of MODELS) {
      expect(entry.poster, `${entry.id}: poster is not ./-relative`).toMatch(/^\.\//);
      expect(
        existsSync(resolve(PUBLIC_DIR, entry.poster)),
        `${entry.id}: ${entry.poster} is not a file under public/`,
      ).toBe(true);
    }
  });

  it('writes every accent as a six-digit hex colour', () => {
    for (const entry of MODELS) {
      expect(entry.accent, `${entry.id}: accent is not a hex colour`).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
