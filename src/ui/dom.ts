// DOM IDs in the static layout identify their concrete element type at each caller.
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing element ${id}`);
  return found as T;
}
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char] ?? char);
}
let timer = 0;
export function notify(message: string) {
  const toast = el('toast');
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => { toast.hidden = true; }, 3800);
}
export function report(error: unknown) {
  notify(error instanceof Error ? error.message : 'The operation could not be completed.');
}
