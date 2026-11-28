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

const PACK = 'vehicles-sea-air';

function item(
  id: string,
  code: string,
  name: string,
  primary: string,
  accent: string,
  description: string,
): ExpansionMetaItem {
  return { id, code, category: 'Object', browseCategory: 'vehicle', name, primary, accent, description, pack: PACK };
}

export const vehiclesSeaAirMeta: readonly ExpansionMetaItem[] = [
  item('mississippi-paddle-steamer', 'VS-01', 'Mississippi Paddle Steamer', '#f2ece1', '#c63d2f',
    'Multi-deck riverboat with twin crowned smokestacks, ornate pilothouse, and a spinning stern paddlewheel.'),
  item('north-sea-trawler', 'VS-02', 'North Sea Trawler', '#2a4d69', '#e07a38',
    'Stout deep-sea fishing trawler with high flared bow, aft bridge, and a swinging steel net-hauling gantry.'),
  item('research-bathyscaphe', 'VS-03', 'Research Bathyscaphe', '#e8b923', '#2e5266',
    'Abyssal research bathyscaphe uniting a buoy float hull, spherical viewport cabin, and twin articulated sampling arms.'),
  item('coastal-hydrofoil-ferry', 'VS-04', 'Coastal Hydrofoil Ferry', '#e8eef2', '#1d6fa5',
    'High-speed passenger hydrofoil raised on swept submerged foil struts with spinning twin stern waterjets.'),
  item('pirate-galleon-sloop', 'VS-05', 'Pirate Three-Mast Sloop', '#6d4428', '#d9a441',
    'Three-masted timber sailing ship with raised quarterdeck, cannon ports, billowing sails, and swinging main yardarm.'),
  item('venetian-rowing-gondola', 'VS-06', 'Venetian Rowing Gondola', '#24292e', '#c99738',
    'Slender lagoon gondola with ornate bow ferro prow, tufted passenger canopy, and sweeping stern oar.'),
  item('twin-pontoon-seaplane', 'VS-07', 'Twin-Pontoon Seaplane', '#d64531', '#f3ead6',
    'High-wing bush floatplane mounted on twin stepped pontoon floats with spinning nose propeller and hinged tail elevator.'),
  item('rigid-zeppelin-airship', 'VS-08', 'Rigid Zeppelin Airship', '#cfd6dc', '#b83b3b',
    'Ribbed cigar-hulled dirigible moored to a steel mast cradle with underslung passenger gondola and twin spinning props.'),
  item('autogyro-rotorcraft', 'VS-09', 'Autogyro Rotorcraft', '#d97b29', '#325d79',
    'Open-frame light gyrocopter with overhead free-spinning rotor blades, pusher tail propeller, and tricycle gear.'),
  item('commuter-bullet-train', 'VS-10', 'Commuter Bullet Train', '#edf2f7', '#1e5aa8',
    'Aerodynamic duck-bill high-speed express locomotive with flush glazing, sliding coach door, and tilting pantograph.'),
  item('alpine-funicular-car', 'VS-11', 'Alpine Funicular Car', '#c0392b', '#f2e8cf',
    'Terraced mountain incline rail coach with stepped panoramic bays, sliding boarding doors, and roof cable clamp.'),
  item('cargo-river-barge', 'VS-12', 'Cargo River Barge', '#4a5d6e', '#d96b27',
    'Flat-bottomed inland freight barge with aft wheelhouse, sliding corrugated hatch cover, and stacked cargo crates.'),
  item('amphibious-hovercraft', 'VS-13', 'Amphibious Hovercraft', '#2c7a7b', '#f2b705',
    'Pleated-skirt air-cushion craft driven by twin rear ducted fans with pivoting twin air rudders.'),
  item('racing-catamaran', 'VS-14', 'Racing Catamaran', '#1d4e89', '#f77f00',
    'Twin wave-piercing racing hulls bridged by a tensioned trampoline deck and a pivoting aerodynamic wing sail.'),
  item('polar-icebreaker', 'VS-15', 'Polar Icebreaker', '#c83e2b', '#e9eef2',
    'Reinforced spoon-bow polar vessel with high lookout bridge, spinning marine radar, and swiveling aft deck crane.'),
  item('crop-duster-monoplane', 'VS-16', 'Crop-Duster Monoplane', '#e5b822', '#2f6d4a',
    'Low-wing agricultural spray plane with tall cockpit, radial spinning prop, underwing spray bars, and taildragger gear.'),
  item('tandem-chinook-heli', 'VS-17', 'Tandem Chinook Heli', '#4f6248', '#d99b26',
    'Heavy tandem-rotor transport helicopter with twin spinning overhead rotors and a lowering rear cargo ramp.'),
  item('vintage-caboose-car', 'VS-18', 'Vintage Caboose Car', '#a93226', '#e6c25b',
    'Classic wood-sided railway caboose with raised rooftop cupola, railed end platforms, and spinning handbrake wheel.'),
  item('viking-dragon-longship', 'VS-19', 'Viking Dragon Longship', '#7c4d2b', '#c93b2b',
    'Clinker-built Norse longship with carved dragon prow, shield-lined gunwales, striped square sail, and sweeping oars.'),
  item('jetfoil-rescue-boat', 'VS-20', 'Jetfoil Rescue Boat', '#e55925', '#f4f1e8',
    'Self-righting offshore rescue launch with enclosed wheelhouse, rotating radar bar, and swiveling bow water cannon.'),
];
