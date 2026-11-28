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

const item = (
  code: string,
  id: string,
  name: string,
  primary: string,
  accent: string,
  description: string,
): ExpansionMetaItem => ({
  id,
  code,
  category: 'Object',
  browseCategory: 'prop',
  name,
  primary,
  accent,
  description,
  pack: 'sports-play',
});

export const sportsPlayMeta: readonly ExpansionMetaItem[] = [
  item('SP-01', 'street-basketball-hoop', 'Street Basketball Hoop', '#2e4a6b', '#e05a2b',
    'Weighted-base street basketball goal with angled telescoping pole, framed acrylic backboard, flexing breakaway rim, and swinging cord net.'),
  item('SP-02', 'stadium-foosball-table', 'Stadium Foosball Table', '#8b5431', '#d9483b',
    'Walnut arcade foosball cabinet with recessed turf pitch, goal chutes, spinning and sliding player rods, and abacus score beads.'),
  item('SP-03', 'classic-pinball-machine', 'Classic Pinball Machine', '#2f4d8a', '#f0b429',
    'Sloped glass-top arcade pinball cabinet with marquee backbox, illuminated pop bumpers, dual swinging flippers, and spring ball plunger.'),
  item('SP-04', 'motorized-treadmill', 'Motorized Treadmill', '#3a4654', '#e85d2a',
    'Inclined gym running deck with twin upright handrails, telemetry display console, spinning belt roller, and safety clip.'),
  item('SP-05', 'power-squat-rack', 'Power Squat Rack', '#2e3740', '#d63d33',
    'Four-post steel strength cage with pull-up bar, J-hooks, spotter arms, and a loaded Olympic barbell lifting along the uprights.'),
  item('SP-06', 'folding-ping-pong-table', 'Folding Ping-Pong Table', '#1f5c8a', '#e87d2e',
    'Wheeled tournament table-tennis chassis with center mesh net and twin hinged folding leaves with crisp court markings.'),
  item('SP-07', 'boxing-ring-corner', 'Boxing Ring Corner Post', '#c4342d', '#f0c43c',
    'Elevated canvas boxing ring corner with padded turnbuckle bolster, three tensioned ropes, corner stairs, and ringing brass bell.'),
  item('SP-08', 'park-seesaw-plank', 'Park Seesaw Plank', '#2c8c5b', '#f0a526',
    'Anchored A-frame playground fulcrum supporting a long balancing plank with molded seats, arched grab handles, and rubber bumper tires.'),
  item('SP-09', 'playground-merry-go-round', 'Playground Merry-Go-Round', '#d9483b', '#f2c12e',
    'Grounded steel hub carousel with spinning segmented circular deck, curved tubular handrails, and central spoked steering wheel.'),
  item('SP-10', 'spiral-playground-slide', 'Spiral Playground Slide', '#2b7ab8', '#f08a24',
    'Elevated ladder tower with peaked canopy, safety guardrails, sweeping helical slide chute, and spinning sensory activity wheel.'),
  item('SP-11', 'slate-billiard-table', 'Slate Billiard Table', '#7a4427', '#1f7a4d',
    'Mahogany tournament pool table with turned legs, cushioned rails, six drop pockets, racked balls, and gliding break cue stick.'),
  item('SP-12', 'baseball-pitching-machine', 'Baseball Pitching Machine', '#2c6a9e', '#e6b82e',
    'Tripod-mounted batting practice pitcher with curved ball feeder chute, tilting launch head, and dual counter-spinning drive wheels.'),
  item('SP-13', 'alpine-ski-lift-chair', 'Alpine Ski-Lift Chair', '#385a7c', '#d94832',
    'Grounded alpine cable gantry frame suspending a swinging dual-seat ski-lift chair with padded cushions and hinged safety bar.'),
  item('SP-14', 'bowling-pinsetter-gate', 'Bowling Pinsetter Gate', '#2b3a67', '#e8533f',
    'Maple pin deck flanked by ball gutters, ten lathed bowling pins in formation, retro overhead masking hood, and dropping sweep rake.'),
  item('SP-15', 'rowing-ergometer', 'Rowing Ergometer', '#2d353c', '#3da5d9',
    'Monorail indoor rowing machine with perforated front flywheel fan, gliding seat carriage, foot stretchers, and pulling handle.'),
  item('SP-16', 'climbing-boulder-wall', 'Climbing Boulder Wall', '#b88454', '#e04f33',
    'Overhanging birch climbing wall braced by rear A-frame buttresses, studded with colorful holds, crash pad, and swinging summit bell.'),
  item('SP-17', 'archery-target-stand', 'Archery Target Stand', '#9c6a3e', '#d93b32',
    'Cedar tripod easel carrying a concentric banded straw target butt with embedded arrows, strapped quiver, and fluttering wind flag.'),
  item('SP-18', 'tabletop-air-hockey', 'Tabletop Air-Hockey', '#23334c', '#ef476f',
    'Pedestal arcade air-hockey table with overhead electronic score bridge, dual sliding striker paddles, and gliding glowing puck.'),
  item('SP-19', 'tennis-umpire-chair', 'Tennis Umpire Chair', '#1f5e42', '#e0632c',
    'Tall courtside ladder-frame official chair with elevated bucket seat, folding scorekeeper writing tablet, and hinged sun canopy.'),
  item('SP-20', 'gymnastic-pommel-horse', 'Gymnastic Pommel Horse', '#a86e44', '#2c5e8a',
    'Height-adjustable suede-clad gymnastic horse with curved twin pommels on a landing mat alongside a flexing coiled springboard.'),
];
