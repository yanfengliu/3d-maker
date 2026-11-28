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

const PACK = 'buildings-fantasy-scifi';

function item(
  id: string,
  code: string,
  name: string,
  primary: string,
  accent: string,
  description: string,
): ExpansionMetaItem {
  return {
    id,
    code,
    category: 'Object',
    browseCategory: 'building',
    name,
    primary,
    accent,
    description,
    pack: PACK,
  };
}

export const buildingsFantasyScifiMeta: readonly ExpansionMetaItem[] = [
  item(
    'dwarven-forge-gatehouse',
    'BF-01',
    'Dwarven Forge Gatehouse',
    '#5c5854',
    '#cf812e',
    'Angular basalt mountain gatehouse with runic pylons, glowing smelter vents, rising rune slab gate, and detachable forge braziers.',
  ),
  item(
    'elven-canopy-pavilion',
    'BF-02',
    'Elven Canopy Pavilion',
    '#d8d3c4',
    '#4c8d5e',
    'Sweeping curved silverwood tree-rib arches cradling a leaf-domed woodland pavilion, spinning starlight orrery, and detachable crystal lamps.',
  ),
  item(
    'mossy-stone-keep',
    'BF-03',
    'Mossy Stone Keep',
    '#7c7d73',
    '#5c7a42',
    'Fortified Norman stone donjon with battered plinth, corner bartizan turrets, hinged oak door, and swaying rooftop heraldic banner.',
  ),
  item(
    'crooked-witch-cottage',
    'BF-04',
    'Crooked Witch Cottage',
    '#6c5878',
    '#d98b2b',
    'Leaning storybook cottage crowned with a twisted shingled witch-hat steeple, crooked chimney, hinged door, and detachable cauldron hearth.',
  ),
  item(
    'steampunk-clockwork-hall',
    'BF-05',
    'Steampunk Clockwork Hall',
    '#3d7c6e',
    '#cc9236',
    'Copper-domed Victorian brass-ribbed hall featuring a giant spinning facade cogwheel, twin steam stacks, and hinged brass entrance door.',
  ),
  item(
    'alchemist-guildhall',
    'BF-06',
    'Alchemist Guildhall',
    '#d8cab0',
    '#45a496',
    'Half-timbered steep-gabled guildhall topped with a glass alembic retort, coiled brass condenser pipes, spinning stirrer, and oak guild door.',
  ),
  item(
    'dragon-roost-tower',
    'BF-07',
    'Dragon Roost Tower',
    '#3e3c47',
    '#e05a28',
    'Jagged obsidian crag keep rising to a flared crenellated aerie ringed with fire-beacons, rotating flame crown, and heavy tower gate.',
  ),
  item(
    'fairy-mushroom-house',
    'BF-08',
    'Fairy Mushroom House',
    '#c83932',
    '#ebe0c4',
    'Bulbous cream mushroom-stalk cottage topped by a spotted crimson toadstool dome, acorn chimney, round wooden door, and detachable side toadstools.',
  ),
  item(
    'grounded-rune-sanctum',
    'BF-09',
    'Grounded Rune Sanctum',
    '#676c79',
    '#36b8e6',
    'Stepped stone plinth with four angled conduit obelisk struts cradling a faceted crystalline sanctum, rotating rune ring, and tilting focus prism.',
  ),
  item(
    'desert-bazaar-caravanserai',
    'BF-10',
    'Desert Bazaar Caravanserai',
    '#cfa878',
    '#b84232',
    'Fortified sandstone oasis trading post with domed corner watch-turrets, striped awnings, hinged caravan gate, and detachable spice stalls.',
  ),
  item(
    'mars-pressure-hab-dome',
    'BF-11',
    'Mars Pressure Hab Dome',
    '#dfe3e6',
    '#c95c32',
    'Ribbed white composite Martian hemisphere on a regolith pad with tubular airlock, external cryo tanks, rotating comms dish, and sliding hatch.',
  ),
  item(
    'cyberpunk-ramen-megatower',
    'BF-12',
    'Cyberpunk Ramen Megatower',
    '#3a404e',
    '#f53d7e',
    'Stacked vertical neon urban spire with cantilevered AC units, glowing billboards, rotating rooftop holo-sign, and sliding exterior lift pod.',
  ),
  item(
    'orbital-shuttle-pad',
    'BF-13',
    'Orbital Shuttle Pad',
    '#66707a',
    '#e8a229',
    'Octagonal blast-deflector landing apron with perimeter beacons, trussed service gantry, swinging umbilical arm, and tilting blast shield.',
  ),
  item(
    'arid-moisture-vaporator',
    'BF-14',
    'Arid Moisture Vaporator',
    '#c8b392',
    '#3e859c',
    'Desert farmstead atmospheric collector compound with finned condenser mast, twin cistern tanks, spinning wind vanes, and hinged pump hatch.',
  ),
  item(
    'neon-pachinko-parlor',
    'BF-15',
    'Neon Pachinko Parlor',
    '#302c4a',
    '#f24b88',
    'Flamboyant downtown arcade facade with curved illuminated crown sign, marquee light columns, spinning jackpot wheel, and sliding entry doors.',
  ),
  item(
    'arctic-research-biodome',
    'BF-16',
    'Arctic Research Biodome',
    '#d8e2ea',
    '#e0532c',
    'Elevated insulated hexagonal polar laboratory on snow-anchor struts with geodesic cupola, spinning wind anemometer, and hinged thermal door.',
  ),
  item(
    'armored-command-bunker',
    'BF-17',
    'Armored Command Bunker',
    '#6d706c',
    '#c48f32',
    'Low-profile sloped reinforced-concrete brutalist bunker with recessed observation slit, rotating roof sensor turret, and sliding blast shutter.',
  ),
  item(
    'starport-control-spire',
    'BF-18',
    'Starport Control Spire',
    '#d2dae0',
    '#2e7fa8',
    'Flaring aerospace control spire with cantilevered tinted command deck, stabilizer fins, spinning radar bar, and rotating navigation beacon ring.',
  ),
  item(
    'megacorp-data-monolith',
    'BF-19',
    'Megacorp Data Monolith',
    '#262b36',
    '#28d2b4',
    'Stepped obsidian-and-glass corporate server citadel with glowing vertical fiber-optic cooling fins, rooftop uplink turret, and sliding vents.',
  ),
  item(
    'lunar-mining-refinery',
    'BF-20',
    'Lunar Mining Refinery',
    '#d49a2a',
    '#5a6874',
    'Heavy industrial regolith ore-processing rig with spherical storage silos, inclined hopper conveyor, spinning crusher drum, and tilting ore chute.',
  ),
];
