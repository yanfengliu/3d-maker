import { COLOR_KEYS, type ColorKey } from '../src/iphone/materials.js';
import { VIEW_KEYS, type ViewKey } from '../src/iphone/views.js';

/**
 * The shot matrix behind scripts/shoot-iphone.ps1, in one place so the
 * PowerShell loop, a future headless-Chrome driver, and the debug contract in
 * the viewer cannot drift apart.
 *
 * This file is also why `scripts/` is lintable: ESLint 10 exits 2 when a
 * directory named on the command line matches no file, and the rest of this
 * folder is PowerShell.
 */

export interface ShotTarget {
  readonly color: ColorKey;
  readonly view: ViewKey;
  /** File name inside the output directory. */
  readonly file: string;
  readonly url: string;
}

export function shotMatrix(baseUrl: string): ShotTarget[] {
  const base = baseUrl.replace(/\/+$/, '');
  const targets: ShotTarget[] = [];
  for (const color of COLOR_KEYS) {
    for (const view of VIEW_KEYS) {
      targets.push({
        color,
        view,
        file: `${color}_${view}.png`,
        url: `${base}/iphone.html?shot=1&color=${color}&view=${view}`,
      });
    }
  }
  return targets;
}

export function parseArgs(argv: readonly string[]): { baseUrl: string; outDir: string } {
  const args = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (key === undefined || value === undefined) break;
    args.set(key.replace(/^--/, ''), value);
  }
  return {
    baseUrl: args.get('base-url') ?? 'http://localhost:5199',
    outDir: args.get('out') ?? '.shots',
  };
}
