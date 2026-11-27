export type Axis = 'x' | 'y' | 'z';
export type AxisVector = [number, number, number];

export interface RiggedMimicSpec {
  /** Name of the leader rigged part whose pose value drives this follower. */
  part: string;
  /** Ratio multiplying the leader's pose value (in Form Foundry units: deg/deg, m/m, m/deg, or deg/m). */
  multiplier: number;
}

export interface RiggedPartSpec {
  name: string;
  label: string;
  type: 'rotate' | 'slide';
  /** Cardinal axis (`'x' | 'y' | 'z'`) or normalized 3D local unit vector `[nx, ny, nz]`. */
  axis: Axis | AxisVector;
  range: [number, number];
  /**
   * Optional factor converting asset-root metres into `node.parent`'s local translation units for `slide` joints
   * (e.g. `1000` when a Sand3D millimetre GLB carries a `0.001` ancestor root scale). Defaults to `1`.
   */
  slideScale?: number;
  /** True for unbounded endless spin joints (e.g. Sand3D `continuous` drums, wheels, dials). */
  continuous?: boolean;
  /** Optional coupled leader joint that drives this part automatically. */
  mimic?: RiggedMimicSpec;
  describe?: string;
}

const CARDINAL_AXES = new Set<Axis>(['x', 'y', 'z']);
const MAX_RANGE_ABS = 1e6;
const MAX_SLIDE_SCALE = 1e6;

export function slideOffsetFactor(spec: Pick<RiggedPartSpec, 'slideScale'>): number {
  return spec.slideScale !== undefined && Number.isFinite(spec.slideScale) && spec.slideScale > 0
    ? spec.slideScale
    : 1;
}

export function clampPartValue(
  part: { range?: readonly [number, number]; continuous?: boolean },
  value: number,
): number {
  if (part.continuous || !part.range) return value;
  const lo = Math.min(part.range[0], part.range[1]);
  const hi = Math.max(part.range[0], part.range[1]);
  return Math.min(hi, Math.max(lo, value));
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6 || 0;
}

/**
 * Parse a rigged-part local motion axis: either a positive cardinal shorthand (`'x' | 'y' | 'z'`)
 * or an arbitrary finite non-zero 3D unit vector `[nx, ny, nz]` (such as Sand3D negative or tilted axes).
 */
export function parseAxisSpec(raw: unknown): Axis | AxisVector | null {
  if (typeof raw === 'string') return CARDINAL_AXES.has(raw as Axis) ? (raw as Axis) : null;
  if (!Array.isArray(raw) || raw.length !== 3) return null;
  const x = Number(raw[0]);
  const y = Number(raw[1]);
  const z = Number(raw[2]);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
  const len = Math.hypot(x, y, z);
  if (len < 1e-6) return null;
  const ux = round6(x / len);
  const uy = round6(y / len);
  const uz = round6(z / len);
  if (Math.abs(ux - 1) < 1e-6 && Math.abs(uy) < 1e-6 && Math.abs(uz) < 1e-6) return 'x';
  if (Math.abs(ux) < 1e-6 && Math.abs(uy - 1) < 1e-6 && Math.abs(uz) < 1e-6) return 'y';
  if (Math.abs(ux) < 1e-6 && Math.abs(uy) < 1e-6 && Math.abs(uz - 1) < 1e-6) return 'z';
  return [ux, uy, uz];
}

/** Resolve any `Axis | AxisVector` into a unit `[x, y, z]` tuple. */
export function axisTuple(axis: Axis | AxisVector): AxisVector {
  if (axis === 'x') return [1, 0, 0];
  if (axis === 'y') return [0, 1, 0];
  if (axis === 'z') return [0, 0, 1];
  const len = Math.hypot(axis[0], axis[1], axis[2]);
  if (len < 1e-6) return [0, 0, 1];
  return [axis[0] / len, axis[1] / len, axis[2] / len];
}

/**
 * Remove any `mimic` link whose leader does not exist in `parts`, points to itself, or forms a cycle.
 * Returns a sanitized shallow-copied array preserving input order.
 */
export function sanitizeMimicLinks<T extends { name: string; mimic?: RiggedMimicSpec }>(parts: readonly T[]): T[] {
  const byName = new Map<string, T>();
  for (const part of parts) byName.set(part.name, part);

  const validMimic = (part: T): boolean => {
    if (!part.mimic) return false;
    if (!Number.isFinite(part.mimic.multiplier) || Math.abs(part.mimic.multiplier) < 1e-12) return false;
    const seen = new Set<string>([part.name]);
    let cur: string | undefined = part.mimic.part;
    while (cur) {
      if (seen.has(cur)) return false;
      seen.add(cur);
      const next = byName.get(cur);
      if (!next) return false;
      cur = next.mimic?.part;
    }
    return true;
  };

  return parts.map(part => {
    if (!part.mimic || validMimic(part)) return part;
    const copy = { ...part };
    delete copy.mimic;
    return copy;
  });
}

/** List every transitive `mimic` follower name driven by `leaderName` in deterministic topological order. */
export function listMimicFollowers(
  parts: readonly { name: string; mimic?: RiggedMimicSpec }[],
  leaderName: string,
): string[] {
  const byLeader = new Map<string, string[]>();
  for (const part of parts) {
    if (!part.mimic) continue;
    let list = byLeader.get(part.mimic.part);
    if (!list) {
      list = [];
      byLeader.set(part.mimic.part, list);
    }
    list.push(part.name);
  }
  const out: string[] = [];
  const queue: string[] = [leaderName];
  const visited = new Set<string>([leaderName]);
  while (queue.length) {
    const cur = queue.shift();
    if (!cur) continue;
    for (const child of byLeader.get(cur) ?? []) {
      if (visited.has(child)) continue;
      visited.add(child);
      out.push(child);
      queue.push(child);
    }
  }
  return out;
}

/**
 * Propagate a leader pose change down all transitive `mimic` follower chains in deterministic topological order.
 * Clamps intermediate and leaf non-continuous stops when `range` is provided so multi-level chains agree everywhere.
 */
export function propagateMimicValues(
  parts: readonly { name: string; range?: readonly [number, number]; continuous?: boolean; mimic?: RiggedMimicSpec }[],
  leaderName: string,
  leaderValue: number,
  options?: { clamp?: boolean },
): Map<string, number> {
  const clamp = options?.clamp !== false;
  const followersByLeader = new Map<
    string,
    { name: string; multiplier: number; range?: readonly [number, number]; continuous?: boolean }[]
  >();
  for (const part of parts) {
    if (!part.mimic) continue;
    let list = followersByLeader.get(part.mimic.part);
    if (!list) {
      list = [];
      followersByLeader.set(part.mimic.part, list);
    }
    list.push({
      name: part.name,
      multiplier: part.mimic.multiplier,
      ...(part.range ? { range: part.range } : {}),
      ...(part.continuous ? { continuous: true } : {}),
    });
  }

  const out = new Map<string, number>();
  const queue: { name: string; value: number }[] = [{ name: leaderName, value: leaderValue }];
  const visited = new Set<string>([leaderName]);
  while (queue.length) {
    const cur = queue.shift();
    if (!cur) continue;
    for (const child of followersByLeader.get(cur.name) ?? []) {
      if (visited.has(child.name)) continue;
      visited.add(child.name);
      const rawNext = cur.value * child.multiplier;
      const nextVal = clamp ? clampPartValue(child, rawNext) : rawNext;
      out.set(child.name, nextVal);
      queue.push({ name: child.name, value: nextVal });
    }
  }
  return out;
}

const MAX_CLIP_LEG_STEPS = 64;
const MAX_CLIP_SPIN_STEPS = 128;

export interface ClipPoseSchedule {
  times: number[];
  leaderValues: number[];
  followerValues: Map<string, number[]>;
}

/**
 * Build synchronized keyframe times and pose curves for a leader joint plus all transitive mimic followers.
 * Subdivides open/close legs whenever the leader OR any rotating follower exceeds 45° so quaternion tracks
 * never collapse a 360° follower spin into a no-op, while bounding keyframe count for malformed ranges.
 */
export function buildClipPoseSchedule(
  part: RiggedPartSpec,
  allParts: readonly RiggedPartSpec[],
): ClipPoseSchedule {
  const far = Math.abs(part.range[1]) >= Math.abs(part.range[0]) ? part.range[1] : part.range[0];
  const isContinuousCycle = part.type === 'rotate' && (Math.abs(far) >= 359 || Boolean(part.continuous));
  const target = isContinuousCycle && part.continuous && Math.abs(far) < 359 ? 360 : far;

  const followerNames = listMimicFollowers(allParts, part.name);
  const byName = new Map(allParts.map(p => [p.name, p]));
  const startCoupled = propagateMimicValues(allParts, part.name, 0);
  const endCoupled = propagateMimicValues(allParts, part.name, target);

  let maxDegSpan = part.type === 'rotate' ? Math.abs(target) : 0;
  for (const fName of followerNames) {
    const fSpec = byName.get(fName);
    if (!fSpec || fSpec.type !== 'rotate') continue;
    const fSpan = Math.abs((endCoupled.get(fName) ?? 0) - (startCoupled.get(fName) ?? 0));
    if (fSpan > maxDegSpan) maxDegSpan = fSpan;
  }

  const times: number[] = [];
  const leaderValues: number[] = [];
  if (isContinuousCycle) {
    const steps = Math.min(MAX_CLIP_SPIN_STEPS, Math.max(8, Math.ceil(maxDegSpan / 45)));
    for (let i = 0; i <= steps; i++) {
      times.push((i / steps) * 2.4);
      leaderValues.push((target * i) / steps);
    }
  } else {
    const steps = Math.min(MAX_CLIP_LEG_STEPS, Math.max(1, Math.ceil(maxDegSpan / 45)));
    for (let i = 0; i <= steps; i++) {
      times.push((i / steps) * 0.9);
      leaderValues.push((target * i) / steps);
    }
    times.push(1.5);
    leaderValues.push(target);
    for (let i = 1; i <= steps; i++) {
      times.push(1.5 + (i / steps) * 0.9);
      leaderValues.push(target * (1 - i / steps));
    }
  }

  const followerValues = new Map<string, number[]>();
  for (const fName of followerNames) followerValues.set(fName, []);
  if (followerNames.length) {
    for (const v of leaderValues) {
      const coupled = propagateMimicValues(allParts, part.name, v);
      for (const fName of followerNames) {
        followerValues.get(fName)?.push(coupled.get(fName) ?? 0);
      }
    }
  }
  return { times, leaderValues, followerValues };
}

function trimField(value: unknown, maxLen: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLen) : undefined;
}

function parseRange2(value: unknown): [number, number] | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const a = Number(value[0]);
  const b = Number(value[1]);
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= MAX_RANGE_ABS && Math.abs(b) <= MAX_RANGE_ABS && a !== b
    ? [a, b]
    : null;
}

/** Parse and sanitize an untrusted `riggedParts` JSON array (validating axes, ranges, continuous flags, and acyclic mimic links). */
export function parseRiggedPartsList(
  value: unknown,
  humanize: (raw: string) => string,
  limits = { maxParts: 64, maxNameLen: 80, maxDescLen: 280 },
): RiggedPartSpec[] {
  if (!Array.isArray(value)) return [];
  const parts: RiggedPartSpec[] = [];
  const seen = new Set<string>();
  for (const row of value) {
    if (parts.length >= limits.maxParts) break;
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
    const rec = row as Record<string, unknown>;
    const name = trimField(rec.name, limits.maxNameLen);
    if (!name || seen.has(name)) continue;
    const axis = parseAxisSpec(rec.axis);
    if (!axis) continue;
    const range = parseRange2(rec.range);
    if (!range) continue;
    seen.add(name);
    const type = rec.type === 'slide' ? 'slide' : 'rotate';
    const label = trimField(rec.label, limits.maxNameLen) ?? humanize(name);
    const describe = trimField(rec.describe, limits.maxDescLen);
    const continuous = rec.continuous === true ? true : undefined;
    const rawSlideScale = typeof rec.slideScale === 'number' && Number.isFinite(rec.slideScale) && rec.slideScale > 0 && rec.slideScale <= MAX_SLIDE_SCALE
      ? rec.slideScale
      : undefined;
    const slideScale = type === 'slide' && rawSlideScale !== undefined && Math.abs(rawSlideScale - 1) > 1e-6
      ? rawSlideScale
      : undefined;
    let mimic: RiggedMimicSpec | undefined;
    if (rec.mimic && typeof rec.mimic === 'object' && !Array.isArray(rec.mimic)) {
      const m = rec.mimic as Record<string, unknown>;
      const leader = trimField(m.part, limits.maxNameLen);
      const mult = typeof m.multiplier === 'number' && Number.isFinite(m.multiplier) ? m.multiplier : undefined;
      if (leader && leader !== name && mult !== undefined && Math.abs(mult) > 1e-12) {
        mimic = { part: leader, multiplier: mult };
      }
    }
    parts.push({
      name,
      label,
      type,
      axis,
      range,
      ...(slideScale !== undefined ? { slideScale } : {}),
      ...(continuous ? { continuous } : {}),
      ...(mimic ? { mimic } : {}),
      ...(describe ? { describe } : {}),
    });
  }
  return sanitizeMimicLinks(parts);
}
