import type { ProceduralAssetDef } from '../../collection-types';
import { charactersAdventureMeta, type ExpansionMetaItem } from '../meta/characters-adventure';
import { charAsset, det, rig } from './characters-adventure-kit';
import {
  buildBattleWarmage, buildClockworkAutomaton, buildCyberneticNetrunner, buildGalacticBountyHunter,
  buildMysticAlchemist, buildOrbitalStarMarine, buildPlagueApothecary, buildRoninWanderer,
  buildShadowShinobi, buildVikingShieldmaiden,
} from './characters-adventure-a';
import {
  buildArenaGladiator, buildChronoTinkerer, buildForestDruidShaman, buildFrostPaladin,
  buildHeavyMechaPilot, buildRoyalMusketeer, buildSkyshipCorsair, buildSpaceExobotanist,
  buildTempleMonk, buildWastelandScavenger,
} from './characters-adventure-b';

function metaAt(id: string): ExpansionMetaItem {
  const found = charactersAdventureMeta.find(item => item.id === id);
  if (!found) throw new Error('Missing characters-adventure meta: ' + id);
  return found;
}

export const charactersAdventurePack: readonly ProceduralAssetDef[] = [
  charAsset(metaAt('battle-warmage'),
    [rig('SpellFocus', 'Spell focus', 'y', [0, 360], 'Spins the ringed arcane crystal spell focus')],
    [det('WarmageMantle', 'Warmage mantle', 'Detachable armored shoulder mantle and crimson battle cape')], buildBattleWarmage),
  charAsset(metaAt('viking-shieldmaiden'),
    [rig('ShieldArm', 'Round shield', 'y', [-35, 35], 'Pivots the forearm-mounted Nordic round shield')],
    [det('NordicHelm', 'Nordic helm', 'Detachable horned iron spangenhelm with bronze nasal guard')], buildVikingShieldmaiden),
  charAsset(metaAt('ronin-wanderer'),
    [rig('KatanaHilt', 'Katana blade', 'x', [-35, 35], 'Pivots the drawn katana blade in the right hand')],
    [det('KasaHat', 'Kasa hat', 'Detachable conical woven sedge travel hat')], buildRoninWanderer),
  charAsset(metaAt('plague-apothecary'),
    [rig('PlagueBeak', 'Beaked mask', 'x', [-20, 30], 'Tilts the hinged beaked alchemical physician mask')],
    [det('ApothecaryHat', 'Apothecary hat', 'Detachable wide-brimmed leather apothecary hat')], buildPlagueApothecary),
  charAsset(metaAt('cybernetic-netrunner'),
    [rig('NeuralVisor', 'Neural visor', 'x', [0, -52], 'Flips up the wraparound neon AR neural visor')],
    [det('DataSpine', 'Data spine', 'Detachable back-mounted vertebral cybernetic data rig')], buildCyberneticNetrunner),
  charAsset(metaAt('orbital-star-marine'),
    [rig('MarineVisor', 'Blast visor', 'x', [0, -45], 'Lifts the hinged orbital drop-trooper blast visor')],
    [det('JumpPack', 'Jump pack', 'Detachable twin-thruster orbital jump backpack')], buildOrbitalStarMarine),
  charAsset(metaAt('galactic-bounty-hunter'),
    [rig('Rangefinder', 'Rangefinder stalk', 'x', [0, 85], 'Flips the helmet rangefinder stalk down over the visor')],
    [det('BountyPack', 'Missile jetpack', 'Detachable twin-rocket bounty hunter missile jetpack')], buildGalacticBountyHunter),
  charAsset(metaAt('clockwork-automaton'),
    [rig('WindupKey', 'Wind-up key', 'z', [0, 360], 'Spins the brass clockwork wind-up key on the back')],
    [det('SteamPipes', 'Steam pipes', 'Detachable twin brass back exhaust stacks')], buildClockworkAutomaton),
  charAsset(metaAt('mystic-alchemist'),
    [rig('AlchemyLens', 'Alchemy loupe', 'z', [-40, 40], 'Swivels the brass alchemical monocle loupe lens')],
    [det('AlembicPack', 'Alembic pack', 'Detachable copper alembic distillation canister rig')], buildMysticAlchemist),
  charAsset(metaAt('shadow-shinobi'),
    [rig('ShinobiScarf', 'Shinobi scarf', 'x', [-25, 35], 'Billows the trailing crimson shinobi scarf tail')],
    [det('TwinScabbards', 'Twin scabbards', 'Detachable crossed back-slung ninjato scabbards')], buildShadowShinobi),
  charAsset(metaAt('space-exobotanist'),
    [rig('BioVisor', 'Bio visor', 'x', [0, -48], 'Raises the tinted exobiology survey helmet visor')],
    [det('BioDomePack', 'Biodome pack', 'Detachable back specimen glass biodome pack with fern')], buildSpaceExobotanist),
  charAsset(metaAt('heavy-mecha-pilot'),
    [rig('MechaVisor', 'Mecha visor', 'x', [0, -52], 'Flips up the neural-link cockpit blast visor')],
    [det('SyncPack', 'Sync pack', 'Detachable neural-sync dual battery backpack')], buildHeavyMechaPilot),
  charAsset(metaAt('forest-druid-shaman'),
    [rig('DruidTotem', 'Druid totem', 'z', [-25, 25], 'Sways the carved wildwood spirit totem staff')],
    [det('AntlerCrown', 'Antler crown', 'Detachable branching stag antler shaman crown')], buildForestDruidShaman),
  charAsset(metaAt('arena-gladiator'),
    [rig('ArenaVisor', 'Grille visor', 'x', [0, -48], 'Raises the hinged bronze arena grille visor')],
    [det('GladiatorBuckler', 'Arena buckler', 'Detachable spiked bronze forearm buckler')], buildArenaGladiator),
  charAsset(metaAt('skyship-corsair'),
    [rig('CorsairGoggles', 'Aviator goggles', 'x', [0, -45], 'Flips the brass skyship aviator goggles onto the brow')],
    [det('CorsairWings', 'Glider wings', 'Detachable ribbed canvas skyship glider wingpack')], buildSkyshipCorsair),
  charAsset(metaAt('temple-monk'),
    [rig('PrayerWheel', 'Prayer wheel', 'y', [0, 360], 'Spins the embossed brass monastery prayer wheel')],
    [det('PilgrimHat', 'Pilgrim hat', 'Detachable back-slung conical woven bamboo pilgrim hat')], buildTempleMonk),
  charAsset(metaAt('wasteland-scavenger'),
    [rig('ScrapRadar', 'Scrap radar', 'y', [0, 360], 'Rotates the shoulder-mounted salvage radar dish')],
    [det('SalvagePack', 'Salvage pack', 'Detachable bolted wasteland scrap-crate backpack')], buildWastelandScavenger),
  charAsset(metaAt('frost-paladin'),
    [rig('FrostBlade', 'Frost blade', 'x', [-35, 35], 'Tilts the crystalline glacial paladin greatsword')],
    [det('FrostHelm', 'Frost helm', 'Detachable winged glacial knight crown helm')], buildFrostPaladin),
  charAsset(metaAt('chrono-tinkerer'),
    [rig('ChronoLoupe', 'Chrono loupe', 'x', [0, -55], 'Flips up the multi-lens brass horologist loupe')],
    [det('ChronoPack', 'Chrono pack', 'Detachable clockface pendulum horologist backpack')], buildChronoTinkerer),
  charAsset(metaAt('royal-musketeer'),
    [rig('RapierBlade', 'Swept rapier', 'x', [-35, 35], 'Pivots the swept-hilt royal court rapier')],
    [det('CavalierHat', 'Cavalier hat', 'Detachable plumed wide-brimmed cavalier hat')], buildRoyalMusketeer),
];
