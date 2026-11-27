export type ModelParamValue = number | boolean | string;
export type ModelParamValues = Record<string, ModelParamValue>;

export interface RangeParamSpec {
  name: string;
  label: string;
  type: 'range';
  default: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  describe?: string;
}

export interface ToggleParamSpec {
  name: string;
  label: string;
  type: 'toggle';
  default: boolean;
  describe?: string;
}

export interface ChoiceParamOption {
  value: string;
  label: string;
}

export interface ChoiceParamSpec {
  name: string;
  label: string;
  type: 'choice';
  default: string;
  options: readonly ChoiceParamOption[];
  describe?: string;
}

export type ModelParamSpec = RangeParamSpec | ToggleParamSpec | ChoiceParamSpec;

export const MODEL_PARAM_NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/;

const maxParams = 24;
const maxOptions = 24;
const maxLabelLen = 60;
const maxDescLen = 200;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function trimText(value: unknown, maxLen: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLen) : undefined;
}

/** Validate and normalize a list of declared structural knob specifications for capabilities JSON. */
export function parseModelParamSpecs(value: unknown): ModelParamSpec[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const specs: ModelParamSpec[] = [];
  const seen = new Set<string>();
  for (const row of value) {
    if (specs.length >= maxParams) break;
    if (!isRecord(row) || typeof row.name !== 'string') continue;
    const name = row.name.trim();
    if (!MODEL_PARAM_NAME_PATTERN.test(name) || seen.has(name)) continue;
    const label = trimText(row.label, maxLabelLen) ?? name;
    const describe = trimText(row.describe, maxDescLen);
    if (row.type === 'range') {
      const min = row.min;
      const max = row.max;
      const def = row.default;
      if (
        typeof min !== 'number' || typeof max !== 'number' || typeof def !== 'number' ||
        !Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(def) ||
        max <= min || def < min || def > max
      ) continue;
      const step = typeof row.step === 'number' && Number.isFinite(row.step) && row.step > 0 ? row.step : undefined;
      const unit = trimText(row.unit, 12);
      seen.add(name);
      specs.push({
        name,
        label,
        type: 'range',
        default: def,
        min,
        max,
        ...(step !== undefined ? { step } : {}),
        ...(unit ? { unit } : {}),
        ...(describe ? { describe } : {}),
      });
    } else if (row.type === 'toggle') {
      if (typeof row.default !== 'boolean') continue;
      seen.add(name);
      specs.push({ name, label, type: 'toggle', default: row.default, ...(describe ? { describe } : {}) });
    } else if (row.type === 'choice') {
      if (!Array.isArray(row.options) || typeof row.default !== 'string') continue;
      const options: ChoiceParamOption[] = [];
      const optSeen = new Set<string>();
      for (const opt of row.options) {
        if (options.length >= maxOptions) break;
        if (typeof opt === 'string') {
          const val = opt.trim().slice(0, maxLabelLen);
          if (!val || optSeen.has(val)) continue;
          optSeen.add(val);
          options.push({ value: val, label: val });
        } else if (isRecord(opt)) {
          const val = trimText(opt.value, maxLabelLen);
          if (!val || optSeen.has(val)) continue;
          const optLabel = trimText(opt.label, maxLabelLen) ?? val;
          optSeen.add(val);
          options.push({ value: val, label: optLabel });
        }
      }
      if (!options.length || !optSeen.has(row.default)) continue;
      seen.add(name);
      specs.push({
        name,
        label,
        type: 'choice',
        default: row.default,
        options,
        ...(describe ? { describe } : {}),
      });
    }
  }
  return specs.length ? specs : undefined;
}

/** Validate user or JSON recipe `params` against the model's declared `ModelParamSpec[]`. */
export function parseRecipeParams(
  raw: unknown,
  specs?: readonly ModelParamSpec[],
): ModelParamValues | undefined {
  if (raw === undefined) return undefined;
  if (!isRecord(raw)) throw new Error('params must be a JSON object of named parameter values.');
  const entries = Object.entries(raw);
  if (entries.length === 0) return undefined;
  if (entries.length > maxParams) throw new Error(`params may declare at most ${String(maxParams)} values.`);
  const byName = new Map((specs ?? []).map(spec => [spec.name, spec]));
  if (byName.size === 0) {
    throw new Error('This model does not accept custom structural params.');
  }
  const out: ModelParamValues = {};
  for (const [key, val] of entries) {
    const spec = byName.get(key);
    if (!spec) throw new Error(`Unknown model parameter "${key}".`);
    if (spec.type === 'range') {
      if (typeof val !== 'number' || !Number.isFinite(val)) {
        throw new Error(`Parameter "${key}" must be a finite number.`);
      }
      if (val < spec.min - 1e-6 || val > spec.max + 1e-6) {
        throw new Error(`Parameter "${key}" must be between ${String(spec.min)} and ${String(spec.max)}.`);
      }
      const clamped = Math.max(spec.min, Math.min(spec.max, val));
      const stepped = spec.step ? Math.round((clamped - spec.min) / spec.step) * spec.step + spec.min : clamped;
      // Avoid floating-point drift like 0.30000000000000004
      out[key] = Math.round(stepped * 10000) / 10000;
    } else if (spec.type === 'toggle') {
      if (typeof val !== 'boolean') throw new Error(`Parameter "${key}" must be true or false.`);
      out[key] = val;
    } else {
      if (typeof val !== 'string' || !spec.options.some(o => o.value === val)) {
        throw new Error(`Parameter "${key}" must be one of: ${spec.options.map(o => o.value).join(', ')}.`);
      }
      out[key] = val;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

/** Resolve a complete parameter map from defaults plus optional validated overrides. */
export function resolveModelParams(
  specs: readonly ModelParamSpec[] | undefined,
  overrides?: ModelParamValues,
): ModelParamValues {
  const resolved: ModelParamValues = {};
  if (!specs) return resolved;
  for (const spec of specs) {
    const raw = overrides?.[spec.name];
    if (spec.type === 'range') {
      const num = typeof raw === 'number' && Number.isFinite(raw) ? raw : spec.default;
      const clamped = Math.max(spec.min, Math.min(spec.max, num));
      resolved[spec.name] = Math.round(clamped * 10000) / 10000;
    } else if (spec.type === 'toggle') {
      resolved[spec.name] = typeof raw === 'boolean' ? raw : spec.default;
    } else {
      resolved[spec.name] = typeof raw === 'string' && spec.options.some(o => o.value === raw) ? raw : spec.default;
    }
  }
  return resolved;
}
