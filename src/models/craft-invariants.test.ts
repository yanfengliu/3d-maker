import * as T from 'three'
import { afterAll, describe, expect, it } from 'vitest'
import { inspectAsset } from '../capabilities/runtime'
import { listVariations } from '../data/recipe'
import { findAnimationDetachments } from './craft-animation'
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

  it('catches co-located full spheres/cylinders under rotating lids while allowing concave bowl + hollow lid', () => {
    const broken = new T.Group()
    const baseBall = new T.Mesh(new T.SphereGeometry(0.42, 12, 8), matA)
    baseBall.position.set(0, 0.84, 0)
    baseBall.scale.set(1, 0.74, 1)
    const lidGroup = new T.Group()
    lidGroup.name = 'KettleLid'
    lidGroup.position.set(0, 0.9, -0.42)
    const lidBall = new T.Mesh(new T.SphereGeometry(0.42, 12, 8), matA)
    lidBall.position.set(0, 0.04, 0.42)
    lidBall.scale.set(1, 0.68, 1)
    lidGroup.add(lidBall)
    broken.add(baseBall, lidGroup)

    const brokenAudit = auditModelCraft(broken, new Set(['KettleLid']))
    expect(brokenAudit.rotatingRigOverlaps.length).toBe(1)
    expect(brokenAudit.rotatingRigOverlaps[0]?.rigPart).toBe('KettleLid')
    expect(brokenAudit.rotatingRigOverlaps[0]?.jaccard).toBeGreaterThan(0.7)

    // Properly crafted concave Lathe bowl (y <= 0.88) + hollow Lathe dome lid (y >= 0.90) has zero solid overlap.
    const clean = new T.Group()
    const bowlPts = [
      new T.Vector2(0, 0.58), new T.Vector2(0.32, 0.64), new T.Vector2(0.42, 0.88),
      new T.Vector2(0.38, 0.88), new T.Vector2(0.29, 0.67), new T.Vector2(0, 0.63),
    ]
    const bowl = new T.Mesh(new T.LatheGeometry(bowlPts, 12), matA)
    const cleanLidGroup = new T.Group()
    cleanLidGroup.name = 'KettleLid'
    cleanLidGroup.position.set(0, 0.9, -0.42)
    const lidPts = [
      new T.Vector2(0.38, 0), new T.Vector2(0.42, 0), new T.Vector2(0.34, 0.2),
      new T.Vector2(0, 0.27), new T.Vector2(0, 0.23), new T.Vector2(0.31, 0.17), new T.Vector2(0.38, 0),
    ]
    const lidDome = new T.Mesh(new T.LatheGeometry(lidPts, 12), matA)
    lidDome.position.set(0, 0, 0.42)
    cleanLidGroup.add(lidDome)
    clean.add(bowl, cleanLidGroup)

    const cleanAudit = auditModelCraft(clean, new Set(['KettleLid']))
    expect(cleanAudit.rotatingRigOverlaps).toEqual([])
  })

  it('catches animated parts that detach from their mechanism mid-stroke while passing seated pistons', () => {
    const makePress = (rodHeight: number, rodOffsetY: number) => {
      const root = new T.Group()
      const frame = new T.Group()
      frame.name = 'PressFrame'
      const pillarL = new T.Mesh(new T.BoxGeometry(0.12, 2, 0.2), matA)
      pillarL.position.set(-0.5, 1, 0)
      const pillarR = new T.Mesh(new T.BoxGeometry(0.12, 2, 0.2), matA)
      pillarR.position.set(0.5, 1, 0)
      const topBeam = new T.Mesh(new T.BoxGeometry(1.2, 0.16, 0.24), matA)
      topBeam.position.set(0, 1.96, 0)
      const cylinder = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 0.36, 12), matA)
      cylinder.position.set(0, 1.76, 0)
      const bolster = new T.Mesh(new T.BoxGeometry(1.1, 0.14, 0.26), matA)
      bolster.position.set(0, 0.96, 0)
      frame.add(pillarL, pillarR, topBeam, cylinder, bolster)

      const ram = new T.Group()
      ram.name = 'PressRam'
      ram.position.set(0, 1.46, 0)
      const rod = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, rodHeight, 10), matB)
      rod.position.set(0, rodOffsetY, 0)
      const shoe = new T.Mesh(new T.BoxGeometry(0.24, 0.09, 0.22), matB)
      shoe.position.set(0, -0.09, 0)
      ram.add(rod, shoe)
      root.add(frame, ram)
      root.animations = [
        new T.AnimationClip('Press stroke', 2, [
          new T.VectorKeyframeTrack('PressRam.position', [0, 1, 2], [0, 1.46, 0, 0, 1.16, 0, 0, 1.46, 0]),
        ]),
      ]
      return root
    }

    // Short 0.30m rod pulls completely out of the upper cylinder mid-stroke and floats in mid-air.
    const broken = makePress(0.3, 0.08)
    const brokenIssues = findAnimationDetachments(broken)
    expect(brokenIssues.length).toBeGreaterThan(0)
    expect(brokenIssues.some(i => i.kind === 'floating-clip' || i.kind === 'lost-anchor-clip')).toBe(true)

    // Full 0.56m rod remains seated inside the hydraulic cylinder throughout the entire stroke.
    const seated = makePress(0.56, 0.22)
    expect(findAnimationDetachments(seated)).toEqual([])
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

  it('has zero rotating rigged solids buried inside stationary bodies', () => {
    expect(getAudit().rotatingRigOverlaps).toEqual([])
  })

  it('keeps every animated and rigged part attached throughout motion', () => {
    if (INTENTIONAL_FLOATING_KEYS.has(key)) return
    expect(findAnimationDetachments(getModel())).toEqual([])
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
