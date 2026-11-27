import { ensureCharacterAnimations } from '../animation/lazy';
import { createAssetController, type AssetController } from '../capabilities/runtime';
import type { Recipe } from '../data/recipe';
import type { ImportedAsset } from '../imports';
import { buildModel } from '../models';
import type { ExportOptions } from './export';
import { disposeModel } from './stage-env';
import type { Viewport } from './viewport';

export interface ExportTarget {
  stage: Viewport;
  recipe: Recipe | null;
  imported: ImportedAsset | null;
  originalController: AssetController | null;
}

export async function exportStudioGlb(target: ExportTarget, options?: ExportOptions): Promise<ArrayBuffer> {
  const [{ GLTFExporter }, { cloneForExport }] = await Promise.all([
    import('three/addons/exporters/GLTFExporter.js'),
    import('./export'),
  ]);
  const source = target.imported?.group;
  const snapshot = source ? target.stage.restClone(() => cloneForExport(source, options, target.imported?.controller)) : null;
  const builtOriginal = target.recipe ? buildModel(target.recipe) : null;
  let exportCtrl: AssetController | null = null;
  if (builtOriginal) {
    const origState = target.originalController?.getState();
    exportCtrl = createAssetController(builtOriginal);
    const exportMimics = new Set(exportCtrl.capabilities.riggedParts.filter(p => p.mimic).map(p => p.name));
    for (const [part, val] of Object.entries(origState?.pose ?? {})) {
      if (!exportMimics.has(part)) exportCtrl.setPart(part, val);
    }
    for (const part of origState?.hiddenParts ?? []) exportCtrl.setVisible(part, false);
    if (origState?.night && exportCtrl.capabilities.nightZones.length) exportCtrl.setNight(true);
    if (origState?.decalText && exportCtrl.capabilities.decals.length) exportCtrl.setDecalsVisible(true, origState.decalText);
    await ensureCharacterAnimations(builtOriginal);
  }
  const originalSnap = builtOriginal ? cloneForExport(builtOriginal, options, exportCtrl) : null;
  exportCtrl?.dispose();
  const model = originalSnap?.root ?? snapshot?.root;
  if (!model) throw new Error('Choose an asset to export.');
  try {
    if (!builtOriginal) await ensureCharacterAnimations(model);
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

export async function downloadStudioGlb(
  assetName: string,
  target: ExportTarget,
  options?: ExportOptions,
): Promise<void> {
  const filename = assetName.replace(/[^a-z\d -]/gi, '').trim() || 'asset';
  const url = URL.createObjectURL(new Blob([await exportStudioGlb(target, options)], { type: 'model/gltf-binary' }));
  Object.assign(document.createElement('a'), { href: url, download: filename + '.glb' }).click();
  window.setTimeout(() => { URL.revokeObjectURL(url); }, 10000);
}
