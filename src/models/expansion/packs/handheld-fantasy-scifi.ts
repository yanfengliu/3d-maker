import type { ProceduralAssetDef } from '../../collection-types';
import { handheldFantasyScifiMeta, type ExpansionMetaItem } from '../meta/handheld-fantasy-scifi';
import { det, handheldAsset, rig } from './handheld-fantasy-scifi-kit';
import {
  buildCrystalScepterStand, buildDoubleBitBattleaxe, buildDwarvenWarhammer, buildElvenRecurveBowStand,
  buildGrimoireSpellbookPodium, buildKnightBroadswordRack, buildLacqueredKatanaStand,
  buildPirateFlintlockPistol, buildPolearmHalberdRack, buildVikingRoundShield,
} from './handheld-fantasy-scifi-a';
import {
  buildCryoFreezeBlaster, buildGrapplingHookLauncher, buildHandheldBioScanner, buildPalmHoloProjector,
  buildPortableCyberdeck, buildPowerGravityGauntlet, buildPulsePlasmaRifle, buildSonicDisruptorEmitter,
  buildStarfleetTricorder, buildTwinEnergyBlade,
} from './handheld-fantasy-scifi-b';

function metaAt(id: string): ExpansionMetaItem {
  const found = handheldFantasyScifiMeta.find(item => item.id === id);
  if (!found) throw new Error('Missing handheld-fantasy-scifi meta: ' + id);
  return found;
}

export const handheldFantasyScifiPack: readonly ProceduralAssetDef[] = [
  handheldAsset(metaAt('knight-broadsword-rack'),
    [rig('BroadSword', 'Broadsword', 'x', [-24, 24], 'Tilts the medieval broadsword on its twin-pillar oak rack')],
    [], buildKnightBroadswordRack),
  handheldAsset(metaAt('dwarven-warhammer'),
    [rig('WarHammer', 'Warhammer', 'z', [-22, 22], 'Rocks the forged twin-faced dwarven warhammer in its plinth')],
    [], buildDwarvenWarhammer),
  handheldAsset(metaAt('double-bit-battleaxe'),
    [rig('BattleAxe', 'Battleaxe', 'z', [-24, 24], 'Rocks the symmetrical double-bit battleaxe in its armory saddle')],
    [], buildDoubleBitBattleaxe),
  handheldAsset(metaAt('elven-recurve-bow-stand'),
    [rig('DrawArrow', 'Draw arrow', 'z', [0, -0.22], 'Draws the nocked elven arrow backward along the riser', 'slide')],
    [], buildElvenRecurveBowStand),
  handheldAsset(metaAt('grimoire-spellbook-podium'),
    [rig('BookCover', 'Spellbook cover', 'z', [0, -105], 'Opens the hinged jewel-clasped arcane grimoire cover')],
    [det('BookmarkOrb', 'Crystal bookmark', 'Removable ribbon bookmark weighted with a faceted crystal orb')],
    buildGrimoireSpellbookPodium),
  handheldAsset(metaAt('pirate-flintlock-pistol'),
    [
      rig('FlintHammer', 'Flintlock hammer', 'x', [0, -48], 'Cocks the curved spark-striking flint hammer back'),
      rig('PistolTrigger', 'Pistol trigger', 'x', [0, -25], 'Rocks the curved brass flintlock trigger'),
    ],
    [], buildPirateFlintlockPistol),
  handheldAsset(metaAt('lacquered-katana-stand'),
    [rig('KatanaBlade', 'Katana blade', 'x', [-20, 20], 'Tilts the curved steel katana on the upper katanakake tier')],
    [det('SayaSheath', 'Saya scabbard', 'Detachable crimson-lacquered wooden scabbard with sageo cord')],
    buildLacqueredKatanaStand),
  handheldAsset(metaAt('polearm-halberd-rack'),
    [rig('HalberdShaft', 'Halberd shaft', 'z', [-18, 18], 'Tilts the banded infantry halberd in its weighted socket')],
    [], buildPolearmHalberdRack),
  handheldAsset(metaAt('crystal-scepter-stand'),
    [
      rig('ManaCrystal', 'Mana crystal', 'y', [0, 360], 'Spins the faceted arcane crystal inside the scepter prongs'),
      rig('ScepterRing', 'Halo ring', 'z', [0, 360], 'Orbits the gilded brass halo ring around the crystal crown'),
    ],
    [], buildCrystalScepterStand),
  handheldAsset(metaAt('viking-round-shield'),
    [
      rig('ShieldTilt', 'Shield tilt', 'x', [-15, 15], 'Tilts the banded Nordic round shield on its timber easel'),
      rig('ShieldBoss', 'Runic boss', 'z', [0, 360], 'Spins the domed bronze runic center shield boss'),
    ],
    [], buildVikingRoundShield),
  handheldAsset(metaAt('pulse-plasma-rifle'),
    [rig('PlasmaBolt', 'Charging bolt', 'z', [0, -0.18], 'Cycles the reciprocating bullpup plasma charging bolt', 'slide')],
    [det('PowerMag', 'Power magazine', 'Detachable glowing rear bullpup plasma energy cell magazine')],
    buildPulsePlasmaRifle),
  handheldAsset(metaAt('handheld-bio-scanner'),
    [
      rig('ScannerHead', 'Scanner head', 'y', [-45, 45], 'Sweeps the front optical diagnostic emitter head left and right'),
      rig('SensorFin', 'Sensor fin', 'x', [0, -75], 'Flips up the curved upper medical telemetry sensor fin'),
    ],
    [], buildHandheldBioScanner),
  handheldAsset(metaAt('grappling-hook-launcher'),
    [
      rig('CableDrum', 'Cable drum', 'x', [0, 360], 'Spins the geared side winch drum winding the grapple line'),
      rig('GrappleClaw', 'Grapple claw', 'z', [0, 0.28], 'Extends the four-prong barbed grappling claw forward', 'slide'),
    ],
    [], buildGrapplingHookLauncher),
  handheldAsset(metaAt('cryo-freeze-blaster'),
    [rig('CryoNozzle', 'Cryo nozzle', 'z', [0, 360], 'Spins the front liquid-nitrogen vortex diffuser nozzle')],
    [det('CryoTank', 'Cryo tank', 'Detachable pressurized frosted liquid-nitrogen coolant canister')],
    buildCryoFreezeBlaster),
  handheldAsset(metaAt('twin-energy-blade'),
    [
      rig('EnergyHilt', 'Energy hilt', 'y', [-40, 40], 'Pivots the dual-emitter plasma blade hilt on its altar mount'),
      rig('EmitterGuard', 'Emitter guard', 'x', [0, 0.12], 'Slides the armored central emitter shroud along the hilt', 'slide'),
    ],
    [], buildTwinEnergyBlade),
  handheldAsset(metaAt('sonic-disruptor-emitter'),
    [
      rig('SonicRings', 'Sonic rings', 'z', [0, 0.16], 'Extends the stepped parabolic acoustic emitter rings', 'slide'),
      rig('FreqDial', 'Frequency dial', 'z', [0, 360], 'Spins the rear knurled harmonic frequency calibration wheel'),
    ],
    [], buildSonicDisruptorEmitter),
  handheldAsset(metaAt('palm-holo-projector'),
    [
      rig('PetalRing', 'Iris petal ring', 'y', [0, 360], 'Rotates the eight-petal holographic emitter iris collar'),
      rig('HoloCore', 'Hologram core', 'y', [0, 360], 'Spins the projected planetary hologram core and orbit ring'),
    ],
    [], buildPalmHoloProjector),
  handheldAsset(metaAt('power-gravity-gauntlet'),
    [rig('FingerClaw', 'Finger claws', 'x', [0, 48], 'Articulates the four armored gauntlet fingers toward the palm core')],
    [], buildPowerGravityGauntlet),
  handheldAsset(metaAt('portable-cyberdeck'),
    [rig('DeckScreen', 'Deck screen', 'x', [0, -105], 'Flips up the retro-futuristic wedge cyberdeck holo display lid')],
    [det('DataCart', 'Data cartridge', 'Detachable neon-striped side memory data cartridge')],
    buildPortableCyberdeck),
  handheldAsset(metaAt('starfleet-tricorder'),
    [rig('TricorderFlap', 'Tricorder flap', 'x', [0, -110], 'Flips open the hinged upper clamshell telemetry display hood')],
    [det('MiniScanner', 'Mini scanner', 'Detachable cylindrical handheld auxiliary field scanner wand')],
    buildStarfleetTricorder),
];
