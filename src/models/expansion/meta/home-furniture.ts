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

const PACK = 'home-furniture';
const item = (
  id: string, code: string, name: string, primary: string, accent: string, description: string,
): ExpansionMetaItem => ({
  id, code, category: 'Object', browseCategory: 'prop', name, primary, accent, description, pack: PACK,
});

export const homeFurnitureMeta: readonly ExpansionMetaItem[] = [
  item('winged-armchair', 'HF-01', 'Winged Armchair', '#3d5a58', '#d4a259', 'High-backed upholstered wing chair with turned walnut legs, reclining backrest, and detachable lumbar pillow.'),
  item('four-poster-bunk-bed', 'HF-02', 'Four-Poster Bunk Bed', '#7d5638', '#c85b42', 'Turned timber four-poster bunk bed with side ladder, sliding trundle drawer, and removable canopy valance.'),
  item('oak-wardrobe', 'HF-03', 'Carved Oak Wardrobe', '#6e492e', '#d1a34b', 'Tall Victorian oak armoire with twin paneled doors, interior hanging rail, and a sliding base drawer.'),
  item('rolltop-desk', 'HF-04', 'Tambour Rolltop Desk', '#845836', '#c99c48', 'Twin-pedestal study desk with pigeonhole gallery, pivoting tambour rolltop hood, and sliding center drawer.'),
  item('slatted-bookcase', 'HF-05', 'Slatted Library Bookcase', '#764e32', '#3c7a74', 'Tall library shelving bay with slatted sides, rail-mounted rolling ladder, and detachable book stacks.'),
  item('mirrored-vanity', 'HF-06', 'Mirrored Dressing Vanity', '#a87d56', '#d8a657', 'Mid-century splayed-leg dressing vanity with tilting brass-framed oval mirror and sliding jewelry drawer.'),
  item('dining-table-set', 'HF-07', 'Farmhouse Dining Table Set', '#875c3b', '#4d6b53', 'Rustic trestle dining table with sliding extension leaf and two tuck-in spindle-back dining chairs.'),
  item('rocking-cradle', 'HF-08', 'Bentwood Rocking Cradle', '#a97b52', '#e0b35a', 'Spindle-sided bentwood nursery cradle on curved rockers with a rocking crib body and spinning overhead mobile.'),
  item('brass-bar-cart', 'HF-09', 'Brass Rolling Bar Cart', '#2d5c57', '#d8ae56', 'Art Deco two-tier rolling bar cart with tubular brass rails, spinning spoked casters, and removable decanter tray.'),
  item('turned-coat-tree', 'HF-10', 'Turned Coat Tree', '#633e27', '#cf9c46', 'Victorian fluted walnut hall coat tree with rotating bentwood hook crown and detachable umbrella bundle.'),
  item('vinyl-record-console', 'HF-11', 'Mid-Century Record Console', '#825132', '#d69742', 'Walnut stereo credenza with woven speaker grilles, hinged dust lid, and spinning vinyl turntable platter.'),
  item('hearth-fireplace', 'HF-12', 'Carved Stone Hearth Fireplace', '#8a8278', '#d96b30', 'Masonry hearth fireplace with carved mantel, glowing fire logs, swinging mesh doors, and removable mantel clock.'),
  item('curio-vitrine', 'HF-13', 'Arched Curio Vitrine', '#5e3c28', '#d4a652', 'Tall arched-pediment glass display vitrine with hinged front door and detachable porcelain curio shelf pieces.'),
  item('convertible-daybed', 'HF-14', 'Convertible Daybed Futon', '#4b667a', '#d49a52', 'Scandinavian ash-frame daybed futon with slatted arms, reclining cushioned backrest, and sliding storage drawer.'),
  item('trestle-workbench', 'HF-15', 'Joiner Trestle Workbench', '#9e7044', '#c95c38', 'Heavy laminated maple joiner workbench with sliding cast-iron front vise and detachable rear hand-tool rack.'),
  item('credenza-sideboard', 'HF-16', 'Slatted Credenza Sideboard', '#7c4c2f', '#d6a44e', 'Low mid-century walnut credenza on tapered legs with bypass slatted sliding doors and central media niche.'),
  item('treadle-sewing-cabinet', 'HF-17', 'Treadle Sewing Cabinet', '#6d472e', '#d6a244', 'Antique cast-iron and oak sewing table with rocking foot treadle, spinning handwheel, and folding drop leaf.'),
  item('corner-china-hutch', 'HF-18', 'Corner China Hutch', '#506a64', '#d8ae5c', 'Chamfered colonial corner china cupboard with glazed upper door, paneled lower door, and removable plate display.'),
  item('architect-drafting-table', 'HF-19', 'Architect Drafting Table', '#465866', '#d88c3a', 'Cast-iron studio drafting table with tilting blueprint board, sliding pencil tray, and clamped gooseneck lamp.'),
  item('tufted-leather-sofa', 'HF-20', 'Tufted Chesterfield Sofa', '#6e3426', '#cfa052', 'Deep-tufted rolled-arm leather Chesterfield sofa with pop-out reclining footrest and detachable accent cushions.'),
];
