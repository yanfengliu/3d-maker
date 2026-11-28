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
 * Remove any `mimic` link whose immediate leader is missing/invalid or participates in a cycle.
 * Preserves valid surviving downstream links when an upstream leader is pruned (e.g. missing A in A->B->C keeps B->C).
 */
export function sanitizeMimicLinks<T extends { name: string; mimic?: RiggedMimicSpec }>(parts: readonly T[]): T[] {
  const byName = new Map<string, T>();
  for (const part of parts) byName.set(part.name, part);

  // Pass 1: keep only links whose immediate leader exists and has a valid non-zero multiplier.
  const step1 = parts.map(part => {
    const m = part.mimic;
    if (!m) return part;
    const ok = m.part !== part.name
      && byName.has(m.part)
      && Number.isFinite(m.multiplier)
      && Math.abs(m.multiplier) >= 1e-12;
    if (ok) return part;
    const copy = { ...part };
    delete copy.mimic;
    return copy;
  });

  // Pass 2: strip only links that reach a cycle among surviving links.
  const survivingByName = new Map<string, T>();
  for (const part of step1) survivingByName.set(part.name, part);

  const acyclic = (part: T): boolean => {
    const seen = new Set<string>([part.name]);
    let cur: string | undefined = part.mimic?.part;
    while (cur) {
      if (seen.has(cur)) return false;
      seen.add(cur);
      cur = survivingByName.get(cur)?.mimic?.part;
    }
    return true;
  };

  return step1.map(part => {
    if (!part.mimic || acyclic(part)) return part;
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

const MAX_CLIP_LEG_STEPS = 256;
const MAX_CLIP_SPIN_STEPS = 128;
const MAX_CLIP_SPIN_DEG = 3600;

export interface ClipPoseSchedule {
  times: number[];
  leaderValues: number[];
  followerValues: Map<string, number[]>;
}

function collectMimicBreakpoints(
  part: RiggedPartSpec,
  allParts: readonly RiggedPartSpec[],
  startVal: number,
  endVal: number,
): number[] {
  const loBound = Math.min(startVal, endVal);
  const hiBound = Math.max(startVal, endVal);
  const span = hiBound - loBound;
  if (span < 1e-12) return [];
  const eps = Math.min(1e-9, span * 1e-9);
  const byName = new Map(allParts.map(p => [p.name, p]));
  const cumMult = new Map<string, number>([[part.name, 1]]);
  const breaks: number[] = [];
  for (const fName of listMimicFollowers(allParts, part.name)) {
    const fSpec = byName.get(fName);
    if (!fSpec?.mimic) continue;
    const parentMult = cumMult.get(fSpec.mimic.part);
    if (parentMult === undefined) continue;
    const mult = parentMult * fSpec.mimic.multiplier;
    cumMult.set(fName, mult);
    if (fSpec.continuous || Math.abs(mult) < 1e-12) continue;
    for (const lim of fSpec.range) {
      const bp = lim / mult;
      if (Number.isFinite(bp) && bp > loBound + eps && bp < hiBound - eps) {
        breaks.push(bp);
      }
    }
  }
  const dir = endVal >= startVal ? 1 : -1;
  breaks.sort((a, b) => (a - b) * dir);
  const deduped: number[] = [];
  for (const bp of breaks) {
    const prev = deduped[deduped.length - 1];
    if (prev === undefined || Math.abs(bp - prev) > eps) deduped.push(bp);
  }
  return deduped;
}

/**
 * Generate breakpoint-aware and angle-aware sweep sample values for `part` across `part.range`, ensuring
 * narrow early follower-stop segments and multi-turn coupled rotations are densely sampled.
 */
export function buildSweepSampleValues(
  part: RiggedPartSpec,
  allParts: readonly RiggedPartSpec[],
  opts: { minSteps: number; degPerStep: number; maxTotalSteps: number; exactSteps?: number },
): number[] {
  const [r0, r1] = part.range;
  const totalSpan = Math.abs(r1 - r0);
  if (totalSpan < 1e-12) return [r0];
  const knots = [r0, ...collectMimicBreakpoints(part, allParts, r0, r1), r1];
  const byName = new Map(allParts.map(p => [p.name, p]));
  const followerNames = listMimicFollowers(allParts, part.name);

  if (opts.exactSteps !== undefined && knots.length === 2) {
    const n = Math.max(2, opts.exactSteps);
    return Array.from({ length: n }, (_, i) => r0 + ((r1 - r0) * i) / (n - 1));
  }

  const segs: { a: number; b: number; steps: number }[] = [];
  const baseSteps = Math.max(1, (opts.exactSteps ?? opts.minSteps) - 1);
  let prevCoupled = propagateMimicValues(allParts, part.name, r0);
  for (let i = 0; i < knots.length - 1; i++) {
    const a = knots[i] ?? r0;
    const b = knots[i + 1] ?? r1;
    const nextCoupled = propagateMimicValues(allParts, part.name, b);
    let segDeg = part.type === 'rotate' ? Math.abs(b - a) : 0;
    for (const fName of followerNames) {
      const fSpec = byName.get(fName);
      if (!fSpec || fSpec.type !== 'rotate') continue;
      const d = Math.abs((nextCoupled.get(fName) ?? 0) - (prevCoupled.get(fName) ?? 0));
      if (d > segDeg) segDeg = d;
    }
    const fracSteps = Math.round(baseSteps * (Math.abs(b - a) / totalSpan));
    const angSteps = segDeg > 1e-6 ? Math.ceil(segDeg / opts.degPerStep) : 0;
    segs.push({ a, b, steps: Math.max(1, fracSteps, angSteps) });
    prevCoupled = nextCoupled;
  }

  const totalSteps = segs.reduce((acc, s) => acc + s.steps, 0);
  if (totalSteps > opts.maxTotalSteps) {
    const scale = opts.maxTotalSteps / totalSteps;
    for (const s of segs) s.steps = Math.max(1, Math.round(s.steps * scale));
  }

  const values: number[] = [r0];
  for (const seg of segs) {
    for (let i = 1; i <= seg.steps; i++) {
      values.push(seg.a + ((seg.b - seg.a) * i) / seg.steps);
    }
  }
  return values;
}

/**
 * Build synchronized keyframe times and pose curves for a leader joint plus all transitive mimic followers.
 * Inserts exact breakpoints at every follower mechanical stop and subdivides every segment so consecutive
 * quaternion keys stay <= 45° (widening up to 90° only above 32 turns) while keeping key counts bounded.
 */
export function buildClipPoseSchedule(
  part: RiggedPartSpec,
  allParts: readonly RiggedPartSpec[],
): ClipPoseSchedule {
  const far = Math.abs(part.range[1]) >= Math.abs(part.range[0]) ? part.range[1] : part.range[0];
  const isContinuousCycle = part.type === 'rotate' && (Math.abs(far) >= 359 || Boolean(part.continuous));
  let target = isContinuousCycle && part.continuous && Math.abs(far) < 359 ? 360 : far;
  if (isContinuousCycle && Math.abs(target) > MAX_CLIP_SPIN_DEG) {
    target = Math.sign(target) * MAX_CLIP_SPIN_DEG;
  }

  const followerNames = listMimicFollowers(allParts, part.name);
  const byName = new Map(allParts.map(p => [p.name, p]));
  const maxBudget = isContinuousCycle ? MAX_CLIP_SPIN_STEPS : MAX_CLIP_LEG_STEPS;

  const buildSegments = (endVal: number) => {
    const knots = [0, ...collectMimicBreakpoints(part, allParts, 0, endVal), endVal];
    const segs: { a: number; b: number; deg: number }[] = [];
    let prevCoupled = propagateMimicValues(allParts, part.name, 0);
    let totalDeg = 0;
    for (let i = 0; i < knots.length - 1; i++) {
      const a = knots[i] ?? 0;
      const b = knots[i + 1] ?? endVal;
      const nextCoupled = propagateMimicValues(allParts, part.name, b);
      let segDeg = part.type === 'rotate' ? Math.abs(b - a) : 0;
      for (const fName of followerNames) {
        const fSpec = byName.get(fName);
        if (!fSpec || fSpec.type !== 'rotate') continue;
        const d = Math.abs((nextCoupled.get(fName) ?? 0) - (prevCoupled.get(fName) ?? 0));
        if (d > segDeg) segDeg = d;
      }
      segs.push({ a, b, deg: segDeg });
      totalDeg += segDeg;
      prevCoupled = nextCoupled;
    }
    return { segs, totalDeg };
  };

  const initial = buildSegments(target);
  let segs = initial.segs;
  let stepDeg = 45;
  if (initial.totalDeg > maxBudget * 45) {
    if (initial.totalDeg <= maxBudget * 90) {
      stepDeg = Math.min(90, initial.totalDeg / maxBudget);
    } else {
      stepDeg = 90;
      target *= (maxBudget * 90) / initial.totalDeg;
      segs = buildSegments(target).segs;
    }
  }

  const legValues: number[] = [0];
  const legFracs: number[] = [0];
  const targetSpan = Math.abs(target) > 1e-12 ? target : 1;
  for (const seg of segs) {
    const steps = Math.max(1, Math.ceil(seg.deg / stepDeg));
    for (let i = 1; i <= steps; i++) {
      const v = seg.a + ((seg.b - seg.a) * i) / steps;
      legValues.push(v);
      legFracs.push(Math.max(0, Math.min(1, v / targetSpan)));
    }
  }
  if (isContinuousCycle && legValues.length < 9) {
    legValues.length = 0;
    legFracs.length = 0;
    for (let i = 0; i <= 8; i++) {
      legFracs.push(i / 8);
      legValues.push((target * i) / 8);
    }
  }

  const times: number[] = [];
  const leaderValues: number[] = [];
  if (isContinuousCycle) {
    for (let i = 0; i < legValues.length; i++) {
      times.push((legFracs[i] ?? 0) * 2.4);
      leaderValues.push(legValues[i] ?? 0);
    }
  } else {
    for (let i = 0; i < legValues.length; i++) {
      times.push((legFracs[i] ?? 0) * 0.9);
      leaderValues.push(legValues[i] ?? 0);
    }
    times.push(1.5);
    leaderValues.push(target);
    for (let i = legValues.length - 2; i >= 0; i--) {
      times.push(1.5 + (1 - (legFracs[i] ?? 0)) * 0.9);
      leaderValues.push(legValues[i] ?? 0);
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
