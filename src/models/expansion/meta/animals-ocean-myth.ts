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

const PACK = 'animals-ocean-myth';

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

export const animalsOceanMythMeta: readonly ExpansionMetaItem[] = [
  item('breaching-blue-whale', 'AO-01', 'Breaching Blue Whale', '#2b5876', '#cbdbe6',
    'Colossal baleen whale rising above a sculpted ocean wave plinth with pleated throat, sweeping flippers, and tail fluke.'),
  item('hammerhead-shark', 'AO-02', 'Hammerhead Shark', '#5a7282', '#d9e2e8',
    'Sleek reef predator on a wave-coral pedestal with wide T-shaped hammer head, sickle dorsal fin, and sweeping tail.'),
  item('giant-reef-octopus', 'AO-03', 'Giant Reef Octopus', '#c2463a', '#f2a65a',
    'Bulbous-mantled octopus gripping seafloor rocks with eight curling tentacles and articulated sweeping front arms.'),
  item('gliding-manta-ray', 'AO-04', 'Gliding Manta Ray', '#283c4f', '#e6eef2',
    'Diamond-winged ocean manta gliding above a coral wave base with cephalic fins, whip tail, and flapping wingtips.'),
  item('spotted-narwhal', 'AO-05', 'Spotted Narwhal', '#627d8f', '#f0e6cc',
    'Arctic whale resting on an icy wave cradle with a long spiraled ivory horn tusk, flippers, and sweeping tail fluke.'),
  item('giant-king-crab', 'AO-06', 'Giant King Crab', '#b83c2a', '#e89d54',
    'Spiny armored deep-sea king crab standing on six tall jointed legs with articulated snapping pincer claws.'),
  item('curled-seahorse', 'AO-07', 'Curled Seahorse', '#e59a28', '#f5d97e',
    'Upright ridged seahorse coiling its tail around a reef coral branch with tubular snout, coronet, and fluttering fin.'),
  item('tyrannosaurus-rex', 'AO-08', 'Tyrannosaurus Rex', '#4f6d42', '#c8a95b',
    'Bipedal apex theropod dinosaur with muscular legs, counterbalancing tail, tiny arms, and a hinged roaring jaw.'),
  item('horned-triceratops', 'AO-09', 'Horned Triceratops', '#5d7359', '#d9c598',
    'Armored quadruped dinosaur with scalloped bone frill, triple brow and nose horns, and an articulated charging head.'),
  item('plated-stegosaurus', 'AO-10', 'Plated Stegosaurus', '#6c7c48', '#cc6b3d',
    'Arched-back herbivore dinosaur with alternating diamond dorsal plates and a swinging four-spiked thagomizer tail.'),
  item('crested-pterosaur', 'AO-11', 'Crested Pterosaur', '#8c5638', '#d9a05b',
    'Prehistoric winged reptile perched on a coastal crag with sweeping head crest, spear beak, and flapping wings.'),
  item('longneck-brachiosaurus', 'AO-12', 'Long-Neck Brachiosaurus', '#587b65', '#c8c088',
    'Towering sauropod with tall forelegs, sloping back, sweeping tail, and a soaring articulated crane-like neck.'),
  item('winged-western-dragon', 'AO-13', 'Winged Western Dragon', '#9e2a2b', '#e09f3e',
    'Four-legged horned European dragon with ribbed flapping wings, spined back, curling tail, and a hinged roaring jaw.'),
  item('serpentine-eastern-lung', 'AO-14', 'Serpentine Eastern Lung', '#2a7f62', '#e8b931',
    'Sinuous imperial eastern dragon coiled atop cloud-rocks with stag antlers, flowing whiskers, and swaying head.'),
  item('lion-eagle-griffin', 'AO-15', 'Lion-Eagle Griffin', '#b8863c', '#f0e4c8',
    'Regal lion-bodied mythical guardian with eagle fore-talons, hooked beak, tufted tail, and flapping feathered wings.'),
  item('blazing-fire-phoenix', 'AO-16', 'Blazing Fire Phoenix', '#d94816', '#f7c948',
    'Radiant firebird perched on an ember spire with layered flame wings, flowing tail plumes, and a nodding crest.'),
  item('horned-moon-unicorn', 'AO-17', 'Horned Moon Unicorn', '#edf2f7', '#a78bfa',
    'Graceful horned equine with sculpted mane, feathered hooves, spiraled radiant forehead horn, and swishing tail.'),
  item('winged-pegasus', 'AO-18', 'Winged Pegasus', '#e6ecf2', '#d9a441',
    'Noble winged stallion standing on a sculpted cloud-stone plinth with sweeping articulated feathered wings.'),
  item('mossy-stone-golem', 'AO-19', 'Mossy Stone Golem', '#6b7068', '#52a357',
    'Hulking boulder-hewn guardian with glowing rune core, moss-draped shoulders, and heavy swinging stone fists.'),
  item('nine-tailed-kitsune', 'AO-20', 'Nine-Tailed Kitsune', '#f2ece1', '#d9483b',
    'Mythical folklore fox spirit with tall alert ears, shrine collar orb, turning head, and a fanning nine-tail crown.'),
];
