import { resolveModelParams, type ModelParamSpec, type ModelParamValues } from '../capabilities/param-schema';
import { escapeHtml } from './dom';
import { paintSlider } from './inspector';

function formatRangeValue(value: number, step: number | undefined, unit: string | undefined): string {
  const decimals = step !== undefined && step < 1 ? (step < 0.1 ? 2 : 1) : 0;
  const formatted = value.toFixed(decimals);
  return unit ? `${formatted}${unit}` : formatted;
}

/** Render model-specific semantic structural knobs (range, toggle, choice) inside `#modelParams`. */
export function showModelParams(
  specs: readonly ModelParamSpec[] | undefined,
  current: ModelParamValues | undefined,
  onChange: (next: ModelParamValues) => void,
): void {
  const host = document.getElementById('modelParams');
  if (!host) return;
  if (!specs || !specs.length) {
    host.innerHTML = '';
    return;
  }

  const resolved = resolveModelParams(specs, current);
  const rows = specs.map(spec => {
    const id = `param-${escapeHtml(spec.name)}`;
    const title = spec.describe ? ` title="${escapeHtml(spec.describe)}"` : '';
    if (spec.type === 'range') {
      const val = Number(resolved[spec.name] ?? spec.default);
      const step = spec.step ?? 1;
      return `<div class="param-row"${title}><label class="rangelabel" for="${id}"><span>${escapeHtml(spec.label)}</span><output id="${id}Value">${escapeHtml(formatRangeValue(val, spec.step, spec.unit))}</output></label>
        <input class="slider" id="${id}" data-param-range="${escapeHtml(spec.name)}" aria-label="${escapeHtml(spec.label)}" type="range" min="${String(spec.min)}" max="${String(spec.max)}" step="${String(step)}" value="${String(val)}"/></div>`;
    }
    if (spec.type === 'toggle') {
      const checked = resolved[spec.name] === true ? 'checked' : '';
      return `<label class="detailrow param-toggle"${title}><span>${escapeHtml(spec.label)}</span><input id="${id}" data-param-toggle="${escapeHtml(spec.name)}" type="checkbox" role="switch" ${checked}/><i></i></label>`;
    }
    const selected = String(resolved[spec.name] ?? spec.default);
    const options = spec.options
      .map(opt => `<option value="${escapeHtml(opt.value)}" ${opt.value === selected ? 'selected' : ''}>${escapeHtml(opt.label)}</option>`)
      .join('');
    return `<label class="accentrow param-choice"${title} for="${id}"><span>${escapeHtml(spec.label)}</span><select id="${id}" data-param-choice="${escapeHtml(spec.name)}">${options}</select></label>`;
  }).join('');

  host.innerHTML = `<label class="property-label">Model parameters</label><div class="param-list">${rows}</div>`;

  const emit = (name: string, value: number | boolean | string) => {
    resolved[name] = value;
    onChange({ ...resolved });
  };

  for (const input of host.querySelectorAll<HTMLInputElement>('[data-param-range]')) {
    paintSlider(input);
    input.oninput = () => {
      const name = input.dataset.paramRange;
      if (!name) return;
      const spec = specs.find((s): s is Extract<ModelParamSpec, { type: 'range' }> => s.name === name && s.type === 'range');
      if (!spec) return;
      const val = Number(input.value);
      const out = document.getElementById(`param-${name}Value`);
      if (out) out.textContent = formatRangeValue(val, spec.step, spec.unit);
      paintSlider(input);
      emit(name, val);
    };
  }

  for (const input of host.querySelectorAll<HTMLInputElement>('[data-param-toggle]')) {
    input.onchange = () => {
      const name = input.dataset.paramToggle;
      if (name) emit(name, input.checked);
    };
  }

  for (const select of host.querySelectorAll<HTMLSelectElement>('[data-param-choice]')) {
    select.onchange = () => {
      const name = select.dataset.paramChoice;
      if (name) emit(name, select.value);
    };
  }
}
