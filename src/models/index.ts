import * as T from 'three'
import type { Recipe } from '../data/recipe'
import { character } from './character'
import { attachOriginalCapabilities } from './capabilities'
import { drone } from './drone'
import { cargo, rover, tower } from './equipment'
import { finishes } from './parts'

/** Create an independently owned, animated asset. +Y is up and +Z is forward. */
export function buildModel(recipe: Recipe): T.Group {
  const root = new T.Group()
  root.name = 'Asset'
  const palette = finishes(recipe)
  switch (recipe.template) {
    case 'relay-drone': drone(root, palette, recipe.detail); break
    case 'field-rover': rover(root, palette, recipe.detail); break
    case 'cargo-pod': cargo(root, palette, recipe.detail); break
    case 'signal-tower': tower(root, palette, recipe.detail); break
    case 'survey-bot': character(root, palette, false, recipe.detail); break
    case 'field-pilot': character(root, palette, true, recipe.detail); break
  }
  root.userData.recipe = { ...recipe }
  root.scale.set(recipe.scale * recipe.proportion, recipe.scale, recipe.scale)
  attachOriginalCapabilities(root, recipe)
  return root
}
