import '../ui/style.css';
import '../ui/workspace.css';
import type * as T from 'three';
import type { ExportOptions } from './export';
import { downloadStudioGlb, exportStudioGlb } from './export-flow';
import { attachCharacterAnimations, loadCharacterAnimations } from '../animation/lazy';
import { createAssetController, type AssetController } from '../capabilities/runtime';
import { readCapabilities } from '../capabilities/schema';
import { catalog, parseRecipe, resolveVariationRecipe, type Recipe } from '../data/recipe';
import { findVariation } from '../models/variations';
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
import { parseProjection, readProjectionPreference, saveProjectionPreference, type Projection } from './projection';
import { setupShelf } from './shelf';
import { Viewport, disposeModel, type View } from './viewport';

const params = new URLSearchParams(window.location.search);
el('app').innerHTML = layout;
if (params.get('shot') === '1' && params.get('noui') === '1') document.body.classList.add('shot-only');
const initialProjection = parseProjection(params.get('projection')) ?? readProjectionPreference();
const stage = new Viewport(el('viewport'), false, initialProjection);
el<HTMLSelectElement>('projection').value = initialProjection;
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
const category = () => recipe ? (catalog.find(row => row.id === recipe?.template)?.category ?? 'Object')
  : imported?.source.kind === 'polyfork' ? 'PolyFork model' : 'Imported GLB';

function syncRigEdits() {
  if (!imported) return;
  const state = imported.controller.getState();
  const next = { ...imported.edits };
  if (state.pose) next.pose = state.pose;
  else delete next.pose;
  imported.edits = next;
}

const ui = createInspectorBridge({
  stage, getRecipe: () => recipe, getImported: () => imported, getController: activeController,
  edit, selectVariation, setImportEdits, syncRigEdits,
});

function toolbar() {
  const row = catalog.find(entry => entry.id === recipe?.template);
  el('sceneName').textContent = name();
  el('assetCode').textContent = row ? `${row.category} · ${recipe?.quality === 'hd' ? 'HD' : 'Standard'}` : category();
  const source = el<HTMLAnchorElement>('assetSource');
  source.hidden = imported?.source.kind !== 'polyfork';
  if (imported?.source.kind === 'polyfork') source.href = 'https://polyfork.dev/asset/' + encodeURIComponent(imported.source.assetId);
  else source.removeAttribute('href');
  el('save').innerHTML = icon(selection.id ? 'save' : 'plus', 16) + (selection.id ? ' Save changes' : ' Save to inventory');
  ui.syncViewportTools();
}

function onMotionsReady(model: T.Group, hadClips: boolean) {
  if (stage.model !== model) return;
  if (!hadClips && model.animations.length) {
    stage.setClip(0);
    stage.play(autoplay);
  }
  ui.renderControls();
}

function availableClips() {
  const model = stage.model;
  if (!model) return [];
  if (document.body.classList.contains('shot-only')) {
    const hadClips = model.animations.length > 0;
    attachCharacterAnimations(model, () => { onMotionsReady(model, hadClips); });
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
    if (!document.body.classList.contains('shot-only')) {
      const hadClips = model.animations.length > 0;
      attachCharacterAnimations(model, () => { onMotionsReady(model, hadClips); });
    }
  } else if (previous) {
    model.animations.push(...previous.animations.slice(model.animations.length));
  }
  const firstClipSynthesized = Boolean(readCapabilities(model)?.clips?.[0]?.synthesized);
  stage.setModel(model, refit, !firstClipSynthesized);
  if (refit) stage.play(autoplay && !firstClipSynthesized);
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

function applyOriginalState(ctrl: AssetController, state?: ReturnType<AssetController['getState']>) {
  if (!state) return;
  if (state.pose && Object.keys(state.pose).length) {
    if (!stage.playing) stage.syncExternalPose();
    for (const [part, value] of Object.entries(state.pose)) {
      if (ctrl.capabilities.riggedParts.some(p => p.name === part)) ctrl.setPart(part, value);
    }
  }
  for (const part of state.hiddenParts ?? []) {
    if (ctrl.capabilities.detachableParts.some(p => p.name === part)) ctrl.setVisible(part, false);
  }
  if (state.night && ctrl.capabilities.nightZones.length) ctrl.setNight(true);
  if (state.decalText && ctrl.capabilities.decals.length) ctrl.setDecalsVisible(true, state.decalText);
  stage.invalidate();
}

function selectVariation(variation: string, template?: string) {
  const id = template ?? recipe?.template;
  if (!id) throw new Error('Open a studio original to switch variations.');
  applyRecipe(resolveVariationRecipe(id, variation), false);
  const init = findVariation(id, variation)?.state;
  if (init && originalController) {
    applyOriginalState(originalController, {
      ...(init.pose ? { pose: { ...init.pose } } : {}),
      ...(init.hiddenParts ? { hiddenParts: [...init.hiddenParts] } : {}),
      ...(init.night !== undefined ? { night: init.night } : {}),
      ...(init.decalText ? { decalText: { ...init.decalText } } : {}),
    });
    ui.syncViewportTools();
    ui.refreshRig();
  }
}

function edit(patch: Partial<Recipe & ImportEdits>) {
  try {
    if (recipe) {
      const prevState = originalController?.getState();
      recipe = parseRecipe({ ...recipe, ...patch });
      const built = buildModel(recipe);
      originalController?.dispose();
      originalController = createAssetController(built);
      swap(built, false);
      applyOriginalState(originalController, prevState);
      ui.refreshRig();
    } else if (imported) {
      applyImportEdits(imported, { ...imported.edits, ...patch });
      if (patch.scale !== undefined || patch.proportion !== undefined) stage.place(false);
      else stage.invalidate();
      ui.refreshRig();
    }
    toolbar();
  } catch (error) { report(error); ui.renderControls(); }
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
    notify(asset.metadataUnavailable
      ? 'PolyFork metadata was temporarily unavailable; some saved edits could not be restored.'
      : `Skipped ${String(asset.droppedPaintSlots.length)} outdated saved edit(s) that no longer match this model.`);
  }
}

function save(): Promise<string> {
  stopPartPreviewAnimation();
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

const exportTarget = () => ({ stage, recipe, imported, originalController });
const exportGLB = (options?: ExportOptions) => exportStudioGlb(exportTarget(), options);
const downloadGlb = (options?: ExportOptions) => downloadStudioGlb(name(), exportTarget(), options);

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
      const { id, title, category, remixable } = item.asset;
      await openImport(() => openPolyforkGlb(id, title, signal, category, undefined, remixable), undefined, signal);
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

function applyRecipe(input: unknown, carryPose = true) {
  const next = parseRecipe(input);
  if (!recipe || next.template !== recipe.template) { choose(next); return; }
  openSequence++;
  const prevState = carryPose ? originalController?.getState() : undefined;
  const model = buildModel(next);
  originalController?.dispose();
  originalController = createAssetController(model);
  recipe = next;
  swap(model, false);
  applyOriginalState(originalController, prevState);
  toolbar();
  ui.renderControls();
}

const openRemote = (id: string, title: string, signal?: AbortSignal) =>
  openImport(() => openPolyforkGlb(id, title, signal), undefined, signal);
const getImportEdits = () => imported ? structuredClone(imported.edits) : null;
const paintSlots = () => imported ? listPaintSlots(imported) : [];

function setImportEdits(edits: ImportEdits) {
  if (!imported) throw new Error('Open an imported GLB first.');
  stopPartPreviewAnimation();
  const previous = imported.edits;
  if (JSON.stringify(previous.pose ?? {}) !== JSON.stringify(edits.pose ?? {})) {
    stage.syncExternalPose();
    showPlayback(false);
  }
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
    if (row) { applyRecipe(row.recipe, false); stage.place(true); }
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
function setProjection(mode: Projection) {
  const valid = parseProjection(mode);
  if (!valid) throw new Error('Projection must be "perspective" or "orthographic".');
  stage.setProjection(valid);
  el<HTMLSelectElement>('projection').value = valid;
  saveProjectionPreference(valid);
}
el('fit').onclick = () => { stage.place(true); el<HTMLSelectElement>('view').value = 'Perspective'; };
el<HTMLSelectElement>('view').onchange = e => { stage.view((e.currentTarget as HTMLSelectElement).value as View); };
el<HTMLSelectElement>('projection').onchange = e => { setProjection((e.currentTarget as HTMLSelectElement).value as Projection); };
el('expand').onclick = () => {
  void (document.fullscreenElement ? document.exitFullscreen() : el('scenePanel').requestFullscreen()).catch(report);
};
stage.onTick = frac => {
  const slider = document.querySelector<HTMLInputElement>('#timeline');
  if (slider) { slider.value = String(frac); slider.style.setProperty('--pct', String(frac * 100) + '%'); }
};
stage.onReady = () => {
  window.__shotReady = true;
  if (!document.body.classList.contains('shot-only')) void loadCharacterAnimations();
};

const api = createAgentApi({
  stage, getRecipe: () => (recipe ? { ...recipe } : null), getImported: () => imported, getController: activeController,
  applyRecipe: input => { applyRecipe(input); }, selectVariation, remix, save, exportGLB, openPolyfork: openRemote,
  listPaintSlots: paintSlots, getImportEdits, setImportEdits,
  listClips: () => availableClips().map(({ name, duration }) => ({ name, duration })),
  playClip: index => {
    if (!availableClips()[index]) throw new Error('Unknown animation clip.');
    stage.setClip(index); stage.play(true); ui.renderControls();
  },
  syncRigEdits, refreshRig: ui.refreshRig, syncViewportTools: ui.syncViewportTools, applyPreset: ui.applyPreset, setProjection,
});
declare global { interface Window { forgeStudio: ForgeStudioApi; __shotReady: boolean; } }
window.forgeStudio = api;
window.__shotReady = false;
const startId = params.get('asset');
const startVariation = params.get('variation') ?? undefined;
const startRow = catalog.find(row => row.id === startId);
choose(startRow ? resolveVariationRecipe(startRow.id, startVariation) : initial);
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
