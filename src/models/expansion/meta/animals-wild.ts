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

const PACK = 'animals-wild';

function item(
  id: string,
  code: string,
  name: string,
  primary: string,
  accent: string,
  description: string,
): ExpansionMetaItem {
  return { id, code, category: 'Object', browseCategory: 'animal', name, primary, accent, description, pack: PACK };
}

export const animalsWildMeta: readonly ExpansionMetaItem[] = [
  item('grizzly-brown-bear', 'AW-01', 'Grizzly Brown Bear', '#6f4a32', '#9c785c',
    'Muscular woodland grizzly bear with shoulder hump, rounded ears, clawed paws, and a hinged growling jaw.'),
  item('african-savanna-elephant', 'AW-02', 'African Savanna Elephant', '#7d848a', '#ece4cf',
    'Towering savanna elephant with pillar legs, curved ivory tusks, flapping fan ears, and a swinging trunk.'),
  item('reticulated-giraffe', 'AW-03', 'Reticulated Giraffe', '#dfa244', '#6d3f22',
    'Slender long-legged giraffe with patterned patches, ossicone horns, and a towering articulated nodding neck.'),
  item('giant-bamboo-panda', 'AW-04', 'Giant Bamboo Panda', '#f2efe9', '#25292e',
    'Plump bamboo-munching giant panda with iconic dark eye patches, turning head, waving paw, and detachable bamboo.'),
  item('bald-golden-eagle', 'AW-05', 'Bald Golden Eagle', '#5a3d28', '#f2ede2',
    'Majestic perched raptor on a crag stump with hooked amber beak, white crown, and sweeping articulated wings.'),
  item('pink-wading-flamingo', 'AW-06', 'Pink Wading Flamingo', '#eb7a95', '#f9c6d1',
    'Graceful pink flamingo standing in shallow water ripples with curved S-neck, downturned beak, and fluttering wings.'),
  item('red-bounding-kangaroo', 'AW-07', 'Red Bounding Kangaroo', '#b85d38', '#e8d3b5',
    'Upright red kangaroo balanced on powerful hind feet and heavy tail with tall swiveling ears and alert head.'),
  item('playful-river-otter', 'AW-08', 'Playful River Otter', '#6e4e3a', '#c9b399',
    'Whiskered river otter perched on a smooth river rock with webbed paws, rudder tail, and detachable river shell.'),
  item('himalayan-snow-leopard', 'AW-09', 'Himalayan Snow Leopard', '#cfd3d6', '#565d63',
    'Lithe spotted mountain leopard with broad snow paws, prowling stance, turning head, and thick sweeping tail.'),
  item('antlered-woodland-moose', 'AW-10', 'Antlered Woodland Moose', '#4e392d', '#c9b698',
    'Tall woodland moose with broad overhanging muzzle, throat bell, nodding head, and detachable palmate antlers.'),
  item('armored-white-rhinoceros', 'AW-11', 'Armored White Rhinoceros', '#7c8084', '#c9c2b2',
    'Heavy savanna rhinoceros with folded hide armor plates, stout legs, and a lowering dual-horned charging head.'),
  item('river-hippopotamus', 'AW-12', 'River Hippopotamus', '#6e6570', '#c4969e',
    'Barrel-bodied river hippo with short sturdy legs, tiny ears, and a wide-yawning hinged jaw with ivory tusks.'),
  item('silverback-gorilla', 'AW-13', 'Silverback Gorilla', '#2f3238', '#aeb6bf',
    'Knuckle-walking silverback great ape with pale saddle back, heavy brow ridge, and articulated swinging arms.'),
  item('dromedary-desert-camel', 'AW-14', 'Dromedary Desert Camel', '#c79b63', '#a83c32',
    'Single-humped desert camel with splayed padded feet, curved nodding neck, and a detachable woven saddle cloth.'),
  item('fluffy-highland-alpaca', 'AW-15', 'Fluffy Highland Alpaca', '#efe6d5', '#b88b5a',
    'Woolly highland alpaca with cloud-puffed fleece, slender legs, tall banana ears, turning head, and swishing tail.'),
  item('pembroke-corgi-pup', 'AW-16', 'Pembroke Corgi Pup', '#d98236', '#f7f1e3',
    'Low-slung corgi pup with oversized upright ears, fluffy chest ruff, tilting curious head, and wagging stub tail.'),
  item('spotted-cheetah', 'AW-17', 'Spotted Cheetah', '#dfa64b', '#332b24',
    'Slender deep-chested sprinter cheetah with dark spots, tear-stripe face, swiveling head, and long balancing tail.'),
  item('horned-great-owl', 'AW-18', 'Horned Great Owl', '#7a5c43', '#dfc79b',
    'Broad-shouldered great horned owl on a woodland perch with dramatic ear tufts, swiveling head, and flapping wings.'),
  item('arctic-walrus', 'AW-19', 'Arctic Walrus', '#7d5f52', '#efe7d6',
    'Whiskered blubbery walrus resting on an ice floe with long twin ivory tusks, nodding head, and flapping flippers.'),
  item('fanning-peacock', 'AW-20', 'Fanning Peacock', '#1d6f8a', '#2e9e6d',
    'Iridescent crested peacock with slender neck, turning head, and an eye-spotted multi-plume tail fan.'),
];
