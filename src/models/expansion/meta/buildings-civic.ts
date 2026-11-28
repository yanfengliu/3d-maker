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

const PACK = 'buildings-civic';

function meta(
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

export const buildingsCivicMeta: readonly ExpansionMetaItem[] = [
  meta(
    'brick-fire-station',
    'BC-01',
    'Brick Fire Station',
    '#a64236',
    '#d9a648',
    'Two-story red-brick firehouse with an arched engine bay, tall corner hose-drying tower, sliding bay door, and swinging brass alarm bell.',
  ),
  meta(
    'municipal-courthouse',
    'BC-02',
    'Municipal Courthouse',
    '#d9d1bf',
    '#4c7a6e',
    'Neoclassical limestone courthouse with grand entrance steps, four fluted portico columns, triangular pediment, clock cupola, and rotating scale vane.',
  ),
  meta(
    'carnegie-public-library',
    'BC-03',
    'Carnegie Public Library',
    '#cfc3ab',
    '#43736a',
    'Beaux-Arts stone public library with arched tripartite windows, grand entry archway, ribbed copper dome skylight, hinged door, and detachable book drop.',
  ),
  meta(
    'chrome-corner-diner',
    'BC-04',
    'Chrome Corner Diner',
    '#bfc9cf',
    '#c93f3b',
    'Streamlined stainless-steel railcar diner with wrap-around corner glass, checkered waist band, hinged door, and spinning rooftop coffee-cup neon sign.',
  ),
  meta(
    'vintage-service-station',
    'BC-05',
    'Vintage Service Station',
    '#e0dacb',
    '#2f7a73',
    'Mid-century streamlined service garage with cantilevered pump canopy on columns, sliding service bay door, and detachable twin vintage fuel pumps.',
  ),
  meta(
    'timber-grain-silo',
    'BC-06',
    'Timber Grain Silo',
    '#b58858',
    '#4d5c66',
    'Tall iron-banded timber-stave cylindrical grain silo with conical headhouse roof, angled auger chute, side hopper shed, rotating turbine, and chute gate.',
  ),
  meta(
    'elevated-water-tower',
    'BC-07',
    'Elevated Water Tower',
    '#9c744f',
    '#b84738',
    'Cross-braced four-leg steel trestle water tower supporting a banded wooden tank, catwalk railing, conical roof, rotating wind vane, and sliding level gauge.',
  ),
  meta(
    'red-barn-hayloft',
    'BC-08',
    'Red Barn & Hayloft',
    '#a43831',
    '#e4dfd0',
    'Classic gambrel-roofed red barn with cross-braced double doors, hayloft dormer with protruding hay-fork hood, louvered cupola, and hinged barn and loft doors.',
  ),
  meta(
    'victorian-conservatory',
    'BC-09',
    'Victorian Conservatory',
    '#4f7361',
    '#d6cbb5',
    'Ornate octagonal iron-and-glass botanical rotunda with ribbed dome, twin glazed wings, iron roof cresting, hinged entry door, and tilting crown vent.',
  ),
  meta(
    'ferry-terminal-hall',
    'BC-10',
    'Ferry Terminal Hall',
    '#49697f',
    '#c7543e',
    'Waterfront arched steel-truss ferry terminal with clock gable, passenger boarding ramp, lifting boarding gate, and maritime mast with rotating radar.',
  ),
  meta(
    'mountain-ranger-cabin',
    'BC-11',
    'Mountain Ranger Cabin',
    '#8f5f3c',
    '#3d634d',
    'Notched-log park ranger cabin with battered fieldstone chimney, covered front porch, trailhead noticeboard, hinged cabin door, and detachable woodpile.',
  ),
  meta(
    'brick-schoolhouse',
    'BC-12',
    'Brick Schoolhouse',
    '#ab4a3b',
    '#e5decb',
    'One-room rural brick schoolhouse with steep pitched gable, front vestibule porch, white belfry tower, swinging brass school bell, and hinged door.',
  ),
  meta(
    'stone-parish-chapel',
    'BC-13',
    'Stone Parish Chapel',
    '#b8b1a3',
    '#4d5a66',
    'Gothic country stone chapel with buttressed nave, circular rose window over a pointed portal, tall stone steeple spire, hinged chapel door, and swinging bell.',
  ),
  meta(
    'corner-pharmacy-shop',
    'BC-14',
    'Corner Pharmacy Shop',
    '#a35342',
    '#2e6b57',
    'Chamfered-corner brick apothecary with bow display bays, striped transom awning, hinged corner door, and swaying hanging mortar-and-pestle street sign.',
  ),
  meta(
    'waterfront-fish-cannery',
    'BC-15',
    'Waterfront Fish Cannery',
    '#8a8e8a',
    '#b8523d',
    'Timber wharf fish cannery on pilings over water with sawtooth clerestory roof, brick boiler smokestack, sliding dock door, and swinging jib hoist.',
  ),
  meta(
    'rural-sawmill-shed',
    'BC-16',
    'Rural Sawmill Shed',
    '#9e734c',
    '#667880',
    'Open-sided timber-framed sawmill pavilion with corrugated gable roof, twin carriage track rails, sliding log carriage, and spinning circular saw blade.',
  ),
  meta(
    'urban-subway-entrance',
    'BC-17',
    'Urban Subway Entrance',
    '#365e4d',
    '#cfa152',
    'Art Nouveau cast-iron and glass subway kiosk canopy over a descending tiled stair enclosure with hinged service gate and detachable twin globe lamps.',
  ),
  meta(
    'botanical-bandstand',
    'BC-18',
    'Botanical Bandstand',
    '#d4ccb8',
    '#487d6f',
    'Raised octagonal stone park bandstand with fluted iron columns, lattice railings, swept copper bell-curve roof, rotating music stand, and detachable benches.',
  ),
  meta(
    'harbor-customs-house',
    'BC-19',
    'Harbor Customs House',
    '#cec7b8',
    '#3b6375',
    'Stately two-story maritime stone customs headquarters with arcaded ground floor, roof balustrade, hinged entry door, and rotating harbor signal beacon.',
  ),
  meta(
    'coastal-rescue-station',
    'BC-20',
    'Coastal Rescue Station',
    '#7c8487',
    '#c74b34',
    'Shingle-style coastal lifeboat boathouse with lookout cupola, angled timber launch slipway apron, hinged boat-bay door, and sweeping rescue searchlight.',
  ),
];
