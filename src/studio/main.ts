import '../ui/style.css';
import '../ui/workspace.css';
import type * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { cloneForExport } from './export';
import { addCharacterAnimations } from '../animation/library';
import { catalog, parseRecipe, type Recipe } from '../data/recipe';
import { readInventory, saveAsset } from '../data/inventory';
import {
  applyImportEdits,
  listImports,
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
import { showProperties, showAnimation, showPlayback } from '../ui/inspector';
import { setupDialogs } from '../ui/dialogs';
import { setupShelf } from './shelf';
import { Viewport, disposeModel, type View } from './viewport';

const params = new URLSearchParams(window.location.search);
el('app').innerHTML = layout;
if (params.get('shot') === '1' && params.get('noui') === '1') document.body.classList.add('shot-only');
const stage = new Viewport(el('viewport'));
const autoplay = params.get('shot') !== '1';
let recipe: Recipe | null = null;
let imported: ImportedAsset | null = null;
function newSelection(id?:string) {
  return {id, write:Promise.resolve()};
}
let selection = newSelection();
let tab: 'props' | 'anim' = 'props';
let grid = true,
  wire = false,
  openSequence = 0;
const first = catalog[0];
if (!first) throw new Error('The starter catalog is empty.');
const initial = first.recipe;
function category() {
  if (recipe) return catalog.find((row) => row.id === recipe?.template)?.category ?? 'Object';
  return imported?.source.kind === 'polyfork' ? 'PolyFork model' : 'Imported GLB';
}
function name() {
  return recipe?.name ?? imported?.edits.name ?? 'Asset';
}
function toolbar() {
  const row = catalog.find((row) => row.id === recipe?.template);
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
}
function availableClips() {
  const model = stage.model;
  if (!model) return [];
  const hadClips = model.animations.length > 0;
  addCharacterAnimations(model);
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
  // A selected result or tab keeps focus after a mouse click. Space can operate the
  // preview there, while other focused buttons keep their native keyboard activation.
  const button = target.closest('button');
  if (button && !button.matches('#play,.clip[aria-pressed="true"],.inv-card[aria-pressed="true"],.tabs .active')) return;
  if (!availableClips().length) return;
  event.preventDefault();
  if (!event.repeat) showPlayback(togglePlayback());
});
function namePlaybackControl() {
  const clip = stage.model?.animations[stage.clipIndex];
  if (clip) el('play').title = 'Play or pause ' + clip.name + ' (Space)';
}
function controls() {
  el('propertiesTab').setAttribute('aria-pressed', String(tab === 'props'));
  el('animationTab').setAttribute('aria-pressed', String(tab === 'anim'));
  el('propertiesTab').classList.toggle('active', tab === 'props');
  el('animationTab').classList.toggle('active', tab === 'anim');
  if (tab === 'anim') availableClips();
  el('play').hidden = !stage.model?.animations.length;
  showPlayback(stage.playing);
  namePlaybackControl();
  let markClip: ((i: number) => void) | undefined;
  if (tab === 'anim') {
    markClip = showAnimation(
      stage.model?.animations ?? [],
      stage.clipIndex,
      stage.playing,
      stage.speed,
      stage.playAll,
      (on) => {
        stage.playAll = on;
        if (on) stage.play(true);
        return stage.playing;
      },
      (i) => {
        stage.setClip(i);
        stage.seek(0);
        stage.play(true);
        namePlaybackControl();
      },
      (n) => {
        stage.seek(n);
      },
      (n) => {
        stage.speed = n;
      },
    );
  } else if (recipe) showProperties(recipe, category(), edit);
  else if (imported) showProperties({ ...imported.edits, primary: imported.edits.tint }, category(), edit);
  stage.onAdvance = index => { namePlaybackControl(); markClip?.(index); };
}
function swap(model: T.Group, refit: boolean) {
  const previous = stage.model;
  const clip = refit ? undefined : previous?.animations[stage.clipIndex];
  const playing = stage.playing, fraction = stage.clipFraction;
  if (clip && (stage.playAll || !model.animations.some(candidate => candidate.name === clip.name))) addCharacterAnimations(model);
  if (refit) {
    stage.playAll = false;
    if (autoplay && !model.animations.length) addCharacterAnimations(model);
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
      swap(buildModel(recipe), false);
    } else if (imported) {
      applyImportEdits(imported, { ...imported.edits, ...patch });
      stage.place(false);
    }
    toolbar();
  } catch (error) {
    report(error);
    controls();
  }
}
function choose(next: Recipe, id?: string) {
  const valid = parseRecipe(next);
  const model = buildModel(valid);
  openSequence++;
  recipe = valid;
  imported = null;
  selection = newSelection(id);
  tab = 'props';
  swap(model, true);
  toolbar();
  controls();
  shelf.markSelection();
}
async function openImport(load: () => Promise<ImportedAsset>, id?: string, signal?: AbortSignal) {
  const seq = ++openSequence;
  const asset = await load();
  if (seq !== openSequence || signal?.aborted) {
    disposeModel(asset.group);
    return;
  }
  recipe = null;
  imported = asset;
  selection = newSelection(id);
  tab = 'props';
  swap(asset.group, true);
  toolbar();
  controls();
  shelf.markSelection();
}
function save(): Promise<string> {
  const target = selection;
  const draft = recipe ? {...recipe} : null;
  const file = imported ? {...imported, edits:{...imported.edits}} : null;
  // Each call owns the values it acknowledged. Queue writes on the displayed asset,
  // even if another catalog request starts or finishes before its first ID is assigned.
  const result = target.write.then(async () => {
    const saved = draft ? saveAsset(draft,target.id) : file ? await saveImport(file,target.id) : null;
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
async function exportGLB(): Promise<ArrayBuffer> {
  const source = imported?.group;
  const snapshot = source ? stage.restClone(() => cloneForExport(source)) : null;
  const model = recipe ? buildModel(recipe) : snapshot?.root;
  if (!model) throw new Error('Choose an asset to export.');
  try {
    addCharacterAnimations(model);
    return (await new GLTFExporter().parseAsync(model, {
      binary: true,
      animations: model.animations,
      onlyVisible: true,
    })) as ArrayBuffer;
  } finally {
    if (snapshot) snapshot.dispose();
    else disposeModel(model);
  }
}
async function downloadGlb() {
  const filename =
    name()
      .replace(/[^a-z\d -]/gi, '')
      .trim() || 'asset';
  const data = await exportGLB();
  const url = URL.createObjectURL(new Blob([data], { type: 'model/gltf-binary' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename + '.glb';
  link.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 10000);
}
const shelf = setupShelf({
  activeKey: () => {
    if (selection.id) return 'saved:' + selection.id;
    if (recipe) return 'original:' + recipe.template;
    if (imported?.source.kind === 'polyfork') return 'polyfork:' + imported.source.assetId;
    return null;
  },
  open: async (item, signal) => {
    if (item.source === 'original') choose(item.recipe);
    else if (item.source === 'polyfork') {
      const {id, title, category} = item.asset;
      await openImport(() => openPolyforkGlb(id, title, signal, category), undefined, signal);
    } else if ('recipe' in item.entry) choose(item.entry.recipe, item.entry.id);
    else {
      const {id} = item.entry;
      await openImport(() => openSavedImport(id, signal), id, signal);
    }
  },
  deleted: (id) => {
    if (selection.id === id) {
      selection = newSelection();
      toolbar(); shelf.markSelection();
    }
  },
});
function applyRecipe(input: unknown) {
  const next = parseRecipe(input);
  if (!recipe || next.template !== recipe.template) { choose(next); return; }
  openSequence++;
  const model=buildModel(next);
  recipe=next;
  swap(model,false);
  toolbar();controls();
}
const openRemote = (id: string, title: string, signal?: AbortSignal) =>
  openImport(() => openPolyforkGlb(id, title, signal), undefined, signal);
const dialogs = setupDialogs({
  recipe: () => (recipe ? { ...recipe } : null),
  apply: applyRecipe,
  openLocal: (file, signal) => openImport(() => openLocalGlb(file), undefined, signal),
  exportGlb: downloadGlb,
});
el('import').onclick = dialogs.imports;
el('assistant').onclick = dialogs.assistant;
el('export').onclick = dialogs.exports;
el('save').onclick = () => {
  const btn = el<HTMLButtonElement>('save');
  btn.disabled = true;
  void save()
    .catch(report)
    .finally(() => {
      btn.disabled = false;
    });
};
el('play').onclick = () => { showPlayback(togglePlayback()); };
el('propertiesTab').onclick = () => {
  tab = 'props';
  controls();
};
el('animationTab').onclick = () => {
  tab = 'anim';
  controls();
};
el('reset').onclick = () => {
  if (recipe) {
    const row = catalog.find((v) => v.id === recipe?.template);
    if (row) { applyRecipe(row.recipe); stage.place(true); }
  } else if (imported) {
    applyImportEdits(imported, {
      name:
        imported.source.kind === 'polyfork'
          ? imported.source.title
          : imported.source.filename.replace(/\.glb$/i, ''),
      scale: 1,
      proportion: 1,
      tint: '#ffffff',
    });
    stage.place(true);
    toolbar();
    controls();
  }
};
el('grid').setAttribute('aria-pressed', 'true');
el('wire').setAttribute('aria-pressed', 'false');
el('grid').onclick = () => {
  grid = !grid;
  stage.showGrid(grid);
  el('grid').setAttribute('aria-pressed', String(grid));
};
el('wire').onclick = () => {
  wire = !wire;
  stage.wireframe(wire);
  el('wire').setAttribute('aria-pressed', String(wire));
};
el('fit').onclick = () => {
  stage.place(true);
  el<HTMLSelectElement>('view').value = 'Perspective';
};
el<HTMLSelectElement>('view').onchange = (e) => {
  stage.view((e.currentTarget as HTMLSelectElement).value as View);
};
el('expand').onclick = () => {
  void (document.fullscreenElement ? document.exitFullscreen() : el('scenePanel').requestFullscreen()).catch(
    report,
  );
};
stage.onTick = (frac) => {
  const slider = document.querySelector<HTMLInputElement>('#timeline');
  if (slider) {
    slider.value = String(frac);
    slider.style.setProperty('--pct', String(frac * 100) + '%');
  }
};
stage.onReady = () => {
  window.__shotReady = true;
};
const api = {
  listTemplates: () => structuredClone(catalog),
  getRecipe: () => (recipe ? { ...recipe } : null),
  applyRecipe,
  save,
  listInventory: async () => [...readInventory(), ...(await listImports())],
  exportGLB,
  openPolyfork: openRemote,
  getImportEdits: () => (imported ? { ...imported.edits } : null),
  setImportEdits: (edits: ImportEdits) => {
    if (!imported) throw new Error('Open an imported GLB first.');
    applyImportEdits(imported, edits);
    stage.place(false);
    toolbar();
    controls();
  },
  listClips: () => availableClips().map(({ name, duration }) => ({ name, duration })),
  playClip: (index: number) => {
    if (!availableClips()[index]) throw new Error('Unknown animation clip.');
    stage.setClip(index);
    stage.play(true);
    controls();
  },
};
declare global {
  interface Window {
    forgeStudio: typeof api;
    __shotReady: boolean;
  }
}
window.forgeStudio = api;
window.__shotReady = false;
choose(catalog.find((row) => row.id === params.get('asset'))?.recipe ?? initial);
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
