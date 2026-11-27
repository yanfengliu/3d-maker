import { applyLocalCommand } from './commands';
import { parseRecipe, type Recipe } from './recipe';

type Availability = 'available' | 'downloadable' | 'downloading' | 'unavailable';
interface Progress { addEventListener(type: 'downloadprogress', listener: (event: { loaded: number }) => void): void }
interface Session {
  prompt(text: string, options: { responseConstraint: object; signal: AbortSignal }): Promise<string>;
  destroy(): void;
}
interface Options {
  expectedInputs: { type: 'text'; languages: string[] }[];
  expectedOutputs: { type: 'text'; languages: string[] }[];
}
interface OnDeviceModel {
  availability(options: Options): Promise<Availability>;
  create(options: Options & { monitor?: (progress: Progress) => void; initialPrompts?: { role: 'system'; content: string }[]; signal?: AbortSignal }): Promise<Session>;
}

function model(): OnDeviceModel | undefined {
  return (globalThis as typeof globalThis & { LanguageModel?: OnDeviceModel }).LanguageModel;
}

const textOptions: Options = {
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
};

export async function getPromptAvailability(): Promise<Availability> {
  try {
    return (await model()?.availability(textOptions)) ?? 'unavailable';
  } catch {
    return 'unavailable';
  }
}

/** Invoke from the Enable button so Chrome has activation to start a model download. */
export async function preparePromptModel(onProgress?: (fraction: number) => void): Promise<void> {
  const api = model();
  if (!api) throw new Error('On-device AI is unavailable in this browser.');
  const session = await api.create({
    ...textOptions,
    monitor(progress) {
      progress.addEventListener('downloadprogress', event => onProgress?.(event.loaded));
    },
  });
  session.destroy();
}

const controls = {
  name: { type: 'string', minLength: 1, maxLength: 80 },
  primary: { type: 'string', pattern: '^#[A-Fa-f0-9]{6}$' },
  accent: { type: 'string', pattern: '^#[A-Fa-f0-9]{6}$' },
  scale: { type: 'number', minimum: .65, maximum: 1.5 },
  proportion: { type: 'number', minimum: .65, maximum: 1.5 },
  detail: { type: 'boolean' },
  quality: { type: 'string', enum: ['standard', 'hd'] },
};
const responseConstraint = {
  type: 'object', additionalProperties: false, required: ['supported', 'changes'],
  properties: {
    supported: { type: 'boolean' },
    changes: { type: 'object', properties: controls, additionalProperties: false },
  },
};
const instructions = 'Translate the requested edit to a patch for the existing 3D asset recipe. Return only changed controls. Primary and accent are sRGB hex paint colors. Scale controls overall size and proportion controls breadth. Detail toggles extra parts. Quality selects standard or hd geometry. Preserve the asset name unless asked to rename it. For a request outside these controls or a partial match, return supported=false and an empty changes object.';

function modelRecipe(original: Recipe, json: string): Recipe {
  let answer: unknown;
  try { answer = JSON.parse(json) as unknown; } catch { throw new Error('The on-device model returned unreadable JSON.'); }
  if (!answer || typeof answer !== 'object' || !('supported' in answer) || !('changes' in answer)) {
    throw new Error('The on-device model returned an invalid edit.');
  }
  if (answer.supported !== true) throw new Error('This request exceeds the available recipe controls.');
  const patch = answer.changes;
  if (!patch || typeof patch !== 'object' || Array.isArray(patch) || !Object.keys(patch).length || Object.keys(patch).some(key => !Object.hasOwn(controls, key))) {
    throw new Error('The on-device model returned an invalid edit.');
  }
  return parseRecipe({ ...original, ...patch });
}

export async function editWithPrompt(recipe: Recipe, prompt: string): Promise<{ recipe: Recipe; engine: string }> {
  const original = parseRecipe(recipe);
  const text = prompt.trim();
  if (!text) throw new Error('Describe an edit to apply.');
  if (text.length > 2000) throw new Error('Keep edit instructions to 2,000 characters.');
  const api = model();
  if (!api || await getPromptAvailability() !== 'available') {
    return { recipe: applyLocalCommand(original, text), engine: 'Local command' };
  }
  const signal = AbortSignal.timeout(90_000);
  const session = await api.create({ ...textOptions, signal, initialPrompts: [{ role: 'system', content: instructions }] });
  try {
    const output = await session.prompt(JSON.stringify({ recipe: original, request: text }), { responseConstraint, signal });
    return { recipe: modelRecipe(original, output), engine: 'On-device AI' };
  } finally {
    session.destroy();
  }
}
