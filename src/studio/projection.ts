export type Projection = 'perspective' | 'orthographic';

export const DEFAULT_PROJECTION: Projection = 'perspective';
export const PERSPECTIVE_FOV = 40;

const STORAGE_KEY = '3d-maker:viewport:projection';
const COOKIE_KEY = 'ff_projection';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function parseProjection(value: unknown): Projection | null {
  if (typeof value !== 'string') return null;
  const clean = value.trim().toLowerCase();
  if (clean === 'perspective') return 'perspective';
  if (clean === 'orthographic' || clean === 'ortho' || clean === 'isometric') return 'orthographic';
  return null;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined' || typeof document.cookie !== 'string') return null;
  for (const part of document.cookie.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

/**
 * Read the persisted projection preference.
 * Checks the domain-scoped cookie first so different localhost ports (for example :5173 and :5174)
 * share the latest choice, then falls back to localStorage, defaulting to real-life perspective.
 */
export function readProjectionPreference(): Projection {
  const fromCookie = parseProjection(readCookie(COOKIE_KEY));
  if (fromCookie) return fromCookie;
  try {
    const fromStorage = typeof localStorage !== 'undefined' ? parseProjection(localStorage.getItem(STORAGE_KEY)) : null;
    if (fromStorage) return fromStorage;
  } catch {
    // Ignore storage quota or restricted-origin errors and fall back to default.
  }
  return DEFAULT_PROJECTION;
}

/** Persist the projection preference in both cookie (shared across localhost ports) and localStorage. */
export function saveProjectionPreference(projection: Projection): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, projection);
  } catch {
    // Ignore restricted-storage environments.
  }
  try {
    if (typeof document !== 'undefined') {
      document.cookie = `${COOKIE_KEY}=${encodeURIComponent(projection)}; Path=/; Max-Age=${String(COOKIE_MAX_AGE)}; SameSite=Lax`;
    }
  } catch {
    // Ignore cookie-restricted environments.
  }
}

export function orthoHalfHeight(frameWidth: number, frameHeight: number, aspect: number): number {
  return Math.max(frameHeight, frameWidth / Math.max(0.01, aspect)) * 0.5;
}

/**
 * Camera distance from target so a box of (frameWidth, frameHeight, frameDepth) in camera space
 * fits cleanly inside a PerspectiveCamera without clipping its front face.
 */
export function perspectiveDistance(
  frameWidth: number,
  frameHeight: number,
  frameDepth: number,
  aspect: number,
  fovDeg = PERSPECTIVE_FOV,
): number {
  const tanHalfY = Math.tan((fovDeg * Math.PI) / 360);
  const tanHalfX = tanHalfY * Math.max(0.01, aspect);
  const fitY = (frameHeight * 0.5) / tanHalfY;
  const fitX = (frameWidth * 0.5) / tanHalfX;
  return Math.max(fitY, fitX) + frameDepth * 0.5;
}

export function perspectiveDistanceForOrtho(orthoHalfH: number, orthoZoom: number, fovDeg = PERSPECTIVE_FOV): number {
  const tanHalfY = Math.tan((fovDeg * Math.PI) / 360);
  return orthoHalfH / Math.max(1e-4, orthoZoom * tanHalfY);
}

export function orthoZoomForPerspective(
  orthoHalfH: number,
  distance: number,
  perspZoom: number,
  fovDeg = PERSPECTIVE_FOV,
): number {
  const tanHalfY = Math.tan((fovDeg * Math.PI) / 360);
  const visibleHalfH = (distance * tanHalfY) / Math.max(1e-4, perspZoom);
  return orthoHalfH / Math.max(1e-4, visibleHalfH);
}
