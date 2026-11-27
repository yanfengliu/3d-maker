import { afterEach, expect, it, vi } from 'vitest';
import { editImportWithPrompt, parseImportedSettings } from './import-prompt';

const edits = { name: 'Waiter', tint: '#ffffff', scale: 1, proportion: 1, paint: { 'material-1': '#778899' } };
const slots = [{ id: 'vertex-0-aabbcc', label: 'Hat and ribbon' }, { id: 'material-1', label: 'Jacket' }];
afterEach(() => { vi.unstubAllGlobals(); });

it('applies named and ID-based paint with global settings while retaining other colors', async () => {
  const result = await editImportWithPrompt(edits, slots,
    'Paint "Hat and ribbon" forest green and tint teal, height 105%, scale 0.8; name it "Search and Rescue"');
  expect(result).toEqual({ engine: 'Local command', edits: {
    name: 'Search and Rescue', tint: '#379a93', scale: .8, proportion: 1.05,
    paint: { 'material-1': '#778899', 'vertex-0-aabbcc': '#396a4e' },
  } });
  const recolored = await editImportWithPrompt(result.edits, slots, 'set vertex-0-aabbcc to #010203 and restore jacket');
  expect(recolored.edits.paint).toEqual({ 'vertex-0-aabbcc': '#010203' });
  const curly = await editImportWithPrompt(recolored.edits, slots, 'Paint \u201cHat and ribbon\u201d teal, reset tint, and name it \u2018Harbour Pilot\u2019');
  expect(curly.edits.paint).toEqual({ 'vertex-0-aabbcc': '#379a93' });
  expect(curly.edits.tint).toBe('#ffffff');
  expect(curly.edits.name).toBe('Harbour Pilot');
  expect(edits.paint).toEqual({ 'material-1': '#778899' });
});

it('rejects unsupported or ambiguous instructions as a whole', async () => {
  await expect(editImportWithPrompt(edits, slots, 'paint jacket teal then grow wings')).rejects.toThrow();
  await expect(editImportWithPrompt(edits, slots, 'height 200%')).rejects.toThrow();
  await expect(editImportWithPrompt(edits, [...slots, { id: 'material-2', label: 'Jacket' }], 'paint jacket red')).rejects.toThrow(/Several/);
  expect(() => parseImportedSettings({ ...edits, paint: { 'material-20': '#ff0000' } }, slots)).toThrow(/Unknown/);
  expect(() => parseImportedSettings({ ...edits, quality: 'hd' }, slots)).toThrow();
  expect(edits.paint).toEqual({ 'material-1': '#778899' });
});

it('constrains on-device patches to model paint slots and validates their real output', async () => {
  const destroy = vi.fn();
  const prompt = vi.fn().mockResolvedValueOnce('{"supported":true,"changes":{"paint":{"vertex-0-aabbcc":"#abcdef"},"reset":[]}}')
    .mockResolvedValueOnce('{"supported":true,"changes":{"reset":["material-1"]}}')
    .mockResolvedValueOnce('{"supported":true,"changes":{"paint":{"material-9":"#001122"}}}')
    .mockResolvedValueOnce('{"supported":true,"changes":{"paint":{"material-1":900}}}');
  vi.stubGlobal('LanguageModel', { availability: () => Promise.resolve('available'), create: () => Promise.resolve({ prompt, destroy }) });
  const result = await editImportWithPrompt(edits, slots, 'Give the hat a pale blue ribbon');
  expect(result).toEqual({engine: 'On-device AI', edits: {...edits, paint: {...edits.paint, 'vertex-0-aabbcc': '#abcdef'}}});
  expect(prompt).toHaveBeenCalledWith(expect.stringContaining('Hat and ribbon'), expect.objectContaining({ responseConstraint: expect.any(Object) as unknown }));
  const restored = await editImportWithPrompt(result.edits, slots, 'Restore jacket');
  expect(restored.edits.paint).toEqual({ 'vertex-0-aabbcc': '#abcdef' });
  await expect(editImportWithPrompt(edits, slots, 'Invent a slot')).rejects.toThrow(/Unknown/);
  await expect(editImportWithPrompt(edits, slots, 'Return nonsense')).rejects.toThrow(/paint/i);
  expect(destroy).toHaveBeenCalledTimes(4);
});
