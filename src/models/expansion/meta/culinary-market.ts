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

const PACK = 'culinary-market';
const item = (
  id: string, code: string, name: string, primary: string, accent: string, description: string,
): ExpansionMetaItem => ({
  id, code, category: 'Object', browseCategory: 'prop', name, primary, accent, description, pack: PACK,
});

export const culinaryMarketMeta: readonly ExpansionMetaItem[] = [
  item('gelato-umbrella-cart', 'CM-01', 'Gelato Umbrella Cart', '#67a69c', '#e07a62', 'Italian street gelato cart on spoked wheels with striped sun umbrella and twin hinged freezer well lids.'),
  item('ramen-noodle-stall', 'CM-02', 'Timber Ramen Noodle Stall', '#7c5334', '#c94332', 'Traditional cedar yatai ramen stall with hanging lanterns, swaying noren curtain, and lifting broth pot lid.'),
  item('sushi-conveyor-counter', 'CM-03', 'Sushi Conveyor Counter', '#a88052', '#d4543c', 'Japanese kaiten sushi counter with slatted hinoki front, spinning conveyor track, and removable nigiri plates.'),
  item('curved-bakery-display', 'CM-04', 'Curved Bakery Display Case', '#8a5d3b', '#e0a548', 'Patisserie curved-glass bakery cabinet with sliding rear clerk doors and detachable croissant and tart trays.'),
  item('oak-wine-barrel-rack', 'CM-05', 'Oak Wine Barrel Rack', '#784c2e', '#d6a444', 'Cellar timber tasting rack cradling iron-hooped oak wine casks with turning brass spigot and removable glasses.'),
  item('wooden-cheese-press', 'CM-06', 'Wooden Lever Cheese Press', '#8f623c', '#e6bd56', 'Farmhouse oak lever cheese press with perforated vat mold, turning leadscrew, and weighted fulcrum beam.'),
  item('drum-coffee-roaster', 'CM-07', 'Cast-Iron Coffee Roaster', '#3c454d', '#cf8d3c', 'Artisan drum coffee roaster with brass bean hopper, spinning roast drum, and rotating front cooling agitator.'),
  item('brass-hotdog-cart', 'CM-08', 'Brass Hot-Dog Cart', '#c84838', '#e0b248', 'Classic striped-awning street hot-dog cart on spoked wheels with hinged brass steamer lid and condiment wells.'),
  item('tiered-spice-stall', 'CM-09', 'Tiered Spice Bazaar Stall', '#825636', '#d97828', 'Moroccan stepped timber spice stall with tilting striped awning and removable colorful conical spice mounds.'),
  item('maple-butcher-block', 'CM-10', 'Maple Butcher Block', '#b08252', '#c85038', 'Heavy end-grain maple chopping block table with sliding front cleaver drawer and detachable side knife rack.'),
  item('tea-ceremony-table', 'CM-11', 'Japanese Tea Ceremony Table', '#663c28', '#528064', 'Low lacquered chabudai tea table with sunken brazier hearth, lifting cast-iron kettle lid, and sliding tea drawer.'),
  item('vintage-popcorn-wagon', 'CM-12', 'Vintage Popcorn Wagon', '#be3c32', '#e2b64a', 'Ornate fairground carnival popcorn wagon with tall spoked wheels, glazed cabinet, and tilting popping kettle.'),
  item('chrome-soda-fountain', 'CM-13', 'Chrome Soda Fountain Counter', '#4c8e8c', '#d95448', 'Retro soda fountain bar counter with pulling chrome draft levers and a spinning countertop milkshake mixer.'),
  item('taco-griddle-cart', 'CM-14', 'Street Taco Griddle Cart', '#b85036', '#e0a63e', 'Street taco plancha cart with rotating vertical al-pastor trompo spit, pineapple crown, and folding side shelf.'),
  item('tiered-flower-stall', 'CM-15', 'Tiered Market Flower Stall', '#567862', '#e06e78', 'Stepped timber market flower stand with tilting scalloped canvas sunshade and removable floral bouquet buckets.'),
  item('cider-apple-press', 'CM-16', 'Oak Cider Apple Press', '#7d5232', '#b83c34', 'Rustic orchard oak cider press with slatted pressing basket, rotating cast-iron flywheel, and descending platen.'),
  item('fishmonger-ice-table', 'CM-17', 'Fishmonger Ice Table', '#58788a', '#d86646', 'Harbor fishmonger angled ice display table with swinging brass overhead pan scale and removable seafood catch.'),
  item('street-crepe-stand', 'CM-18', 'Parisian Crepe Stand', '#425d78', '#e0a246', 'Sidewalk crepe kiosk counter with dual billig griddles, spinning batter spreader rake, and opening warming drawer.'),
  item('olive-oil-amphora-rack', 'CM-19', 'Olive Oil Amphora Rack', '#a65c3e', '#6f8546', 'Mediterranean wrought-iron cellar rack holding terracotta olive oil amphorae with tilting pour jar and pitcher.'),
  item('dim-sum-steamer-cart', 'CM-20', 'Dim-Sum Steamer Cart', '#7d8a92', '#d4a254', 'Cantonese stainless dim-sum rolling push cart with stacked bamboo steamers, lifting lid, and rolling spoked wheels.'),
];
