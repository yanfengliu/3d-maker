import { parseRecipe } from './data/recipe';
import { buildModel } from './models';
export { catalog, parseRecipe } from './data/recipe';
export type { Recipe, TemplateId } from './data/recipe';
/** Build an independent animated Group from validated JSON for a three.js scene. */
export function createAsset(recipe: unknown) {
  return buildModel(parseRecipe(recipe));
}
