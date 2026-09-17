/**
 * The model registry.
 *
 * This registry is the single source for the index page. A new model is a new
 * entry here, plus a rollup input for its own page in vite.config.ts, plus a
 * poster under public/posters/.
 *
 * Both paths are written `./`-relative so one registry resolves under the dev
 * server (`/`) and under the Pages project site (`/3d-maker/`) alike.
 */

export interface ModelEntry {
  /** Stable key: test lookups and future deep links hang off this. */
  readonly id: string;
  /** Card heading. */
  readonly title: string;
  /** Dimensions line under the heading. */
  readonly subtitle: string;
  /** One line on what the model is and how it is made. */
  readonly description: string;
  /** The model's own page. */
  readonly href: string;
  /** Poster under `public/`, used as the card image. */
  readonly poster: string;
  /** CSS hex colour for the card's swatch and its focus ring. */
  readonly accent: string;
}

export const MODELS: readonly ModelEntry[] = [
  {
    id: 'iphone-17-pro',
    title: 'iPhone 17 Pro',
    subtitle: '6.3-inch \u00B7 150.0 \u00D7 71.9 \u00D7 8.75 mm',
    description: 'Procedural three.js model in three finishes, built to its real millimetre dimensions.',
    href: './iphone.html',
    poster: './posters/iphone-17-pro.png',
    accent: '#c75b39',
  },
];
