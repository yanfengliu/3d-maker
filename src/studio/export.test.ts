import { describe, expect, it } from 'vitest';
import {
  AnimationClip,
  BoxGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  NumberKeyframeTrack,
  PropertyBinding,
} from 'three';
import { cloneForExport } from './export';

describe('import export snapshot', () => {
  it('captures shared vertex colors before an edit during export', () => {
    const geometry = new BoxGeometry();
    geometry.setAttribute('color', new Float32BufferAttribute([1, 0, 0], 3));
    const root = new Group();
    root.add(new Mesh(geometry), new Mesh(geometry));
    const snapshot = cloneForExport(root);
    const [first, second] = snapshot.root.children;
    if (!(first instanceof Mesh) || !(second instanceof Mesh)) throw new Error('Expected two meshes.');
    const captured = (first as Mesh).geometry;
    geometry.getAttribute('color').setXYZ(0, 0, 1, 0);
    expect(captured).toBe((second as Mesh).geometry);
    expect(captured.getAttribute('color').getX(0)).toBe(1);
    expect(captured.getAttribute('color').getY(0)).toBe(0);
    snapshot.dispose();
  });
  it('keeps anonymous animation targets and isolates preview material settings', () => {
    const source = new Group(),
      original = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
    source.add(original);
    source.animations = [
      new AnimationClip('Unnamed joint', 1, [
        new NumberKeyframeTrack(original.uuid + '.scale[x]', [0, 1], [1, 2]),
      ]),
    ];
    const snapshot = cloneForExport(source);
    const copy = snapshot.root.children[0] as Mesh<BoxGeometry, MeshStandardMaterial>;
    const clip = snapshot.root.animations[0];
    const binding = PropertyBinding.parseTrackName(clip?.tracks[0]?.name ?? '');
    expect(PropertyBinding.findNode(snapshot.root, binding.nodeName)).toBe(copy);
    original.material.wireframe = true;
    expect(copy.material.wireframe).toBe(false);
    snapshot.dispose();
  });
});
