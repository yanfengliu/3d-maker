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
  changed: (patch: Partial<Recipe & ImportEdits>) => void,
) {
  const isLocal = value.accent !== undefined;
  el('propertiesBody').innerHTML =
    `<div class="propgroup identity"><label class="property-label" for="assetName">Name</label><input class="namefield" id="assetName" value="${escapeHtml(value.name)}" maxlength="80" required/></div>
  ${isLocal ? '' : '<div class="propgroup" id="modelPaint"></div>'}
  <div class="propgroup"><label class="subrow" for="primaryColor"><span>${isLocal ? 'Body color' : 'Overall tint'}</span><span class="hex" id="hex">${value.primary.toUpperCase()}</span></label><div class="paints">${paints.map(([label, color]) => `<button aria-label="${label}" aria-pressed="${String(value.primary.toLowerCase() === color)}" class="swatch" style="--swatch:${color}" data-paint="${color}" title="${label}"></button>`).join('')}<label class="custompaint" title="Custom color">${icon('plus', 14)}<input id="primaryColor" aria-label="${isLocal ? 'Custom body color' : 'Custom overall tint'}" type="color" value="${value.primary}"/></label></div>
  ${value.accent ? `<label class="accentrow" for="accent"><span>Accent color</span><span class="colorchip"><i style="background:${value.accent}"></i><span>${value.accent.toUpperCase()}</span>${icon('chevron', 12)}<input type="color" aria-label="Accent color" id="accent" value="${value.accent}"/></span></label>` : ''}</div>
  <div class="propgroup transforms">${slider('scale', 'Scale', value.scale)}${slider('proportion', isLocal ? 'Body width' : 'Height', value.proportion)}${isLocal ? `<label class="accentrow qualityrow" for="quality">Mesh quality<select id="quality"><option value="hd" ${value.quality === 'hd' ? 'selected' : ''}>HD</option><option value="standard" ${value.quality !== 'hd' ? 'selected' : ''}>Standard</option></select></label>` : ''}${value.detail !== undefined ? `<label class="detailrow"><span>Surface details</span><input id="detail" type="checkbox" role="switch" ${value.detail ? 'checked' : ''}/><i></i></label>` : ''}</div>`;
  el<HTMLInputElement>('assetName').onchange = (e) => {
    const input = e.currentTarget as HTMLInputElement;
    const name = input.value.trim() || input.defaultValue;
    input.value = name;
    input.defaultValue = name;
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
export function showPlayback(on: boolean) {
  const button = document.getElementById('play');
  if (button) button.innerHTML = icon(on ? 'pause' : 'play', 15) + (on ? ' Pause' : ' Play clip') + '<kbd aria-hidden="true">Space</kbd>';
}
export function showAnimation(
  clips: { name: string; duration: number }[],
  index: number,
  playing: boolean,
  speed: number,
  playAll: boolean,
  cycle: (on: boolean) => boolean,
  select: (i: number) => void,
  seek: (n: number) => void,
  setSpeed: (n: number) => void,
) {
  const panel = el('animationBody');
  const canSearch = clips.length > 8;
  const clear = el<HTMLButtonElement>('clearMotionSearch');
  clear.hidden = true;
  clear.onclick = null;
  if (!clips.length) {
    el('motionCount').textContent = '0 clips';
    panel.innerHTML = '<p class="empty-mini">No playable clips for this model.</p>';
    return undefined;
  }
  const rows = clips.map((clip, i) => `<button type="button" data-clip="${String(i)}" class="clip" aria-pressed="false">${icon('film', 15)}<span>${escapeHtml(clip.name)}</span><small>${clip.duration.toFixed(1)}s</small></button>`).join('');
  panel.innerHTML = `<div class="motion-picker">
    ${canSearch ? '<input type="search" class="namefield" aria-label="Search animations" id="motionSearch" placeholder="Search animations…" autocomplete="off"/>' : ''}
    <div class="cliplist" id="clipList">${rows}<p id="noMotionMatches" hidden>No matching animations.</p></div></div>
    <div class="motion-settings"><div class="motion-status"><strong id="motionName"></strong><select id="speed" aria-label="Playback speed">${[0.5, 1, 1.5, 2].map(n => `<option value="${String(n)}" ${n === speed ? 'selected' : ''}>${String(n)}×</option>`).join('')}</select></div>
    <input class="slider" aria-label="Animation timeline" id="timeline" type="range" min="0" max="1" step=".001" value="0"/>
    ${clips.length > 1 ? `<label class="play-sequence"><input id="playAllClips" type="checkbox" ${playAll ? 'checked' : ''}/> Play all clips</label>` : ''}</div>`;
  const buttons = [...el('clipList').querySelectorAll<HTMLButtonElement>('[data-clip]')];
  function currentClip(selected: number) {
    el('motionName').textContent = clips[selected]?.name ?? '';
    for (const [i, button] of buttons.entries()) {
      button.setAttribute('aria-pressed', String(i === selected));
      button.classList.toggle('selected', i === selected);
    }
  }
  currentClip(index);
  showPlayback(playing);
  el('motionCount').textContent = String(clips.length) + (clips.length === 1 ? ' clip' : ' clips');
  el('clipList').onclick = event => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-clip]') : null;
    if (!button) return;
    const next = Number(button.dataset.clip);
    select(next);
    currentClip(next);
    showPlayback(true);
  };
  if (canSearch) {
    const search = el<HTMLInputElement>('motionSearch');
    const filterMotions = () => {
      const query = search.value.trim().toLowerCase();
      let matches = 0;
      for (const [i, button] of buttons.entries()) {
        button.hidden = !clips[i]?.name.toLowerCase().includes(query);
        if (!button.hidden) matches++;
      }
      el('noMotionMatches').hidden = matches > 0;
      el('motionCount').textContent = (query ? String(matches) + ' of ' : '') + String(clips.length) + ' clips';
      clear.hidden = !query;
      el('clipList').scrollTop = 0;
    };
    search.oninput = filterMotions;
    clear.setAttribute('aria-label', 'Show all ' + String(clips.length) + ' animations');
    clear.onclick = () => {
      search.value = '';
      filterMotions();
      search.focus();
    };
  }
  const sequence = panel.querySelector<HTMLInputElement>('#playAllClips');
  if (sequence) sequence.onchange = () => { showPlayback(cycle(sequence.checked)); };
  el<HTMLInputElement>('timeline').oninput = e => { seek(Number((e.currentTarget as HTMLInputElement).value)); };
  el<HTMLSelectElement>('speed').onchange = e => { setSpeed(Number((e.currentTarget as HTMLSelectElement).value)); };
  return currentClip;
}
