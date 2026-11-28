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

const PACK = 'workshop-machinery';
const item = (
  id: string, code: string, name: string, primary: string, accent: string, description: string,
): ExpansionMetaItem => ({
  id, code, category: 'Object', browseCategory: 'prop', name, primary, accent, description, pack: PACK,
});

export const workshopMachineryMeta: readonly ExpansionMetaItem[] = [
  item('cabinet-table-saw', 'WM-01', 'Cabinet Table Saw', '#3f6270', '#d97a2b', 'Heavy cast-iron cabinet table saw with extension wing, spinning carbide blade, and sliding T-square rip fence.'),
  item('floor-drill-press', 'WM-02', 'Floor Drill Press', '#4a5a68', '#d68934', 'Tall cast-iron floor drill press with circular worktable, spinning drill chuck, and radial quill feed lever.'),
  item('metalworking-lathe', 'WM-03', 'Metalworking Engine Lathe', '#4d615c', '#d88e36', 'Industrial precision engine lathe with prismatic ways, spinning three-jaw chuck, and sliding tool carriage.'),
  item('gantry-cnc-mill', 'WM-04', 'Gantry CNC Mill', '#4e5b68', '#e07b2e', 'Rigid portal gantry CNC router mill on a steel bench with sliding gantry bridge and spinning high-speed spindle.'),
  item('corexy-3d-printer', 'WM-05', 'CoreXY 3D Printer', '#3c454e', '#e06932', 'Enclosed aluminum-frame CoreXY 3D printer with top filament spool, sliding extruder head, and rising build plate.'),
  item('hydraulic-shop-press', 'WM-06', 'H-Frame Hydraulic Press', '#a63e32', '#e0ae42', 'Twenty-ton steel H-frame hydraulic workshop press with pinned bolster bed, descending press ram, and pump handle.'),
  item('anvil-hammer-station', 'WM-07', 'Blacksmith Anvil Station', '#5a5550', '#d96c2c', 'Oak-stump anvil and mechanical helve-hammer station with pivoting striker arm and detachable forging tong rack.'),
  item('electric-potters-wheel', 'WM-08', 'Electric Potter\'s Wheel', '#4c7378', '#c46c45', 'Ceramic studio electric potter\'s wheel with splash pan, spinning clay wheelhead, and tilting foot speed pedal.'),
  item('screw-printing-press', 'WM-09', 'Timber Screw Printing Press', '#7a5234', '#cfa048', 'Historical mortised-oak screw printing press with rotating central leadscrew and sliding inked type coffin bed.'),
  item('floor-weaving-loom', 'WM-10', 'Floor Weaving Loom', '#8c5e3a', '#c85442', 'Four-shaft timber floor weaving loom with warp frame, rocking reed beater bar, and rotating front cloth beam.'),
  item('diesel-backup-generator', 'WM-11', 'Diesel Backup Generator', '#c78c28', '#3c464f', 'Skid-mounted acoustic-canopy diesel standby generator with spinning radiator fan and hinged engine service panel.'),
  item('twin-tank-air-compressor', 'WM-12', 'Twin-Tank Air Compressor', '#b84234', '#d8b048', 'Portable V-twin workshop air compressor with twin horizontal tanks, spinning flywheel pulley, and rolling wheels.'),
  item('mig-welder-cart', 'WM-13', 'MIG Welder Cart', '#365b82', '#e0892e', 'Rolling steel MIG welding cart with strapped shielding-gas tank, spinning copper wire spool, and swinging torch boom.'),
  item('vertical-wood-bandsaw', 'WM-14', 'Vertical Wood Bandsaw', '#476b5e', '#d68832', 'Cast-iron vertical bandsaw with curved gooseneck spine, spinning spoked upper bandwheel, and tilting worktable.'),
  item('rotary-cement-mixer', 'WM-15', 'Rotary Cement Mixer', '#d4742a', '#49545c', 'Jobsite rotary-drum cement mixer on wheeled tubular chassis with spinning ribbed drum and side dump tilt wheel.'),
  item('cast-iron-jointer', 'WM-16', 'Cast-Iron Jointer Planer', '#4e646e', '#d98a32', 'Long-bed woodworking cast-iron jointer planer with tall fence, spinning helical cutterhead, and pivoting blade guard.'),
  item('cyclone-dust-collector', 'WM-17', 'Cyclone Dust Collector', '#526572', '#d98e34', 'Vertical industrial cyclone dust extractor with pleated filter canister, spinning impeller fan, and detachable drum.'),
  item('pedestal-bench-grinder', 'WM-18', 'Pedestal Bench Grinder', '#4d5d6b', '#d97e2e', 'Cast-iron floor pedestal grinder with twin spinning abrasive wheels, quench cup, and hinged clear spark shield.'),
  item('flatbed-laser-cutter', 'WM-19', 'Flatbed Laser Cutter', '#4b5763', '#e06c32', 'Enclosed flatbed CO2 laser cutter cabinet with hinged acrylic lid, honeycomb bed, and sliding X-axis laser gantry.'),
  item('rotary-pipe-bender', 'WM-20', 'Rotary Pipe Bender Rig', '#9c4332', '#d8a63e', 'Heavy floor-pedestal rotary-draw pipe bender with grooved center die, rotating bender arm, and ratchet lever.'),
];
