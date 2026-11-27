import { validateEdits, type ImportEdits } from '../imports/asset';
import { editFields, translateEdit } from './assistant';
import { commandClauses, commandColor, commandName } from './commands';

export type SlotName = { id: string; label: string };
const controls = { name: editFields.name, scale: editFields.scale, proportion: editFields.proportion, tint: editFields.primary };
const keys = [...Object.keys(controls), 'paint'];
const instructions = 'Translate the request to a patch of the supplied imported model. The paint object maps exact slot IDs to six-digit sRGB hex colors. Return only the requested fields and paint slots. tint multiplies the whole model. scale controls size, proportion controls height. Name changes require a rename request. If any part of the request exceeds these controls, set supported to false.';

export function parseImportedSettings(value: unknown, slots: SlotName[]): ImportEdits {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !keys.includes(key)) ||
      !('name' in value) || typeof value.name !== 'string' || !('tint' in value) || typeof value.tint !== 'string' ||
      !('scale' in value) || typeof value.scale !== 'number' || !('proportion' in value) || typeof value.proportion !== 'number') {
    throw new Error('Use the model’s name, tint, scale, proportion and optional paint settings.');
  }
  // validateEdits also normalizes and validates every entry in the optional paint map.
  const edits = validateEdits(value as ImportEdits);
  for (const id of Object.keys(edits.paint ?? {})) {
    if (!slots.some(slot => slot.id === id)) throw new Error('Unknown paint slot: ' + id);
  }
  return edits;
}

function findSlot(text: string, slots: SlotName[]) {
  const target = text.trim().replace(/^(?:the )/, '').replace(/^(["'])(.*)\1$/, '$2');
  const byId = slots.find(slot => slot.id === target);
  if (byId) return byId.id;
  const matching = slots.filter(slot => slot.label.toLowerCase() === target);
  if (matching.length === 1 && matching[0]) return matching[0].id;
  if (matching.length > 1) throw new Error('Several colors have that label. Use a paint slot ID.');
  throw new Error('Unknown model color “' + text + '”. Use its label or paint slot ID.');
}

function importClause(next: ImportEdits, slots: SlotName[], clause: string) {
  const command = clause.trim().replace(/^please\s+/i, '').replace(/[.!]$/, '');
  const name = commandName(command);
  if (name !== undefined) {
    next.name = name;
    return;
  }
  const text = command.toLowerCase().replace(/^(?:make|set|change|paint|repaint|color)\s+/, '').replace(/^the\s+/, '');
  const size = /^(scale|size|height|proportion)(?:\s+(?:to|of|at))?\s*[:=]?\s*(\d*\.?\d+)(%|x)?$/.exec(text);
  if (size?.[2]) {
    const field = size[1] === 'scale' || size[1] === 'size' ? 'scale' : 'proportion';
    next[field] = Number(size[2]) / (size[3] === '%' ? 100 : 1);
    return;
  }
  const reset = /^(?:restore|reset)\s+(.+)$/.exec(text);
  if (reset?.[1]) {
    const id = findSlot(reset[1], slots);
    if (next.paint) next.paint = Object.fromEntries(Object.entries(next.paint).filter(([key]) => key !== id));
    return;
  }
  const words = text.split(/\s+/);
  const twoWordColor = words.length >= 2 && commandColor(words.slice(-2).join(' '));
  const color = twoWordColor || commandColor(words.at(-1) ?? '');
  if (!color) throw new Error('Try “tint teal”, “height 1.1” or “paint” followed by a model color label and hex value.');
  const target = words.slice(0, twoWordColor ? -2 : -1).join(' ').replace(/\s+to$/, '');
  if (['', 'it', 'tint', 'overall tint', 'it to'].includes(target)) next.tint = color;
  else {
    const id = findSlot(target, slots);
    (next.paint ??= {})[id] = color;
  }
}

export async function editImportWithPrompt(original: ImportEdits, slots: SlotName[], prompt: string, signal?: AbortSignal) {
  const next = parseImportedSettings(original, slots);
  const paint = { type: 'object', additionalProperties: false, properties: Object.fromEntries(slots.map(slot => [slot.id, editFields.primary])) };
  const patch = await translateEdit({ model: next, slots }, prompt, instructions, slots.length ? { ...controls, paint } : controls, signal);
  if (!patch) {
    for (const clause of commandClauses(prompt)) importClause(next, slots, clause);
    return { edits: parseImportedSettings(next, slots), engine: 'Local command' };
  }
  if ('paint' in patch && (!patch.paint || typeof patch.paint !== 'object' || Array.isArray(patch.paint) || !Object.keys(patch.paint).length)) {
    throw new Error('The on-device model returned an invalid paint edit.');
  }
  const merged = { ...next, ...patch };
  if ('paint' in patch) merged.paint = { ...next.paint, ...patch.paint as Record<string, string> };
  return { edits: parseImportedSettings(merged, slots), engine: 'On-device AI' };
}
