import { el, escapeHtml } from './dom';
import { icon } from './icons';
import type { Recipe } from '../data/recipe';
import type { ImportEdits } from '../imports';
export const paints = [
  ['Signal yellow', '#efb634'],
  ['Terracotta', '#cb714d'],
  ['Sage', '#8c9e83'],
  ['Glacier', '#839eae'],
  ['Chalk', '#e8e4cf'],
  ['Graphite', '#373c3b'],
] as const;
function slider(id: string, label: string, value: number) {
  return `<label class="rangelabel" for="${id}"><span>${label}</span><output id="${id}Value">${value.toFixed(2)}×</output></label><input class="slider" id="${id}" aria-label="${label}" type="range" min="0.65" max="1.5" step=".01" value="${String(value)}"/>`;
}
export function paintSlider(input: HTMLInputElement) {
  input.style.setProperty(
    '--pct',
    `${String(((Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min))) * 100)}%`,
  );
}
export interface Editable {
  name: string;
  primary: string;
  accent?: string;
  scale: number;
  proportion: number;
  detail?: boolean;
  quality?: 'standard' | 'hd';
}
export function showProperties(
  value: Editable,
  category: string,
  changed: (patch: Partial<Recipe & ImportEdits>) => void,
) {
  const isLocal = value.accent !== undefined;
  el('inspectorBody').innerHTML =
    `<div class="propgroup identity"><label class="micro" for="assetName">ASSET NAME</label><input class="namefield" id="assetName" value="${escapeHtml(value.name)}" maxlength="80" required/><small>${icon(category === 'Character' ? 'person' : 'studio', 12)} ${escapeHtml(category)}</small></div>
  <div class="propgroup"><h3 class="micro">APPEARANCE</h3><label class="subrow" for="primaryColor"><span>${isLocal ? 'Body color' : 'Material tint'}</span><span class="hex" id="hex">${value.primary.toUpperCase()}</span></label><div class="paints">${paints.map(([label, color]) => `<button aria-label="${label}" aria-pressed="${String(value.primary.toLowerCase() === color)}" class="swatch" style="--swatch:${color}" data-paint="${color}" title="${label}"></button>`).join('')}<label class="custompaint" title="Custom color">${icon('plus', 14)}<input id="primaryColor" aria-label="Custom body color" type="color" value="${value.primary}"/></label></div>
  ${value.accent ? `<label class="accentrow" for="accent"><span>Accent color</span><span class="colorchip"><i style="background:${value.accent}"></i><span>${value.accent.toUpperCase()}</span>${icon('chevron', 12)}<input type="color" aria-label="Accent color" id="accent" value="${value.accent}"/></span></label>` : ''}</div>
  <div class="propgroup transforms"><h3 class="micro">GEOMETRY</h3>${slider('scale', 'Scale', value.scale)}${slider('proportion', isLocal ? 'Body width' : 'Height', value.proportion)}${isLocal ? `<label class="accentrow qualityrow" for="quality">Mesh quality<select id="quality"><option value="hd" ${value.quality === 'hd' ? 'selected' : ''}>HD</option><option value="standard" ${value.quality !== 'hd' ? 'selected' : ''}>Standard</option></select></label>` : ''}${value.detail !== undefined ? `<label class="detailrow"><span>Surface details</span><input id="detail" type="checkbox" role="switch" ${value.detail ? 'checked' : ''}/><i></i></label>` : ''}</div>`;
  el<HTMLInputElement>('assetName').onchange = (e) => {
    const input = e.currentTarget as HTMLInputElement;
    const name = input.value.trim() || value.name;
    input.value = name;
    changed({ name });
  };
  function colorChange(hex: string) {
    el('hex').textContent = hex.toUpperCase();
    el<HTMLInputElement>('primaryColor').value = hex;
    document.querySelectorAll<HTMLButtonElement>('[data-paint]').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.paint === hex));
    });
    changed(isLocal ? { primary: hex } : { tint: hex });
  }
  document.querySelectorAll<HTMLButtonElement>('[data-paint]').forEach(
    (b) =>
      (b.onclick = () => {
        colorChange(b.dataset.paint ?? value.primary);
      }),
  );
  el<HTMLInputElement>('primaryColor').oninput = (e) => {
    colorChange((e.currentTarget as HTMLInputElement).value);
  };
  if (value.accent)
    el<HTMLInputElement>('accent').oninput = (e) => {
      const hex = (e.currentTarget as HTMLInputElement).value;
      const chip = el('accent').parentElement;
      if (chip) {
        const swatch = chip.querySelector('i'),
          label = chip.querySelector('span');
        if (swatch) swatch.style.background = hex;
        if (label) label.textContent = hex.toUpperCase();
      }
      changed({ accent: hex });
    };
  for (const id of ['scale', 'proportion'] as const) {
    const input = el<HTMLInputElement>(id);
    paintSlider(input);
    input.oninput = () => {
      const v = Number(input.value);
      el(id + 'Value').textContent = v.toFixed(2) + '×';
      paintSlider(input);
      changed({ [id]: v });
    };
  }
  if (isLocal)
    el<HTMLSelectElement>('quality').onchange = (e) => {
      changed({ quality: (e.currentTarget as HTMLSelectElement).value === 'hd' ? 'hd' : 'standard' });
    };
  if (value.detail !== undefined)
    el<HTMLInputElement>('detail').onchange = (e) => {
      changed({ detail: (e.currentTarget as HTMLInputElement).checked });
    };
}
export function showAnimation(
  clips: { name: string; duration: number }[],
  index: number,
  playing: boolean,
  speed: number,
  select: (i: number) => void,
  toggle: () => boolean,
  seek: (n: number) => void,
  setSpeed: (n: number) => void,
) {
  const panel = el('inspectorBody');
  const canSearch = clips.length > 8;
  if (!clips.length) {
    panel.innerHTML = '<p class="empty-mini">This asset has no playable clips.</p>';
    return;
  }
  const rows = clips.map((clip, i) => `<button type="button" data-clip="${String(i)}" class="clip" aria-pressed="false">${icon('film', 15)}<span>${escapeHtml(clip.name)}</span><small>${clip.duration.toFixed(1)}s</small></button>`).join('');
  panel.innerHTML = `<section class="propgroup anim motion-picker"><h3 class="micro">ANIMATION CLIPS <span id="motionCount"></span></h3>
    ${canSearch ? '<input type="search" class="namefield" aria-label="Search animations" id="motionSearch" placeholder="Search animations…" autocomplete="off"/>' : ''}
    <div class="cliplist" id="clipList">${rows}<p id="noMotionMatches" hidden>No matching animations.</p></div></section>
    <section class="propgroup anim"><h3 class="micro">PLAYBACK</h3><strong id="motionName"></strong>
    <button class="btn" id="play"></button><label class="rangelabel" for="timeline">Timeline</label><input class="slider" aria-label="Animation timeline" id="timeline" type="range" min="0" max="1" step=".001" value="0"/>
    <label class="accentrow" for="speed">Speed<select id="speed">${[0.5, 1, 1.5, 2].map(n => `<option value="${String(n)}" ${n === speed ? 'selected' : ''}>${String(n)}×</option>`).join('')}</select></label></section>`;
  const buttons = [...el('clipList').querySelectorAll<HTMLButtonElement>('[data-clip]')];
  function currentClip(selected: number) {
    el('motionName').textContent = clips[selected]?.name ?? '';
    for (const [i, button] of buttons.entries()) {
      button.setAttribute('aria-pressed', String(i === selected));
      button.classList.toggle('selected', i === selected);
    }
  }
  function transport(on: boolean) {
    el('play').innerHTML = icon(on ? 'pause' : 'play', 15) + (on ? ' Pause' : ' Play clip');
  }
  currentClip(index);
  transport(playing);
  el('motionCount').textContent = String(clips.length);
  el('clipList').onclick = event => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-clip]') : null;
    if (!button) return;
    const next = Number(button.dataset.clip);
    select(next);
    currentClip(next);
  };
  if (canSearch) {
    const search = el<HTMLInputElement>('motionSearch');
    search.oninput = () => {
      const query = search.value.trim().toLowerCase();
      let matches = 0;
      for (const [i, button] of buttons.entries()) {
        button.hidden = !clips[i]?.name.toLowerCase().includes(query);
        if (!button.hidden) matches++;
      }
      el('noMotionMatches').hidden = matches > 0;
      el('motionCount').textContent = query ? String(matches) + ' / ' + String(clips.length) : String(clips.length);
      el('clipList').scrollTop = 0;
    };
  }
  el('play').onclick = () => { transport(toggle()); };
  el<HTMLInputElement>('timeline').oninput = e => { seek(Number((e.currentTarget as HTMLInputElement).value)); };
  el<HTMLSelectElement>('speed').onchange = e => { setSpeed(Number((e.currentTarget as HTMLSelectElement).value)); };
}
