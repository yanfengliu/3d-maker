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

export const handheldToolsMeta: readonly ExpansionMetaItem[] = [
  {
    id: 'surveyor-theodolite', code: 'HT-01', category: 'Object', browseCategory: 'ultra',
    name: 'Surveyor Theodolite', primary: '#d99c2b', accent: '#2c3e4f', pack: 'handheld-tools',
    description: 'Precision optical surveyor theodolite on a three-legged leveling tripod with panning yoke and tilting sighting telescope.',
  },
  {
    id: 'brass-marine-sextant', code: 'HT-02', category: 'Object', browseCategory: 'ultra',
    name: 'Brass Marine Sextant', primary: '#c99a3b', accent: '#2b4b5c', pack: 'handheld-tools',
    description: 'Lattice-frame nautical brass sextant mounted on a navigator plinth with graduated arc limb and sweeping index mirror arm.',
  },
  {
    id: 'megaphone-bullhorn', code: 'HT-03', category: 'Object', browseCategory: 'ultra',
    name: 'Megaphone Bullhorn', primary: '#d44a32', accent: '#e6e2d6', pack: 'handheld-tools',
    description: 'Flared acoustic bullhorn megaphone resting in a desk cradle with coiled handset cord, pivoting mic, and trigger lever.',
  },
  {
    id: 'travel-gramophone', code: 'HT-04', category: 'Object', browseCategory: 'ultra',
    name: 'Travel Gramophone', primary: '#6b4228', accent: '#d4a23e', pack: 'handheld-tools',
    description: 'Portable walnut suitcase gramophone with spinning vinyl platter, pivoting brass tonearm, crank, and detachable acoustic horn.',
  },
  {
    id: 'solidbody-electric-guitar', code: 'HT-05', category: 'Object', browseCategory: 'ultra',
    name: 'Solidbody Electric Guitar', primary: '#b82e2e', accent: '#e8dfc8', pack: 'handheld-tools',
    description: 'Double-cutaway electric guitar on an A-frame stage stand with dual pickups, swaying body mount, and pivoting whammy bar.',
  },
  {
    id: 'concert-violin-bow', code: 'HT-06', category: 'Object', browseCategory: 'ultra',
    name: 'Concert Violin & Bow', primary: '#8f4222', accent: '#2a221d', pack: 'handheld-tools',
    description: 'Arched spruce concert violin on a carved luthier display stand with scroll pegbox, bridge, and sweeping horsehair bow.',
  },
  {
    id: 'diatonic-button-accordion', code: 'HT-07', category: 'Object', browseCategory: 'ultra',
    name: 'Diatonic Button Accordion', primary: '#9e2d3b', accent: '#e2d6bc', pack: 'handheld-tools',
    description: 'Pleated-bellows button accordion in a velvet stage cradle with pearl button banks, grille, and sliding bellows expansion.',
  },
  {
    id: 'brass-blowtorch', code: 'HT-08', category: 'Object', browseCategory: 'ultra',
    name: 'Brass Blowtorch', primary: '#c98c2b', accent: '#3b4b54', pack: 'handheld-tools',
    description: 'Vintage pressurized brass fuel blowtorch on a workshop base with sliding side air pump and spinning burner control valve.',
  },
  {
    id: 'cordless-circular-saw', code: 'HT-09', category: 'Object', browseCategory: 'ultra',
    name: 'Cordless Circular Saw', primary: '#e09c24', accent: '#2d3842', pack: 'handheld-tools',
    description: 'Heavy-duty battery circular saw docked in a carpenter shoe cradle with spinning toothed blade and retracting lower guard.',
  },
  {
    id: 'master-wrench-rack', code: 'HT-10', category: 'Object', browseCategory: 'ultra',
    name: 'Master Wrench Rack', primary: '#3b698a', accent: '#d97828', pack: 'handheld-tools',
    description: 'Angled mechanic pegboard rack displaying graduated steel wrenches with a pivoting center ratchet and detachable socket tray.',
  },
  {
    id: 'yellow-geiger-counter', code: 'HT-11', category: 'Object', browseCategory: 'ultra',
    name: 'Yellow Geiger Counter', primary: '#e2b824', accent: '#2b3136', pack: 'handheld-tools',
    description: 'Rugged field radiation survey meter with sweeping analog gauge needle, carry handle, coiled cord, and detachable side probe wand.',
  },
  {
    id: 'field-walkie-talkie', code: 'HT-12', category: 'Object', browseCategory: 'ultra',
    name: 'Field Walkie-Talkie', primary: '#3e543c', accent: '#d9842c', pack: 'handheld-tools',
    description: 'Tactical handheld transceiver in a desktop charging dock with rotary channel selector knob and extending telescopic whip antenna.',
  },
  {
    id: 'prism-binoculars', code: 'HT-13', category: 'Object', browseCategory: 'ultra',
    name: 'Prism Binoculars', primary: '#2f3c42', accent: '#c98c38', pack: 'handheld-tools',
    description: 'Porro-prism twin-barrel field binoculars on a display yoke with recessed optics, spinning focus wheel, and hinged barrel bridge.',
  },
  {
    id: 'storm-hurricane-lamp', code: 'HT-14', category: 'Object', browseCategory: 'ultra',
    name: 'Storm Hurricane Lamp', primary: '#a83228', accent: '#d9a43b', pack: 'handheld-tools',
    description: 'Tubular-frame kerosene hurricane lantern with bulged glass globe, swinging wire carry bail, and rotating brass wick knob.',
  },
  {
    id: 'drafting-transit-level', code: 'HT-15', category: 'Object', browseCategory: 'ultra',
    name: 'Drafting Transit Level', primary: '#2f6b5c', accent: '#d9ae44', pack: 'handheld-tools',
    description: 'Engineer optical builder level on a tri-screw brass plinth with rotating azimuth turret, spirit vial, and focus dial.',
  },
  {
    id: 'chef-cleaver-block', code: 'HT-16', category: 'Object', browseCategory: 'ultra',
    name: 'Chef Cleaver Block', primary: '#7d4f32', accent: '#b8bec2', pack: 'handheld-tools',
    description: 'Slanted hardwood culinary knife block holding nested blades, a lifting broad steel cleaver, and detachable honing steel.',
  },
  {
    id: 'twin-lens-reflex-camera', code: 'HT-17', category: 'Object', browseCategory: 'ultra',
    name: 'Twin-Lens Reflex Camera', primary: '#2a2e34', accent: '#c99848', pack: 'handheld-tools',
    description: 'Classic vertical dual-lens reflex camera on a studio plinth with folding waist-level finder hood and spinning film crank.',
  },
  {
    id: 'brass-oil-can-funnel', code: 'HT-18', category: 'Object', browseCategory: 'ultra',
    name: 'Brass Oil Can & Funnel', primary: '#c98c2e', accent: '#4d5a62', pack: 'handheld-tools',
    description: 'Machinist drip-tray set featuring a gooseneck brass oiler with rocking thumb-pump lever and detachable ribbed brass funnel.',
  },
  {
    id: 'soldering-iron-station', code: 'HT-19', category: 'Object', browseCategory: 'ultra',
    name: 'Soldering Iron Station', primary: '#2c5d8a', accent: '#e07b28', pack: 'handheld-tools',
    description: 'Electronics bench soldering controller with rotary heat dial, coiled cradle, pivoting pencil iron, and detachable solder spool.',
  },
  {
    id: 'leather-medic-satchel', code: 'HT-20', category: 'Object', browseCategory: 'ultra',
    name: 'Leather Medic Satchel', primary: '#7a3c28', accent: '#d93842', pack: 'handheld-tools',
    description: 'Structured Gladstone leather doctor bag on a clinic tray with brass clasps, opening hinged top frame, and detachable bandage roll.',
  },
];
