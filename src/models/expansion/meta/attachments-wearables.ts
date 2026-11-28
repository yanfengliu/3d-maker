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

export const attachmentsWearablesMeta: readonly ExpansionMetaItem[] = [
  {
    id: 'twin-scuba-tank-rig', code: 'AX-01', category: 'Object', browseCategory: 'attachment',
    name: 'Twin Scuba Tank Rig', primary: '#e0a428', accent: '#2b3842', pack: 'attachments-wearables',
    description: 'Dual pressurized dive cylinder harness on a deck stand with regulator hose, spinning manifold valve, and detachable weight pouch.',
  },
  {
    id: 'alpine-hiking-rucksack', code: 'AX-02', category: 'Object', browseCategory: 'attachment',
    name: 'Alpine Hiking Rucksack', primary: '#3b6b4c', accent: '#d97c2e', pack: 'attachments-wearables',
    description: 'Tall internal-frame mountain trekking rucksack on a gear rack with hinged top pocket flap and detachable strapped trekking poles.',
  },
  {
    id: 'articulated-mechanical-wings', code: 'AX-03', category: 'Object', browseCategory: 'attachment',
    name: 'Articulated Mechanical Wings', primary: '#687882', accent: '#e09c32', pack: 'attachments-wearables',
    description: 'Dorsal gear-spine flight harness on a display pylon with paired swept metallic blade wings that fold and flare symmetrically.',
  },
  {
    id: 'scaled-dragon-wings', code: 'AX-04', category: 'Object', browseCategory: 'attachment',
    name: 'Scaled Dragon Wings', primary: '#7a242c', accent: '#d49a3c', pack: 'attachments-wearables',
    description: 'Armored dorsal spine harness on a stone plinth with horned wing arms and sculpted stepped dragon membranes that beat outward.',
  },
  {
    id: 'horned-samurai-kabuto', code: 'AX-05', category: 'Object', browseCategory: 'attachment',
    name: 'Horned Samurai Kabuto', primary: '#2c262a', accent: '#d9a83c', pack: 'attachments-wearables',
    description: 'Lacquered samurai helmet on a kabuto display stand with layered neck guards, menpo face plate, pivoting horns, and detachable crest.',
  },
  {
    id: 'brass-diving-helmet', code: 'AX-06', category: 'Object', browseCategory: 'attachment',
    name: 'Brass Diving Helmet', primary: '#c98c2e', accent: '#3e5c6b', pack: 'attachments-wearables',
    description: 'Riveted copper-brass deep-sea helmet on a timber bust plinth with hinged grilled front viewport hatch and spinning exhaust knob.',
  },
  {
    id: 'visor-astronaut-helmet', code: 'AX-07', category: 'Object', browseCategory: 'attachment',
    name: 'Visor Astronaut Helmet', primary: '#e4e8ec', accent: '#e0a228', pack: 'attachments-wearables',
    description: 'Orbital EVA dome helmet on a flight-deck neck ring with hinged gold reflective sun visor and detachable side telemetry camera.',
  },
  {
    id: 'pointed-wizard-hat', code: 'AX-08', category: 'Object', browseCategory: 'attachment',
    name: 'Pointed Wizard Hat', primary: '#3b2e78', accent: '#e0b444', pack: 'attachments-wearables',
    description: 'Wide-brimmed arcane sorcerer hat resting on a turned wooden block stand with swaying crooked spire tip and detachable front buckle.',
  },
  {
    id: 'plumed-knight-helm', code: 'AX-09', category: 'Object', browseCategory: 'attachment',
    name: 'Plumed Knight Helm', primary: '#5a6878', accent: '#c93838', pack: 'attachments-wearables',
    description: 'Fluted steel armet helmet on an armory stand with gorget collar, hinged pointed visor shield, and detachable sweeping crest plume.',
  },
  {
    id: 'jeweled-crown-cushion', code: 'AX-10', category: 'Object', browseCategory: 'attachment',
    name: 'Jeweled Crown Cushion', primary: '#d9a834', accent: '#9e2438', pack: 'attachments-wearables',
    description: 'Carved royal plinth and tasseled velvet cushion supporting an eight-point gilded imperial crown on a rotating display turntable.',
  },
  {
    id: 'mounted-rail-cannon', code: 'AX-11', category: 'Object', browseCategory: 'attachment',
    name: 'Mounted Rail Cannon', primary: '#42505c', accent: '#38c8e0', pack: 'attachments-wearables',
    description: 'Shoulder-harness electromagnetic railgun rig on an armature stand with panning azimuth ring, elevating twin rails, and capacitor coils.',
  },
  {
    id: 'field-medic-backpack', code: 'AX-12', category: 'Object', browseCategory: 'attachment',
    name: 'Field Medic Backpack', primary: '#e0e6e4', accent: '#d4323c', pack: 'attachments-wearables',
    description: 'Hard-shell trauma response pack on a rescue stand with medical cross emblem, hinged triage lid, and detachable defibrillator pod.',
  },
  {
    id: 'tactical-radio-pack', code: 'AX-13', category: 'Object', browseCategory: 'attachment',
    name: 'Tactical Radio Pack', primary: '#4b5c42', accent: '#c98c32', pack: 'attachments-wearables',
    description: 'Field communications manpack on a harness rack with rotary tuning dials, telescoping whip antenna mast, and detachable coiled handset.',
  },
  {
    id: 'iridescent-fairy-wings', code: 'AX-14', category: 'Object', browseCategory: 'attachment',
    name: 'Iridescent Fairy Wings', primary: '#5a4294', accent: '#4ee0c8', pack: 'attachments-wearables',
    description: 'Filigree dorsal clasp mounted on a sculpted stand with paired double-lobed crystal-veined fairy wings that flutter gracefully.',
  },
  {
    id: 'steampunk-boiler-pack', code: 'AX-15', category: 'Object', browseCategory: 'attachment',
    name: 'Steampunk Boiler Pack', primary: '#7a482c', accent: '#d49a38', pack: 'attachments-wearables',
    description: 'Riveted copper pressure-boiler flight rig on a foundry stand with twin smokestacks, spinning brass flywheel, and detachable coal drum.',
  },
  {
    id: 'ranger-quiver-harness', code: 'AX-16', category: 'Object', browseCategory: 'attachment',
    name: 'Ranger Quiver Harness', primary: '#5c4028', accent: '#3a6b42', pack: 'attachments-wearables',
    description: 'Diagonal leather archer harness on a timber rack with banded arrow quiver, sliding hero draw arrow, and detachable belt pouch.',
  },
  {
    id: 'vigilante-utility-belt', code: 'AX-17', category: 'Object', browseCategory: 'attachment',
    name: 'Vigilante Utility Belt', primary: '#262a32', accent: '#e0b02c', pack: 'attachments-wearables',
    description: 'Armored tactical gadget belt wrapped around a waist display form with hinged center pouch lid and detachable side grapple clip.',
  },
  {
    id: 'cybernetic-exo-spine', code: 'AX-18', category: 'Object', browseCategory: 'attachment',
    name: 'Cybernetic Exo-Spine', primary: '#364452', accent: '#2ce0c8', pack: 'attachments-wearables',
    description: 'Articulated dorsal neural spine frame on a lab pylon with rib stabilizers, flexing upper actuator, and spinning spinal core.',
  },
  {
    id: 'royal-heraldic-cape', code: 'AX-19', category: 'Object', browseCategory: 'attachment',
    name: 'Royal Heraldic Cape', primary: '#8f2030', accent: '#e0b844', pack: 'attachments-wearables',
    description: 'Fur-mantled sovereign ceremonial cloak draped on a dress stand with billowing lower cape hem and detachable chained gold clasp.',
  },
  {
    id: 'falconer-armored-gauntlet', code: 'AX-20', category: 'Object', browseCategory: 'attachment',
    name: 'Falconer Armored Gauntlet', primary: '#6b4228', accent: '#d49a3c', pack: 'attachments-wearables',
    description: 'Flared riveted leather-and-plate hawking gauntlet on a wooden perch with hinged brass cuff guard and detachable wrist lure.',
  },
];
