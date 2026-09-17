import { MODELS, type ModelEntry } from './models.js';

/**
 * The index page: one card per registry entry, over the dark studio backdrop
 * the viewer's overlay already uses. Plain DOM, no framework.
 *
 * Query parameters:
 *   shot  1 suppresses the card entrance, so a capture lands on the very first
 *         presented frame
 *
 * window.__shotReady is set once every poster has loaded or failed, because the
 * posters are the only slow part of this page and the capture harness needs a
 * point where the images are actually in the frame.
 */

declare global {
  interface Window {
    __shotReady?: boolean;
  }
}

/** Longest a capture waits for posters before the page calls itself ready. */
const POSTER_TIMEOUT_MS = 3000;

const params = new URLSearchParams(window.location.search);
const shotMode = params.get('shot') === '1';

interface Card {
  readonly link: HTMLAnchorElement;
  readonly poster: HTMLImageElement;
}

/** A poster that has already settled resolves without waiting for an event. */
async function settled(image: HTMLImageElement): Promise<void> {
  if (image.complete) return;
  await new Promise<void>((resolve) => {
    const done = (): void => {
      resolve();
    };
    image.addEventListener('load', done, { once: true });
    image.addEventListener('error', done, { once: true });
  });
}

/** Resolves after `ms`, however the posters are doing. */
async function delay(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    window.setTimeout(() => {
      resolve();
    }, ms);
  });
}

function textLine(className: string, text: string): HTMLParagraphElement {
  const line = document.createElement('p');
  line.className = className;
  line.textContent = text;
  return line;
}

function buildCard(entry: ModelEntry): Card {
  // The whole card is the link. The `Open` row is a span, not a nested anchor,
  // because an anchor inside an anchor is invalid and unreachable by keyboard.
  const link = document.createElement('a');
  link.className = 'card';
  link.href = entry.href;
  link.setAttribute('aria-label', `${entry.title} \u2014 open the model viewer`);
  link.style.setProperty('--accent', entry.accent);

  const poster = document.createElement('img');
  poster.className = 'card-poster';
  poster.src = entry.poster;
  poster.alt = `${entry.title}, rendered live in three.js`;
  poster.decoding = 'async';

  const title = document.createElement('h2');
  title.className = 'card-title';
  title.textContent = entry.title;

  const swatch = document.createElement('span');
  swatch.className = 'card-swatch';

  const open = document.createElement('span');
  open.className = 'card-open';
  open.textContent = 'Open \u2192';

  const foot = document.createElement('div');
  foot.className = 'card-foot';
  foot.append(swatch, open);

  const body = document.createElement('div');
  body.className = 'card-body';
  body.append(title, textLine('card-subtitle', entry.subtitle), textLine('card-desc', entry.description), foot);

  link.append(poster, body);
  return { link, poster };
}

/** Waits for the posters, then opens the screenshot gate. */
async function markShotReady(images: readonly HTMLImageElement[]): Promise<void> {
  await Promise.race([Promise.all(images.map((image) => settled(image))), delay(POSTER_TIMEOUT_MS)]);
  window.__shotReady = true;
}

export function startIndex(): void {
  const app = document.getElementById('app');
  if (app === null) throw new Error('#app is missing');

  const heading = document.createElement('h1');
  heading.className = 'page-title';
  heading.textContent = '3d-maker';

  const header = document.createElement('header');
  header.className = 'page-header';
  header.append(heading, textLine('page-subtitle', 'Procedural models, rendered live in three.js'));

  const grid = document.createElement('div');
  grid.className = 'grid';

  const images: HTMLImageElement[] = [];
  for (const entry of MODELS) {
    const card = buildCard(entry);
    images.push(card.poster);
    grid.append(card.link);
  }
  if (MODELS.length === 0) grid.append(textLine('empty', 'No models yet.'));

  const footer = document.createElement('footer');
  footer.className = 'page-footer';
  footer.textContent = 'Deployed from github.com/yanfengliu/3d-maker \u00B7 built by vite';

  app.append(header, grid, footer);
  document.documentElement.classList.toggle('shot', shotMode);
  // The gate opens in the background: the page is interactive before the
  // posters land, and a capture only needs the flag, never the images to be
  // good — a poster that 404s still opens the gate, which is the point.
  void markShotReady(images);
}

startIndex();
