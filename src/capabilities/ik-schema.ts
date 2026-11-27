export interface IkLimbSpec {
  name: string;
  upperM: number;
  lowerM: number;
  footOffset: [number, number, number];
}

export interface IkLegsSpec {
  hipHeightM: number;
  strideM: number;
  stepHeightM: number;
  duty: number;
  phaseOrder: string[];
  limbs: IkLimbSpec[];
}

export interface IkArmSegmentSpec {
  name: string;
  lengthM: number;
}

export interface IkArmSpec {
  baseAt: [number, number, number];
  reachM: number;
  segments: IkArmSegmentSpec[];
}

export interface AssetIkSpec {
  type: 'legs' | 'arm';
  summary?: string;
  legs?: IkLegsSpec;
  arm?: IkArmSpec;
}

const maxNameLen = 80;
const maxDescLen = 280;
const maxLimbs = 12;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function trimText(value: unknown, maxLen: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLen) : undefined;
}

function positiveNum(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

function tuple3(value: unknown): [number, number, number] | null {
  if (!Array.isArray(value) || value.length !== 3) return null;
  const nums = value.map(Number);
  return nums.every(Number.isFinite) ? [nums[0] ?? 0, nums[1] ?? 0, nums[2] ?? 0] : null;
}

function parseLegs(value: unknown): IkLegsSpec | undefined {
  if (!isRecord(value)) return undefined;
  const hipHeightM = positiveNum(value.hipHeightM);
  const strideM = positiveNum(value.strideM);
  const stepHeightM = positiveNum(value.stepHeightM);
  const duty = typeof value.duty === 'number' && Number.isFinite(value.duty) && value.duty > 0 && value.duty < 1
    ? value.duty
    : undefined;
  if (hipHeightM === undefined || strideM === undefined || stepHeightM === undefined || duty === undefined) return undefined;
  if (!Array.isArray(value.limbs) || !Array.isArray(value.phaseOrder)) return undefined;

  const limbs: IkLimbSpec[] = [];
  const seen = new Set<string>();
  for (const row of value.limbs) {
    if (limbs.length >= maxLimbs) break;
    if (!isRecord(row)) continue;
    const name = trimText(row.name, maxNameLen);
    const upperM = positiveNum(row.upperM);
    const lowerM = positiveNum(row.lowerM);
    const footOffset = tuple3(row.footOffset);
    if (!name || seen.has(name) || upperM === undefined || lowerM === undefined || !footOffset) continue;
    seen.add(name);
    limbs.push({ name, upperM, lowerM, footOffset });
  }
  if (!limbs.length) return undefined;

  const phaseOrder = value.phaseOrder
    .filter((item): item is string => typeof item === 'string' && seen.has(item.trim()))
    .map(item => item.trim());
  if (!phaseOrder.length) return undefined;

  return { hipHeightM, strideM, stepHeightM, duty, phaseOrder, limbs };
}

function parseArm(value: unknown): IkArmSpec | undefined {
  if (!isRecord(value)) return undefined;
  const baseAt = tuple3(value.baseAt);
  const reachM = positiveNum(value.reachM);
  if (!baseAt || reachM === undefined || !Array.isArray(value.segments)) return undefined;

  const segments: IkArmSegmentSpec[] = [];
  const seen = new Set<string>();
  for (const row of value.segments) {
    if (segments.length >= maxLimbs) break;
    if (!isRecord(row)) continue;
    const name = trimText(row.name, maxNameLen);
    const lengthM = positiveNum(row.lengthM);
    if (!name || seen.has(name) || lengthM === undefined) continue;
    seen.add(name);
    segments.push({ name, lengthM });
  }
  if (!segments.length) return undefined;
  return { baseAt, reachM, segments };
}

/** Validate and normalize measured IK metadata read from GLB extras or JSON. */
export function parseIkSpec(value: unknown): AssetIkSpec | undefined {
  if (!isRecord(value) || (value.type !== 'legs' && value.type !== 'arm')) return undefined;
  const summary = trimText(value.summary, maxDescLen);
  const legs = value.type === 'legs' ? parseLegs(value.legs) : undefined;
  const arm = value.type === 'arm' ? parseArm(value.arm) : undefined;
  return {
    type: value.type,
    ...(summary ? { summary } : {}),
    ...(legs ? { legs } : {}),
    ...(arm ? { arm } : {}),
  };
}
