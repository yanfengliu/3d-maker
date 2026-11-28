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

const PACK = 'kitchen-appliances';
const item = (
  id: string, code: string, name: string, primary: string, accent: string, description: string,
): ExpansionMetaItem => ({
  id, code, category: 'Object', browseCategory: 'prop', name, primary, accent, description, pack: PACK,
});

export const kitchenAppliancesMeta: readonly ExpansionMetaItem[] = [
  item('retro-refrigerator', 'KA-01', 'Retro Rounded Refrigerator', '#5fa89d', '#d8d6cc', 'Vintage rounded-shoulder enamel refrigerator with chrome badge and independently opening freezer and fridge doors.'),
  item('cast-iron-gas-range', 'KA-02', 'Cast-Iron Gas Range', '#38464f', '#d97a38', 'Six-burner commercial gas range stove with spider grates, rotating burner dial, and drop-down glazed oven door.'),
  item('commercial-espresso-machine', 'KA-03', 'Commercial Espresso Machine', '#b54434', '#d8ae56', 'Dual-group Italian cafe espresso machine with pulling brew levers, articulating steam wand, and cup warmer rail.'),
  item('planetary-stand-mixer', 'KA-04', 'Planetary Stand Mixer', '#c7483e', '#d9cbb4', 'Sculpted cast-metal planetary stand mixer with latched stainless bowl, tilting motor head, and spinning wire whisk.'),
  item('undercounter-dishwasher', 'KA-05', 'Undercounter Dishwasher', '#7d8a92', '#d4a65a', 'Butcher-block-topped stainless dishwasher with fold-down front door and roll-out loaded dish rack.'),
  item('countertop-microwave', 'KA-06', 'Countertop Microwave', '#4e7a78', '#e0a94f', 'Retro-modern countertop microwave on a tiled caddy plinth with opening door and spinning interior glass turntable.'),
  item('domed-pizza-oven', 'KA-07', 'Brick Pizza Oven', '#b05638', '#e08b36', 'Wood-fired domed brick pizza oven on an arched masonry pedestal with hinged iron door and sliding pizza peel.'),
  item('high-speed-blender', 'KA-08', 'High-Speed Counter Blender', '#c45238', '#e6c24c', 'Commercial high-speed countertop blender with tapered pitcher, spinning blade rotor, and hinged vented lid.'),
  item('convection-toaster-oven', 'KA-09', 'Convection Toaster Oven', '#546874', '#d99848', 'Artisan convection toaster oven on a baking stand with rotating temperature dial and drop-down glass door.'),
  item('commercial-ice-dispenser', 'KA-10', 'Commercial Ice Dispenser', '#6a7c88', '#4298a8', 'Tall stainless hotel ice dispenser with louvered condenser head, push-paddle chute lever, and service bin hatch.'),
  item('dual-zone-wine-cooler', 'KA-11', 'Dual-Zone Wine Cooler', '#3e444b', '#b8683a', 'Tall dual-zone wine cellar cabinet with framed tinted glass door and pull-out slatted oak bottle shelf.'),
  item('charcoal-kettle-grill', 'KA-12', 'Charcoal Kettle Grill', '#2d373d', '#d95432', 'Classic enameled spherical charcoal kettle grill on rolling tripod wheels with hinged domed vent lid.'),
  item('offset-barrel-smoker', 'KA-13', 'Offset Barrel Smoker', '#393e42', '#d9692b', 'Heavy horizontal steel-drum offset barbecue smoker with counterweighted barrel lid and opening side firebox door.'),
  item('commercial-wok-station', 'KA-14', 'Commercial Wok Station', '#78848c', '#d86634', 'Stainless restaurant wok range with seasoned wok pan, swiveling overhead water faucet arm, and rotating flame valve.'),
  item('induction-chef-island', 'KA-15', 'Induction Chef Island', '#4b5a63', '#cf8d48', 'Modern monolithic induction island with overhead pot arch, sliding utensil drawer, and swinging copper pot hook.'),
  item('canopy-range-hood', 'KA-16', 'Canopy Range Hood Station', '#7d8a91', '#d68a3c', 'Freestanding island pyramid canopy range hood over a cook frame with tilting baffle filter and spinning exhaust fan.'),
  item('gelato-batch-freezer', 'KA-17', 'Gelato Batch Freezer', '#4e8094', '#e0a04a', 'Italian stainless gelato batch freezer with hopper funnel, hinged dispensing chute, and spinning churn dasher.'),
  item('bakery-proofer-cabinet', 'KA-18', 'Bakery Proofer Cabinet', '#7c878e', '#d69d4a', 'Tall rolling bakery dough-proofer cabinet with twin glazed doors and detachable stacked rising dough sheet pans.'),
  item('twin-basket-fryer', 'KA-19', 'Commercial Twin-Basket Fryer', '#75828a', '#db8e36', 'Floor-standing commercial deep fryer with flue riser and dual lifting mesh fry baskets with dipped handles.'),
  item('sous-vide-prep-station', 'KA-20', 'Sous-Vide Prep Station', '#506f7a', '#e0a246', 'Stainless culinary sous-vide bath cart with polycarbonate tank, hinged bath cover, and spinning circulator rotor.'),
];
