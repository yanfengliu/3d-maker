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

const PACK = 'vehicles-road';

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

export const vehiclesRoadMeta: readonly ExpansionMetaItem[] = [
  item('articulated-city-bus', 'VR-01', 'Articulated City Bus', '#2b6cb0', '#f0b429',
    'Twin-section articulated transit bus with pleated bellows hinge, panoramic windows, and sliding boarding doors.'),
  item('ladder-fire-engine', 'VR-02', 'Ladder Fire Engine', '#c53030', '#edf2f7',
    'Heavy fire pumper truck with side equipment lockers, flashing lightbar, and a rotating elevating aerial ladder.'),
  item('quarry-dump-truck', 'VR-03', 'Quarry Dump Truck', '#e6a21e', '#3a4248',
    'Colossal off-highway quarry haul truck with side access stairs, massive lugged tires, and a tilting rock dump bed.'),
  item('yellow-school-bus', 'VR-04', 'Yellow School Bus', '#eab308', '#222831',
    'Classic long-nose yellow school bus with ribbed roof, swing-out safety stop arm, and rolling axles.'),
  item('vintage-roadster-coupe', 'VR-05', 'Vintage Roadster Coupe', '#8c2d38', '#e6cfa3',
    '1930s sweeping-fender roadster with chrome grille shell, side exhaust pipes, folding rumble deck, and spoked wheels.'),
  item('three-wheel-tuktuk', 'VR-06', 'Three-Wheel Tuk-Tuk', '#1f8a70', '#f6c945',
    'Agile three-wheeled auto-rickshaw with steerable front fork, curved canopy roof, and rear passenger bench.'),
  item('gourmet-food-truck', 'VR-07', 'Gourmet Food Truck', '#d95d39', '#f7e3af',
    'Step-van street kitchen with an uplifting side serving awning, roof food sign topper, and rear vent stack.'),
  item('emergency-ambulance', 'VR-08', 'Emergency Ambulance', '#eef2f6', '#d63333',
    'High-roof rescue ambulance with crimson medical striping, roof lightbar, and double swinging rear doors.'),
  item('concrete-mixer-truck', 'VR-09', 'Concrete Mixer Truck', '#2f7d6d', '#f2a93b',
    'Heavy cab-over mixer chassis carrying a sloped ribbed rotating concrete drum and swinging discharge chute.'),
  item('tracked-bulldozer', 'VR-10', 'Tracked Bulldozer', '#d89b1c', '#3c434a',
    'High-drive caterpillar bulldozer with enclosed safety cab, tilting front steel blade, and rear ripper shank.'),
  item('urban-street-sweeper', 'VR-11', 'Urban Street Sweeper', '#3a7ca5', '#f4a236',
    'Compact municipal sweeper with twin spinning rotary gutter brooms, hopper body, and flashing roof beacon.'),
  item('alpine-snowplow', 'VR-12', 'Alpine Snowplow', '#d45128', '#f2c94c',
    'Winter highway plow truck fitted with an angled V-blade, rear salt hopper, and spinning spreader disc.'),
  item('poptop-camper-van', 'VR-13', 'Pop-Top Camper Van', '#4f9d8c', '#f4efe1',
    'Retro camper van with an elevating canvas pop-top roof tent, nose-mounted spare wheel, and detachable roof surfboard.'),
  item('open-wheel-kart', 'VR-14', 'Open-Wheel Racing Kart', '#d93829', '#f5e663',
    'Low-slung tubular motorsport kart with sculpted aero nose cone, sidepods, steering column, and rear wing.'),
  item('london-double-decker', 'VR-15', 'London Double-Decker', '#b91c1c', '#f3e7c9',
    'Iconic two-level red city bus with open rear boarding stair, stacked window bays, and rolling wheels.'),
  item('flatbed-tow-truck', 'VR-16', 'Flatbed Tow Truck', '#2c5aa0', '#f29f24',
    'Heavy recovery tow truck with a tilting rollback flatbed ramp, winch pylon, and overhead amber warning bar.'),
  item('bank-armored-van', 'VR-17', 'Bank Armored Van', '#3b4a59', '#c8a951',
    'Reinforced cash-in-transit armored truck with heavy bullbar, recessed view slits, and a hinged rear vault door.'),
  item('pastel-icecream-van', 'VR-18', 'Pastel Ice-Cream Van', '#ec8fa3', '#fff4d6',
    'Cheerful serving van topped with a giant swirled ice-cream cone, lifting side service flap, and pastel stripes.'),
  item('vintage-vespa-scooter', 'VR-19', 'Vintage Vespa Scooter', '#5ea89b', '#f2e8cf',
    'Curved leg-shield Italian motor scooter with steerable headlamp bars, rounded side cowls, and rear luggage rack.'),
  item('rally-offroad-buggy', 'VR-20', 'Rally Off-Road Buggy', '#d96b27', '#264653',
    'Tubular desert rally buggy with exposed long-travel suspension, roof rally light pod, and chunky knobby tires.'),
];
