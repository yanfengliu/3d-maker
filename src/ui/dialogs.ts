import { editWithPrompt, getPromptAvailability, preparePromptModel } from '../data/assistant';
import { parseRecipe, type Recipe } from '../data/recipe';
import { el, notify, report } from './dom';
import { icon } from './icons';
import './dialogs.css';

interface DialogActions {
  recipe: () => Recipe | null;
  apply: (recipe: Recipe) => void;
  openLocal: (file: File, signal?: AbortSignal) => Promise<void>;
  exportGlb: () => Promise<void>;
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
        if (!signal.aborted) actions.apply(recipe);
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
    const tabs = `<div class="dialogtabs" aria-label="Editing method"><button id="promptTab" aria-pressed="${String(!showRecipe)}">${icon('spark', 15)} Prompt</button><button id="recipeTab" aria-pressed="${String(showRecipe)}">${icon('code', 15)} Agent recipe</button></div>`;
    const editor = showRecipe
      ? `<label class="field" for="recipeText">Recipe JSON<textarea id="recipeText" spellcheck="false" rows="10" placeholder="Paste a Form Foundry recipe"></textarea></label>
        <div class="dialogactions"><button class="btn" id="copyRecipe">Copy JSON</button><button class="btn orange" id="applyRecipe">Apply recipe</button></div><a class="textbutton doclink" href="./llms.txt" target="_blank" rel="noopener">Agent documentation ${icon('diagonal', 14)}</a>`
      : `<div class="modelstate"><span id="modelState">Checking on-device AI…</span><button class="textbutton" id="enableModel" hidden>Enable on-device AI</button></div>
        <form id="promptForm" class="dialogstack"><label for="promptText" class="field">Describe your edit<textarea id="promptText" rows="3" maxlength="2000" placeholder="Make it teal with cream accents" ${recipe ? '' : 'disabled'}></textarea></label>
        ${recipe ? '' : '<p class="dialogcopy">Open a studio starter to edit its recipe, or paste one in the Agent recipe tab.</p>'}
        <div class="dialogactions"><button class="btn orange" id="applyPrompt" ${recipe ? '' : 'disabled'}>${icon('spark', 15)} Apply edit</button></div></form>`;
    const signal = open('AI tools', `<div class="dialogstack">${tabs}${editor}${statusLine}</div>`);
    button('promptTab').onclick = () => { assistant(); };
    button('recipeTab').onclick = () => { assistant(true); };
    if (showRecipe) {
      const text = el<HTMLTextAreaElement>('recipeText');
      text.value = recipe ? JSON.stringify(recipe, null, 2) : '';
      button('applyRecipe').onclick = () => {
        try {
          actions.apply(parseRecipe(JSON.parse(text.value) as unknown));
          close();
          notify('Recipe applied.');
        } catch (error) { status(message(error)); }
      };
      button('copyRecipe').onclick = () => {
        if (!text.value.trim()) { status('Enter a recipe to copy.'); return; }
        const clipboard = (navigator as Partial<Navigator>).clipboard;
        if (!clipboard) { text.focus(); text.select(); status('Recipe selected. Use your copy shortcut.'); return; }
        void clipboard.writeText(text.value).then(() => { if (!signal.aborted) status('Recipe copied.'); }, () => {
          if (!signal.aborted) { text.focus(); text.select(); status('Recipe selected. Use your copy shortcut.'); }
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
    el<HTMLFormElement>('promptForm').onsubmit = event => {
      event.preventDefault();
      const original = actions.recipe();
      if (!original || button('applyPrompt').disabled) return;
      const snapshot = JSON.stringify(original);
      const input = prompt.value;
      const apply = button('applyPrompt');
      apply.disabled = true;
      status('Applying edit…');
      void editWithPrompt(original, input).then(result => {
        if (signal.aborted) return;
        if (JSON.stringify(actions.recipe()) !== snapshot || prompt.value !== input) { status('The asset or instruction changed. Apply the edit again.'); return; }
        actions.apply(result.recipe);
        close();
        notify(`Edit applied · ${result.engine}`);
      }).catch((error: unknown) => { if (!signal.aborted) status(message(error)); }).finally(() => { apply.disabled = false; });
    };
  }

  function exports() {
    const recipe = actions.recipe();
    const signal = open('Export asset', `<div class="dialogstack">
      <div class="exportrow"><span class="formatmark">${icon('studio', 24)}</span><div><strong>Binary glTF</strong><p class="dialogcopy">Mesh, materials, rig and available clips in one .glb file.</p></div><button class="btn dark" id="downloadGlb">${icon('download', 15)} GLB</button></div>
      ${recipe ? `<div class="exportrow"><span class="formatmark">${icon('code', 24)}</span><div><strong>Editable recipe</strong><p class="dialogcopy">Rebuild this asset in Form Foundry or the three.js SDK.</p></div><button class="btn" id="downloadRecipe">${icon('download', 15)} JSON</button></div>` : ''}${statusLine}</div>`);
    button('downloadGlb').onclick = () => { void complete(signal, actions.exportGlb, 'Preparing GLB…'); };
    if (recipe) button('downloadRecipe').onclick = () => {
      try { downloadRecipe(recipe); close(); notify('Recipe downloaded.'); } catch (error) { report(error); }
    };
  }

  return { imports, assistant: () => { assistant(); }, exports };
}
