import { AnimationClip } from 'three';
import { describe, expect, it } from 'vitest';
import { catalog } from '../data/recipe';
import { buildModel } from '../models';
import { createAsset } from '../sdk';
import { addCharacterAnimations } from './library';

function recipe(id: string) {
  const item = catalog.find(row => row.id === id);
  if (!item) throw new Error('Missing template ' + id);
  return item.recipe;
}
const pilot = recipe('field-pilot');
const rover = recipe('field-rover');

describe('published character motion library', () => {
  it('loads the complete release and preserves both studio cycles in the game SDK', () => {
    const model = createAsset(pilot);
    const names = model.animations.map(clip => clip.name);
    expect(names.slice(0, 2)).toEqual(['Idle', 'Walk']);
    expect(new Set(names).size).toBe(87);
    expect(names).toEqual(expect.arrayContaining(['Run', 'Dance', 'Sitting', 'Swimming', 'Idle (library)', 'Walk (library)']));
    expect(model.animations.every(clip => clip.validate() && clip.tracks.length > 0)).toBe(true);
    expect(addCharacterAnimations(model).animations).toHaveLength(87);
  });
  it('preserves imported custom clips in their original order and leaves unrelated rigs alone', () => {
    const model = buildModel(pilot);
    const custom = new AnimationClip('Dance', 3, []);
    model.animations.unshift(custom);
    addCharacterAnimations(model);
    expect(model.animations[0]).toBe(custom);
    expect(model.animations.filter(clip => clip.name === 'Dance')).toHaveLength(1);
    expect(model.animations.find(clip => clip.name === 'Dance (library)')?.tracks.length).toBeGreaterThan(0);
    const restored = buildModel(pilot);
    restored.animations = model.animations.map(clip => clip.clone());
    expect(addCharacterAnimations(restored).animations.map(clip => clip.name)).toEqual(model.animations.map(clip => clip.name));
    expect(createAsset(rover).animations.map(c => c.name)).toEqual(buildModel(rover).animations.map(c => c.name));
  });
});
