import { COLORWAYS, type ColorKey } from './materials.js';
import type { ViewKey } from './views.js';

/**
 * The overlay card: title, colour dropdown, and a readout of the current
 * camera view. Plain DOM, because a native `<select>` is the one control that
 * is keyboard-, touch- and screenshot-reliable.
 */

export interface ViewerUi {
  setColor(key: ColorKey): void;
  setView(view: ViewKey): void;
  dispose(): void;
}

const SWATCH: Record<ColorKey, string> = {
  'cosmic-orange': '#c75b39',
  'deep-blue': '#3a4356',
  silver: '#d7d8da',
};

const PANEL_STYLE = [
  'min-width:266px',
  'padding:18px 20px 16px',
  'border-radius:18px',
  'border:1px solid rgba(255,255,255,0.09)',
  'background:linear-gradient(160deg, rgba(24,26,32,0.86), rgba(12,13,17,0.78))',
  'backdrop-filter:blur(18px) saturate(140%)',
  '-webkit-backdrop-filter:blur(18px) saturate(140%)',
  'box-shadow:0 18px 40px rgba(0,0,0,0.45)',
  'font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif',
  'color:#f2f3f5',
  'user-select:none',
].join(';');

const ARROW =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M1 1.5 6 6.5 11 1.5' fill='none' stroke='%23c9ccd4' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/></svg>\")";

const SELECT_STYLE = [
  'appearance:none',
  'width:100%',
  'margin-top:9px',
  'padding:10px 38px 10px 14px',
  'border-radius:11px',
  'border:1px solid rgba(255,255,255,0.14)',
  'background-color:rgba(255,255,255,0.07)',
  `background-image:${ARROW}`,
  'background-repeat:no-repeat',
  'background-position:right 14px center',
  'color:#f5f6f8',
  'font-size:14px',
  'font-weight:500',
  'letter-spacing:0.01em',
  'cursor:pointer',
  'outline:none',
].join(';');

/** A native option cannot render a styled swatch, so the dot is a glyph in
 *  the label and the true colour is echoed by the dots under the select. */
function optionLabel(key: ColorKey): string {
  return `\u25CF  ${COLORWAYS[key].label}`;
}

export function createUi(
  host: HTMLElement,
  initialColor: ColorKey,
  initialView: ViewKey,
  onColor: (key: ColorKey) => void,
): ViewerUi {
  const panel = document.createElement('div');
  panel.id = 'iphone-panel';
  panel.style.cssText = PANEL_STYLE;

  const title = document.createElement('div');
  title.textContent = 'iPhone 17 Pro';
  title.style.cssText = 'font-size:20px;font-weight:600;letter-spacing:-0.01em';

  const subtitle = document.createElement('div');
  subtitle.textContent = '6.3-inch \u00B7 150.0 \u00D7 71.9 \u00D7 8.75 mm';
  subtitle.style.cssText = 'margin-top:5px;font-size:11.5px;color:#9aa0ac;letter-spacing:0.02em';

  const label = document.createElement('label');
  label.textContent = 'Finish';
  label.setAttribute('for', 'iphone-color');
  label.style.cssText =
    'display:block;margin-top:16px;font-size:10.5px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#8b919d';

  const select = document.createElement('select');
  select.id = 'iphone-color';
  select.style.cssText = SELECT_STYLE;
  const keys = Object.keys(COLORWAYS) as ColorKey[];
  for (const key of keys) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = optionLabel(key);
    option.style.color = SWATCH[key];
    select.append(option);
  }

  const swatches = document.createElement('div');
  swatches.style.cssText = 'display:flex;gap:6px;margin-top:10px';
  const dots = new Map<ColorKey, HTMLSpanElement>();
  for (const key of keys) {
    const dot = document.createElement('span');
    dot.style.cssText = `width:9px;height:9px;border-radius:50%;background:${SWATCH[key]}`;
    dots.set(key, dot);
    swatches.append(dot);
  }

  const viewLine = document.createElement('div');
  viewLine.style.cssText = 'margin-top:14px;font-size:11px;color:#8b919d;letter-spacing:0.02em';

  const footer = document.createElement('div');
  footer.textContent = 'Procedurally modeled in three.js';
  footer.style.cssText =
    'margin-top:16px;padding-top:13px;border-top:1px solid rgba(255,255,255,0.08);font-size:10.5px;color:#767c88;letter-spacing:0.02em';

  label.append(select);
  panel.append(title, subtitle, label, swatches, viewLine, footer);
  host.append(panel);

  let color = initialColor;
  let view = initialView;

  const sync = (): void => {
    select.value = color;
    // The label stays light on purpose: tinting it with the swatch colour makes
    // Deep Blue unreadable against the dark card. The colour is carried by the
    // ring around the control and by the dots below it instead.
    select.style.boxShadow = `inset 0 0 0 1px ${SWATCH[color]}55`;
    viewLine.textContent = `View \u00B7 ${view.replace('-', ' ')}`;
    for (const [key, dot] of dots) {
      dot.style.boxShadow =
        key === color ? '0 0 0 2px rgba(255,255,255,0.85)' : '0 0 0 1px rgba(255,255,255,0.18)';
    }
  };

  const onChange = (): void => {
    const key = select.value as ColorKey;
    if (!(key in COLORWAYS)) return;
    color = key;
    sync();
    onColor(key);
  };
  select.addEventListener('change', onChange);
  sync();

  return {
    setColor: (next: ColorKey) => {
      color = next;
      sync();
    },
    setView: (next: ViewKey) => {
      view = next;
      sync();
    },
    dispose: () => {
      select.removeEventListener('change', onChange);
      panel.remove();
    },
  };
}
