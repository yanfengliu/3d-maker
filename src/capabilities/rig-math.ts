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
  /** True for unbounded endless spin joints (e.g. Sand3D `continuous` drums, wheels, dials). */
  continuous?: boolean;
  /** Optional coupled leader joint that drives this part automatically. */
  mimic?: RiggedMimicSpec;
  describe?: string;
}

const CARDINAL_AXES = new Set<Axis>(['x', 'y', 'z']);

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

/**
 * Propagate a leader pose change down all transitive `mimic` follower chains in deterministic topological order.
 * Returns a map of `followerName -> computedValue` (excluding the leader itself).
 */
export function propagateMimicValues(
  parts: readonly { name: string; mimic?: RiggedMimicSpec }[],
  leaderName: string,
  leaderValue: number,
): Map<string, number> {
  const followersByLeader = new Map<string, { name: string; multiplier: number }[]>();
  for (const part of parts) {
    if (!part.mimic) continue;
    let list = followersByLeader.get(part.mimic.part);
    if (!list) {
      list = [];
      followersByLeader.set(part.mimic.part, list);
    }
    list.push({ name: part.name, multiplier: part.mimic.multiplier });
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
      const nextVal = cur.value * child.multiplier;
      out.set(child.name, nextVal);
      queue.push({ name: child.name, value: nextVal });
    }
  }
  return out;
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
  return Number.isFinite(a) && Number.isFinite(b) && a !== b ? [a, b] : null;
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
      ...(continuous ? { continuous } : {}),
      ...(mimic ? { mimic } : {}),
      ...(describe ? { describe } : {}),
    });
  }
  return sanitizeMimicLinks(parts);
}
