import * as T from 'three';
import { describe, expect, it } from 'vitest';
import { listVariations } from '../data/recipe';
import { buildModel } from '../models';
import { cloneForExport } from '../studio/export';
import { createAssetController, farRangeEnd, inspectAsset, synthesizeRigClips } from './runtime';
import { parseCapabilities, readCapabilities, writeCapabilities, type AssetCapabilities, type Axis } from './schema';

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function disposeTree(root: T.Object3D) {
  root.traverse(node => {
    if (!(node instanceof T.Mesh)) return;
    (node.geometry as T.BufferGeometry).dispose();
    const mats = Array.isArray(node.material) ? node.material : [node.material];
    for (const mat of mats) (mat as T.Material).dispose();
  });
}

describe('universal capability and round-trip invariants', () => {
  it('preserves posed transforms, hidden detachable subtrees, and rest recovery across every interactive original variation', () => {
    const variations = listVariations();
    let checkedRigged = 0;
    let checkedDetachable = 0;

    for (const entry of variations) {
      const group = buildModel({ ...entry.recipe, quality: 'standard' });
      const caps = inspectAsset(group);
      if (!caps.riggedParts.length && !caps.detachableParts.length) {
        disposeTree(group);
        continue;
      }

      const ctrl = createAssetController(group);
      const restQuats = new Map<string, T.Quaternion>();
      const restPos = new Map<string, T.Vector3>();
      for (const spec of caps.riggedParts) {
        const node = group.getObjectByName(spec.name);
        expect(node, `${entry.key} missing rigged node ${spec.name}`).toBeDefined();
        if (!node) continue;
        restQuats.set(spec.name, node.quaternion.clone());
        restPos.set(spec.name, node.position.clone());
        checkedRigged++;
      }

      // Pose every rigged part to its far extreme and hide every detachable part.
      const posedQuats = new Map<string, T.Quaternion>();
      const posedPos = new Map<string, T.Vector3>();
      for (const spec of caps.riggedParts) {
        const mid = (spec.range[0] + spec.range[1]) / 2;
        expect(ctrl.setPart(spec.name, mid)).toBeCloseTo(mid, 5);
        const far = farRangeEnd(spec.range);
        expect(ctrl.openPart(spec.name)).toBeCloseTo(far, 5);
        expect(ctrl.getPart(spec.name)).toBeCloseTo(far, 5);
        const node = group.getObjectByName(spec.name);
        if (node) {
          posedQuats.set(spec.name, node.quaternion.clone());
          posedPos.set(spec.name, node.position.clone());
        }
      }
      for (const det of caps.detachableParts) {
        checkedDetachable++;
        ctrl.setVisible(det.name, false);
        expect(ctrl.isVisible(det.name)).toBe(false);
        expect(group.getObjectByName(det.name)?.visible).toBe(false);
      }

      // Export posed + hidden model, then re-bind a fresh controller without double-rotating or losing hidden nodes.
      const exported = cloneForExport(group, { includePartClips: true }, ctrl);
      const manifestRaw = readCapabilities(exported.root);
      expect(manifestRaw).not.toBeNull();
      const roundTrippedManifest = parseCapabilities(JSON.parse(JSON.stringify(manifestRaw)));
      expect(roundTrippedManifest).not.toBeNull();

      for (const det of caps.detachableParts) {
        const exportedNode = exported.root.getObjectByName(det.name);
        expect(exportedNode, `${entry.key} lost hidden detachable ${det.name} in export`).toBeDefined();
        expect(exportedNode?.visible).toBe(true);
      }

      const reCtrl = createAssetController(exported.root);
      for (const det of caps.detachableParts) {
        expect(reCtrl.isVisible(det.name)).toBe(false);
        reCtrl.setVisible(det.name, true);
        expect(exported.root.getObjectByName(det.name)?.visible).toBe(true);
      }
      for (const spec of caps.riggedParts) {
        const far = farRangeEnd(spec.range);
        expect(reCtrl.getPart(spec.name)).toBeCloseTo(far, 4);
        const exportedNode = exported.root.getObjectByName(spec.name);
        const expectedQ = posedQuats.get(spec.name);
        const expectedP = posedPos.get(spec.name);
        if (exportedNode && expectedQ && expectedP) {
          expect(exportedNode.quaternion.angleTo(expectedQ)).toBeLessThan(1e-4);
          expect(exportedNode.position.distanceTo(expectedP)).toBeLessThan(1e-4);
        }
        reCtrl.closePart(spec.name);
        const restQ = restQuats.get(spec.name);
        const restP = restPos.get(spec.name);
        if (exportedNode && restQ && restP) {
          expect(exportedNode.quaternion.angleTo(restQ)).toBeLessThan(1e-4);
          expect(exportedNode.position.distanceTo(restP)).toBeLessThan(1e-4);
        }
      }

      reCtrl.dispose();
      exported.dispose();
      ctrl.dispose();
      disposeTree(group);
    }

    expect(checkedRigged).toBeGreaterThan(150);
    expect(checkedDetachable).toBeGreaterThan(40);
  }, 30_000);

  it('round-trips randomized adversarial multi-axis hinges, >90/180/360 ranges, slides, and synthesized clips', () => {
    const rand = seededRandom(0x5eed1234);
    const axes: Axis[] = ['x', 'y', 'z'];
    const angleRanges: [number, number][] = [
      [0, 80],
      [0, -135],
      [-120, 145],
      [0, 180],
      [0, 360],
      [-180, 180],
    ];

    for (let trial = 0; trial < 24; trial++) {
      const root = new T.Group();
      root.name = `RigTrial_${String(trial)}`;
      const riggedParts: AssetCapabilities['riggedParts'] = [];
      const detachableParts: AssetCapabilities['detachableParts'] = [];
      const restQuats = new Map<string, T.Quaternion>();
      const restPos = new Map<string, T.Vector3>();

      const partCount = 2 + Math.floor(rand() * 3);
      for (let p = 0; p < partCount; p++) {
        const name = `Part_${String(p)}`;
        const node = new T.Group();
        node.name = name;
        node.position.set((rand() - 0.5) * 2, rand() * 2, (rand() - 0.5) * 2);
        // Include non-identity rest orientations (90 deg, 180 deg, arbitrary Euler) on hinges.
        const restYaw = [0, Math.PI / 2, Math.PI, -Math.PI / 3][Math.floor(rand() * 4)] ?? 0;
        const restPitch = [0, Math.PI / 4, -Math.PI / 6][Math.floor(rand() * 3)] ?? 0;
        node.quaternion.setFromEuler(new T.Euler(restPitch, restYaw, 0));
        node.add(new T.Mesh(new T.BoxGeometry(0.2, 0.2, 0.2), new T.MeshStandardMaterial({ color: 0x6688aa })));
        root.add(node);
        restQuats.set(name, node.quaternion.clone());
        restPos.set(name, node.position.clone());

        const axis = axes[Math.floor(rand() * 3)] ?? 'y';
        const isSlide = rand() < 0.35;
        const range: [number, number] = isSlide
          ? [-(0.2 + Math.round(rand() * 40) / 100), 0.3 + Math.round(rand() * 60) / 100]
          : (angleRanges[Math.floor(rand() * angleRanges.length)] ?? [0, 90]);
        riggedParts.push({ name, label: `Part ${String(p)}`, type: isSlide ? 'slide' : 'rotate', axis, range });
      }

      const detName = 'ExtraProp';
      const det = new T.Group();
      det.name = detName;
      det.add(new T.Mesh(new T.BoxGeometry(0.15, 0.15, 0.15), new T.MeshStandardMaterial({ color: 0xaa6644 })));
      root.add(det);
      detachableParts.push({ name: detName, label: 'Extra prop' });

      writeCapabilities(root, {
        version: 1,
        name: root.name,
        riggedParts,
        detachableParts,
        nightZones: [],
        decals: [],
      });

      const ctrl = createAssetController(root);
      const targets = new Map<string, number>();
      for (const spec of riggedParts) {
        const frac = 0.2 + rand() * 0.8;
        const val = spec.range[0] + (spec.range[1] - spec.range[0]) * frac;
        const applied = ctrl.setPart(spec.name, val);
        targets.set(spec.name, applied);
      }
      ctrl.setVisible(detName, false);

      // Synthesized clips on a posed rig must still move cleanly at t = 0.25 / 0.5 / 0.75 of clip duration.
      const synthClips = synthesizeRigClips(root, ctrl.syncManifest());
      expect(synthClips).toHaveLength(riggedParts.length);

      const exported = cloneForExport(root, { includePartClips: true }, ctrl);
      const reCtrl = createAssetController(exported.root);

      expect(reCtrl.isVisible(detName)).toBe(false);
      for (const spec of riggedParts) {
        const expected = targets.get(spec.name) ?? 0;
        // getState() serializes pose values rounded to 3 decimal places (0.001).
        expect(Math.abs(reCtrl.getPart(spec.name) - expected)).toBeLessThanOrEqual(0.00051);
      }

      reCtrl.resetParts();
      for (const spec of riggedParts) {
        const node = exported.root.getObjectByName(spec.name);
        const restQ = restQuats.get(spec.name);
        const restP = restPos.get(spec.name);
        expect(node).toBeDefined();
        if (node && restQ && restP) {
          expect(node.quaternion.angleTo(restQ)).toBeLessThan(1e-3);
          expect(node.position.distanceTo(restP)).toBeLessThan(1e-3);
        }
      }

      // Play each synthesized clip from rest and confirm non-zero motion at t = 0.25 / 0.5 / 0.75.
      for (const clip of exported.root.animations) {
        const mixer = new T.AnimationMixer(exported.root);
        const action = mixer.clipAction(clip).reset().play();
        const trackedName = T.PropertyBinding.parseTrackName(clip.tracks[0]?.name ?? '').nodeName;
        const tracked = exported.root.getObjectByName(trackedName);
        expect(tracked).toBeDefined();
        if (tracked) {
          const restQ = tracked.quaternion.clone();
          const restP = tracked.position.clone();
          let moved = false;
          for (const frac of [0.25, 0.5, 0.75]) {
            action.time = clip.duration * frac;
            mixer.update(0);
            if (tracked.quaternion.angleTo(restQ) > 1e-3 || tracked.position.distanceTo(restP) > 1e-3) {
              moved = true;
            }
          }
          expect(moved, `Synthesized clip "${clip.name}" produced no motion`).toBe(true);
        }
        action.stop();
        mixer.uncacheRoot(exported.root);
      }

      reCtrl.dispose();
      exported.dispose();
      ctrl.dispose();
      disposeTree(root);
    }
  });
});
