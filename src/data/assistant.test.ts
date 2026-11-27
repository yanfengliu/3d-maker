import { afterEach, expect, it, vi } from 'vitest';
import { editWithPrompt, getPromptAvailability, preparePromptModel } from './assistant';
import { parseRecipe } from './recipe';

const base = parseRecipe({
  version: 1, template: 'relay-drone', name: 'Relay Drone', primary: '#efb634', accent: '#e8e4cf', scale: 1, proportion: 1, detail: true,
});

afterEach(() => vi.unstubAllGlobals());

it('labels compound local edits and changes only the requested controls', async () => {
  const { recipe, engine } = await editWithPrompt(base, 'Make it teal with cream accents and 20% larger, turn details off; call it "Search and Rescue"');
  expect(engine).toBe('Local command');
  expect(recipe).toEqual({ ...base, primary: '#379a93', accent: '#e8e4cf', scale: 1.2, detail: false, name: 'Search and Rescue' });
  expect((await editWithPrompt(base, 'set the accent color to #aabbcc and proportion 0.8')).recipe).toEqual({ ...base, accent: '#aabbcc', proportion: .8 });
  expect((await editWithPrompt(base, 'Make it HD and remove detail')).recipe).toEqual({ ...base, quality: 'hd', detail: false });
  expect((await editWithPrompt({ ...base, quality: 'hd' }, 'set quality to standard')).recipe).toEqual({ ...base, quality: 'standard' });
});

it('rejects a partially supported command atomically and rejects out-of-range dimensions', async () => {
  await expect(editWithPrompt(base, 'paint it blue and add a second camera')).rejects.toThrow(/second camera/);
  await expect(editWithPrompt(base, 'scale to 160%')).rejects.toThrow(/0.65/);
  expect(base.primary).toBe('#efb634');
});

it('keeps downloads under a separate explicit action and reports browser progress', async () => {
  const destroy = vi.fn();
  const create = vi.fn((options: { monitor: (monitor: { addEventListener: (type: string, fn: (event: { loaded: number }) => void) => void }) => void }) => {
    options.monitor({ addEventListener: (_event, fn) => { fn({ loaded: .25 }); } });
    return Promise.resolve({ destroy });
  });
  vi.stubGlobal('LanguageModel', { availability: () => Promise.resolve('downloadable'), create });
  expect(await getPromptAvailability()).toBe('downloadable');
  expect((await editWithPrompt(base, 'Make it smaller')).engine).toBe('Local command');
  expect(create).not.toHaveBeenCalled();
  const onProgress = vi.fn();
  await preparePromptModel(onProgress);
  expect(onProgress).toHaveBeenCalledWith(.25);
  expect(destroy).toHaveBeenCalledOnce();
});

it('constrains real model calls, validates each patch, and always releases the session', async () => {
  const destroy = vi.fn();
  const prompt = vi.fn().mockResolvedValueOnce('{"supported":true,"changes":{"primary":"#ffffff","accent":"#307fac","quality":"hd"}}')
    .mockResolvedValueOnce('{"supported":true,"changes":{"scale":90}}')
    .mockResolvedValueOnce('{"supported":true,"changes":{"template":"field-pilot"}}')
    .mockResolvedValueOnce('{"supported":false,"changes":{}}');
  vi.stubGlobal('LanguageModel', {
    availability: () => Promise.resolve('available'),
    create: () => Promise.resolve({ destroy, prompt }),
  });
  const output = await editWithPrompt(base, 'Give it an arctic palette in high definition');
  expect(output).toEqual({ engine: 'On-device AI', recipe: { ...base, primary: '#ffffff', accent: '#307fac', quality: 'hd' } });
  expect(prompt).toHaveBeenCalledWith(expect.stringContaining('arctic palette'), expect.objectContaining({
    responseConstraint: expect.objectContaining({ required: ['supported', 'changes'] }) as unknown,
  }));
  await expect(editWithPrompt(base, 'Fit it to a city')).rejects.toThrow(/scale/);
  await expect(editWithPrompt(base, 'Swap the template')).rejects.toThrow(/invalid edit/);
  await expect(editWithPrompt(base, 'Add an extra rotor')).rejects.toThrow(/available model controls/);
  expect(destroy).toHaveBeenCalledTimes(4);
});
