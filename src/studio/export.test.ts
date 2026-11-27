import { describe, expect, it } from 'vitest';
import {
  AnimationClip,
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  NumberKeyframeTrack,
  PropertyBinding,
} from 'three';
import { cloneForExport } from './export';

describe('import export snapshot', () => {
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
