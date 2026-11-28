import type { AssetCapabilities } from '../capabilities/schema';
import { editWithPrompt, getPromptAvailability, preparePromptModel } from '../data/assistant';
import { parseRecipe, type Recipe } from '../data/recipe';
import { editImportWithPrompt, parseImportedSettings, type SlotName } from '../data/import-prompt';
import type { ImportEdits } from '../imports';
import type { ExportOptions } from '../studio/export';
import { el, escapeHtml, notify, report } from './dom';
import { icon } from './icons';
import { stopPartPreviewAnimation } from './model-parts';
import './dialogs.css';

interface DialogActions {
  recipe: () => Recipe | null;
  apply: (recipe: Recipe) => Promise<void> | void;
  importEdits: () => ImportEdits | null;
  applyImportEdits: (edits: ImportEdits) => void;
  paintSlots: () => SlotName[];
  capabilities: () => AssetCapabilities | null;
  hasClips: () => boolean;
  selectionKey: () => object;
  openLocal: (file: File, signal?: AbortSignal) => Promise<void>;
  exportGlb: (options?: ExportOptions) => Promise<void>;
}

const message = (error: unknown) => error instanceof Error ? error.message : 'The operation could not be completed.';
const button = (id: string) => el<HTMLButtonElement>(id);
const statusLine = '<div id="dialogStatus" class="dialogstatus" role="status" aria-live="polite"></div>';

function downloadRecipe(recipe: Recipe) {
  const blob = new Blob([JSON.stringify(recipe, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = (recipe.name.replace(/[^a-z\d]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || recipe.template) + '.json';
  link.click();
  window.setTimeout(() => { URL.revokeObjectURL(url); }, 1000);
}

function capabilityReferenceMarkup(slots: SlotName[], caps: AssetCapabilities | null): string {
  const sections: string[] = [];
  if (slots.length) {
    sections.push(`<details class="dialogcopy"><summary>Model color names and IDs</summary><ul>${slots.map(slot =>
      `<li>${escapeHtml(slot.label)} · <code>${escapeHtml(slot.id)}</code></li>`).join('')}</ul></details>`);
  }
  if (caps && (caps.riggedParts.length || caps.detachableParts.length || caps.presets?.length || caps.nightZones.length || caps.decals.length)) {
    const items: string[] = [];
    for (const part of caps.riggedParts) {
      const unit = part.type === 'slide' ? 'm' : '°';
      items.push(`<li>Rigged: <strong>${escapeHtml(part.label)}</strong> · <code>${escapeHtml(part.name)}</code> (${String(part.range[0])}${unit} to ${String(part.range[1])}${unit})${part.describe ? ' — ' + escapeHtml(part.describe) : ''}</li>`);
    }
    for (const part of caps.detachableParts) {
      items.push(`<li>Detachable: <strong>${escapeHtml(part.label)}</strong> · <code>${escapeHtml(part.name)}</code></li>`);
    }
    if (caps.presets?.length) {
      items.push(`<li>Colorways: ${caps.presets.map(p => `<code>${escapeHtml(p.name)}</code>`).join(', ')}</li>`);
    }
    if (caps.nightZones.length) {
      items.push(`<li>Night lighting: ${caps.nightZones.map(z => escapeHtml(z.label)).join(', ')}</li>`);
    }
    for (const slot of caps.decals) {
      items.push(`<li>Decal area: <code>${escapeHtml(slot.name)}</code> (${slot.size[0].toFixed(2)} × ${slot.size[1].toFixed(2)} m)</li>`);
    }
    sections.push(`<details class="dialogcopy"><summary>Interactive parts and model capabilities</summary><ul>${items.join('')}</ul></details>`);
  }
  return sections.join('');
}

export function setupDialogs(actions: DialogActions) {
  const dialog = el<HTMLDialogElement>('dialog');
  const body = el('dialogBody');
  dialog.setAttribute('aria-labelledby', 'dialogTitle');
  let lifecycle = new AbortController();

  const close = () => { lifecycle.abort(); dialog.close(); };
  button('closeDialog').onclick = close;
  dialog.addEventListener('cancel', () => { lifecycle.abort(); });
  dialog.addEventListener('close', () => { if (!dialog.open) lifecycle.abort(); });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
  });

  function open(title: string, html: string) {
    stopPartPreviewAnimation();
    lifecycle.abort();
    lifecycle = new AbortController();
    el('dialogTitle').textContent = title;
    body.innerHTML = html;
    if (!dialog.open) dialog.showModal();
    body.parentElement?.scrollTo(0, 0);
    return lifecycle.signal;
  }

  function status(text: string) {
    el('dialogStatus').textContent = text;
  }

  async function complete(signal: AbortSignal, work: () => Promise<void>, pending: string, finished?: string) {
    status(pending);
    const controls = [...body.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
    controls.forEach(control => { control.disabled = true; });
    try {
      await work();
      if (signal.aborted) return;
      close();
      if (finished) notify(finished);
    } catch (error) {
      if (!signal.aborted) status(message(error));
    } finally {
      controls.forEach(control => { control.disabled = false; });
    }
  }

  function imports() {
    const signal = open('Import asset', `<div class="dialogstack">
      <div class="dropzone" id="dropzone">${icon('upload', 28)}<strong>Drop an asset here</strong><p class="dialogcopy">Three.js-compatible GLB or a Form Foundry recipe (.json).</p>
      <button class="btn dark" id="chooseFile">Choose file</button><input id="assetFile" type="file" accept=".glb,.json" hidden /></div>${statusLine}</div>`);
    const fileInput = el<HTMLInputElement>('assetFile');
    const zone = el('dropzone');
    let opening = false;
    const load = async (file?: File) => {
      if (!file || opening) return;
      opening = true;
      await complete(signal, async () => {
        if (/\.glb$/i.test(file.name)) return actions.openLocal(file, signal);
        if (!/\.json$/i.test(file.name)) throw new Error('Choose a .glb model or a .json recipe.');
        const recipe = parseRecipe(JSON.parse(await file.text()) as unknown);
        if (!signal.aborted) await actions.apply(recipe);
      }, 'Opening asset…', 'Asset opened in the studio.');
      opening = false;
    };
    button('chooseFile').onclick = () => { fileInput.click(); };
    fileInput.onchange = () => { void load(fileInput.files?.[0]); fileInput.value = ''; };
    zone.ondragover = event => { event.preventDefault(); zone.classList.add('dragover'); };
    zone.ondragleave = () => { zone.classList.remove('dragover'); };
    zone.ondrop = event => {
      event.preventDefault();
      zone.classList.remove('dragover');
      void load(event.dataTransfer?.files[0]);
    };
  }

  function assistant(showRecipe = false) {
    const recipe = actions.recipe();
    const imported = actions.importEdits();
    const caps = actions.capabilities();
    const selection = actions.selectionKey();
    const slots = imported ? actions.paintSlots() : [];
    const kind = imported ? 'settings' : 'recipe';
    const tabs = `<div class="dialogtabs" aria-label="Editing method"><button id="promptTab" aria-pressed="${String(!showRecipe)}">${icon('spark', 15)} Prompt</button><button id="recipeTab" aria-pressed="${String(showRecipe)}">${icon('code', 15)} Agent ${kind}</button></div>`;
    const editor = showRecipe
      ? `<label class="field" for="recipeText">${imported ? 'Model settings' : 'Recipe'} JSON<textarea id="recipeText" spellcheck="false" rows="10"></textarea></label>
        <div class="dialogactions"><button class="btn" id="copyRecipe">Copy JSON</button><button class="btn orange" id="applyRecipe">Apply ${kind}</button></div><a class="textbutton doclink" href="./llms.txt" target="_blank" rel="noopener">Agent documentation ${icon('diagonal', 14)}</a>`
      : `<div class="modelstate"><span id="modelState">Checking on-device AI…</span><button class="textbutton" id="enableModel" hidden>Enable on-device AI</button></div>
        <form id="promptForm" class="dialogstack"><label for="promptText" class="field">Describe your edit<textarea id="promptText" rows="3" maxlength="2000"></textarea></label>
        <div class="dialogactions"><button class="btn orange" id="applyPrompt">${icon('spark', 15)} Apply edit</button></div></form>`;
    const reference = capabilityReferenceMarkup(slots, imported ? caps : null);
    const signal = open('AI tools', `<div class="dialogstack">${tabs}${editor}${reference}${statusLine}</div>`);
    button('promptTab').onclick = () => { assistant(); };
    button('recipeTab').onclick = () => { assistant(true); };
    if (showRecipe) {
      const text = el<HTMLTextAreaElement>('recipeText');
      const snapshot = JSON.stringify(recipe ?? imported);
      text.value = JSON.stringify(recipe ?? imported, null, 2);
      button('applyRecipe').onclick = () => {
        try {
          if (actions.selectionKey() !== selection || JSON.stringify(actions.recipe() ?? actions.importEdits()) !== snapshot) {
            throw new Error('The active model changed. Reopen AI tools for the new model.');
          }
          const value: unknown = JSON.parse(text.value);
          let pending: Promise<void> | void = undefined;
          if (imported && !(value && typeof value === 'object' && 'template' in value)) {
            actions.applyImportEdits(parseImportedSettings(value, slots, caps));
          } else pending = actions.apply(parseRecipe(value));
          const finish = () => {
            if (signal.aborted) return;
            close();
            notify('Edits applied.');
          };
          if (pending) void pending.then(finish, (error: unknown) => { if (!signal.aborted) status(message(error)); });
          else finish();
        } catch (error) { status(message(error)); }
      };
      button('copyRecipe').onclick = () => {
        if (!text.value.trim()) { status('Enter JSON to copy.'); return; }
        const clipboard = (navigator as Partial<Navigator>).clipboard;
        if (!clipboard) { text.focus(); text.select(); status('JSON selected. Use your copy shortcut.'); return; }
        void clipboard.writeText(text.value).then(() => { if (!signal.aborted) status('JSON copied.'); }, () => {
          if (!signal.aborted) { text.focus(); text.select(); status('JSON selected. Use your copy shortcut.'); }
        });
      };
      return;
    }
    const modelState = el('modelState');
    const enable = button('enableModel');
    void getPromptAvailability().then(available => {
      if (signal.aborted) return;
      modelState.textContent = available === 'available' ? 'On-device AI ready' : 'Local commands available';
      enable.hidden = available !== 'downloadable' && available !== 'downloading';
    });
    enable.onclick = () => {
      enable.disabled = true;
      modelState.textContent = 'Preparing on-device AI…';
      void preparePromptModel(progress => {
        if (!signal.aborted) modelState.textContent = `Preparing on-device AI · ${Math.round(progress * 100).toString()}%`;
      }).then(() => {
        if (!signal.aborted) { modelState.textContent = 'On-device AI ready'; enable.hidden = true; }
      }, (error: unknown) => {
        if (!signal.aborted) { modelState.textContent = 'Local commands available'; enable.disabled = false; status(message(error)); }
      });
    };
    const prompt = el<HTMLTextAreaElement>('promptText');
    const firstPart = caps?.riggedParts[0];
    prompt.placeholder = imported
      ? (firstPart ? `Open ${firstPart.name}` : slots[0] ? `Paint "${slots[0].label}" teal` : 'Set height to 1.1')
      : 'Make it teal with cream accents';
    el<HTMLFormElement>('promptForm').onsubmit = event => {
      event.preventDefault();
      const original = actions.recipe();
      const edits = actions.importEdits();
      if (button('applyPrompt').disabled) return;
      if (actions.selectionKey() !== selection) { status('The active model changed. Reopen AI tools for the new model.'); return; }
      const snapshot = JSON.stringify(original ?? edits);
      const input = prompt.value;
      const edit = original ? editWithPrompt(original, input, signal) : edits ? editImportWithPrompt(edits, slots, input, signal, caps) : null;
      if (!edit) return;
      const apply = button('applyPrompt');
      apply.disabled = true;
      status('Applying edit…');
      void edit.then(async result => {
        const aborted = () => signal.aborted;
        if (aborted()) return;
        if (actions.selectionKey() !== selection || JSON.stringify(actions.recipe() ?? actions.importEdits()) !== snapshot || prompt.value !== input) {
          status('The asset or instruction changed. Apply the edit again.');
          return;
        }
        if ('recipe' in result) await actions.apply(result.recipe);
        else actions.applyImportEdits(result.edits);
        if (aborted()) return;
        close();
        notify(`Edit applied · ${result.engine}`);
      }).catch((error: unknown) => { if (!signal.aborted) status(message(error)); }).finally(() => { apply.disabled = false; });
    };
  }

  function exports() {
    const recipe = actions.recipe();
    const caps = actions.capabilities();
    const hasRigged = Boolean(caps?.riggedParts.length);
    const defaultBake = hasRigged && !actions.hasClips();
    const rigOption = hasRigged
      ? `<label class="play-sequence" style="margin-top:6px"><input id="exportPartClips" type="checkbox" ${defaultBake ? 'checked' : ''}/> Include rigged-part animation clips (e.g. Open ${escapeHtml(caps?.riggedParts[0]?.label.toLowerCase() ?? 'part')})</label>`
      : '';
    const signal = open('Export asset', `<div class="dialogstack">
      <div class="exportrow"><span class="formatmark">${icon('studio', 24)}</span><div><strong>Binary glTF</strong><p class="dialogcopy">Mesh, materials, rig, clips and self-describing <code>extras.formFoundry</code> capabilities in one .glb file.</p>${rigOption}</div><button class="btn dark" id="downloadGlb">${icon('download', 15)} GLB</button></div>
      ${recipe ? `<div class="exportrow"><span class="formatmark">${icon('code', 24)}</span><div><strong>Editable recipe</strong><p class="dialogcopy">Rebuild this asset in Form Foundry or the three.js SDK.</p></div><button class="btn" id="downloadRecipe">${icon('download', 15)} JSON</button></div>` : ''}${statusLine}</div>`);
    button('downloadGlb').onclick = () => {
      const includePartClips = Boolean(document.querySelector<HTMLInputElement>('#exportPartClips')?.checked);
      void complete(signal, () => actions.exportGlb({ includePartClips }), 'Preparing GLB…');
    };
    if (recipe) button('downloadRecipe').onclick = () => {
      try { downloadRecipe(recipe); close(); notify('Recipe downloaded.'); } catch (error) { report(error); }
    };
  }

  return { imports, assistant: () => { assistant(); }, exports };
}
