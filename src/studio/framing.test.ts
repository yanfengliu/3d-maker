import * as T from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { catalog } from '../data/recipe';
import { createAsset } from '../sdk';
import { clipFocusShift, expandedFrame, projectedBoxSize, sampleClipBounds } from './framing';
import {
  DEFAULT_PROJECTION,
  orthoHalfHeight,
  orthoZoomForPerspective,
  parseProjection,
  perspectiveDistance,
  perspectiveDistanceForOrtho,
  readProjectionPreference,
  saveProjectionPreference,
} from './projection';

function pilotModel(scale = 1) {
  const row = catalog.find((entry) => entry.id === 'field-pilot');
  if (!row) throw new Error('Missing Field Pilot template.');
  return createAsset({ ...row.recipe, scale });
}

function cameraAt(target: T.Vector3, direction: [number, number, number], radius: number) {
  const camera = new T.OrthographicCamera(-2, 2, 2, -2, 0.01, 200);
  camera.position.copy(target).addScaledVector(new T.Vector3(...direction).normalize(), radius * 5.2);
  camera.lookAt(target);
  camera.updateMatrixWorld();
  return camera;
}

describe('clip preview framing', () => {
  it('detects low poses without altering model transforms, rest pose, or clip tracks', () => {
    const model = pilotModel();
    const rest = new T.Box3().setFromObject(model, true);
    const radius = rest.getSize(new T.Vector3()).length() / 2;
    const hips = model.getObjectByName('Hips');
    if (!hips) throw new Error('Missing Hips bone.');
    const restHips = hips.position.clone();
    const swimming = model.animations.find((clip) => clip.name === 'Swimming');
    const treading = model.animations.find((clip) => clip.name === 'Treading water');
    const idle = model.animations.find((clip) => clip.name === 'Idle');
    if (!swimming || !treading || !idle) throw new Error('Missing expected clips.');
    const tracksBefore = swimming.tracks.map((track) => Array.from(track.values));

    const swimBounds = sampleClipBounds(model, swimming, rest);
    const treadBounds = sampleClipBounds(model, treading, rest);
    const idleBounds = sampleClipBounds(model, idle, rest);

    expect(model.position.toArray()).toEqual([0, 0, 0]);
    expect(hips.position.distanceTo(restHips)).toBeLessThan(1e-6);
    expect(swimming.tracks.map((track) => Array.from(track.values))).toEqual(tracksBefore);

    const swimShift = clipFocusShift(rest, swimBounds, radius);
    const treadShift = clipFocusShift(rest, treadBounds, radius);
    const idleShift = clipFocusShift(rest, idleBounds, radius);
    expect(swimShift.y).toBeLessThan(-0.9);
    expect(treadShift.y).toBeLessThan(-1.2);
    expect(idleShift.length()).toBe(0);
  });

  it('expands tight views for stretched poses while staying invariant to scale edits', () => {
    const normal = pilotModel(1);
    const rest = new T.Box3().setFromObject(normal, true);
    const radius = rest.getSize(new T.Vector3()).length() / 2;
    const swimming = normal.animations.find((clip) => clip.name === 'Swimming');
    const treading = normal.animations.find((clip) => clip.name === 'Treading water');
    if (!swimming || !treading) throw new Error('Missing swimming clips.');

    const swimBounds = sampleClipBounds(normal, swimming, rest);
    const treadBounds = sampleClipBounds(normal, treading, rest);
    const restCenter = rest.getCenter(new T.Vector3());

    const topCam = cameraAt(restCenter, [0, 8, 0.001], radius);
    const topRest = projectedBoxSize(rest, topCam.matrixWorldInverse);
    const topBaseW = topRest.x * 1.18;
    const topBaseH = topRest.y * 1.15;
    const topExpanded = expandedFrame(topBaseW, topBaseH, rest, swimBounds, topCam.matrixWorldInverse, radius, 1.18, 1.15);
    expect(topExpanded.width).toBeGreaterThan(topBaseW * 1.5);
    expect(topExpanded.height).toBeGreaterThan(topBaseH * 2.5);

    const perspCam = cameraAt(restCenter, [5, 3.55, 6.5], radius);
    const perspRest = projectedBoxSize(rest, perspCam.matrixWorldInverse);
    const baseW = perspRest.x * 1.18;
    const baseH = perspRest.y * 1.15;
    const treadExpanded = expandedFrame(baseW, baseH, rest, treadBounds, perspCam.matrixWorldInverse, radius, 1.18, 1.15);
    expect(treadExpanded.height).toBeGreaterThan(baseH);

    // Scaling the model keeps expandedFrame invariant so the Scale slider visibly resizes the preview.
    const scaled = pilotModel(1.4);
    const scaledRest = new T.Box3().setFromObject(scaled, true);
    const scaledSwim = sampleClipBounds(scaled, swimming, scaledRest);
    const normalSwimFrame = expandedFrame(baseW, baseH, rest, swimBounds, perspCam.matrixWorldInverse, radius, 1.18, 1.15);
    const scaledSwimFrame = expandedFrame(baseW, baseH, scaledRest, scaledSwim, perspCam.matrixWorldInverse, radius, 1.18, 1.15);
    expect(scaledSwimFrame.width).toBeCloseTo(normalSwimFrame.width, 1);
    expect(scaledSwimFrame.height).toBeCloseTo(normalSwimFrame.height, 1);
  });

  it('keeps rigid models with spinning wheels grounded without rotating-AABB floor drop', () => {
    const row = catalog.find((entry) => entry.id === 'field-rover');
    if (!row) throw new Error('Missing Field Rover template.');
    const rover = createAsset(row.recipe);
    const rest = new T.Box3().setFromObject(rover, true);
    const radius = rest.getSize(new T.Vector3()).length() / 2;
    const traverse = rover.animations.find((clip) => clip.name === 'Traverse');
    if (!traverse) throw new Error('Missing Traverse clip.');
    const bounds = sampleClipBounds(rover, traverse, rest);
    expect(Math.abs(bounds.min.y - rest.min.y)).toBeLessThan(0.015);
    expect(clipFocusShift(rest, bounds, radius).length()).toBe(0);
  });

  it('computes finite, grounded framing across all 87 humanoid clips without mutating rest transforms', () => {
    const model = pilotModel();
    expect(model.animations.length).toBe(87);
    const rest = new T.Box3().setFromObject(model, true);
    const restCenter = rest.getCenter(new T.Vector3());
    const radius = rest.getSize(new T.Vector3()).length() / 2;
    const hips = model.getObjectByName('Hips');
    if (!hips) throw new Error('Missing Hips bone.');
    const restHips = hips.position.clone();
    const cam = cameraAt(restCenter, [5, 3.55, 6.5], radius);
    const restProjected = projectedBoxSize(rest, cam.matrixWorldInverse);
    const baseW = restProjected.x * 1.18;
    const baseH = restProjected.y * 1.15;

    for (const clip of model.animations) {
      const sampled = sampleClipBounds(model, clip, rest);
      expect(sampled.isEmpty(), `Empty bounds for clip "${clip.name}"`).toBe(false);
      const size = sampled.getSize(new T.Vector3());
      expect(size.toArray().every(v => Number.isFinite(v) && v > 0.05 && v < 15), `Invalid size for "${clip.name}"`).toBe(true);
      const shift = clipFocusShift(rest, sampled, radius);
      expect(shift.toArray().every(Number.isFinite), `Non-finite shift for "${clip.name}"`).toBe(true);
      const frame = expandedFrame(baseW, baseH, rest, sampled, cam.matrixWorldInverse, radius, 1.18, 1.15);
      expect(frame.width).toBeGreaterThanOrEqual(baseW - 1e-6);
      expect(frame.height).toBeGreaterThanOrEqual(baseH - 1e-6);
      expect(Number.isFinite(frame.width) && Number.isFinite(frame.height)).toBe(true);
    }
    expect(hips.position.distanceTo(restHips)).toBeLessThan(1e-6);
  }, 15_000);
});

describe('camera projection and cross-port localhost persistence', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults to perspective, normalizes aliases, and persists across localhost ports via cookie + localStorage', () => {
    const store = new Map<string, string>();
    const cookies = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
    });
    vi.stubGlobal('document', {
      get cookie() {
        return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
      },
      set cookie(raw: string) {
        const pair = raw.split(';')[0] ?? '';
        const idx = pair.indexOf('=');
        if (idx > 0) cookies.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
      },
    });

    expect(DEFAULT_PROJECTION).toBe('perspective');
    expect(parseProjection('Perspective')).toBe('perspective');
    expect(parseProjection('isometric')).toBe('orthographic');
    expect(parseProjection('ortho')).toBe('orthographic');
    expect(parseProjection('fisheye')).toBeNull();
    expect(readProjectionPreference()).toBe('perspective');

    // Saving on port A sets both cookie and localStorage.
    saveProjectionPreference('orthographic');
    expect(readProjectionPreference()).toBe('orthographic');

    // Opening a different localhost port (empty localStorage, shared domain cookie) keeps orthographic.
    store.clear();
    expect(readProjectionPreference()).toBe('orthographic');

    // Switching back to perspective on port B overrides a stale localStorage value on port A.
    store.set('3d-maker:viewport:projection', 'orthographic');
    saveProjectionPreference('perspective');
    expect(readProjectionPreference()).toBe('perspective');
  });

  it('matches apparent visible scale cleanly when switching between perspective and orthographic', () => {
    const aspect = 1.5;
    const halfH = orthoHalfHeight(3.2, 2.8, aspect);
    const dist = perspectiveDistance(3.2, 2.8, 2.2, aspect);
    expect(dist).toBeGreaterThan(2.5);
    const matchedDist = perspectiveDistanceForOrtho(halfH, 1.4);
    const roundTripZoom = orthoZoomForPerspective(halfH, matchedDist, 1);
    expect(roundTripZoom).toBeCloseTo(1.4, 6);
  });
});
