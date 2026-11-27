import type { ColorwayPresetSpec } from '../capabilities/schema';
import type { listPaintSlots } from '../imports';
import { el, escapeHtml } from './dom';
import { icon } from './icons';

export function showModelPaint(
  slots: ReturnType<typeof listPaintSlots>,
  initial: Record<string, string> | undefined,
  apply: (paint: Record<string, string>) => void,
  selectedId?: string,
  presets?: readonly ColorwayPresetSpec[],
  applyPreset?: (preset: ColorwayPresetSpec) => void,
) {
  if (!slots.length) return;
  const panel = el('modelPaint');
  const presetMarkup = presets?.length
    ? `<label class="property-label">Colorways</label><div class="preset-strip">${presets.map(preset => {
        const dot = Object.values(preset.colors)[0] ?? '#888888';
        return `<button type="button" class="preset-chip" data-colorway="${escapeHtml(preset.name)}" aria-pressed="false"><i class="preset-dot" style="background:${escapeHtml(dot)}"></i>${escapeHtml(preset.label)}</button>`;
      }).join('')}</div>`
    : '';
  panel.innerHTML = `${presetMarkup}<label class="property-label" for="paintSlot">Model colors</label>
    <div class="paint-editor"><select id="paintSlot" aria-label="Choose a model color">${slots.map(slot =>
      `<option value="${escapeHtml(slot.id)}">${escapeHtml(slot.label)}</option>`).join('')}</select>
    <input id="slotColor" type="color" aria-label="Selected model color"/>
    <button type="button" class="square" id="resetSlot" aria-label="Restore selected color" title="Restore selected color">${icon('reset', 14)}</button></div>`;
  const selector = el<HTMLSelectElement>('paintSlot');
  if (selectedId && slots.some(slot => slot.id === selectedId)) selector.value = selectedId;
  const color = el<HTMLInputElement>('slotColor');
  const reset = el<HTMLButtonElement>('resetSlot');
  const paint = new Map(Object.entries(initial ?? {}));
  function display() {
    const slot = slots[selector.selectedIndex];
    if (!slot) return;
    color.value = paint.get(slot.id) ?? slot.originalColor;
    reset.disabled = !paint.has(slot.id);
    if (presets?.length) {
      for (const chip of panel.querySelectorAll<HTMLButtonElement>('[data-colorway]')) {
        const preset = presets.find(p => p.name === chip.dataset.colorway);
        if (!preset) continue;
        const active = Object.entries(preset.colors).every(([zone, hex]) => {
          const match = slots.find(s => s.id === 'zone-' + zone);
          return match ? (paint.get(match.id) ?? match.originalColor).toLowerCase() === hex.toLowerCase() : false;
        });
        chip.setAttribute('aria-pressed', String(active));
      }
    }
  }
  function change(value?: string) {
    const slot = slots[selector.selectedIndex];
    if (!slot) return;
    if (value && value !== slot.originalColor) paint.set(slot.id, value);
    else paint.delete(slot.id);
    apply(Object.fromEntries(paint));
    display();
  }
  selector.onchange = display;
  color.oninput = () => { change(color.value); };
  reset.onclick = () => { change(); };
  if (presets?.length && applyPreset) {
    for (const chip of panel.querySelectorAll<HTMLButtonElement>('[data-colorway]')) {
      chip.onclick = () => {
        const preset = presets.find(p => p.name === chip.dataset.colorway);
        if (preset) applyPreset(preset);
      };
    }
  }
  display();
}
