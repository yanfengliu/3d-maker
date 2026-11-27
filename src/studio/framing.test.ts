import * as T from 'three';
import { describe, expect, it } from 'vitest';
import { catalog } from '../data/recipe';
import { createAsset } from '../sdk';
import { clipFocusShift, expandedFrame, projectedBoxSize, sampleClipBounds } from './framing';

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
});
