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

export const charactersCivilianMeta: readonly ExpansionMetaItem[] = [
  {
    id: 'hospital-surgeon', code: 'CC-01', category: 'Character', browseCategory: 'character',
    name: 'Hospital Surgeon', primary: '#3d96a2', accent: '#edf3f5', pack: 'characters-civilian',
    description: 'Operating theater surgeon in teal scrubs with draped stethoscope, hinged optical loupes, and detachable medical satchel.',
  },
  {
    id: 'commercial-airline-pilot', code: 'CC-02', category: 'Character', browseCategory: 'character',
    name: 'Commercial Airline Pilot', primary: '#1f324f', accent: '#d9b148', pack: 'characters-civilian',
    description: 'Captain in double-breasted navy flight uniform with gold epaulets, swiveling comms boom, flight bag, and detachable peaked cap.',
  },
  {
    id: 'field-botanist', code: 'CC-03', category: 'Character', browseCategory: 'character',
    name: 'Field Botanist', primary: '#677848', accent: '#c99752', pack: 'characters-civilian',
    description: 'Expedition plant researcher with pocketed vest, pressed flora backpack, swinging hand loupe, and detachable pith sunhat.',
  },
  {
    id: 'village-blacksmith', code: 'CC-04', category: 'Character', browseCategory: 'character',
    name: 'Village Blacksmith', primary: '#5c3b29', accent: '#db6e27', pack: 'characters-civilian',
    description: 'Artisan smith wearing a heavy leather forge apron, hinged brow goggles, hand hammer, and detachable back iron-tool roll.',
  },
  {
    id: 'jazz-saxophonist', code: 'CC-05', category: 'Character', browseCategory: 'character',
    name: 'Jazz Saxophonist', primary: '#322940', accent: '#e0ab38', pack: 'characters-civilian',
    description: 'Evening lounge musician in a tailored dinner jacket with a swaying brass tenor saxophone and detachable ribboned fedora.',
  },
  {
    id: 'cafe-barista', code: 'CC-06', category: 'Character', browseCategory: 'character',
    name: 'Cafe Barista', primary: '#63422e', accent: '#d9a468', pack: 'characters-civilian',
    description: 'Specialty coffee maker in a cross-strap canvas apron holding a tilting espresso portafilter and wearing a detachable knit beanie.',
  },
  {
    id: 'postal-carrier', code: 'CC-07', category: 'Character', browseCategory: 'character',
    name: 'Postal Carrier', primary: '#2d588a', accent: '#e2c34a', pack: 'characters-civilian',
    description: 'Neighborhood mail carrier in collared uniform with a hinged leather satchel flap overflowing with letters and detachable visor cap.',
  },
  {
    id: 'archivist-librarian', code: 'CC-08', category: 'Character', browseCategory: 'character',
    name: 'Archivist Librarian', primary: '#61343e', accent: '#d6b786', pack: 'characters-civilian',
    description: 'Rare-book archivist in a cardigan vest with spectacles, an opening hand-held ledger folio, and detachable scroll satchel.',
  },
  {
    id: 'alpine-mountaineer', code: 'CC-09', category: 'Character', browseCategory: 'character',
    name: 'Alpine Mountaineer', primary: '#c94e2c', accent: '#397794', pack: 'characters-civilian',
    description: 'High-altitude climber with coiled chest rope, ice axe, tilting helmet headlamp, and detachable summit rucksack.',
  },
  {
    id: 'noir-trench-detective', code: 'CC-10', category: 'Character', browseCategory: 'character',
    name: 'Noir Trench Detective', primary: '#5c5347', accent: '#ba8e4a', pack: 'characters-civilian',
    description: 'Classic investigator in a belted upturned-collar trench coat with a raised magnifying glass and detachable brimmed fedora.',
  },
  {
    id: 'studio-painter', code: 'CC-11', category: 'Character', browseCategory: 'character',
    name: 'Studio Painter', primary: '#374b7d', accent: '#e07a3b', pack: 'characters-civilian',
    description: 'Fine-arts painter wearing a draped canvas smock, thumb-hole color palette, sweeping brush arm, and detachable artist beret.',
  },
  {
    id: 'master-carpenter', code: 'CC-12', category: 'Character', browseCategory: 'character',
    name: 'Master Carpenter', primary: '#8f5a34', accent: '#e0b038', pack: 'characters-civilian',
    description: 'Woodworking craftsman in a nail-pocket tool apron wielding a rocking hand saw with a detachable back timber-tool tote.',
  },
  {
    id: 'harvest-farmer', code: 'CC-13', category: 'Character', browseCategory: 'character',
    name: 'Harvest Farmer', primary: '#4c733d', accent: '#d9ac50', pack: 'characters-civilian',
    description: 'Countryside grower in buckled bib overalls and bandana carrying a tilting harvest fork and detachable woven straw hat.',
  },
  {
    id: 'railway-conductor', code: 'CC-14', category: 'Character', browseCategory: 'character',
    name: 'Railway Conductor', primary: '#25354a', accent: '#d9aa3c', pack: 'characters-civilian',
    description: 'Express train conductor in a brass-buttoned vest with pocket watch chain, swinging brass signal lantern, and detachable pillbox cap.',
  },
  {
    id: 'dig-archaeologist', code: 'CC-15', category: 'Character', browseCategory: 'character',
    name: 'Dig Archaeologist', primary: '#9e7a50', accent: '#45756c', pack: 'characters-civilian',
    description: 'Field excavator in a strapped khaki jacket with coiled hip rope, pivoting excavation trowel, and detachable expedition bush hat.',
  },
  {
    id: 'urban-skater', code: 'CC-16', category: 'Character', browseCategory: 'character',
    name: 'Urban Skater', primary: '#2f4c75', accent: '#e85d3f', pack: 'characters-civilian',
    description: 'Street skateboarder in a layered pullover hoodie and knee guards with swiveling DJ headphones and detachable back-strapped deck.',
  },
  {
    id: 'kimono-silk-weaver', code: 'CC-17', category: 'Character', browseCategory: 'character',
    name: 'Kimono Silk Weaver', primary: '#8f2d49', accent: '#e2bd66', pack: 'characters-civilian',
    description: 'Traditional textile artisan in a crossed-collar kimono with broad tied obi sash, waving silk fan, and detachable hairpin crown.',
  },
  {
    id: 'maritime-harbor-captain', code: 'CC-18', category: 'Character', browseCategory: 'character',
    name: 'Maritime Harbor Captain', primary: '#1f3b54', accent: '#d49f36', pack: 'characters-civilian',
    description: 'Sea-weathered harbor skipper in a heavy slicker coat with sculpted beard, tilting brass spyglass, and detachable souwester hat.',
  },
  {
    id: 'astronomy-professor', code: 'CC-19', category: 'Character', browseCategory: 'character',
    name: 'Astronomy Professor', primary: '#364163', accent: '#d9ae4e', pack: 'characters-civilian',
    description: 'Observatory scholar in academic robes and gold stole holding a spinning brass armillary sphere with a detachable mortarboard cap.',
  },
  {
    id: 'bicycle-florist', code: 'CC-20', category: 'Character', browseCategory: 'character',
    name: 'Bicycle Florist', primary: '#4e8064', accent: '#e06986', pack: 'characters-civilian',
    description: 'Market flower courier in a scalloped garden apron with a back wicker bouquet basket, tilting watering can, and detachable boater hat.',
  },
];
