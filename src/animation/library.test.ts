import { AnimationClip } from 'three';
import { describe, expect, it } from 'vitest';
import { catalog } from '../data/recipe';
import { buildModel } from '../models';
import { createAsset } from '../sdk';
import { addCharacterAnimations } from './library';

const pilot = catalog.find(item => item.id === 'field-pilot')!.recipe;
const rover = catalog.find(item => item.id === 'field-rover')!.recipe;

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
    expect(createAsset(rover).animations.map(c => c.name)).toEqual(buildModel(rover).animations.map(c => c.name));
  });
});
