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

export const charactersAdventureMeta: readonly ExpansionMetaItem[] = [
  {
    id: 'battle-warmage', code: 'CA-01', category: 'Character', browseCategory: 'character',
    name: 'Battle Warmage', primary: '#6b273a', accent: '#e0b044', pack: 'characters-adventure',
    description: 'Armored arcane caster with horned circlet, runic waist faulds, spinning crystal spell focus, and detachable armored mantle.',
  },
  {
    id: 'viking-shieldmaiden', code: 'CA-02', category: 'Character', browseCategory: 'character',
    name: 'Viking Shieldmaiden', primary: '#3a5b75', accent: '#c99848', pack: 'characters-adventure',
    description: 'Nordic warrior in fur-trimmed shoulder pelts with battleaxe, pivoting round shield mount, and detachable horned spangenhelm.',
  },
  {
    id: 'ronin-wanderer', code: 'CA-03', category: 'Character', browseCategory: 'character',
    name: 'Ronin Wanderer', primary: '#3e4a5c', accent: '#c9543c', pack: 'characters-adventure',
    description: 'Drifting masterless swordsman in a travel haori cloak with hip scabbards, poised katana draw, and detachable conical kasa hat.',
  },
  {
    id: 'plague-apothecary', code: 'CA-04', category: 'Character', browseCategory: 'character',
    name: 'Plague Apothecary', primary: '#2f353b', accent: '#ba8c3e', pack: 'characters-adventure',
    description: 'Alchemical physician in an oilskin storm coat and vial belt with hinged beaked mask and detachable wide-brimmed leather hat.',
  },
  {
    id: 'cybernetic-netrunner', code: 'CA-05', category: 'Character', browseCategory: 'character',
    name: 'Cybernetic Netrunner', primary: '#1f2e45', accent: '#e83f78', pack: 'characters-adventure',
    description: 'Neon deck hacker in an asymmetric tech collar jacket with flip-up AR neural visor, wrist deck, and detachable spinal data rig.',
  },
  {
    id: 'orbital-star-marine', code: 'CA-06', category: 'Character', browseCategory: 'character',
    name: 'Orbital Star Marine', primary: '#3c5442', accent: '#d99e36', pack: 'characters-adventure',
    description: 'Heavy drop trooper in reinforced power cuirass and banded pauldrons with hinged blast visor and detachable orbital jump pack.',
  },
  {
    id: 'galactic-bounty-hunter', code: 'CA-07', category: 'Character', browseCategory: 'character',
    name: 'Galactic Bounty Hunter', primary: '#485c54', accent: '#c9522e', pack: 'characters-adventure',
    description: 'Armored frontier tracker wearing a T-visor helmet with flip-down rangefinder stalk, shoulder cape, and detachable missile jetpack.',
  },
  {
    id: 'clockwork-automaton', code: 'CA-08', category: 'Character', browseCategory: 'character',
    name: 'Clockwork Automaton', primary: '#9e6e3c', accent: '#38b8a8', pack: 'characters-adventure',
    description: 'Brass steam-driven mechanical sentinel with furnace grate core, spinning back wind-up key, and detachable twin exhaust stacks.',
  },
  {
    id: 'mystic-alchemist', code: 'CA-09', category: 'Character', browseCategory: 'character',
    name: 'Mystic Alchemist', primary: '#2d665a', accent: '#e0a83c', pack: 'characters-adventure',
    description: 'Elixir brewer in a phial-lined chest bandolier with swiveling monocle loupe and detachable back copper alembic canister rig.',
  },
  {
    id: 'shadow-shinobi', code: 'CA-10', category: 'Character', browseCategory: 'character',
    name: 'Shadow Shinobi', primary: '#262b38', accent: '#c93848', pack: 'characters-adventure',
    description: 'Stealth infiltrator in wrapped cloth cowl and shuriken bracers with billowing rigged scarf tail and detachable crossed scabbards.',
  },
  {
    id: 'space-exobotanist', code: 'CA-11', category: 'Character', browseCategory: 'character',
    name: 'Space Exobotanist', primary: '#d6dfd6', accent: '#42b874', pack: 'characters-adventure',
    description: 'Off-world xenobiologist in a sealed survey suit with hinged tinted visor, telemetry pad, and detachable back glass biodome pack.',
  },
  {
    id: 'heavy-mecha-pilot', code: 'CA-12', category: 'Character', browseCategory: 'character',
    name: 'Heavy Mecha Pilot', primary: '#c9482e', accent: '#e0be42', pack: 'characters-adventure',
    description: 'Walker cockpit ace in a neural-link flight harness with cooling shoulder fins, hinged blast visor, and detachable sync battery pack.',
  },
  {
    id: 'forest-druid-shaman', code: 'CA-13', category: 'Character', browseCategory: 'character',
    name: 'Forest Druid Shaman', primary: '#3b5c3a', accent: '#c99c4e', pack: 'characters-adventure',
    description: 'Wildwood mystic draped in a layered leaf mantle with belt charms, swaying carved totem staff, and detachable stag antler crown.',
  },
  {
    id: 'arena-gladiator', code: 'CA-14', category: 'Character', browseCategory: 'character',
    name: 'Arena Gladiator', primary: '#8f382a', accent: '#d4a848', pack: 'characters-adventure',
    description: 'Colosseum champion with crested bronze helm, hinged grille visor, asymmetric spiked arm guard, and detachable forearm buckler.',
  },
  {
    id: 'skyship-corsair', code: 'CA-15', category: 'Character', browseCategory: 'character',
    name: 'Skyship Corsair', primary: '#2c4b6e', accent: '#d9923b', pack: 'characters-adventure',
    description: 'Cloud-raider privateer in a buckled skycoat and aviator cap with flip-up brass goggles and detachable ribbed glider wingpack.',
  },
  {
    id: 'temple-monk', code: 'CA-16', category: 'Character', browseCategory: 'character',
    name: 'Temple Monk', primary: '#c96a2b', accent: '#e0b84c', pack: 'characters-adventure',
    description: 'Mountain monastery ascetic in saffron sash and prayer beads holding a spinning brass prayer wheel with detachable back pilgrim hat.',
  },
  {
    id: 'wasteland-scavenger', code: 'CA-17', category: 'Character', browseCategory: 'character',
    name: 'Wasteland Scavenger', primary: '#7a5a3c', accent: '#d4822a', pack: 'characters-adventure',
    description: 'Desert scrap-runner in respirator mask and tire-tread pauldron with spinning salvage dish and detachable back scrap-crate pack.',
  },
  {
    id: 'frost-paladin', code: 'CA-18', category: 'Character', browseCategory: 'character',
    name: 'Frost Paladin', primary: '#4a7ea8', accent: '#d8ebf5', pack: 'characters-adventure',
    description: 'Glacial knight clad in frosted crystal pauldrons and fur capelet wielding a tilting ice blade with detachable winged crown helm.',
  },
  {
    id: 'chrono-tinkerer', code: 'CA-19', category: 'Character', browseCategory: 'character',
    name: 'Chrono Tinkerer', primary: '#4e3c6b', accent: '#e0ae42', pack: 'characters-adventure',
    description: 'Time-bending horologist with glowing hourglass vest, hinged jeweler loupe crown, and detachable clockface pendulum backpack.',
  },
  {
    id: 'royal-musketeer', code: 'CA-20', category: 'Character', browseCategory: 'character',
    name: 'Royal Musketeer', primary: '#2a4d82', accent: '#e0b84c', pack: 'characters-adventure',
    description: 'Court swordsman in a heraldic cross tabard and bandolier wielding a swept-hilt rapier with detachable plumed cavalier hat.',
  },
];
