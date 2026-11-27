import * as T from 'three';
import { describe, expect, it } from 'vitest';
import { createAssetController } from '../capabilities/runtime';
import { writeCapabilities } from '../capabilities/schema';
import {
  KitFrame,
  bboxFrame,
  createHingeOnFrame,
  grainShader,
  gridFrames,
  heightBandShader,
  jitterFrames,
  localFrame,
  matteMaterial,
  placeOnFrame,
  ringFrames,
  upwardBlendShader,
  varyValues,
} from './kit-grammar';
import { applyVertexColorTone, mergeStaticParts } from './merge-static';

describe('Kit grammar frames, one-frame-per-joint, distributors, and procedural vertex-color shaders', () => {
  it('places children flush on bboxFrame faces/edges and shares one frame with createHingeOnFrame', () => {
    const root = new T.Group();
    root.name = 'FrameCabinet';
    const body = new T.Mesh(new T.BoxGeometry(1.0, 0.8, 0.6), matteMaterial('#8b6a4e'));
    body.position.set(0, 0.4, 0);
    root.add(body);

    // Seat a lamp flush on the cabinet's top (+Y) face with anchor: 'bottom' (zero manual height math).
    const top = bboxFrame(body, '+Y', root);
    expect(top.origin.y).toBeCloseTo(0.8, 5);
    expect(top.z.y).toBeCloseTo(1, 5);

    const lamp = new T.Mesh(new T.CylinderGeometry(0.1, 0.14, 0.4, 8), matteMaterial('#a08446'));
    root.add(lamp);
    placeOnFrame(lamp, top, { anchor: 'bottom' });
    const lampBox = new T.Box3().setFromObject(lamp);
    expect(lampBox.min.y).toBeCloseTo(0.8, 4);
    expect(lampBox.max.y).toBeCloseTo(1.2, 4);

    // Mount a spout perpendicular to the +X side wall using align: 'up' + anchor: 'bottom' + single-applied ry.
    const sideWall = bboxFrame(body, '+X', root);
    const spout = new T.Mesh(new T.BoxGeometry(0.1, 0.3, 0.04), matteMaterial('#708090'));
    root.add(spout);
    placeOnFrame(spout, sideWall, { align: 'up', anchor: 'bottom', ry: 90 });
    const spoutBox = new T.Box3().setFromObject(spout);
    expect(spoutBox.min.x).toBeCloseTo(0.5, 4);
    expect(spoutBox.max.x).toBeCloseTo(0.8, 4);
    // ry: 90 rotates the box's 0.1 width from Z into Y (and 0.04 thickness from Y into Z), proving ry was applied once, not twice.
    expect(spoutBox.max.y - spoutBox.min.y).toBeCloseTo(0.1, 4);
    expect(spoutBox.max.z - spoutBox.min.z).toBeCloseTo(0.04, 4);

    // One-frame-per-joint: place door hinge on the front-right edge (+X+Z) and drive via createAssetController.
    const hingeEdge = bboxFrame(body, '+X+Z', root);
    expect(hingeEdge.origin.x).toBeCloseTo(0.5, 5);
    expect(hingeEdge.origin.z).toBeCloseTo(0.3, 5);
    const { group: doorPivot, spec: doorSpec } = createHingeOnFrame(root, 'FrontDoor', hingeEdge, {
      axis: 'y',
      range: [0, 90],
      describe: 'Swings front door outward',
    });
    const doorLeaf = new T.Mesh(new T.BoxGeometry(0.04, 0.76, 0.96), matteMaterial('#5b4331'));
    doorLeaf.position.set(0.02, 0, -0.48);
    doorPivot.add(doorLeaf);

    writeCapabilities(root, {
      version: 1,
      name: 'FrameCabinet',
      riggedParts: [doorSpec],
      detachableParts: [],
      nightZones: [],
      decals: [],
    });
    const ctrl = createAssetController(root);
    ctrl.openPart('FrontDoor');
    expect(ctrl.getPart('FrontDoor')).toBe(90);
    // Frame normal is +X, frame +Y is world +Y -> rotating +90 deg about local Y swings leaf outward along +X!
    const tipWorld = new T.Vector3(0.02, 0, -0.96).applyMatrix4(doorPivot.matrixWorld);
    expect(tipWorld.z).toBeGreaterThan(0.8);
    ctrl.dispose();
  });

  it('produces deterministic grid, ring, jittered frames, and varied scalar values', () => {
    const base = localFrame({ x: 1, y: 2, z: -1 });
    const grid = gridFrames(3, 2, 0.5, 0.4, KitFrame.fromNormal([0, 0, 0], [0, 1, 0]), true);
    expect(grid.length).toBe(6);
    expect(grid[3]?.origin.x).toBeCloseTo((grid[0]?.origin.x ?? 0) + 0.25, 5);

    const ring = ringFrames(8, 1.5, KitFrame.fromNormal([0, 0.5, 0], [0, 1, 0]), { faceOutward: true });
    expect(ring.length).toBe(8);
    for (const f of ring) {
      expect(Math.hypot(f.origin.x, f.origin.z)).toBeCloseTo(1.5, 5);
      expect(f.origin.y).toBeCloseTo(0.5, 5);
      // Outward normal points radially away from ring center!
      const radial = new T.Vector3(f.origin.x, 0, f.origin.z).normalize();
      expect(f.z.dot(radial)).toBeCloseTo(1, 5);
    }

    const j1 = jitterFrames(ring, { x: 0.05, y: 0.05, ry: 12, seed: 42 });
    const j2 = jitterFrames(ring, { x: 0.05, y: 0.05, ry: 12, seed: 42 });
    expect(j1.map(f => f.point())).toEqual(j2.map(f => f.point()));
    const ring0 = ring[0];
    expect(ring0).toBeDefined();
    if (ring0) expect(j1[0]?.origin.distanceTo(ring0.origin)).toBeLessThanOrEqual(0.08);
    expect(base.point(0, 0, 0)).toEqual([1, 2, -1]);

    const vals = varyValues(10, 2, 16, 99);
    expect(vals.length).toBe(16);
    expect(vals.every(v => v >= 8 && v <= 12)).toBe(true);
    expect(vals).toEqual(varyValues(10, 2, 16, 99));
  });

  it('bakes procedural vertex-color shaders (upward moss, height band, periodic grain) inside mergeStaticParts with zero extra draw calls', () => {
    // 1. Standalone applyVertexColorTone with upwardBlendShader tints top faces green while side faces keep base gray.
    const stone = applyVertexColorTone(
      new T.BoxGeometry(1, 1, 1),
      '#808080',
      0,
      1,
      0,
      upwardBlendShader('#3b6e34', 0.6, 0.1, 1),
    );
    const norm = stone.getAttribute('normal') as T.BufferAttribute;
    const col = stone.getAttribute('color') as T.BufferAttribute;
    let topGreenSum = 0, topRedSum = 0, sideGreenSum = 0, sideRedSum = 0;
    for (let i = 0; i < norm.count; i++) {
      if (norm.getY(i) > 0.9) {
        topRedSum += col.getX(i);
        topGreenSum += col.getY(i);
      } else if (Math.abs(norm.getY(i)) < 0.1) {
        sideRedSum += col.getX(i);
        sideGreenSum += col.getY(i);
      }
    }
    expect(topGreenSum).toBeGreaterThan(topRedSum * 2);
    expect(Math.abs(sideGreenSum - sideRedSum)).toBeLessThan(1e-4);

    // 2. Per-mesh local grainShader + root heightBandShader inside mergeStaticParts keeps single matte draw call and preserves live tintZone!
    const root = new T.Group();
    const bambooMat = matteMaterial('#7da458');
    bambooMat.userData.colorFn = grainShader('#3b5224', 0.2, 0.2, 'y', 0.8);
    const stalk = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 1.0, 8, 12), bambooMat);
    stalk.position.set(0, 0.5, 0);
    root.add(stalk);

    const roofMat = matteMaterial('#566471');
    const roof = new T.Mesh(new T.BoxGeometry(1.0, 0.1, 1.0), roofMat);
    roof.position.set(0, 1.05, 0);
    roof.userData.colorFn = upwardBlendShader('#4c6b3a', 0.7, 0.1, 0.9);
    root.add(roof);

    const accentMat = matteMaterial('#a64533');
    accentMat.userData.tintZone = 'accent';
    const trim = new T.Mesh(new T.BoxGeometry(0.4, 0.1, 0.1), accentMat);
    trim.position.set(0, 0.8, 0.5);
    root.add(trim);

    const report = mergeStaticParts(root, {
      tone: 0.2,
      seed: 7,
      colorFn: heightBandShader('#403a32', '#ffffff', 0, 1.1, 0.35),
    });
    // Bamboo + roof collapse into 1 matte mesh, accent tintZone stays 1 separate live-tintable mesh -> 2 draw calls total!
    expect(report.drawCalls).toBe(2);
    expect(report.mergedMeshes).toBe(3);

    const matteMesh = root.children.find(c => c.name === 'StaticMatte') as T.Mesh | undefined;
    const accentMesh = root.children.find(c => c.name === 'StaticAccent') as T.Mesh | undefined;
    expect(matteMesh).toBeDefined();
    expect(accentMesh).toBeDefined();
    expect((accentMesh?.material as T.MeshStandardMaterial).color.getHexString()).toBe('a64533');
    // Verify matte mesh actually has varied baked vertex colors (not uniform!).
    const mCol = matteMesh?.geometry.getAttribute('color') as T.BufferAttribute;
    let minG = Infinity, maxG = -Infinity;
    for (let i = 0; i < mCol.count; i++) {
      const g = mCol.getY(i);
      if (g < minG) minG = g;
      if (g > maxG) maxG = g;
    }
    expect(maxG - minG).toBeGreaterThan(0.05);
  });
});
