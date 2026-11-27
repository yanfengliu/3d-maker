import { parseRecipe, type Recipe } from './recipe';

export interface SavedAsset {
  id: string;
  recipe: Recipe;
  updatedAt: string;
}

// One key per asset keeps saves in different tabs from clobbering unrelated work.
const prefix = '3d-maker:inventory:v1:';

function decode(id: string, raw: string): SavedAsset | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || !('recipe' in value) || !('updatedAt' in value)) return null;
    if (typeof value.updatedAt !== 'string' || !Number.isFinite(Date.parse(value.updatedAt))) return null;
    return { id, recipe: parseRecipe(value.recipe), updatedAt: value.updatedAt };
  } catch {
    // Leave a damaged record intact for recovery and keep the rest of the inventory usable.
    return null;
  }
}

export function readInventory(): SavedAsset[] {
  const assets: SavedAsset[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(prefix)) continue;
    const raw = localStorage.getItem(key);
    const asset = raw && decode(key.slice(prefix.length), raw);
    if (asset) assets.push(asset);
  }
  return assets.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
}

export function saveAsset(recipe: Recipe, id?: string): SavedAsset {
  const validated = parseRecipe(recipe);
  if (id !== undefined && localStorage.getItem(prefix + id) === null) throw new Error('This saved asset has been removed.');
  const asset = { id: id ?? crypto.randomUUID(), recipe: validated, updatedAt: new Date().toISOString() };
  localStorage.setItem(prefix + asset.id, JSON.stringify({ recipe: asset.recipe, updatedAt: asset.updatedAt }));
  return asset;
}

export function removeAsset(id: string): void {
  localStorage.removeItem(prefix + id);
}
