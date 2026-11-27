import type { listPaintSlots } from '../imports';
import { el, escapeHtml } from './dom';
import { icon } from './icons';

export function showModelPaint(
  slots: ReturnType<typeof listPaintSlots>,
  initial: Record<string, string> | undefined,
  apply: (paint: Record<string, string>) => void,
  selectedId?: string,
) {
  if (!slots.length) return;
  const panel = el('modelPaint');
  panel.innerHTML = `<label class="property-label" for="paintSlot">Model colors</label>
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
  display();
}
