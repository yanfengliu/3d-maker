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

const item = (
  code: string,
  id: string,
  name: string,
  primary: string,
  accent: string,
  description: string,
): ExpansionMetaItem => ({
  id,
  code,
  category: 'Object',
  browseCategory: 'prop',
  name,
  primary,
  accent,
  description,
  pack: 'fantasy-arcane',
});

export const fantasyArcaneMeta: readonly ExpansionMetaItem[] = [
  item(
    'FA-01',
    'bubbling-alchemy-cauldron',
    'Bubbling Alchemy Cauldron',
    '#3d4149',
    '#4cd964',
    'Stone hearth ring with glowing embers, three-legged riveted iron cauldron, and stirring ladle pivoting in luminous emerald brew.',
  ),
  item(
    'FA-02',
    'brass-arcane-astrolabe',
    'Brass Arcane Astrolabe',
    '#5a5561',
    '#d4a64a',
    'Octagonal carved marble pedestal supporting twin counter-rotating zodiac brass rings on a meridian fork around a celestial globe.',
  ),
  item(
    'FA-03',
    'enchanted-spell-lectern',
    'Enchanted Spell Lectern',
    '#6e472d',
    '#d8ab4e',
    'Carved stone eagle-wing pillar holding a sloped oak lectern deck, open illuminated grimoire with turning gilded page, and side sconces.',
  ),
  item(
    'FA-04',
    'toothed-mimic-chest',
    'Toothed Mimic Chest',
    '#6e3f27',
    '#c43e4b',
    'Iron-banded dungeon chest with a snapping upper jaw lined with conical fangs, curling crimson tongue, and peering monster eyes.',
  ),
  item(
    'FA-05',
    'tiered-potion-rack',
    'Tiered Potion Rack',
    '#5d3c28',
    '#46c2b0',
    'Stepped gothic timber shelving with arched niches stocked with corked flasks and alembics plus a swinging side herb-drying rack.',
  ),
  item(
    'FA-06',
    'glowing-rune-obelisk',
    'Glowing Rune Obelisk',
    '#3c404b',
    '#3ee6d8',
    'Stepped runic stone dais and tapered carved basalt monolith with glowing glyph reliefs beneath a rotating bronze-collared energy crown.',
  ),
  item(
    'FA-07',
    'planetary-crystal-orrery',
    'Planetary Crystal Orrery',
    '#4b3b5c',
    '#e0a93b',
    'Clockwork geared brass base with a glowing central sun pillar and three concentric rotating brass arms bearing crystal planets.',
  ),
  item(
    'FA-08',
    'iron-dragon-brazier',
    'Iron Dragon Brazier',
    '#353840',
    '#f26a21',
    'Clawed wrought-iron tripod stand holding a flared fire bowl crowned with dragon-wing horns and a swirling dancing flame spire.',
  ),
  item(
    'FA-09',
    'runic-anvil-forge',
    'Runic Anvil Forge',
    '#4b5059',
    '#e87d2e',
    'Stepped dwarven stone dais with a rune-inscribed horned steel anvil, water quench trough, rune tongs, and articulated strike hammer.',
  ),
  item(
    'FA-10',
    'stone-portal-archway',
    'Stone Portal Archway',
    '#676b75',
    '#7a4ef0',
    'Massive stepped plinth and rune-carved stone twin pillars beneath a keystone arch framing a recessed spinning translucent portal vortex.',
  ),
  item(
    'FA-11',
    'brass-wizard-telescope',
    'Brass Wizard Telescope',
    '#6a442b',
    '#d9ac4c',
    'Ornate mahogany tripod with geared azimuth collar and star chart tray supporting a tilting segmented brass refractor and finder scope.',
  ),
  item(
    'FA-12',
    'dungeon-hanging-cage',
    'Dungeon Hanging Cage',
    '#573c29',
    '#4e555e',
    'Heavy grounded timber-and-iron gallows gibbet frame with a solid linked chain supporting a swinging barred iron dungeon cage.',
  ),
  item(
    'FA-13',
    'golden-reliquary-altar',
    'Golden Reliquary Altar',
    '#d8d2c7',
    '#e0b03f',
    'Stepped carved marble altar table with draped frontal cloth, gilded gothic reliquary with opening triptych doors, and twin candelabras.',
  ),
  item(
    'FA-14',
    'marble-scrying-basin',
    'Marble Scrying Basin',
    '#dcd7cc',
    '#3bc4d6',
    'Fluted marble column pedestal crowned by a wide shallow basin with bronze serpent handles and a rotating crystal-swirl water mirror.',
  ),
  item(
    'FA-15',
    'grimoire-bookshelf',
    'Grimoire Bookshelf',
    '#5a3a26',
    '#b83c4c',
    'Tall gothic arched oak bookcase packed with varied leather tomes, bone skull, and scrolls with a hinged secret book compartment door.',
  ),
  item(
    'FA-16',
    'alchemist-distillation-still',
    'Alchemist Distillation Still',
    '#b86a3a',
    '#4cd48c',
    'Brick burner stove and hammered copper alembic boiler linked by a swan-neck condenser coil to a glass carboy with a spinning valve wheel.',
  ),
  item(
    'FA-17',
    'crystal-prism-pedestal',
    'Crystal Prism Pedestal',
    '#484b59',
    '#4fd8ff',
    'Stepped hexagonal arcane stone plinth with brass focusing prongs framing a giant multifaceted crystal prism spinning on a brass spindle.',
  ),
  item(
    'FA-18',
    'hourglass-monolith',
    'Hourglass Monolith',
    '#575262',
    '#e3b549',
    'Four carved stone corner pillars framing a monumental dual-bulb brass-and-glass hourglass flipping smoothly on central trunnions.',
  ),
  item(
    'FA-19',
    'dwarven-vault-door',
    'Dwarven Vault Door',
    '#5b5f66',
    '#c99342',
    'Thick bevelled stone bulkhead frame with a heavy circular armored bronze vault door swinging open around a spinning spoked lock wheel.',
  ),
  item(
    'FA-20',
    'necromancer-bone-throne',
    'Necromancer Bone Throne',
    '#2f2b3a',
    '#dfd3b8',
    'Stepped obsidian dais with high arched rib-and-horn backrest, skull armrests, hinged secret seat chest, and spinning crowned orb finial.',
  ),
];
