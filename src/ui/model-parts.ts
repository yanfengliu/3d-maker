import { farRangeEnd } from '../capabilities/runtime';
import type { AssetCapabilities, DecalSlotSpec, DetachablePartSpec, RiggedPartSpec } from '../capabilities/schema';
import { el, escapeHtml } from './dom';
import { paintSlider } from './inspector';

export interface RigControlActions {
  getValue: (name: string) => number;
  setValue: (name: string, value: number) => void;
  toggle: (name: string) => number;
  resetAll: () => void;
  onAnimateFrame: () => void;
}

export interface PartPropertiesActions {
  isVisible: (name: string) => boolean;
  setVisible: (name: string, visible: boolean) => void;
  decalText: Record<string, string>;
  setDecalText: (name: string, text: string) => void;
}

let activeAnimFrame = 0;
let activeAnimPart = '';

export function stopPartPreviewAnimation(): void {
  if (activeAnimFrame) cancelAnimationFrame(activeAnimFrame);
  activeAnimFrame = 0;
  activeAnimPart = '';
  if (typeof document !== 'undefined') {
    for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-part-play][aria-pressed="true"]')) {
      btn.setAttribute('aria-pressed', 'false');
      btn.textContent = 'Test';
    }
  }
}

function formatPartValue(part: RiggedPartSpec, value: number): string {
  return part.type === 'slide' ? `${value.toFixed(2)} m` : `${String(Math.round(value))}°`;
}

function toggleLabel(part: RiggedPartSpec, value: number): string {
  const far = farRangeEnd(part.range);
  const open = Math.abs(value) > Math.abs(far) * 0.25;
  const doorLike = /door|gate|lid|hatch|window|drawer/i.test(part.name + ' ' + (part.describe ?? ''));
  if (doorLike) return open ? 'Close' : 'Open';
  return open ? 'Reset' : 'Pose';
}

function rigRowsMarkup(parts: readonly RiggedPartSpec[], getValue: (name: string) => number): string {
  return parts.map(part => {
    const min = Math.min(part.range[0], part.range[1]);
    const max = Math.max(part.range[0], part.range[1]);
    const step = part.type === 'slide' ? Math.max(0.01, (max - min) / 100) : 1;
    const value = getValue(part.name);
    const id = escapeHtml(part.name);
    const desc = part.describe ? `<p class="rig-desc">${escapeHtml(part.describe)}</p>` : '';
    return `<div class="rig-part" data-rig-part="${id}">
      <div class="rig-part-head"><strong>${escapeHtml(part.label)}</strong>
      <div class="rig-part-actions"><output data-part-out="${id}">${formatPartValue(part, value)}</output>
      <button type="button" class="rig-btn" data-part-toggle="${id}">${toggleLabel(part, value)}</button>
      <button type="button" class="rig-btn" data-part-play="${id}" aria-pressed="false" title="Animate ${escapeHtml(part.label)}">Test</button></div></div>
      <input type="range" class="slider" data-part-slider="${id}" aria-label="${escapeHtml(part.label)}" min="${String(min)}" max="${String(max)}" step="${String(step)}" value="${String(value)}"/>
      ${desc}</div>`;
  }).join('');
}

function wireRigControls(container: HTMLElement, parts: readonly RiggedPartSpec[], actions: RigControlActions) {
  const byName = new Map(parts.map(p => [p.name, p]));

  function refreshRow(name: string) {
    const part = byName.get(name);
    if (!part) return;
    const value = actions.getValue(name);
    const row = container.querySelector<HTMLElement>(`[data-rig-part="${CSS.escape(name)}"]`);
    if (!row) return;
    const slider = row.querySelector<HTMLInputElement>('[data-part-slider]');
    const out = row.querySelector<HTMLOutputElement>('[data-part-out]');
    const toggleBtn = row.querySelector<HTMLButtonElement>('[data-part-toggle]');
    const playBtn = row.querySelector<HTMLButtonElement>('[data-part-play]');
    if (slider) {
      slider.value = String(value);
      paintSlider(slider);
    }
    if (out) out.textContent = formatPartValue(part, value);
    if (toggleBtn) toggleBtn.textContent = toggleLabel(part, value);
    if (playBtn) {
      const active = activeAnimPart === name;
      playBtn.setAttribute('aria-pressed', String(active));
      playBtn.textContent = active ? 'Stop' : 'Test';
    }
  }

  function refreshAll() {
    for (const part of parts) refreshRow(part.name);
    const resetBtn = container.querySelector<HTMLButtonElement>('#resetRigParts');
    if (resetBtn) resetBtn.disabled = parts.every(part => Math.abs(actions.getValue(part.name)) <= 1e-4);
  }

  function startLoop(name: string) {
    const part = byName.get(name);
    if (!part) return;
    if (activeAnimPart === name) {
      stopPartPreviewAnimation();
      refreshAll();
      return;
    }
    stopPartPreviewAnimation();
    activeAnimPart = name;
    const far = farRangeEnd(part.range);
    const start = performance.now();
    const tick = (now: number) => {
      if (activeAnimPart !== name) return;
      const phase = ((now - start) / 2400) % 1;
      const wave = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2);
      actions.setValue(name, far * wave);
      refreshRow(name);
      actions.onAnimateFrame();
      activeAnimFrame = requestAnimationFrame(tick);
    };
    refreshAll();
    activeAnimFrame = requestAnimationFrame(tick);
  }

  for (const slider of container.querySelectorAll<HTMLInputElement>('[data-part-slider]')) {
    paintSlider(slider);
    slider.oninput = () => {
      const name = slider.dataset.partSlider;
      if (!name) return;
      stopPartPreviewAnimation();
      actions.setValue(name, Number(slider.value));
      refreshAll();
    };
  }
  container.onclick = event => {
    const btn = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button') : null;
    if (!btn) return;
    if (btn.id === 'resetRigParts') {
      stopPartPreviewAnimation();
      actions.resetAll();
      refreshAll();
      return;
    }
    if (btn.dataset.partToggle) {
      stopPartPreviewAnimation();
      actions.toggle(btn.dataset.partToggle);
      refreshAll();
      return;
    }
    if (btn.dataset.partPlay) {
      startLoop(btn.dataset.partPlay);
    }
  };
  refreshAll();
  return refreshAll;
}

/** Render interactive rigged-part controls in the Animation column (primary when 0 clips, drawer when clips exist). */
export function showRiggedParts(
  parts: readonly RiggedPartSpec[],
  hasClips: boolean,
  actions: RigControlActions,
): (() => void) | undefined {
  stopPartPreviewAnimation();
  if (!parts.length) return undefined;
  const panel = el('animationBody');
  const rows = rigRowsMarkup(parts, actions.getValue);
  if (!hasClips) {
    el('motionCount').textContent = String(parts.length) + (parts.length === 1 ? ' interactive part' : ' interactive parts');
    panel.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'rig-parts-wrap';
    wrap.innerHTML = `<div class="rig-parts" id="rigPartsList">${rows}</div>
      <div class="rig-footer"><button type="button" class="rig-btn" id="resetRigParts">Reset parts</button></div>`;
    panel.append(wrap);
    return wireRigControls(wrap, parts, actions);
  }
  const drawer = document.createElement('details');
  drawer.className = 'parts-drawer';
  drawer.innerHTML = `<summary><span>Interactive parts (${String(parts.length)})</span><span>▾</span></summary>
    <div class="rig-parts" id="rigPartsList">${rows}</div>
    <div class="rig-footer"><button type="button" class="rig-btn" id="resetRigParts">Reset parts</button></div>`;
  panel.append(drawer);
  return wireRigControls(drawer, parts, actions);
}

/** Render detachable part visibility checkboxes and declared decal preview inputs inside Properties. */
export function showModelPartsProperties(
  capabilities: AssetCapabilities,
  actions: PartPropertiesActions,
): void {
  const host = document.getElementById('modelParts');
  if (!host) return;
  const detach: readonly DetachablePartSpec[] = capabilities.detachableParts;
  const decals: readonly DecalSlotSpec[] = capabilities.decals;
  if (!detach.length && !decals.length) {
    host.innerHTML = '';
    return;
  }
  const detachMarkup = detach.length
    ? `<label class="property-label">Detachable parts</label><div class="part-checks">${detach.map(part => {
        const checked = actions.isVisible(part.name) ? 'checked' : '';
        const title = part.describe ? ` title="${escapeHtml(part.describe)}"` : '';
        return `<label class="part-check"${title}><input type="checkbox" data-detach-part="${escapeHtml(part.name)}" ${checked}/><span>${escapeHtml(part.label)}</span></label>`;
      }).join('')}</div>`
    : '';
  const decalMarkup = decals.length
    ? `<label class="property-label"${detach.length ? ' style="margin-top:9px;display:block"' : ''}>Decal areas</label><div class="decal-list">${decals.map(slot => {
        const dims = `${slot.size[0].toFixed(2)} × ${slot.size[1].toFixed(2)} m`;
        const val = escapeHtml(actions.decalText[slot.name] ?? '');
        const title = slot.describe ? ` title="${escapeHtml(slot.describe)}"` : '';
        return `<div class="decal-row"${title}><div class="decal-meta"><strong>${escapeHtml(slot.name)}</strong><span>${dims}</span></div>
          <input type="text" class="namefield" data-decal-input="${escapeHtml(slot.name)}" maxlength="60" placeholder="Preview text on ${escapeHtml(slot.name)}…" value="${val}"/></div>`;
      }).join('')}</div>`
    : '';
  host.innerHTML = detachMarkup + decalMarkup;
  for (const input of host.querySelectorAll<HTMLInputElement>('[data-detach-part]')) {
    input.onchange = () => {
      const name = input.dataset.detachPart;
      if (name) actions.setVisible(name, input.checked);
    };
  }
  for (const input of host.querySelectorAll<HTMLInputElement>('[data-decal-input]')) {
    input.oninput = () => {
      const name = input.dataset.decalInput;
      if (name) actions.setDecalText(name, input.value);
    };
  }
}
