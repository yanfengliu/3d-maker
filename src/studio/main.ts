import '../ui/style.css';
import '../ui/workspace.css';
import type * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { cloneForExport, type ExportOptions } from './export';
import { addCharacterAnimations } from '../animation/library';
import { createAssetController, type AssetController } from '../capabilities/runtime';
import { catalog, parseRecipe, type Recipe } from '../data/recipe';
import { saveAsset } from '../data/inventory';
import {
  applyImportEdits,
  listPaintSlots,
  openLocalGlb,
  openPolyforkGlb,
  openSavedImport,
  saveImport,
  subscribeImportChanges,
  type ImportedAsset,
  type ImportEdits,
} from '../imports';
import { buildModel } from '../models';
import { el, notify, report } from '../ui/dom';
import { icon } from '../ui/icons';
import { layout } from '../ui/layout';
import { showPlayback } from '../ui/inspector';
import { stopPartPreviewAnimation } from '../ui/model-parts';
import { setupDialogs } from '../ui/dialogs';
import { createAgentApi, type ForgeStudioApi } from './agent-api';
import { createInspectorBridge } from './inspector-bridge';
import { setupShelf } from './shelf';
import { Viewport, disposeModel, type View } from './viewport';

const params = new URLSearchParams(window.location.search);
el('app').innerHTML = layout;
if (params.get('shot') === '1' && params.get('noui') === '1') document.body.classList.add('shot-only');
const stage = new Viewport(el('viewport'));
const autoplay = params.get('shot') !== '1';
let recipe: Recipe | null = null;
let imported: ImportedAsset | null = null;
let originalController: AssetController | null = null;
function newSelection(id?: string, remixDraft = false) {
  return { id, remixDraft, write: Promise.resolve() };
}
let selection = newSelection();
let grid = true,
  wire = false,
  openSequence = 0;
const first = catalog[0];
if (!first) throw new Error('The starter catalog is empty.');
const initial = first.recipe;

const activeController = () => imported?.controller ?? originalController;
const name = () => recipe?.name ?? imported?.edits.name ?? 'Asset';
const category = () =>
  recipe
    ? (catalog.find(row => row.id === recipe?.template)?.category ?? 'Object')
    : imported?.source.kind === 'polyfork'
      ? 'PolyFork model'
      : 'Imported GLB';

function syncRigEdits() {
  if (!imported) return;
  const state = imported.controller.getState();
  const next = { ...imported.edits };
  if (state.pose) next.pose = state.pose;
  else delete next.pose;
  imported.edits = next;
}

const ui = createInspectorBridge({
  stage,
  getRecipe: () => recipe,
  getImported: () => imported,
  getController: activeController,
  edit,
  setImportEdits,
  syncRigEdits,
});

function toolbar() {
  const row = catalog.find(entry => entry.id === recipe?.template);
  el('sceneName').textContent = name();
  el('assetCode').textContent = row
    ? `${row.category} · ${recipe?.quality === 'hd' ? 'HD' : 'Standard'}`
    : category();
  const source = el<HTMLAnchorElement>('assetSource');
  source.hidden = imported?.source.kind !== 'polyfork';
  if (imported?.source.kind === 'polyfork') {
    source.href = 'https://polyfork.dev/asset/' + encodeURIComponent(imported.source.assetId);
  } else source.removeAttribute('href');
  el('save').innerHTML =
    icon(selection.id ? 'save' : 'plus', 16) + (selection.id ? ' Save changes' : ' Save to inventory');
  ui.syncViewportTools();
}

function availableClips() {
  const model = stage.model;
  if (!model) return [];
  const hadClips = model.animations.length > 0;
  if (document.body.classList.contains('shot-only')) addCharacterAnimations(model);
  if (!hadClips && model.animations.length) {
    stage.setClip(0);
    stage.play(autoplay);
  }
  return model.animations;
}

function togglePlayback() {
  stage.play(!stage.playing);
  return stage.playing;
}

document.addEventListener('keydown', event => {
  if (event.code !== 'Space' || event.defaultPrevented || event.isComposing ||
      event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
  const target = event.target;
  if (!(target instanceof HTMLElement) || target.isContentEditable || document.querySelector('dialog[open]')) return;
  if (target.closest('input:not(#timeline),textarea,select,a,summary')) return;
  const button = target.closest('button');
  if (button && !button.matches('#play,.clip[aria-pressed="true"],.inv-card[aria-pressed="true"]')) return;
  if (!availableClips().length) return;
  event.preventDefault();
  if (!event.repeat) showPlayback(togglePlayback());
});

function swap(model: T.Group, refit: boolean) {
  stopPartPreviewAnimation();
  const previous = stage.model;
  const clip = refit ? undefined : previous?.animations[stage.clipIndex];
  const playing = stage.playing, fraction = stage.clipFraction;
  if (refit) {
    ui.setPickMode(false);
    stage.playAll = false;
    if (!document.body.classList.contains('shot-only')) addCharacterAnimations(model);
  } else if (previous) {
    model.animations.push(...previous.animations.slice(model.animations.length));
  }
  stage.setModel(model, refit);
  if (refit) stage.play(autoplay);
  if (clip) {
    const next = model.animations.findIndex(candidate => candidate.name === clip.name);
    if (next >= 0) {
      stage.setClip(next);
      stage.seek(fraction);
      stage.play(playing);
    }
  }
  if (previous && previous !== model) disposeModel(previous);
  if (refit) el<HTMLSelectElement>('view').value = 'Perspective';
}

function edit(patch: Partial<Recipe & ImportEdits>) {
  try {
    if (recipe) {
      recipe = parseRecipe({ ...recipe, ...patch });
      const built = buildModel(recipe);
      originalController?.dispose();
      originalController = createAssetController(built);
      swap(built, false);
    } else if (imported) {
      applyImportEdits(imported, { ...imported.edits, ...patch });
      if (patch.scale !== undefined || patch.proportion !== undefined) stage.place(false);
      else stage.invalidate();
      ui.refreshRig();
    }
    toolbar();
  } catch (error) {
    report(error);
    ui.renderControls();
  }
}

function choose(next: Recipe, id?: string) {
  const valid = parseRecipe(next);
  const model = buildModel(valid);
  openSequence++;
  imported?.controller.dispose();
  originalController?.dispose();
  recipe = valid;
  imported = null;
  originalController = createAssetController(model);
  selection = newSelection(id);
  swap(model, true);
  toolbar();
  ui.renderControls();
  shelf.markSelection();
}

async function openImport(load: () => Promise<ImportedAsset>, id?: string, signal?: AbortSignal) {
  const seq = ++openSequence;
  const asset = await load();
  if (seq !== openSequence || signal?.aborted) {
    asset.controller.dispose();
    disposeModel(asset.group);
    return;
  }
  imported?.controller.dispose();
  originalController?.dispose();
  originalController = null;
  recipe = null;
  imported = asset;
  selection = newSelection(id);
  swap(asset.group, true);
  toolbar();
  ui.renderControls();
  shelf.markSelection();
  if (asset.droppedPaintSlots?.length) {
    notify(`Skipped ${String(asset.droppedPaintSlots.length)} outdated saved color override(s) that no longer match this model.`);
  }
}

function save(): Promise<string> {
  const target = selection;
  const draft = recipe ? { ...recipe } : null;
  const file = imported ? { ...imported, edits: structuredClone(imported.edits) } : null;
  const result = target.write.then(async () => {
    const saved = draft ? saveAsset(draft, target.id) : file ? await saveImport(file, target.id) : null;
    if (!saved) throw new Error('Choose an asset to save.');
    target.id = saved.id;
    if (target === selection) {
      toolbar();
      shelf.markSelection();
      notify('Saved to inventory');
    }
    void shelf.refreshSaved().catch(report);
    return saved.id;
  });
  target.write = result.then(() => undefined, () => undefined);
  return result;
}

function remix(newName?: string) {
  const suffix = ' remix';
  const copyName = newName ?? name().slice(0, 80 - suffix.length).replace(/[\uD800-\uDBFF]$/, '').trimEnd() + suffix;
  if (recipe) {
    recipe = parseRecipe({ ...recipe, name: copyName });
    if (stage.model) stage.model.userData.recipe = { ...recipe };
  } else if (imported) {
    applyImportEdits(imported, { ...imported.edits, name: copyName });
  } else throw new Error('Choose a model to remix.');
  openSequence++;
  selection = newSelection(undefined, true);
  const input = el<HTMLInputElement>('assetName');
  input.defaultValue = name();
  input.value = name();
  toolbar();
  shelf.markSelection();
}

async function exportGLB(options?: ExportOptions): Promise<ArrayBuffer> {
  const source = imported?.group;
  const snapshot = source ? stage.restClone(() => cloneForExport(source, options)) : null;
  const builtOriginal = recipe ? buildModel(recipe) : null;
  if (builtOriginal) {
    const origPose = originalController?.getState().pose;
    if (origPose) {
      const exportCtrl = createAssetController(builtOriginal);
      for (const [part, val] of Object.entries(origPose)) exportCtrl.setPart(part, val);
      exportCtrl.dispose();
    }
    addCharacterAnimations(builtOriginal);
  }
  const originalSnap = builtOriginal ? cloneForExport(builtOriginal, options) : null;
  const model = originalSnap?.root ?? snapshot?.root;
  if (!model) throw new Error('Choose an asset to export.');
  try {
    if (!builtOriginal) addCharacterAnimations(model);
    return (await new GLTFExporter().parseAsync(model, {
      binary: true,
      animations: model.animations,
      onlyVisible: true,
    })) as ArrayBuffer;
  } finally {
    snapshot?.dispose();
    originalSnap?.dispose();
    if (builtOriginal) disposeModel(builtOriginal);
  }
}

async function downloadGlb(options?: ExportOptions) {
  const filename = name().replace(/[^a-z\d -]/gi, '').trim() || 'asset';
  const data = await exportGLB(options);
  const url = URL.createObjectURL(new Blob([data], { type: 'model/gltf-binary' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename + '.glb';
  link.click();
  window.setTimeout(() => { URL.revokeObjectURL(url); }, 10000);
}

const shelf = setupShelf({
  activeKey: () => {
    if (selection.id) return 'saved:' + selection.id;
    if (selection.remixDraft) return null;
    if (recipe) return 'original:' + recipe.template;
    if (imported?.source.kind === 'polyfork') return 'polyfork:' + imported.source.assetId;
    return null;
  },
  open: async (item, signal) => {
    if (item.source === 'original') choose(item.recipe);
    else if (item.source === 'polyfork') {
      const { id, title, category } = item.asset;
      await openImport(() => openPolyforkGlb(id, title, signal, category), undefined, signal);
    } else if ('recipe' in item.entry) choose(item.entry.recipe, item.entry.id);
    else await openImport(() => openSavedImport(item.entry.id, signal), item.entry.id, signal);
  },
  deleted: id => {
    if (selection.id === id) {
      selection = newSelection();
      toolbar();
      shelf.markSelection();
    }
  },
});

function applyRecipe(input: unknown) {
  const next = parseRecipe(input);
  if (!recipe || next.template !== recipe.template) { choose(next); return; }
  openSequence++;
  const model = buildModel(next);
  originalController?.dispose();
  originalController = createAssetController(model);
  recipe = next;
  swap(model, false);
  toolbar();
  ui.renderControls();
}

const openRemote = (id: string, title: string, signal?: AbortSignal) =>
  openImport(() => openPolyforkGlb(id, title, signal), undefined, signal);
const getImportEdits = () => imported ? structuredClone(imported.edits) : null;
const paintSlots = () => imported ? listPaintSlots(imported) : [];

function setImportEdits(edits: ImportEdits) {
  if (!imported) throw new Error('Open an imported GLB first.');
  const previous = imported.edits;
  applyImportEdits(imported, edits);
  if (previous.scale !== edits.scale || previous.proportion !== edits.proportion) stage.place(false);
  else stage.invalidate();
  toolbar();
  ui.renderProperties(true);
  ui.refreshRig();
}

const dialogs = setupDialogs({
  recipe: () => (recipe ? { ...recipe } : null),
  apply: applyRecipe,
  importEdits: getImportEdits,
  applyImportEdits: setImportEdits,
  paintSlots,
  capabilities: () => activeController()?.syncManifest() ?? null,
  hasClips: () => availableClips().length > 0,
  selectionKey: () => selection,
  openLocal: (file, signal) => openImport(() => openLocalGlb(file), undefined, signal),
  exportGlb: downloadGlb,
});

el('import').onclick = dialogs.imports;
el('assistant').onclick = dialogs.assistant;
el('export').onclick = dialogs.exports;
el('remix').onclick = () => {
  remix();
  const input = el<HTMLInputElement>('assetName');
  input.focus();
  input.select();
  notify('Remix ready. Save it to your inventory when you’re done.');
};
el('save').onclick = () => {
  const btn = el<HTMLButtonElement>('save');
  btn.disabled = true;
  void save().catch(report).finally(() => { btn.disabled = false; });
};
el('play').onclick = () => { showPlayback(togglePlayback()); };
el('nightToggle').onclick = () => {
  const ctrl = activeController();
  if (!ctrl?.capabilities.nightZones.length) return;
  const next = !ctrl.isNight();
  if (imported) edit({ night: next });
  else { ctrl.setNight(next); ui.syncViewportTools(); }
};
el('decalToggle').onclick = () => {
  const ctrl = activeController();
  if (!ctrl?.capabilities.decals.length) return;
  ctrl.setDecalsVisible(!ctrl.areDecalsVisible(), imported?.edits.decalText);
  ui.syncViewportTools();
  stage.invalidate();
};
el('pickColor').onclick = () => { ui.togglePickMode(); };
el('reset').onclick = () => {
  if (recipe) {
    const row = catalog.find(v => v.id === recipe?.template);
    if (row) { applyRecipe(row.recipe); stage.place(true); }
  } else if (imported) {
    stopPartPreviewAnimation();
    imported.controller.setDecalsVisible(false, {});
    applyImportEdits(imported, {
      name: imported.source.kind === 'polyfork'
        ? imported.source.title
        : imported.source.filename.replace(/\.glb$/i, ''),
      scale: 1, proportion: 1, tint: '#ffffff',
    });
    stage.place(true);
    toolbar();
    ui.renderControls();
  }
};
el('grid').setAttribute('aria-pressed', 'true');
el('wire').setAttribute('aria-pressed', 'false');
el('grid').onclick = () => { grid = !grid; stage.showGrid(grid); el('grid').setAttribute('aria-pressed', String(grid)); };
el('wire').onclick = () => { wire = !wire; stage.wireframe(wire); el('wire').setAttribute('aria-pressed', String(wire)); };
el('fit').onclick = () => { stage.place(true); el<HTMLSelectElement>('view').value = 'Perspective'; };
el<HTMLSelectElement>('view').onchange = e => { stage.view((e.currentTarget as HTMLSelectElement).value as View); };
el('expand').onclick = () => {
  void (document.fullscreenElement ? document.exitFullscreen() : el('scenePanel').requestFullscreen()).catch(report);
};
stage.onTick = frac => {
  const slider = document.querySelector<HTMLInputElement>('#timeline');
  if (slider) { slider.value = String(frac); slider.style.setProperty('--pct', String(frac * 100) + '%'); }
};
stage.onReady = () => { window.__shotReady = true; };

const api = createAgentApi({
  stage,
  getRecipe: () => (recipe ? { ...recipe } : null),
  getImported: () => imported,
  getController: activeController,
  applyRecipe,
  remix,
  save,
  exportGLB,
  openPolyfork: openRemote,
  listPaintSlots: paintSlots,
  getImportEdits,
  setImportEdits,
  listClips: () => availableClips().map(({ name, duration }) => ({ name, duration })),
  playClip: index => {
    if (!availableClips()[index]) throw new Error('Unknown animation clip.');
    stage.setClip(index); stage.play(true); ui.renderControls();
  },
  syncRigEdits,
  refreshRig: ui.refreshRig,
  syncViewportTools: ui.syncViewportTools,
  applyPreset: ui.applyPreset,
});

declare global {
  interface Window {
    forgeStudio: ForgeStudioApi;
    __shotReady: boolean;
  }
}
window.forgeStudio = api;
window.__shotReady = false;
choose(catalog.find(row => row.id === params.get('asset'))?.recipe ?? initial);
const shotView = params.get('view');
if (params.get('shot') === '1' && shotView && ['Front', 'Top', 'Side'].includes(shotView)) {
  stage.view(shotView as View);
  el<HTMLSelectElement>('view').value = shotView;
}
if (!document.body.classList.contains('shot-only')) {
  shelf.start();
  const refreshInventory = () => { void shelf.refreshSaved().catch(report); };
  window.addEventListener('storage', refreshInventory);
  subscribeImportChanges(refreshInventory);
}
