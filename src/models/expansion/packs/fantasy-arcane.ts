import type { DetachablePartSpec, RiggedPartSpec } from '../../../capabilities/schema';
import type { ProceduralAssetDef } from '../../collection-types';
import { fantasyArcaneMeta } from '../meta/fantasy-arcane';
import {
  brassArcaneAstrolabe, bubblingAlchemyCauldron, enchantedSpellLectern, glowingRuneObelisk, ironDragonBrazier,
  planetaryCrystalOrrery, runicAnvilForge, stonePortalArchway, tieredPotionRack, toothedMimicChest,
} from './fantasy-arcane-a';
import {
  alchemistDistillationStill, brassWizardTelescope, crystalPrismPedestal, dungeonHangingCage, dwarvenVaultDoor,
  goldenReliquaryAltar, grimoireBookshelf, hourglassMonolith, marbleScryingBasin, necromancerBoneThrone,
} from './fantasy-arcane-b';
import { det, rig } from './fantasy-arcane-kit';

interface BuilderEntry {
  physicsBody: 'static' | 'dynamic';
  riggedParts: readonly RiggedPartSpec[];
  detachableParts: readonly DetachablePartSpec[];
  build: ProceduralAssetDef['build'];
}

const builders: Record<string, BuilderEntry> = {
  'bubbling-alchemy-cauldron': {
    physicsBody: 'static',
    riggedParts: [rig('StirringLadle', 'Stirring ladle', 'y', [0, 360], 'Stirs the wooden ladle through the glowing brew')],
    detachableParts: [det('BrewFroth', 'Brew froth', 'Removable cluster of glowing cauldron bubbles')],
    build: bubblingAlchemyCauldron,
  },
  'brass-arcane-astrolabe': {
    physicsBody: 'static',
    riggedParts: [
      rig('OuterZodiacRing', 'Outer zodiac ring', 'y', [0, 360], 'Spins the outer engraved zodiac ring'),
      rig('InnerEclipticRing', 'Inner ecliptic ring', 'x', [0, 360], 'Tilts and orbits the inner celestial ring'),
    ],
    detachableParts: [det('CrownFinial', 'Crown finial', 'Removable arcane crystal spire atop the meridian arch')],
    build: brassArcaneAstrolabe,
  },
  'enchanted-spell-lectern': {
    physicsBody: 'static',
    riggedParts: [rig('TurningPage', 'Turning page', 'z', [0, 150], 'Turns the illuminated gilded grimoire page')],
    detachableParts: [det('CandleSconces', 'Candle sconces', 'Twin wrought-iron candle brackets on the lectern sides')],
    build: enchantedSpellLectern,
  },
  'toothed-mimic-chest': {
    physicsBody: 'dynamic',
    riggedParts: [
      rig('MimicJaw', 'Mimic jaw', 'x', [0, -68], 'Snaps the fanged monster chest lid open and shut'),
      rig('MimicTongue', 'Mimic tongue', 'x', [-24, 5], 'Lashes the curling crimson mimic tongue'),
    ],
    detachableParts: [det('SideChains', 'Side chains', 'Forged iron drop-ring shackles on the chest flanks')],
    build: toothedMimicChest,
  },
  'tiered-potion-rack': {
    physicsBody: 'static',
    riggedParts: [rig('HerbDryRack', 'Herb drying rack', 'y', [0, 78], 'Swings the hinged side herb-drying bracket')],
    detachableParts: [det('TopAlembics', 'Top alembics', 'Removable upper shelf copper retort and potion flasks')],
    build: tieredPotionRack,
  },
  'glowing-rune-obelisk': {
    physicsBody: 'static',
    riggedParts: [rig('EnergyCrown', 'Energy crown', 'y', [0, 360], 'Rotates the bronze-collared arcane crystal crown ring')],
    detachableParts: [det('WardBollards', 'Ward bollards', 'Four corner rune ward stones seated around the dais')],
    build: glowingRuneObelisk,
  },
  'planetary-crystal-orrery': {
    physicsBody: 'static',
    riggedParts: [
      rig('InnerOrbitArm', 'Inner orbit arm', 'y', [0, 360], 'Orbits the innermost ruby crystal planet'),
      rig('MidOrbitArm', 'Middle orbit arm', 'y', [0, 360], 'Orbits the ringed turquoise planet'),
      rig('OuterOrbitArm', 'Outer orbit arm', 'y', [0, 360], 'Orbits the outer amethyst crystal world and moon'),
    ],
    detachableParts: [det('CompassRail', 'Compass rail', 'Outer brass horizon ring and stanchions around the base')],
    build: planetaryCrystalOrrery,
  },
  'iron-dragon-brazier': {
    physicsBody: 'static',
    riggedParts: [rig('FlameCrown', 'Flame crown', 'y', [0, 360], 'Swirls the dancing dragonfire flame spire')],
    detachableParts: [det('DragonHorns', 'Dragon horns', 'Serrated dragon-wing iron crests bolted to the fire bowl rim')],
    build: ironDragonBrazier,
  },
  'runic-anvil-forge': {
    physicsBody: 'static',
    riggedParts: [rig('SmithHammerArm', 'Smithing hammer arm', 'x', [-38, 12], 'Raises and strikes the articulated dwarven hammer')],
    detachableParts: [det('QuenchTrough', 'Quench trough', 'Banded stone water trough and glowing rune tongs')],
    build: runicAnvilForge,
  },
  'stone-portal-archway': {
    physicsBody: 'static',
    riggedParts: [rig('PortalVortex', 'Portal vortex', 'z', [0, 360], 'Spins the recessed translucent arcane portal swirl')],
    detachableParts: [det('PortalBrazierPair', 'Portal braziers', 'Twin stone crystal braziers flanking the archway plinth')],
    build: stonePortalArchway,
  },
  'brass-wizard-telescope': {
    physicsBody: 'dynamic',
    riggedParts: [
      rig('TelescopeTube', 'Telescope tube', 'x', [-32, 32], 'Tilts the segmented brass refractor barrel'),
      rig('AzimuthHead', 'Azimuth head', 'y', [-65, 65], 'Pans the geared brass azimuth mount'),
    ],
    detachableParts: [det('StarChartTray', 'Star chart tray', 'Triangular tripod shelf holding a scroll and compass')],
    build: brassWizardTelescope,
  },
  'dungeon-hanging-cage': {
    physicsBody: 'static',
    riggedParts: [rig('HangingCage', 'Hanging cage', 'z', [-12, 12], 'Swings the chained barred iron dungeon cage')],
    detachableParts: [det('GibbetLantern', 'Gibbet lantern', 'Side iron watch lantern suspended from the gallows post')],
    build: dungeonHangingCage,
  },
  'golden-reliquary-altar': {
    physicsBody: 'static',
    riggedParts: [
      rig('ReliquaryDoorL', 'Left shrine door', 'y', [0, -110], 'Opens the left gilded triptych door'),
      rig('ReliquaryDoorR', 'Right shrine door', 'y', [0, 110], 'Opens the right gilded triptych door'),
    ],
    detachableParts: [det('TwinCandelabras', 'Twin candelabras', 'Pair of gilded three-branch altar candelabras')],
    build: goldenReliquaryAltar,
  },
  'marble-scrying-basin': {
    physicsBody: 'static',
    riggedParts: [rig('ScryingMirror', 'Scrying mirror', 'y', [0, 360], 'Rotates the luminous crystal-swirl water mirror')],
    detachableParts: [det('SerpentHandles', 'Serpent handles', 'Twin sculpted bronze serpent handles gripping the rim')],
    build: marbleScryingBasin,
  },
  'grimoire-bookshelf': {
    physicsBody: 'static',
    riggedParts: [rig('SecretBookPanel', 'Secret book door', 'y', [0, 95], 'Swings open the disguised false-book compartment')],
    detachableParts: [det('ShelfCurios', 'Shelf curios', 'Carved bone skull and bundled parchment scrolls')],
    build: grimoireBookshelf,
  },
  'alchemist-distillation-still': {
    physicsBody: 'static',
    riggedParts: [rig('PressureValveWheel', 'Pressure valve wheel', 'z', [0, 360], 'Turns the spoked brass boiler pressure wheel')],
    detachableParts: [det('ReceivingCarboy', 'Receiving carboy', 'Glass distillate carboy seated on the side timber cradle')],
    build: alchemistDistillationStill,
  },
  'crystal-prism-pedestal': {
    physicsBody: 'static',
    riggedParts: [rig('CrystalPrism', 'Crystal prism', 'y', [0, 360], 'Spins the giant multifaceted arcane prism on its spindle')],
    detachableParts: [det('FocusingProngs', 'Focusing prongs', 'Four curved brass focusing claws around the capital')],
    build: crystalPrismPedestal,
  },
  'hourglass-monolith': {
    physicsBody: 'static',
    riggedParts: [rig('HourglassVessel', 'Hourglass vessel', 'x', [0, 180], 'Flips the monumental dual-bulb hourglass on its trunnions')],
    detachableParts: [det('CrownFinial', 'Crown finial', 'Sculpted stone-and-brass sundial crest atop the monolith')],
    build: hourglassMonolith,
  },
  'dwarven-vault-door': {
    physicsBody: 'static',
    riggedParts: [
      rig('VaultDoor', 'Vault door', 'y', [0, -105], 'Swings the circular armored bronze vault door open'),
      rig('LockWheel', 'Locking wheel', 'z', [0, 360], 'Spins the central spoked bronze vault locking wheel'),
    ],
    detachableParts: [det('VaultSconces', 'Vault sconces', 'Twin dwarven bronze torch sconces on the bulkhead jambs')],
    build: dwarvenVaultDoor,
  },
  'necromancer-bone-throne': {
    physicsBody: 'static',
    riggedParts: [
      rig('ThroneOrbFinial', 'Throne orb finial', 'y', [0, 360], 'Rotates the crowned necromantic orb above the backrest'),
      rig('SeatChestLid', 'Seat chest lid', 'x', [0, -56], 'Lifts the hinged throne seat to expose the secret vault'),
    ],
    detachableParts: [det('DaisBraziers', 'Dais braziers', 'Twin obsidian-and-crystal braziers on the front dais corners')],
    build: necromancerBoneThrone,
  },
};

export const fantasyArcanePack: readonly ProceduralAssetDef[] = fantasyArcaneMeta.map(meta => {
  const entry = builders[meta.id];
  if (!entry) throw new Error('Missing fantasy-arcane builder for ' + meta.id);
  return {
    id: meta.id,
    code: meta.code,
    category: meta.category,
    browseCategory: meta.browseCategory,
    name: meta.name,
    primary: meta.primary,
    accent: meta.accent,
    description: meta.description,
    physicsBody: entry.physicsBody,
    riggedParts: entry.riggedParts,
    detachableParts: entry.detachableParts,
    build: entry.build,
  };
});
