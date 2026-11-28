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

const PACK = 'scifi-stations';

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
  pack: PACK,
});

export const scifiStationsMeta: readonly ExpansionMetaItem[] = [
  item(
    'SS-01',
    'vertical-cryo-sleep-pod',
    'Vertical Cryo-Sleep Pod',
    '#3c5b73',
    '#38d9e8',
    'Heavy cryo base plinth with vertical frosted-glass chamber, ribbed cooling manifold, hinged canopy hatch, and vital-sign display.',
  ),
  item(
    'SS-02',
    'tactical-holo-map-table',
    'Tactical Holo-Map Table',
    '#2f4558',
    '#28d6b8',
    'Octagonal bridge pedestal with slanted control ring, translucent glowing topographic holographic terrain, and orbiting marker ring.',
  ),
  item(
    'SS-03',
    'pulsing-warp-core',
    'Pulsing Warp Core',
    '#3c485c',
    '#4ea8ff',
    'Hexagonal reactor base and crown cap linked by four armored conduit struts around a luminous plasma column with oscillating containment rings.',
  ),
  item(
    'SS-04',
    'bulkhead-airlock-console',
    'Bulkhead Airlock Console',
    '#5d6b75',
    '#e68a2e',
    'Slanted armored bulkhead wall frame with twin parting blast shutters, manual dogging lockwheel, and illuminated override keypad.',
  ),
  item(
    'SS-05',
    'specimen-stasis-tube',
    'Specimen Stasis Tube',
    '#3c524b',
    '#7be64c',
    'Cylindrical containment tank on heavy collar base with transparent glass sleeve, internal alien crystal specimen, and rotating scanner collar.',
  ),
  item(
    'SS-06',
    'quad-drone-charging-dock',
    'Quad-Drone Charging Dock',
    '#415061',
    '#f0a528',
    'Beveled landing pad deck with four illuminated corner charge pylons, power spire, pivoting clamp arms, and docked mini-drone.',
  ),
  item(
    'SS-07',
    'vertical-hydroponic-column',
    'Vertical Hydroponic Column',
    '#cfd8d3',
    '#42c970',
    'Nutrient water reservoir base supporting a tiered radial plant tower with lush foliage pods and a rotating overhead LED grow-light halo.',
  ),
  item(
    'SS-08',
    'high-yield-plasma-battery',
    'High-Yield Plasma Battery',
    '#464f57',
    '#ff6b2b',
    'Armored carry skid holding a tri-cell glowing plasma cylinder cluster with ribbed heatsink fins, hinged terminal cover, and rotating lock valve.',
  ),
  item(
    'SS-09',
    'medbay-diagnostic-scanner',
    'Medbay Diagnostic Scanner',
    '#cad5db',
    '#2db9d6',
    'Cantilevered biometric examination bed with a curved diagnostic gantry arch sliding along floor rails and an articulated holo-monitor arm.',
  ),
  item(
    'SS-10',
    'neon-cyberdeck-terminal',
    'Neon Cyberdeck Terminal',
    '#2b3142',
    '#ff3399',
    'Angled cyberpunk server workstation with triple curved glowing monitors, mechanical deck console, pivoting neural-jack boom, and cooling fan.',
  ),
  item(
    'SS-11',
    'magnetic-gravity-anchor',
    'Magnetic Gravity Anchor',
    '#4a505c',
    '#f2b632',
    'Three heavy splayed magnetic clamp feet supporting an armored flux generator drum and counter-rotating gyroscope stabilization rings.',
  ),
  item(
    'SS-12',
    'subspace-comms-dish',
    'Subspace Comms Dish',
    '#c6ced4',
    '#e6682e',
    'Armored hexagonal transceiver plinth with twin hydraulic elevation struts and an azimuth-rotating parabolic dish array with glowing feed horn.',
  ),
  item(
    'SS-13',
    'quantum-teleporter-pad',
    'Quantum Teleporter Pad',
    '#3c4b5e',
    '#4cd8ff',
    'Stepped circular illuminated transport dais framed by three curved focusing emitter pylons and a rotating overhead collector ring.',
  ),
  item(
    'SS-14',
    'hexagonal-shield-emitter',
    'Hexagonal Shield Emitter',
    '#465463',
    '#3de0c8',
    'Heavy armored tripod base and vertical field-coil mast topped by a tilting, spinning hexagonal phased-array energy projector.',
  ),
  item(
    'SS-15',
    'automated-cargo-loader',
    'Automated Cargo Loader',
    '#d99b26',
    '#3b4b59',
    'Tracked industrial base rail with swiveling turret column and articulated dual-segment robotic crane arm ending in a cargo grapple claw.',
  ),
  item(
    'SS-16',
    'orbital-battery-turret',
    'Orbital Battery Turret',
    '#525c63',
    '#d94836',
    'Armored sloped bunker ring carrying a rotating turret housing, elevating twin heavy railgun barrels, and detachable ordnance pod.',
  ),
  item(
    'SS-17',
    'neural-link-chair',
    'Neural Link Chair',
    '#333d4b',
    '#48b8f0',
    'Swivel pedestal captain interface seat with armrest touchpads and an articulated overhead neural-visor helmet arm lowering into position.',
  ),
  item(
    'SS-18',
    'fusion-coolant-tower',
    'Fusion Coolant Tower',
    '#626e75',
    '#28c7b0',
    'Stepped industrial manifold base with twin tapered cooling stacks, heat-exchange louver fins, and counter-spinning exhaust turbine fans.',
  ),
  item(
    'SS-19',
    'droid-repair-bay',
    'Droid Repair Bay',
    '#57606b',
    '#f09429',
    'Slotted diagnostics floor pad under a backlit service gantry arch with detachable tool rack and twin articulated manipulator arms.',
  ),
  item(
    'SS-20',
    'starship-helm-console',
    'Starship Helm Console',
    '#314254',
    '#38c4f5',
    'Swept U-shaped bridge flight station with multi-screen wraparound HUD hood, tilting illuminated throttle levers, and rotating nav trackball.',
  ),
];
