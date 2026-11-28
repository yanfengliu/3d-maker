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

const PACK = 'vehicles-scifi-fantasy';

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

export const vehiclesScifiFantasyMeta: readonly ExpansionMetaItem[] = [
  item('delta-wing-starfighter', 'VX-01', 'Delta-Wing Starfighter', '#dce3ea', '#d64531',
    'Swept delta interceptor on tripod landing struts with wingtip laser cannons and a hinged cockpit canopy.'),
  item('hexapod-spider-walker', 'VX-02', 'Hexapod Spider Walker', '#495867', '#e07a2f',
    'Six-legged armored arachnid walker topped by a rotating twin-barrel dorsal turret and sweeping optic sensor.'),
  item('bipedal-cargo-mech', 'VX-03', 'Bipedal Cargo Mech', '#d99b26', '#3d4852',
    'Reverse-jointed two-legged industrial strider with roll-caged cockpit and dual articulated cargo claw arms.'),
  item('orbital-crew-shuttle', 'VX-04', 'Orbital Crew Shuttle', '#e8edf2', '#264653',
    'Delta-winged orbital spaceplane with triple bell thrusters and twin hinged dorsal payload bay doors.'),
  item('sleek-maglev-pod', 'VX-05', 'Sleek Maglev Pod', '#e2e8f0', '#2b9eb3',
    'Streamlined magnetic transit pod seated on a guideway rail plinth with rising gull-wing boarding doors.'),
  item('steampunk-ornithopter', 'VX-06', 'Steampunk Ornithopter', '#9c6644', '#d4a24c',
    'Brass-boiler airframe with ribbed mechanical flapping wings, spoked landing gear, and a spinning flywheel.'),
  item('gilded-royal-carriage', 'VX-07', 'Gilded Royal Carriage', '#6b2346', '#e0b84c',
    'Ornate curved monarch coach on tall spoked wheels with roof crown finial, side lanterns, and hinged entry door.'),
  item('bronze-war-chariot', 'VX-08', 'Bronze War Chariot', '#a97142', '#8c2d2d',
    'Two-wheeled armored bronze battle chariot with curved embossed breastwork, scythed hubs, and forward yoke.'),
  item('dwarven-steam-tank', 'VX-09', 'Dwarven Steam Tank', '#5b6268', '#c98a3b',
    'Riveted runic ironclad crawler with heavy treads, tall smokestack, prow ram, and a rotating brass cannon turret.'),
  item('floating-sky-galleon', 'VX-10', 'Floating Sky Galleon', '#7a4b2a', '#48a9a6',
    'Fantasy skyship resting on an ornate brass keel cradle with triple sails, rudder fins, and spinning ether paddles.'),
  item('subterranean-drill-mole', 'VX-11', 'Subterranean Drill Mole', '#c98a2c', '#3b424c',
    'Tracked underground boring crawler fronted by a massive rotating spiral auger bit and armored crew cab.'),
  item('orbital-drop-pod', 'VX-12', 'Orbital Drop Pod', '#505b66', '#e05a2b',
    'Faceted hexagonal reentry capsule on splayed shock fins with folding blast-door petals and roof beacon.'),
  item('industrial-exo-loader', 'VX-13', 'Industrial Exo-Loader', '#e5a928', '#333b42',
    'Open-frame bipedal warehouse power loader with splayed hydraulic feet and articulated dual hydraulic claw arms.'),
  item('arctic-rocket-sled', 'VX-14', 'Arctic Rocket Sled', '#2f6f9f', '#e65c2e',
    'Twin-runner ice speedster with aerodynamic canopy, triple aft rocket bells, and hinged dorsal airbrake flaps.'),
  item('saucer-patrol-craft', 'VX-15', 'Saucer Patrol Craft', '#8ea3b0', '#48c9b0',
    'Retro-futuristic flying saucer landed on three tripod struts with glass dome cockpit and rotating sensor ring.'),
  item('terraforming-crawler', 'VX-16', 'Terraforming Crawler', '#c96f32', '#52b788',
    'Multi-tracked planetary processor with a rotating core-sampling drill tower and articulated solar collector dish.'),
  item('cybernetic-trike', 'VX-17', 'Cybernetic Trike', '#2d3748', '#e6396b',
    'Aggressive neo-cyber three-wheeler with twin wide front wheels, steerable forks, and an angular glowing tail cowl.'),
  item('clockwork-stagecoach', 'VX-18', 'Clockwork Stagecoach', '#5e4033', '#d4a243',
    'Victorian brass-geared coach with rotating exposed side gear wheels, hinged passenger door, and roof luggage trunk.'),
  item('crystal-dune-skimmer', 'VX-19', 'Crystal Dune Skimmer', '#c9935b', '#48bfe3',
    'Desert wind-skimmer riding on twin curved sand runners with a glowing crystal core and pivoting lateen sail.'),
  item('plasma-gunship', 'VX-20', 'Plasma Gunship', '#4b5949', '#e07a2f',
    'Angular sci-fi VTOL dropship on skids with tilting twin wing-tip plasma pods and a swiveling chin cannon.'),
];
