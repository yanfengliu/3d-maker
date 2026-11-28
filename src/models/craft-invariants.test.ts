import * as T from 'three'
import { afterAll, describe, expect, it } from 'vitest'
import { inspectAsset } from '../capabilities/runtime'
import { listVariations } from '../data/recipe'
import { auditModelCraft } from './craft-invariants'
import { buildModel } from './index'

// Explicit narrow allowlist ONLY for models with intentional levitating fantasy elements.
const INTENTIONAL_FLOATING_KEYS = new Set<string>([
  'crystal-geode-spire@default', // FloatingShard crystal orbiting above the geode spire
  'mushroom-fairy-ring@default', // Bioluminescent spore ring drifting over the giant cap
])

describe('craft-invariants synthetic defect detection', () => {
  const matA = new T.MeshStandardMaterial({ color: '#c44536', roughness: 0.7 })
  const matB = new T.MeshStandardMaterial({ color: '#2b59c3', roughness: 0.7 })

  it('catches a floating disconnected mesh', () => {
    const root = new T.Group()
    const base = new T.Mesh(new T.BoxGeometry(1, 0.5, 1), matA)
    base.position.set(0, 0.25, 0)
    const floater = new T.Mesh(new T.BoxGeometry(0.3, 0.3, 0.3), matB)
    floater.name = 'BrokenFloater'
    floater.position.set(0, 1.4, 0)
    root.add(base, floater)
    const audit = auditModelCraft(root)
    expect(audit.floatingComponents.length).toBe(1)
    expect(audit.floatingComponents[0]?.meshNames).toContain('BrokenFloater')
  })

  it('catches exposed coplanar Z-fighting while ignoring buried internal overlaps', () => {
    const exposed = new T.Group()
    const slabA = new T.Mesh(new T.BoxGeometry(1, 0.5, 1), matA)
    slabA.position.set(0, 0.25, 0)
    const slabB = new T.Mesh(new T.BoxGeometry(0.6, 0.5, 0.6), matB)
    slabB.position.set(0, 0.25, 0)
    exposed.add(slabA, slabB)
    expect(auditModelCraft(exposed).exposedZFightPairs.length).toBeGreaterThan(0)

    // Now completely enclose the coplanar pair inside a larger solid casing (clear on all 6 faces)
    const casing = new T.Mesh(new T.BoxGeometry(2, 1.4, 2), new T.MeshStandardMaterial({ color: '#888888', roughness: 0.8 }))
    casing.position.set(0, 0.5, 0)
    exposed.add(casing)
    expect(auditModelCraft(exposed).exposedZFightPairs).toEqual([])
  })

  it('catches open-bottom single-sided shells, DoubleSide materials, and glossy matte finishes', () => {
    const openRoot = new T.Group()
    const openCylinder = new T.Mesh(new T.CylinderGeometry(0.8, 0.8, 1.2, 16, 1, true), matA)
    openCylinder.position.set(0, 0.6, 0)
    const lid = new T.Mesh(new T.CircleGeometry(0.8, 16), matA)
    lid.rotation.x = -Math.PI / 2
    lid.position.set(0, 1.2, 0)
    openRoot.add(openCylinder, lid)
    const openAudit = auditModelCraft(openRoot)
    expect(openAudit.bottomToTopRatio).toBeLessThan(0.1)

    const badMatRoot = new T.Group()
    const badMesh = new T.Mesh(
      new T.BoxGeometry(1, 1, 1),
      new T.MeshStandardMaterial({ color: '#aa7755', roughness: 0.05, metalness: 0, side: T.DoubleSide }),
    )
    badMesh.position.set(0, 0.5, 0)
    badMatRoot.add(badMesh)
    const badAudit = auditModelCraft(badMatRoot)
    expect(badAudit.doubleSidedMeshes.length).toBe(1)
    expect(badAudit.materialIssues.length).toBe(1)
  })
})

describe.each(listVariations())('craft invariants: $key', ({ key, recipe }) => {
  let cachedModel: T.Group | undefined
  let cachedAudit: ReturnType<typeof auditModelCraft> | undefined
  const getModel = () => (cachedModel ??= buildModel({ ...recipe, quality: 'standard' }))
  const getAudit = () => (cachedAudit ??= auditModelCraft(getModel()))
  afterAll(() => {
    cachedModel = undefined
    cachedAudit = undefined
  })

  it('has finite watertight geometry, grounded base, clean materials, and zero DoubleSide shells', () => {
    const audit = getAudit()
    expect(audit.meshCount).toBeGreaterThan(0)
    expect(audit.nonFiniteVertices).toBe(0)
    expect(audit.doubleSidedMeshes).toEqual([])
    expect(audit.materialIssues).toEqual([])
    expect(audit.minY).toBeGreaterThanOrEqual(-0.025)
    expect(audit.minY).toBeLessThanOrEqual(0.08)
    expect(audit.bottomToTopRatio).toBeGreaterThanOrEqual(0.55)
    expect(audit.backToFrontRatio).toBeGreaterThanOrEqual(0.55)
    expect(audit.leftRightBalance).toBeGreaterThanOrEqual(0.45)
  })

  it('has zero unintended floating parts', () => {
    const audit = getAudit()
    if (INTENTIONAL_FLOATING_KEYS.has(key)) {
      expect(audit.floatingComponents.length).toBeGreaterThan(0)
    } else {
      expect(audit.floatingComponents).toEqual([])
    }
  })

  it('has zero exposed coplanar Z-fighting faces', () => {
    expect(getAudit().exposedZFightPairs).toEqual([])
  })

  it('stays connected and watertight when any detachable part is hidden', () => {
    const model = getModel()
    const caps = inspectAsset(model)
    for (const part of caps.detachableParts) {
      const node = model.getObjectByName(part.name)
      expect(node).toBeDefined()
      if (!node) continue
      node.visible = false
      const detachedAudit = auditModelCraft(model)
      node.visible = true
      expect(detachedAudit.bottomToTopRatio).toBeGreaterThanOrEqual(0.55)
      expect(detachedAudit.backToFrontRatio).toBeGreaterThanOrEqual(0.55)
      if (!INTENTIONAL_FLOATING_KEYS.has(key)) {
        expect(detachedAudit.floatingComponents).toEqual([])
      }
    }
  })
})
