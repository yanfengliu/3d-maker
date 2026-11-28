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

const PACK = 'science-medical';
const item = (
  id: string, code: string, name: string, primary: string, accent: string, description: string,
): ExpansionMetaItem => ({
  id, code, category: 'Object', browseCategory: 'prop', name, primary, accent, description, pack: PACK,
});

export const scienceMedicalMeta: readonly ExpansionMetaItem[] = [
  item('compound-microscope', 'SM-01', 'Compound Lab Microscope', '#cfd6da', '#2e7c8a', 'Binocular laboratory compound microscope with horseshoe base, revolving objective turret, and elevating specimen stage.'),
  item('benchtop-centrifuge', 'SM-02', 'Benchtop Centrifuge', '#d4dadf', '#2f7a9e', 'Clinical benchtop centrifuge with digital display, hinged viewing lid, and spinning six-tube angled sample rotor.'),
  item('mri-gantry-scanner', 'SM-03', 'MRI Gantry Scanner', '#dce2e6', '#3282a8', 'Superconducting hospital MRI gantry scanner with toroidal tunnel bore, spinning bore collar, and sliding patient table.'),
  item('equatorial-telescope', 'SM-04', 'Equatorial Refractor Telescope', '#d6d4cc', '#c9973e', 'German equatorial refractor telescope on a tripod pier with rotating right-ascension mount and tilting optical tube.'),
  item('steam-autoclave', 'SM-05', 'Horizontal Steam Autoclave', '#7d8a92', '#d48636', 'Cylindrical clinical stainless steam sterilizer autoclave with hinged circular pressure door and spoked lock wheel.'),
  item('lab-fume-hood', 'SM-06', 'Chemical Fume Hood', '#c8d1d6', '#3c8c84', 'Laboratory chemical fume hood bench with flask glassware, sliding counterweighted glass sash, and spinning blower turbine.'),
  item('articulated-xray-arm', 'SM-07', 'Articulated X-Ray Arm', '#d5dce0', '#387ea6', 'Mobile diagnostic X-ray column rig on locking casters with rotating mast arm and tilting collimated emitter head.'),
  item('drum-seismograph', 'SM-08', 'Rotating Drum Seismograph', '#5a6368', '#d4a246', 'Granite-plinth geophysical drum seismograph with suspended pendulum weight, spinning chart drum, and swinging stylus arm.'),
  item('van-de-graaff-generator', 'SM-09', 'Van de Graaff Generator', '#627382', '#d8a642', 'High-voltage physics Van de Graaff dome generator with clear belt column, spinning roller, and pivoting discharge wand.'),
  item('lab-bio-incubator', 'SM-10', 'Lab Bio Incubator', '#ced6dc', '#38967c', 'Microbiology CO2 incubator cabinet with glazed viewing door and pull-out perforated tray holding agar petri dishes.'),
  item('articulated-dental-chair', 'SM-11', 'Articulated Dental Chair', '#428496', '#d9d8d0', 'Hydraulic dental operatory chair with reclining cushioned backrest, instrument arm, and swinging overhead exam lamp.'),
  item('adjustable-hospital-bed', 'SM-12', 'Adjustable Hospital Bed', '#d2d9de', '#3e7ca6', 'Acute-care hospital bed on casters with IV drip pole, elevating mattress head section, and folding side guardrails.'),
  item('blade-server-rack', 'SM-13', 'Blade Server Rack', '#394048', '#3ca69c', 'Full-height datacenter blade server cabinet with perforated front door, status strips, and slide-out service blade.'),
  item('dual-trace-oscilloscope', 'SM-14', 'Dual-Trace Oscilloscope Bench', '#566b73', '#42b086', 'Benchtop dual-trace CRT oscilloscope with hooded waveform graticule, rotating gain/timebase dials, and detachable probe.'),
  item('optical-spectrometer', 'SM-15', 'Optical Prism Spectrometer', '#47525a', '#d6a442', 'Tabletop optical goniometer spectrometer with collimator tube, rotating central glass prism table, and pivoting viewer arm.'),
  item('dna-thermal-cycler', 'SM-16', 'DNA Thermal Cycler', '#cfd6dc', '#3684a6', 'Molecular biology PCR thermal cycler with angled LCD readout, hinged heated compression lid, and detachable microplate.'),
  item('pharmacy-dispensing-robot', 'SM-17', 'Pharmacy Dispensing Robot', '#d4dce0', '#329688', 'Automated pharmacy dispensing cabinet with glazed bay, rotating pill-canister carousel drum, and sliding picker gantry.'),
  item('cryogenic-dewar-cart', 'SM-18', 'Cryogenic Dewar Cart', '#8998a2', '#3a88b4', 'Mobile liquid-nitrogen cryogenic Dewar flask on a wheeled tubular dolly with pressure manifold and lifting neck plug.'),
  item('cleanroom-laminar-hood', 'SM-19', 'Cleanroom Laminar Flow Hood', '#d3dade', '#3d94a8', 'Sterile cleanroom laminar-flow biosafety hood with stainless deck, sliding slanted front shield, and spinning HEPA fan.'),
  item('weather-anemometer-mast', 'SM-20', 'Weather Anemometer Mast', '#cfd4d8', '#d96e34', 'Meteorological station mast with solar panel, louvered radiation shield, rotating wind vane, and spinning cup rotor.'),
];
