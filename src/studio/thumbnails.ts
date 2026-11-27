import { Viewport, disposeModel } from './viewport';
import { catalog, type Recipe } from '../data/recipe';
import { buildModel } from '../models';

let stage: Viewport | undefined;
export function thumbnail(recipe: Recipe) {
  if (!stage) {
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;width:300px;height:164px;left:-10000px;top:0;pointer-events:none';
    document.body.append(host);
    stage = new Viewport(host, true);
  }
  const old = stage.model;
  stage.setModel(buildModel(recipe));
  if (old) disposeModel(old);
  return stage.snapshot();
}
export function starterPosters() {
  return catalog.map((row) => ({ id: row.id, image: thumbnail(row.recipe) }));
}
