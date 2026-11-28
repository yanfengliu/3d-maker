import { Viewport, disposeModel } from './viewport';
import { catalog, type Recipe } from '../data/recipe';
import { preloadAllExpansionPacks } from '../models/expansion/lazy';
import { buildStudioModel } from '../models/studio-build';

let stage: Viewport | undefined;
export function thumbnail(recipe: Recipe) {
  if (!stage) {
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;width:300px;height:164px;left:-10000px;top:0;pointer-events:none';
    document.body.append(host);
    stage = new Viewport(host, true);
  }
  const old = stage.model;
  stage.setModel(buildStudioModel(recipe));
  if (old) disposeModel(old);
  return stage.snapshot();
}
export async function starterPosters(skipIds?: readonly string[]) {
  await preloadAllExpansionPacks();
  const skip = skipIds?.length ? new Set(skipIds) : null;
  const rows = skip ? catalog.filter((row) => !skip.has(row.id)) : catalog;
  return rows.map((row) => ({ id: row.id, image: thumbnail(row.recipe) }));
}
