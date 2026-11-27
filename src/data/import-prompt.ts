import { clampToRange, farRangeEnd } from '../capabilities/runtime';
import type { AssetCapabilities } from '../capabilities/schema';
import { validateEdits, type ImportEdits } from '../imports/asset';
import { editFields, translateEdit } from './assistant';
import { commandClauses, commandColor, commandName } from './commands';

export type SlotName = { id: string; label: string; color?: string; originalColor?: string };
const controls = { name: editFields.name, scale: editFields.scale, proportion: editFields.proportion, tint: editFields.primary };
const keys = [...Object.keys(controls), 'paint', 'pose', 'hiddenParts', 'night', 'decalText'];
const instructions = 'Translate the request to a patch of the supplied imported model. The paint object maps exact slot IDs to six-digit sRGB hex colors. Put exact slot IDs to restore in reset. The pose object maps exact riggedPart names to numbers within their range (0 closes/resets). hiddenParts lists exact detachablePart names to hide. night toggles night lighting when nightZones exist. decalText maps decal names to short sign strings. tint multiplies the whole model (#ffffff resets tint). scale controls size, proportion controls height. If any part exceeds these controls, set supported to false.';

export function parseImportedSettings(
  value: unknown,
  slots: SlotName[],
  capabilities?: AssetCapabilities | null,
): ImportEdits {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !keys.includes(key)) ||
      !('name' in value) || typeof value.name !== 'string' || !('tint' in value) || typeof value.tint !== 'string' ||
      !('scale' in value) || typeof value.scale !== 'number' || !('proportion' in value) || typeof value.proportion !== 'number') {
    throw new Error('Use the model’s name, tint, scale, proportion and optional paint, pose, hiddenParts, night or decalText settings.');
  }
  const edits = validateEdits(value as ImportEdits);
  for (const id of Object.keys(edits.paint ?? {})) {
    if (!slots.some(slot => slot.id === id)) throw new Error('Unknown paint slot: ' + id);
  }
  if (edits.pose) {
    const valid = new Set(capabilities?.riggedParts.map(p => p.name) ?? []);
    for (const part of Object.keys(edits.pose)) {
      if (!valid.has(part)) throw new Error('Unknown rigged part: ' + part);
    }
  }
  if (edits.hiddenParts) {
    const valid = new Set(capabilities?.detachableParts.map(p => p.name) ?? []);
    for (const part of edits.hiddenParts) {
      if (!valid.has(part)) throw new Error('Unknown detachable part: ' + part);
    }
  }
  if (edits.night && !capabilities?.nightZones.length) {
    throw new Error('This model has no night lighting zones.');
  }
  if (edits.decalText) {
    const valid = new Set(capabilities?.decals.map(d => d.name) ?? []);
    for (const slot of Object.keys(edits.decalText)) {
      if (!valid.has(slot)) throw new Error('Unknown decal area: ' + slot);
    }
  }
  return edits;
}

function unquote(text: string): string {
  return text.trim().replace(/^(?:the )/, '').replace(/^(?:(["'])(.*)\1|\u201c(.*)\u201d|\u2018(.*)\u2019)$/, '$2$3$4').trim();
}

function findSlot(text: string, slots: SlotName[]) {
  const target = unquote(text).toLowerCase();
  const byId = slots.find(slot => slot.id.toLowerCase() === target || slot.id.toLowerCase() === 'zone-' + target);
  if (byId) return byId.id;
  const matching = slots.filter(slot => slot.label.toLowerCase() === target);
  if (matching.length === 1 && matching[0]) return matching[0].id;
  if (matching.length > 1) throw new Error('Several colors have that label. Use a paint slot ID.');
  throw new Error('Unknown model color “' + text + '”. Use its label or paint slot ID.');
}

function findNamed<T extends { name: string; label: string }>(text: string, list: readonly T[], kind: string): T {
  const target = unquote(text).toLowerCase();
  const exact = list.find(item => item.name.toLowerCase() === target || item.label.toLowerCase() === target);
  if (exact) return exact;
  const normalized = target.replace(/\s+/g, '-');
  const bySlug = list.find(item => item.name.toLowerCase() === normalized);
  if (bySlug) return bySlug;
  throw new Error(`Unknown ${kind} “${text}”.`);
}

function importClause(next: ImportEdits, slots: SlotName[], clause: string, capabilities?: AssetCapabilities | null) {
  const command = clause.trim().replace(/^please\s+/i, '').replace(/[.!]$/, '');
  const name = commandName(command);
  if (name !== undefined) {
    next.name = name;
    return;
  }
  const lower = command.toLowerCase();

  // Night mode commands.
  if (/^(?:turn\s+)?(?:night(?:\s+mode|\s+lights?)?(?:\s+on)?|lights?\s+on)$/.test(lower)) {
    if (!capabilities?.nightZones.length) throw new Error('This model has no night lighting zones.');
    next.night = true;
    return;
  }
  if (/^(?:turn\s+)?(?:day(?:\s+mode)?|night(?:\s+mode|\s+lights?)?\s+off|lights?\s+off)$/.test(lower)) {
    delete next.night;
    return;
  }

  // Colorway preset commands.
  const colorwayMatch = /^(?:(?:use|apply|set)\s+)?(?:colorway\s+(.+)|(.+)\s+colorway)$/.exec(lower);
  if (colorwayMatch && capabilities?.presets?.length) {
    const raw = (colorwayMatch[1] ?? colorwayMatch[2] ?? '').trim();
    const preset = findNamed(raw, capabilities.presets, 'colorway');
    const updated = new Map(Object.entries(next.paint ?? {}));
    for (const [zone, hex] of Object.entries(preset.colors)) {
      const slot = slots.find(s => s.id === 'zone-' + zone);
      if (!slot) continue;
      if ((slot.originalColor ?? slot.color)?.toLowerCase() === hex.toLowerCase()) updated.delete(slot.id);
      else updated.set(slot.id, hex.toLowerCase());
    }
    next.paint = Object.fromEntries(updated);
    return;
  }

  // Reset all rigged parts.
  if (/^(?:reset|close)\s+all\s+parts$/.test(lower)) {
    delete next.pose;
    return;
  }
  if (/^show\s+all\s+parts$/.test(lower)) {
    delete next.hiddenParts;
    return;
  }

  // Rigged part open / close / set angle or slide.
  const openClose = /^(open|close)\s+(.+)$/.exec(lower);
  if (openClose?.[2] && capabilities?.riggedParts.length) {
    const part = findNamed(openClose[2], capabilities.riggedParts, 'rigged part');
    const pose = { ...(next.pose ?? {}) };
    if (openClose[1] === 'open') pose[part.name] = farRangeEnd(part.range);
    else {
      const filtered = Object.fromEntries(Object.entries(pose).filter(([k]) => k !== part.name));
      next.pose = filtered;
      return;
    }
    next.pose = pose;
    return;
  }
  const setPart = /^(?:set|pose|move|rotate|slide|turn)\s+(.+?)\s+(?:to\s+)?(-?\d*\.?\d+)\s*(?:deg|degrees|°|m|meters)?$/.exec(lower);
  if (setPart?.[1] && setPart[2] && capabilities?.riggedParts.length) {
    const candidate = unquote(setPart[1]);
    if (!['scale', 'size', 'height', 'proportion'].includes(candidate)) {
      const part = capabilities.riggedParts.find(p =>
        p.name.toLowerCase() === candidate || p.label.toLowerCase() === candidate || p.name.toLowerCase() === candidate.replace(/\s+/g, '-'));
      if (part) {
        const clamped = clampToRange(part.range, Number(setPart[2]));
        const pose = { ...(next.pose ?? {}) };
        if (Math.abs(clamped) > 1e-6) pose[part.name] = clamped;
        else next.pose = Object.fromEntries(Object.entries(pose).filter(([k]) => k !== part.name));
        if (Math.abs(clamped) > 1e-6) next.pose = pose;
        return;
      }
    }
  }

  // Detachable part hide / show.
  const hideShow = /^(hide|remove|detach|show|attach)\s+(.+)$/.exec(lower);
  if (hideShow?.[2] && capabilities?.detachableParts.length) {
    const part = findNamed(hideShow[2], capabilities.detachableParts, 'detachable part');
    const hidden = new Set(next.hiddenParts ?? []);
    if (hideShow[1] === 'show' || hideShow[1] === 'attach') hidden.delete(part.name);
    else hidden.add(part.name);
    next.hiddenParts = [...hidden];
    return;
  }

  // Decal text preview.
  const decalCmd = /^(?:decal|sign|label)\s+([a-z0-9_-]+)\s+(.+)$/i.exec(command);
  if (decalCmd?.[1] && decalCmd[2] && capabilities?.decals.length) {
    const target = capabilities.decals.find(d => d.name.toLowerCase() === decalCmd[1]?.toLowerCase());
    if (target) {
      next.decalText = { ...(next.decalText ?? {}), [target.name]: unquote(decalCmd[2]).slice(0, 60) };
      return;
    }
  }

  const text = lower.replace(/^(?:make|set|change|paint|repaint|color)\s+/, '').replace(/^the\s+/, '');
  const size = /^(scale|size|height|proportion)(?:\s+(?:to|of|at))?\s*[:=]?\s*(\d*\.?\d+)(%|x)?$/.exec(text);
  if (size?.[2]) {
    const field = size[1] === 'scale' || size[1] === 'size' ? 'scale' : 'proportion';
    next[field] = Number(size[2]) / (size[3] === '%' ? 100 : 1);
    return;
  }
  const reset = /^(?:restore|reset)\s+(.+)$/.exec(text);
  if (reset?.[1]) {
    const target = reset[1].trim().replace(/^the\s+/, '');
    if (target === 'tint' || target === 'overall tint') {
      next.tint = '#ffffff';
      return;
    }
    if (capabilities?.riggedParts.some(p => p.name.toLowerCase() === target || p.label.toLowerCase() === target)) {
      const part = findNamed(target, capabilities.riggedParts, 'rigged part');
      if (next.pose) next.pose = Object.fromEntries(Object.entries(next.pose).filter(([k]) => k !== part.name));
      return;
    }
    const id = findSlot(reset[1], slots);
    if (next.paint) next.paint = Object.fromEntries(Object.entries(next.paint).filter(([key]) => key !== id));
    return;
  }
  const words = text.split(/\s+/);
  const twoWordColor = words.length >= 2 && commandColor(words.slice(-2).join(' '));
  const color = twoWordColor || commandColor(words.at(-1) ?? '');
  if (!color) throw new Error('Try “open door”, “hide planter”, “night mode”, “tint teal”, or “paint” followed by a color name and hex value.');
  const target = words.slice(0, twoWordColor ? -2 : -1).join(' ').replace(/\s+to$/, '');
  if (['', 'it', 'tint', 'overall tint', 'it to'].includes(target)) next.tint = color;
  else {
    const id = findSlot(target, slots);
    (next.paint ??= {})[id] = color;
  }
}

export async function editImportWithPrompt(
  original: ImportEdits,
  slots: SlotName[],
  prompt: string,
  signal?: AbortSignal,
  capabilities?: AssetCapabilities | null,
) {
  const next = parseImportedSettings(original, slots, capabilities);
  const schemaControls: Record<string, object> = { ...controls };
  if (slots.length) {
    schemaControls.paint = slots.length <= 64
      ? { type: 'object', additionalProperties: false, properties: Object.fromEntries(slots.map(slot => [slot.id, editFields.primary])) }
      : { type: 'object', additionalProperties: editFields.primary };
    schemaControls.reset = {
      type: 'array',
      minItems: 1,
      items: slots.length <= 64 ? { type: 'string', enum: slots.map(slot => slot.id) } : { type: 'string' },
    };
  }
  if (capabilities?.riggedParts.length) {
    schemaControls.pose = {
      type: 'object',
      additionalProperties: false,
      properties: Object.fromEntries(capabilities.riggedParts.map(part => [
        part.name,
        { type: 'number', minimum: Math.min(part.range[0], part.range[1]), maximum: Math.max(part.range[0], part.range[1]) },
      ])),
    };
  }
  if (capabilities?.detachableParts.length) {
    schemaControls.hiddenParts = {
      type: 'array',
      items: { type: 'string', enum: capabilities.detachableParts.map(part => part.name) },
    };
  }
  if (capabilities?.nightZones.length) schemaControls.night = { type: 'boolean' };
  if (capabilities?.decals.length) {
    schemaControls.decalText = {
      type: 'object',
      additionalProperties: false,
      properties: Object.fromEntries(capabilities.decals.map(slot => [slot.name, { type: 'string', maxLength: 60 }])),
    };
  }
  const patch = await translateEdit(
    { model: next, slots, ...(capabilities ? { capabilities } : {}) },
    prompt,
    instructions,
    schemaControls,
    signal,
  );
  if (!patch) {
    let lastDetachVerb: 'hide' | 'show' | null = null;
    for (const rawClause of commandClauses(prompt)) {
      const trimmed = rawClause.trim();
      const verbMatch = /^(hide|remove|detach|show|attach)\s+/i.exec(trimmed);
      let clause = trimmed;
      if (verbMatch?.[1]) {
        lastDetachVerb = /^(?:show|attach)$/i.test(verbMatch[1]) ? 'show' : 'hide';
      } else if (lastDetachVerb && capabilities?.detachableParts.some(p => {
        const clean = unquote(trimmed).toLowerCase();
        return p.name.toLowerCase() === clean || p.label.toLowerCase() === clean;
      })) {
        clause = `${lastDetachVerb} ${trimmed}`;
      } else {
        lastDetachVerb = null;
      }
      importClause(next, slots, clause, capabilities);
    }
    return { edits: parseImportedSettings(next, slots, capabilities), engine: 'Local command' };
  }
  if ('paint' in patch && (!patch.paint || typeof patch.paint !== 'object' || Array.isArray(patch.paint) || !Object.keys(patch.paint).length)) {
    throw new Error('The on-device model returned an invalid paint edit.');
  }
  const resetIds: string[] = [];
  if ('reset' in patch) {
    if (!Array.isArray(patch.reset) || !patch.reset.every((id): id is string => typeof id === 'string') ||
        (!patch.reset.length && Object.keys(patch).length === 1)) {
      throw new Error('The on-device model returned an invalid paint reset.');
    }
    for (const id of patch.reset) {
      if (!slots.some(slot => slot.id === id)) throw new Error('Unknown paint slot: ' + id);
      resetIds.push(id);
    }
  }
  const restPatch = Object.fromEntries(Object.entries(patch).filter(([key]) => key !== 'reset'));
  const merged = { ...next, ...restPatch };
  if ('paint' in patch || resetIds.length) {
    const updated = new Map(Object.entries(next.paint ?? {}));
    for (const id of resetIds) updated.delete(id);
    if ('paint' in patch) {
      for (const [id, hex] of Object.entries(patch.paint as Record<string, string>)) updated.set(id, hex);
    }
    merged.paint = Object.fromEntries(updated);
  }
  if ('pose' in patch && patch.pose && typeof patch.pose === 'object' && !Array.isArray(patch.pose)) {
    merged.pose = { ...(next.pose ?? {}), ...(patch.pose as Record<string, number>) };
  }
  return { edits: parseImportedSettings(merged, slots, capabilities), engine: 'On-device AI' };
}
