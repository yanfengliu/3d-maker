import type { ProceduralAssetDef } from '../../collection-types';
import { musicStageMeta } from '../meta/music-stage';
import {
  celticFloorHarp, chapelPipeOrgan, celloDisplayStand, clubDjBooth, concertGrandPiano,
  fivePieceDrumKit, modularSynthRack, rosewoodMarimba, vinylTurntableConsole, wurlitzerJukebox,
} from './music-stage-a';
import {
  accordionBellowsStand, acousticGuitarRack, baroqueHarpsichord, brassHornPhonograph,
  grandTimpaniPair, guitarAmpStack, stageSpotlightTruss, studioMixingDesk,
  templeBronzeGong, uprightBassStand,
} from './music-stage-b';
import { det, rig } from './music-stage-kit';

type PackBinding = Pick<ProceduralAssetDef, 'physicsBody' | 'riggedParts' | 'detachableParts' | 'build'>;

const bindings: Record<string, PackBinding> = {
  'concert-grand-piano': {
    physicsBody: 'static',
    riggedParts: [
      rig('PianoLid', 'Grand wing lid', 'z', [0, 38], 'Raises and lowers the acoustic grand wing lid'),
      rig('Fallboard', 'Key fallboard', 'x', [0, -78], 'Opens the hinged keyboard fallboard cover'),
    ],
    build: concertGrandPiano,
  },
  'celtic-floor-harp': {
    physicsBody: 'dynamic',
    riggedParts: [rig('LeverRail', 'Sharping lever rail', 'z', [-18, 18], 'Flips the brass sharping lever bar')],
    detachableParts: [det('MusicRest', 'Side music rest', 'Removable side sheet-music stand attached to the harp plinth')],
    build: celticFloorHarp,
  },
  'five-piece-drum-kit': {
    physicsBody: 'static',
    riggedParts: [
      rig('KickBeater', 'Kick drum pedal', 'x', [0, 38], 'Pivots the bass drum beater pedal'),
      rig('CrashCymbal', 'Crash cymbal', 'x', [-24, 24], 'Tilts and rocks the boom-mounted brass crash cymbal'),
    ],
    detachableParts: [det('DrumThrone', 'Drummer throne', 'Removable padded drummer stool behind the kick drum')],
    build: fivePieceDrumKit,
  },
  'rosewood-marimba': {
    physicsBody: 'dynamic',
    riggedParts: [rig('MalletArm', 'Mallet carriage', 'x', [-26, 26], 'Swings the twin mallets across the rosewood bars')],
    build: rosewoodMarimba,
  },
  'chapel-pipe-organ': {
    physicsBody: 'static',
    riggedParts: [
      rig('SwellShutterL', 'Left swell shutter', 'y', [0, -70], 'Swings open the left acoustic swell door'),
      rig('SwellShutterR', 'Right swell shutter', 'y', [0, 70], 'Swings open the right acoustic swell door'),
    ],
    build: chapelPipeOrgan,
  },
  'modular-synth-rack': {
    physicsBody: 'static',
    riggedParts: [
      rig('SequencerBay', 'Sequencer bay', 'x', [0, 30], 'Tilts the upper modular sequencer chassis'),
      rig('ModWheel', 'Modulation wheel', 'x', [-45, 45], 'Rolls the performance pitch and modulation wheel'),
    ],
    build: modularSynthRack,
  },
  'club-dj-booth': {
    physicsBody: 'static',
    riggedParts: [
      rig('PlatterL', 'Left jog platter', 'y', [0, 360], 'Spins the left club turntable platter'),
      rig('PlatterR', 'Right jog platter', 'y', [0, -360], 'Spins the right club turntable platter'),
    ],
    build: clubDjBooth,
  },
  'wurlitzer-jukebox': {
    physicsBody: 'static',
    riggedParts: [
      rig('RecordDeck', 'Vinyl platter', 'y', [0, 360], 'Rotates the visible 45-RPM record turntable'),
      rig('SelectorArm', 'Record tonearm', 'y', [0, 35], 'Swings the record selector tonearm across the platter'),
    ],
    build: wurlitzerJukebox,
  },
  'cello-display-stand': {
    physicsBody: 'dynamic',
    riggedParts: [rig('CelloBow', 'Horsehair bow', 'z', [-26, 26], 'Draws the bracket-mounted cello bow back and forth')],
    build: celloDisplayStand,
  },
  'vinyl-turntable-console': {
    physicsBody: 'static',
    riggedParts: [
      rig('VinylPlatter', 'Turntable platter', 'y', [0, 360], 'Spins the hi-fi vinyl record platter'),
      rig('ToneArm', 'S-curve tonearm', 'y', [0, -28], 'Pivots the hi-fi cartridge tonearm onto the LP'),
      rig('DustCover', 'Acrylic dust cover', 'x', [0, -68], 'Lifts the hinged clear turntable dust cover'),
    ],
    build: vinylTurntableConsole,
  },
  'guitar-amp-stack': {
    physicsBody: 'static',
    riggedParts: [
      rig('MasterKnob', 'Master volume knob', 'z', [0, -180], 'Rotates the master overdrive volume dial'),
      rig('CarryHandle', 'Top carry handle', 'x', [0, -65], 'Pivots the heavy top strap carry handle'),
    ],
    detachableParts: [det('FootPedal', 'Overdrive pedal', 'Removable floor channel-switch pedal and cable')],
    build: guitarAmpStack,
  },
  'stage-spotlight-truss': {
    physicsBody: 'static',
    riggedParts: [
      rig('SpotLeft', 'Left spotlight', 'x', [-30, 35], 'Tilts the left par-can stage spotlight'),
      rig('SpotCenter', 'Center spotlight', 'x', [-30, 35], 'Tilts the center par-can stage spotlight'),
      rig('SpotRight', 'Right spotlight', 'x', [-30, 35], 'Tilts the right par-can stage spotlight'),
    ],
    build: stageSpotlightTruss,
  },
  'acoustic-guitar-rack': {
    physicsBody: 'dynamic',
    riggedParts: [rig('NeckBar', 'Neck retainer bar', 'x', [0, -75], 'Raises the padded guitar neck lock bar')],
    build: acousticGuitarRack,
  },
  'brass-horn-phonograph': {
    physicsBody: 'static',
    riggedParts: [
      rig('HandCrank', 'Spring hand crank', 'x', [0, 360], 'Winds the side brass gramophone crank'),
      rig('ShellacDisc', 'Shellac turntable', 'y', [0, 360], 'Spins the 78-RPM shellac record disc'),
    ],
    build: brassHornPhonograph,
  },
  'temple-bronze-gong': {
    physicsBody: 'static',
    riggedParts: [
      rig('BronzeGong', 'Suspended gong', 'x', [-22, 22], 'Swings the suspended ceremonial bronze gong'),
      rig('GongMallet', 'Striker mallet', 'z', [-35, 22], 'Swings the padded gong mallet'),
    ],
    build: templeBronzeGong,
  },
  'upright-bass-stand': {
    physicsBody: 'dynamic',
    riggedParts: [rig('BassBow', 'Double bass bow', 'z', [-26, 26], 'Rocks the upright bass bow in its side bracket')],
    build: uprightBassStand,
  },
  'grand-timpani-pair': {
    physicsBody: 'static',
    riggedParts: [
      rig('TuningPedalL', 'Bass tuning pedal', 'x', [0, 32], 'Depresses the left 32-inch kettle tuning pedal'),
      rig('TuningPedalR', 'Tenor tuning pedal', 'x', [0, 32], 'Depresses the right 26-inch kettle tuning pedal'),
    ],
    build: grandTimpaniPair,
  },
  'accordion-bellows-stand': {
    physicsBody: 'dynamic',
    riggedParts: [rig('BassSide', 'Accordion bellows', 'z', [0, -24], 'Expands and compresses the pleated bellows and bass housing')],
    build: accordionBellowsStand,
  },
  'studio-mixing-desk': {
    physicsBody: 'static',
    riggedParts: [rig('MasterFader', 'Master fader bank', 'z', [-0.14, 0.14], 'Slides the master bus fader bank along its channel', 'slide')],
    detachableParts: [det('StudioMonitors', 'Studio monitors', 'Removable pair of nearfield reference monitors on the meter bridge')],
    build: studioMixingDesk,
  },
  'baroque-harpsichord': {
    physicsBody: 'static',
    riggedParts: [
      rig('HarpsiLid', 'Harpsichord lid', 'z', [0, 36], 'Raises and lowers the painted baroque wing lid'),
      rig('MusicRack', 'Folding music rack', 'x', [0, -62], 'Folds the gilded sheet-music lectern flat'),
    ],
    build: baroqueHarpsichord,
  },
};

export const musicStagePack: readonly ProceduralAssetDef[] = musicStageMeta.map(meta => {
  const binding = bindings[meta.id];
  if (!binding) throw new Error(`Missing music-stage builder for ${meta.id}`);
  return { ...meta, ...binding };
});
