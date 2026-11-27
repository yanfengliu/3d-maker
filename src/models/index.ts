import * as T from 'three'
import { resolveModelParams } from '../capabilities/param-schema'
import { getModelParamSpecs, type Recipe } from '../data/recipe'
import { character } from './character'
import { attachOriginalCapabilities } from './capabilities'
import { extraAssets } from './collections'
import { drone } from './drone'
import { cargo, rover, tower } from './equipment'
import { finishes } from './parts'
import { findVariation } from './variations'

const extraBuilders = new Map(extraAssets.map(asset => [asset.id, asset.build]))

/** Create an independently owned, animated asset. +Y is up and +Z is forward. */
export function buildModel(recipe: Recipe): T.Group {
  const root = new T.Group()
  root.name = 'Asset'
  const palette = finishes(recipe)
  const variation = findVariation(recipe.template, recipe.variation)
  const paramSpecs = getModelParamSpecs(recipe.template, recipe.variation)
  const resolvedParams = paramSpecs ? resolveModelParams(paramSpecs, recipe.params) : undefined
  if (!variation?.replaceBase) {
    switch (recipe.template) {
      case 'relay-drone': drone(root, palette, recipe.detail); break
      case 'field-rover': rover(root, palette, recipe.detail); break
      case 'cargo-pod': cargo(root, palette, recipe.detail); break
      case 'signal-tower': tower(root, palette, recipe.detail); break
      case 'survey-bot': character(root, palette, false, recipe.detail); break
      case 'field-pilot': character(root, palette, true, recipe.detail); break
      default: {
        const build = extraBuilders.get(recipe.template)
        if (!build) throw new Error('Unknown template: ' + recipe.template)
        build(root, palette, recipe.detail, resolvedParams)
        break
      }
    }
  }
  variation?.modify?.(root, palette, recipe.detail, resolvedParams)
  root.userData.recipe = { ...recipe, ...(recipe.params ? { params: { ...recipe.params } } : {}) }
  root.scale.set(recipe.scale * recipe.proportion, recipe.scale, recipe.scale)
  attachOriginalCapabilities(root, recipe)
  return root
}
