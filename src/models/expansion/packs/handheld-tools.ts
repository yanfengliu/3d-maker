import type { ProceduralAssetDef } from '../../collection-types';
import { handheldToolsMeta, type ExpansionMetaItem } from '../meta/handheld-tools';
import { det, rig, toolAsset } from './handheld-tools-kit';
import {
  buildBrassBlowtorch, buildBrassMarineSextant, buildConcertViolinBow, buildCordlessCircularSaw,
  buildDiatonicButtonAccordion, buildMasterWrenchRack, buildMegaphoneBullhorn,
  buildSolidbodyElectricGuitar, buildSurveyorTheodolite, buildTravelGramophone,
} from './handheld-tools-a';
import {
  buildBrassOilCanFunnel, buildChefCleaverBlock, buildDraftingTransitLevel, buildFieldWalkieTalkie,
  buildLeatherMedicSatchel, buildPrismBinoculars, buildSolderingIronStation, buildStormHurricaneLamp,
  buildTwinLensReflexCamera, buildYellowGeigerCounter,
} from './handheld-tools-b';

function metaAt(id: string): ExpansionMetaItem {
  const found = handheldToolsMeta.find(item => item.id === id);
  if (!found) throw new Error('Missing handheld-tools meta: ' + id);
  return found;
}

export const handheldToolsPack: readonly ProceduralAssetDef[] = [
  toolAsset(metaAt('surveyor-theodolite'), [
    rig('TheodoliteYaw', 'Theodolite yoke', 'y', [-90, 90], 'Pans the brass optical yoke horizontally'),
    rig('SightScope', 'Sight telescope', 'x', [-45, 45], 'Tilts the precision sighting telescope in elevation'),
  ], [], buildSurveyorTheodolite),
  toolAsset(metaAt('brass-marine-sextant'), [
    rig('IndexArm', 'Index arm', 'z', [-38, 38], 'Sweeps the mirrored index arm along the graduated arc limb'),
  ], [], buildBrassMarineSextant),
  toolAsset(metaAt('megaphone-bullhorn'), [
    rig('MicHandset', 'Mic handset', 'x', [-35, 35], 'Pivots the rear coiled-cord speaker microphone'),
    rig('TriggerLever', 'Trigger lever', 'x', [0, -28], 'Squeezes the acoustic broadcast grip trigger'),
  ], [], buildMegaphoneBullhorn),
  toolAsset(metaAt('travel-gramophone'), [
    rig('TurntablePlatter', 'Turntable platter', 'y', [0, 360], 'Spins the felt turntable platter and vinyl record'),
    rig('ToneArm', 'Tonearm', 'y', [-25, 20], 'Swings the brass reproducer tonearm over the record'),
  ], [
    det('GramophoneHorn', 'Gramophone horn', 'Detachable flared scalloped brass acoustic horn'),
  ], buildTravelGramophone),
  toolAsset(metaAt('solidbody-electric-guitar'), [
    rig('GuitarBody', 'Guitar body', 'z', [-10, 10], 'Sways the solidbody electric guitar on its stage stand'),
    rig('WhammyBar', 'Whammy bar', 'x', [-25, 25], 'Pivots the chrome bridge tremolo bar'),
  ], [], buildSolidbodyElectricGuitar),
  toolAsset(metaAt('concert-violin-bow'), [
    rig('ViolinBow', 'Violin bow', 'z', [-24, 24], 'Sweeps the horsehair concert bow across the strings'),
  ], [], buildConcertViolinBow),
  toolAsset(metaAt('diatonic-button-accordion'), [
    rig('AccordionSlide', 'Accordion bellows', 'x', [0, 0.22], 'Expands and compresses the pleated bellows', 'slide'),
  ], [], buildDiatonicButtonAccordion),
  toolAsset(metaAt('brass-blowtorch'), [
    rig('PumpPlunger', 'Air pump plunger', 'x', [0, 0.16], 'Pumps the pressurized brass air piston', 'slide'),
    rig('ValveWheel', 'Valve wheel', 'y', [0, 360], 'Spins the spoked top burner fuel control valve'),
  ], [], buildBrassBlowtorch),
  toolAsset(metaAt('cordless-circular-saw'), [
    rig('SawBlade', 'Saw blade', 'z', [0, 360], 'Spins the toothed carbide circular saw blade'),
    rig('BladeGuard', 'Blade guard', 'z', [0, -55], 'Retracts the curved lower safety blade guard'),
  ], [], buildCordlessCircularSaw),
  toolAsset(metaAt('master-wrench-rack'), [
    rig('CenterRatchet', 'Center ratchet', 'z', [-42, 42], 'Swings the center reversible socket ratchet wrench'),
  ], [
    det('SocketTray', 'Socket tray', 'Removable lower tray holding six graduated chrome drive sockets'),
  ], buildMasterWrenchRack),
  toolAsset(metaAt('yellow-geiger-counter'), [
    rig('GeigerNeedle', 'Gauge needle', 'z', [-48, 48], 'Sweeps the analog radiation count meter needle'),
  ], [
    det('ProbeWand', 'Probe wand', 'Detachable side-docked Geiger-Muller detector wand'),
  ], buildYellowGeigerCounter),
  toolAsset(metaAt('field-walkie-talkie'), [
    rig('ChannelDial', 'Channel dial', 'y', [0, 360], 'Spins the rotary tactical radio channel selector'),
    rig('WhipAntenna', 'Whip antenna', 'y', [0, 0.34], 'Extends the telescoping alloy whip antenna', 'slide'),
  ], [], buildFieldWalkieTalkie),
  toolAsset(metaAt('prism-binoculars'), [
    rig('FocusWheel', 'Focus wheel', 'x', [0, 360], 'Rolls the central optical focus drum'),
    rig('LeftBarrel', 'Left barrel', 'z', [-18, 18], 'Hinges the left Porro-prism barrel for eye spacing'),
  ], [], buildPrismBinoculars),
  toolAsset(metaAt('storm-hurricane-lamp'), [
    rig('LanternBail', 'Lantern bail', 'x', [-48, 48], 'Swings the overhead wire carrying bail'),
    rig('WickKnob', 'Wick knob', 'z', [0, 360], 'Rotates the brass burner wick adjuster star-wheel'),
  ], [], buildStormHurricaneLamp),
  toolAsset(metaAt('drafting-transit-level'), [
    rig('LevelTurret', 'Level turret', 'y', [-120, 120], 'Pans the optical builder transit head horizontally'),
    rig('FocusKnob', 'Focus knob', 'x', [0, 360], 'Turns the side rack-and-pinion optical focus dial'),
  ], [], buildDraftingTransitLevel),
  toolAsset(metaAt('chef-cleaver-block'), [
    rig('HeroCleaver', 'Chef cleaver', 'x', [0, -32], 'Rocks the broad steel chef cleaver out of its slot'),
  ], [
    det('HoningSteel', 'Honing steel', 'Detachable side-mounted steel knife honing rod'),
  ], buildChefCleaverBlock),
  toolAsset(metaAt('twin-lens-reflex-camera'), [
    rig('FilmCrank', 'Film crank', 'x', [0, 360], 'Winds the right-side manual film advance crank'),
    rig('FinderHood', 'Finder hood', 'x', [0, -95], 'Opens the folding waist-level viewfinder hood'),
  ], [], buildTwinLensReflexCamera),
  toolAsset(metaAt('brass-oil-can-funnel'), [
    rig('PumpLever', 'Pump lever', 'z', [-25, 25], 'Rocks the thumb-actuated oiler pump trigger'),
  ], [
    det('BrassFunnel', 'Brass funnel', 'Detachable ribbed conical brass workshop funnel'),
  ], buildBrassOilCanFunnel),
  toolAsset(metaAt('soldering-iron-station'), [
    rig('TempDial', 'Temp dial', 'z', [-120, 120], 'Turns the front bench soldering temperature control dial'),
    rig('SolderIron', 'Soldering iron', 'x', [-35, 25], 'Pivots the pencil soldering iron in its coiled cradle'),
  ], [
    det('SolderSpool', 'Solder spool', 'Detachable rear-mounted alloy solder wire reel'),
  ], buildSolderingIronStation),
  toolAsset(metaAt('leather-medic-satchel'), [
    rig('BagLid', 'Satchel lid', 'x', [0, -68], 'Hinges open the brass-framed Gladstone doctor bag lid'),
  ], [
    det('BandageRoll', 'Bandage roll', 'Detachable side-lashed clinical gauze bandage cylinder'),
  ], buildLeatherMedicSatchel),
];
