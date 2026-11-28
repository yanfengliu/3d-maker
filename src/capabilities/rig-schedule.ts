import { listMimicFollowers, propagateMimicValues, type RiggedPartSpec } from './rig-math';

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
 * Generate breakpoint-aware and alias-free sweep sample values for `part` across its reachable range:
 * - Expands a `continuous` leader's sweep span to reach every finite bounded follower's full stops (capped at ±36,000°).
 * - Samples narrow early-stop segments densely, and for high-turn rotations (>360° capped below `degPerStep`)
 *   samples one full 360° revolution at the start and end of the segment plus intermediate points so angular aliasing never occurs.
 */
export function buildSweepSampleValues(
  part: RiggedPartSpec,
  allParts: readonly RiggedPartSpec[],
  opts: { minSteps: number; degPerStep: number; maxTotalSteps: number; exactSteps?: number },
): number[] {
  let [r0, r1] = part.range;
  const byName = new Map(allParts.map(p => [p.name, p]));
  const followerNames = listMimicFollowers(allParts, part.name);
  if (part.continuous) {
    const cumMult = new Map<string, number>([[part.name, 1]]);
    let lo = Math.min(r0, r1);
    let hi = Math.max(r0, r1);
    for (const fName of followerNames) {
      const fSpec = byName.get(fName);
      if (!fSpec?.mimic) continue;
      const pm = cumMult.get(fSpec.mimic.part);
      if (pm === undefined) continue;
      const mult = pm * fSpec.mimic.multiplier;
      cumMult.set(fName, mult);
      if (fSpec.continuous || Math.abs(mult) < 1e-12) continue;
      for (const lim of fSpec.range) {
        const reach = Math.max(-36000, Math.min(36000, lim / mult));
        if (Number.isFinite(reach)) {
          if (reach < lo) lo = reach;
          if (reach > hi) hi = reach;
        }
      }
    }
    r0 = part.range[0] <= part.range[1] ? lo : hi;
    r1 = part.range[0] <= part.range[1] ? hi : lo;
  }

  const totalSpan = Math.abs(r1 - r0);
  if (totalSpan < 1e-12) return [r0];
  const knots = [r0, ...collectMimicBreakpoints(part, allParts, r0, r1), r1];

  const segs: { a: number; b: number; segDeg: number; steps: number }[] = [];
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
    const desired = opts.exactSteps !== undefined && knots.length === 2
      ? Math.max(1, opts.exactSteps - 1)
      : Math.max(1, fracSteps, angSteps);
    segs.push({ a, b, segDeg, steps: desired });
    prevCoupled = nextCoupled;
  }

  const totalSteps = segs.reduce((acc, s) => acc + s.steps, 0);
  const perTurnSteps = Math.max(12, Math.ceil(360 / opts.degPerStep));
  const values: number[] = [r0];
  const scale = totalSteps > opts.maxTotalSteps ? opts.maxTotalSteps / totalSteps : 1;
  for (const seg of segs) {
    const budget = Math.max(1, Math.round(seg.steps * scale));
    if (seg.segDeg > 360 && seg.segDeg / budget > opts.degPerStep) {
      // Multi-turn alias-free sampling: full 360° circle at start and end + irrational-offset intermediate passes.
      const turnSpan = (seg.b - seg.a) * (360 / seg.segDeg);
      const endStart = seg.b - turnSpan;
      const ringSteps = Math.min(perTurnSteps, Math.max(12, Math.floor(opts.maxTotalSteps / 3)));
      for (let i = 1; i <= ringSteps; i++) values.push(seg.a + (turnSpan * i) / ringSteps);
      const midSpan = endStart - (seg.a + turnSpan);
      if (Math.abs(midSpan) > totalSpan * 1e-9) {
        const midSteps = Math.max(6, Math.min(24, budget));
        for (let i = 1; i < midSteps; i++) {
          const frac = (i + ((i * 0.6180339887) % 1) * 0.35) / midSteps;
          values.push(seg.a + turnSpan + midSpan * Math.min(0.999, frac));
        }
      }
      for (let i = 0; i <= ringSteps; i++) values.push(endStart + (turnSpan * i) / ringSteps);
    } else {
      for (let i = 1; i <= budget; i++) values.push(seg.a + ((seg.b - seg.a) * i) / budget);
    }
  }
  return values;
}

function enforceStrictFloat32Times(rawTimes: number[]): number[] {
  const minStep = 1e-4;
  const n = rawTimes.length;
  if (n <= 1) return rawTimes;
  // Forward pass guarantees strictly increasing Float32 timestamps (glTF 2.0 §5.8.1).
  for (let i = 1; i < n; i++) {
    const prev = rawTimes[i - 1] ?? 0;
    const cur = rawTimes[i] ?? prev;
    if (Math.fround(cur) <= Math.fround(prev) || cur - prev < minStep * 0.5) {
      rawTimes[i] = prev + minStep;
    }
  }
  // Preserve exact clip end (2.4 s) by pulling back only interior nudged timestamps if the end overshot.
  const cap = rawTimes[n - 1] ?? 2.4;
  if (cap > 2.4 + 1e-6) {
    rawTimes[n - 1] = 2.4;
    for (let i = n - 2; i >= 1; i--) {
      const next = rawTimes[i + 1] ?? 2.4;
      const cur = rawTimes[i] ?? 0;
      if (Math.fround(cur) >= Math.fround(next) || next - cur < minStep * 0.5) {
        rawTimes[i] = Math.max(0, next - minStep);
      }
    }
  }
  return rawTimes;
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
  enforceStrictFloat32Times(times);

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
