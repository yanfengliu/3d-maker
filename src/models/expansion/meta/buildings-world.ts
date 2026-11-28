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

const PACK = 'buildings-world';

const item = (
  id: string,
  code: string,
  name: string,
  primary: string,
  accent: string,
  description: string,
): ExpansionMetaItem => ({
  id,
  code,
  category: 'Object',
  browseCategory: 'building',
  name,
  primary,
  accent,
  description,
  pack: PACK,
});

export const buildingsWorldMeta: readonly ExpansionMetaItem[] = [
  item(
    'kyoto-tiered-pagoda',
    'BW-01',
    'Kyoto Tiered Pagoda',
    '#b84231',
    '#3e4b52',
    'Three-tiered timber pagoda with upturned eaves, bronze sorin finial, swinging temple bell, and flanking stone lanterns.',
  ),
  item(
    'moroccan-riad-courtyard',
    'BW-02',
    'Moroccan Riad Courtyard',
    '#d9a477',
    '#2a7d8a',
    'Enclosed ochre stucco riad courtyard with horseshoe archway, zellige tiled fountain basin, rooftop pergola, and entry palms.',
  ),
  item(
    'santorini-whitewashed-windmill',
    'BW-03',
    'Santorini Whitewashed Windmill',
    '#ebe6dc',
    '#2f6aa8',
    'Cycladic cylindrical whitewashed windmill tower with thatched conical cap, cobalt entry steps, and spinning timber sail wheel.',
  ),
  item(
    'swiss-alpine-chalet',
    'BW-04',
    'Swiss Alpine Chalet',
    '#a37149',
    '#52423a',
    'Timber mountain chalet over a stone plinth with wrap-around balcony, wide snow-weighted eaves, and geranium flower boxes.',
  ),
  item(
    'taos-terraced-pueblo',
    'BW-05',
    'Taos Terraced Pueblo',
    '#cca07a',
    '#3b8c94',
    'Multi-level stepped adobe pueblo with protruding cedar viga roof beams, wooden roof ladders, and a clay horno courtyard oven.',
  ),
  item(
    'english-tudor-tavern',
    'BW-06',
    'English Tudor Tavern',
    '#e2d7c2',
    '#8f4232',
    'Half-timbered coaching tavern with jettied upper story, tall brick chimney, steep clay-tile gable, and swinging inn sign.',
  ),
  item(
    'miami-art-deco-cinema',
    'BW-07',
    'Miami Art Deco Cinema',
    '#e8b9a8',
    '#38a3a5',
    'Pastel stepped ziggurat Art Deco movie palace with eyebrow ledges, illuminated marquee canopy, and rotating starburst fin.',
  ),
  item(
    'turkish-domed-hammam',
    'BW-08',
    'Turkish Domed Hammam',
    '#dfd4be',
    '#5c7378',
    'Octagonal limestone bathhouse crowned by an oculus-studded central lead dome, flanking side cupolas, and copper entry urns.',
  ),
  item(
    'london-georgian-townhouse',
    'BW-09',
    'London Georgian Townhouse',
    '#9e5440',
    '#434c54',
    'Three-story red-brick Georgian terrace house with rusticated basement steps, fanlight portal, mansard dormer, and street lamp.',
  ),
  item(
    'thai-bamboo-stilt-house',
    'BW-10',
    'Thai Bamboo Stilt House',
    '#b88954',
    '#6e3d2c',
    'Elevated teak and bamboo stilt house over calm water with swept horn-gable roof, tilting veranda shutter, and moored skiff.',
  ),
  item(
    'viking-turf-longhouse',
    'BW-11',
    'Viking Turf Longhouse',
    '#8a6242',
    '#4f7343',
    'Bowed timber Norse hall crowned with a mossy sod roof, carved dragon-prow ridge finials, hinged oak door, and shield row.',
  ),
  item(
    'tuscan-stone-villa',
    'BW-12',
    'Tuscan Stone Villa',
    '#d9b07e',
    '#b55538',
    'Sun-baked Italian hillside villa with three-arch stone loggia, terracotta hipped roofs, dovecote belvedere, and cypress pots.',
  ),
  item(
    'mongolian-felt-yurt',
    'BW-13',
    'Mongolian Felt Yurt',
    '#e7e1d4',
    '#c44b35',
    'Circular felt steppe ger wrapped with patterned tension bands, carved toono roof crown, painted door, and tilting smoke flap.',
  ),
  item(
    'venetian-canal-palazzo',
    'BW-14',
    'Venetian Canal Palazzo',
    '#dfccb4',
    '#b34c44',
    'Waterfront marble palazzo on canal steps with Gothic arched loggia, balustraded balcony, hinged canal gate, and mooring poles.',
  ),
  item(
    'korean-hanok-pavilion',
    'BW-15',
    'Korean Hanok Pavilion',
    '#d6be9c',
    '#465059',
    'Raised granite podium hanok with open maru veranda, sliding paper-lattice door, curved giwa tile eaves, and courtyard jars.',
  ),
  item(
    'dutch-stepped-gable-house',
    'BW-16',
    'Dutch Stepped Gable House',
    '#964838',
    '#e6dec8',
    'Slender Amsterdam canal house with iconic crow-stepped brick gable, tall mullioned windows, and swinging attic hoist hook.',
  ),
  item(
    'greek-doric-temple',
    'BW-17',
    'Greek Doric Temple',
    '#e6dfd1',
    '#c4874b',
    'Peripteral marble sanctuary on a three-stepped stylobate with fluted Doric columns, triglyph frieze, pediment, and altar brazier.',
  ),
  item(
    'mayan-stepped-pyramid',
    'BW-18',
    'Mayan Stepped Pyramid',
    '#c7ba9e',
    '#4d7a58',
    'Four-tier limestone Mesoamerican pyramid with steep central stairs, serpent balustrades, summit temple, and rotating sun altar.',
  ),
  item(
    'scottish-stone-croft',
    'BW-19',
    'Scottish Stone Croft',
    '#999488',
    '#4b5661',
    'Thick-walled Highland fieldstone cottage with twin gable chimneys, slate roof with skew copings, hinged door, and peat stack.',
  ),
  item(
    'colonial-wrap-porch-manor',
    'BW-20',
    'Colonial Wrap-Porch Manor',
    '#e3dccb',
    '#3e5c52',
    'Symmetrical two-story residence with full-width columned veranda, dormer hip roof, and rooftop cupola weathervane.',
  ),
];
