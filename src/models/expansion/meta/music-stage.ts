import type { BrowseCategory } from '../../../data/browse';

export interface ExpansionMetaItem {
  readonly id: string;
  readonly code: string;
  readonly category: 'Object' | 'Character';
  readonly browseCategory: BrowseCategory;
  readonly name: string;
  readonly primary: string;
  readonly accent: string;
  readonly description: string;
  readonly pack: string;
}

const pack = 'music-stage';

export const musicStageMeta: readonly ExpansionMetaItem[] = [
  {
    id: 'concert-grand-piano', code: 'MS-01', category: 'Object', browseCategory: 'prop', pack,
    name: 'Concert Grand Piano', primary: '#25262b', accent: '#d8b256',
    description: 'Curved-rim concert grand piano with brass pedal lyre, fallboard, and propped acoustic wing lid.',
  },
  {
    id: 'celtic-floor-harp', code: 'MS-02', category: 'Object', browseCategory: 'prop', pack,
    name: 'Celtic Floor Harp', primary: '#7f4c2c', accent: '#d9b154',
    description: 'Carved forepillar Celtic concert harp on a stepped resonator plinth with harmonic curve and brass lever rail.',
  },
  {
    id: 'five-piece-drum-kit', code: 'MS-03', category: 'Object', browseCategory: 'prop', pack,
    name: 'Five-Piece Drum Kit', primary: '#a83430', accent: '#d8ba63',
    description: 'Full acoustic stage drum kit on a grounded riser rug with kick pedal, rack toms, snare, and tilting crash cymbal.',
  },
  {
    id: 'rosewood-marimba', code: 'MS-04', category: 'Object', browseCategory: 'prop', pack,
    name: 'Rosewood Marimba', primary: '#6c3826', accent: '#c9a354',
    description: 'Concert rosewood keyboard marimba with graduated tubular brass resonators and swinging mallet carriage.',
  },
  {
    id: 'chapel-pipe-organ', code: 'MS-05', category: 'Object', browseCategory: 'prop', pack,
    name: 'Chapel Pipe Organ', primary: '#65402b', accent: '#cfb062',
    description: 'Gothic oak chapel organ console with tiered prospect pipes, twin keyboard manuals, and hinged swell shutters.',
  },
  {
    id: 'modular-synth-rack', code: 'MS-06', category: 'Object', browseCategory: 'prop', pack,
    name: 'Modular Synthesizer Rack', primary: '#313a46', accent: '#e37735',
    description: 'Slanted studio Eurorack cabinet packed with patch modules, rotary knobs, and tilting upper sequencer bay.',
  },
  {
    id: 'club-dj-booth', code: 'MS-07', category: 'Object', browseCategory: 'prop', pack,
    name: 'Club DJ Booth', primary: '#293042', accent: '#2ed1c6',
    description: 'Illuminated nightclub DJ console with dual spinning jog-wheel platters, central mixer faders, and overhead truss bar.',
  },
  {
    id: 'wurlitzer-jukebox', code: 'MS-08', category: 'Object', browseCategory: 'prop', pack,
    name: 'Wurlitzer Jukebox', primary: '#9c362e', accent: '#e8b64a',
    description: 'Arched 1950s bubble-tube jukebox with chrome speaker grille, rotating visible vinyl deck, and chrome selector bar.',
  },
  {
    id: 'cello-display-stand', code: 'MS-09', category: 'Object', browseCategory: 'prop', pack,
    name: 'Cello Display Stand', primary: '#8c4923', accent: '#d7b25f',
    description: 'Sculpted orchestral cello cradled in an A-frame studio stand with carved scroll pegbox and pivoting horsehair bow.',
  },
  {
    id: 'vinyl-turntable-console', code: 'MS-10', category: 'Object', browseCategory: 'prop', pack,
    name: 'Vinyl Turntable Console', primary: '#6e4930', accent: '#d8a64e',
    description: 'Mid-century walnut hi-fi credenza with slatted speaker grilles, spinning vinyl platter, pivoting tonearm, and hinged dust cover.',
  },
  {
    id: 'guitar-amp-stack', code: 'MS-11', category: 'Object', browseCategory: 'prop', pack,
    name: 'Guitar Amp Stack', primary: '#2a2c31', accent: '#c99b44',
    description: 'Full-height tube amplifier head atop dual 4x12 slant-and-straight speaker cabinets with pivoting top carry handle and dials.',
  },
  {
    id: 'stage-spotlight-truss', code: 'MS-12', category: 'Object', browseCategory: 'prop', pack,
    name: 'Stage Spotlight Truss', primary: '#3b424c', accent: '#e5a938',
    description: 'Box-truss aluminum concert lighting tower on weighted outriggers carrying three tilting par-can stage spotlights.',
  },
  {
    id: 'acoustic-guitar-rack', code: 'MS-13', category: 'Object', browseCategory: 'prop', pack,
    name: 'Acoustic Guitar Rack', primary: '#7a4b2c', accent: '#d7a955',
    description: 'Backstage multi-instrument wooden rack displaying three dreadnought guitars with a pivoting neck-retainer bar.',
  },
  {
    id: 'brass-horn-phonograph', code: 'MS-14', category: 'Object', browseCategory: 'prop', pack,
    name: 'Brass Horn Phonograph', primary: '#6f4126', accent: '#d9ae4b',
    description: 'Cabinet-mounted antique gramophone with paneled pedestal, hand-crank flywheel, spinning shellac disc, and fluted morning-glory horn.',
  },
  {
    id: 'temple-bronze-gong', code: 'MS-15', category: 'Object', browseCategory: 'prop', pack,
    name: 'Temple Bronze Gong', primary: '#8e2d25', accent: '#cfa144',
    description: 'Lacquered ceremonial timber arch frame suspending a hammered swinging bronze gong and side-mounted striker mallet.',
  },
  {
    id: 'upright-bass-stand', code: 'MS-16', category: 'Object', browseCategory: 'prop', pack,
    name: 'Upright Bass Stand', primary: '#753f22', accent: '#cfa652',
    description: 'Tall orchestral double bass seated in a padded floor tripod with arched bridge, endpin rest, and rocking bow arm.',
  },
  {
    id: 'grand-timpani-pair', code: 'MS-17', category: 'Object', browseCategory: 'prop', pack,
    name: 'Grand Timpani Pair', primary: '#a65732', accent: '#d8b768',
    description: 'Matched orchestral copper kettledrums linked on a low performance platform with tension rods and hinged tuning foot pedals.',
  },
  {
    id: 'accordion-bellows-stand', code: 'MS-18', category: 'Object', browseCategory: 'prop', pack,
    name: 'Accordion Bellows Stand', primary: '#8e2b38', accent: '#e0c678',
    description: 'Pearl-inlaid piano accordion displayed on a tilted velvet cradle with pleated expanding bellows and bass button board.',
  },
  {
    id: 'studio-mixing-desk', code: 'MS-19', category: 'Object', browseCategory: 'prop', pack,
    name: 'Studio Mixing Desk', primary: '#39404b', accent: '#d98c36',
    description: 'Wide analog recording console with padded armrest, sliding master fader bank, angled VU meter bridge, and monitor speakers.',
  },
  {
    id: 'baroque-harpsichord', code: 'MS-20', category: 'Object', browseCategory: 'prop', pack,
    name: 'Baroque Harpsichord', primary: '#365a4e', accent: '#dfb458',
    description: 'Gilded trestle-legged baroque harpsichord with twin inverted-color manuals, decorative soundboard rose, and hinged lid.',
  },
];
