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

export const handheldFantasyScifiMeta: readonly ExpansionMetaItem[] = [
  {
    id: 'knight-broadsword-rack', code: 'HX-01', category: 'Object', browseCategory: 'ultra',
    name: 'Knight Broadsword Rack', primary: '#5a6e82', accent: '#d9a43b', pack: 'handheld-fantasy-scifi',
    description: 'Twin-pillar oak sword rack cradling a fuller-grooved knightly broadsword with gilded crossguard and tilting blade mount.',
  },
  {
    id: 'dwarven-warhammer', code: 'HX-02', category: 'Object', browseCategory: 'ultra',
    name: 'Dwarven Warhammer', primary: '#4a5866', accent: '#d9922e', pack: 'handheld-fantasy-scifi',
    description: 'Runed stone plinth supporting an angular twin-faced dwarven warhammer with gold geometric inlays and rocking display mount.',
  },
  {
    id: 'double-bit-battleaxe', code: 'HX-03', category: 'Object', browseCategory: 'ultra',
    name: 'Double-Bit Battleaxe', primary: '#5e342c', accent: '#c9a248', pack: 'handheld-fantasy-scifi',
    description: 'Iron-shod armory saddle holding a symmetrical twin-crescent battleaxe with spiked crown finial and rocking display pivot.',
  },
  {
    id: 'elven-recurve-bow-stand', code: 'HX-04', category: 'Object', browseCategory: 'ultra',
    name: 'Elven Recurve Bow Stand', primary: '#3b6b4c', accent: '#e0b84c', pack: 'handheld-fantasy-scifi',
    description: 'Carved woodland stand cradling a graceful gilded recurve bow with a sliding nocked arrow pull along the riser.',
  },
  {
    id: 'grimoire-spellbook-podium', code: 'HX-05', category: 'Object', browseCategory: 'ultra',
    name: 'Grimoire Spellbook Podium', primary: '#542a6b', accent: '#e0b444', pack: 'handheld-fantasy-scifi',
    description: 'Clawed arcane reading podium holding a heavy rune-inscribed spellbook with hinged front cover and detachable crystal bookmark.',
  },
  {
    id: 'pirate-flintlock-pistol', code: 'HX-06', category: 'Object', browseCategory: 'ultra',
    name: 'Pirate Flintlock Pistol', primary: '#6b4228', accent: '#d4a038', pack: 'handheld-fantasy-scifi',
    description: 'Inlaid display stand cradling a flared-muzzle brass flintlock pistol with cocking spark hammer and rocking curved trigger.',
  },
  {
    id: 'lacquered-katana-stand', code: 'HX-07', category: 'Object', browseCategory: 'ultra',
    name: 'Lacquered Katana Stand', primary: '#8f242c', accent: '#d9b044', pack: 'handheld-fantasy-scifi',
    description: 'Traditional two-tier katanakake stand holding a curved steel katana with tilting salute mount and detachable lacquered scabbard.',
  },
  {
    id: 'polearm-halberd-rack', code: 'HX-08', category: 'Object', browseCategory: 'ultra',
    name: 'Polearm Halberd Rack', primary: '#46586e', accent: '#c9983c', pack: 'handheld-fantasy-scifi',
    description: 'Weighted armory socket stand presenting a forged infantry halberd with axe blade, rear fluke, spear point, and tilting shaft.',
  },
  {
    id: 'crystal-scepter-stand', code: 'HX-09', category: 'Object', browseCategory: 'ultra',
    name: 'Crystal Scepter Stand', primary: '#3b4682', accent: '#42d4c8', pack: 'handheld-fantasy-scifi',
    description: 'Octagonal arcane cradle supporting a gilded royal scepter topped by a spinning faceted crystal and orbiting brass halo ring.',
  },
  {
    id: 'viking-round-shield', code: 'HX-10', category: 'Object', browseCategory: 'ultra',
    name: 'Viking Round Shield', primary: '#2e5478', accent: '#c9943c', pack: 'handheld-fantasy-scifi',
    description: 'Timber armory easel showcasing a banded Nordic round shield with spinning runic center boss and tilting display frame.',
  },
  {
    id: 'pulse-plasma-rifle', code: 'HX-11', category: 'Object', browseCategory: 'ultra',
    name: 'Pulse Plasma Rifle', primary: '#34485c', accent: '#38d9c8', pack: 'handheld-fantasy-scifi',
    description: 'Docked bullpup energy rifle with glowing cooling rails, holo sight, sliding charging bolt, and detachable power cell magazine.',
  },
  {
    id: 'handheld-bio-scanner', code: 'HX-12', category: 'Object', browseCategory: 'ultra',
    name: 'Handheld Bio-Scanner', primary: '#dce6e4', accent: '#2eb886', pack: 'handheld-fantasy-scifi',
    description: 'Medbay cradle holding an ergonomic optical diagnostic scanner with sweeping emitter head and flip-up sensor fin.',
  },
  {
    id: 'grappling-hook-launcher', code: 'HX-13', category: 'Object', browseCategory: 'ultra',
    name: 'Grappling Hook Launcher', primary: '#424b54', accent: '#e08a28', pack: 'handheld-fantasy-scifi',
    description: 'Tactical dock supporting a motorized cable launcher with spinning side winch drum and extending four-prong grappling claw.',
  },
  {
    id: 'cryo-freeze-blaster', code: 'HX-14', category: 'Object', browseCategory: 'ultra',
    name: 'Cryo Freeze Blaster', primary: '#326894', accent: '#7ee0f0', pack: 'handheld-fantasy-scifi',
    description: 'Lab test stand carrying a frosted liquid-nitrogen freeze emitter with spinning vortex diffuser nozzle and detachable cryo tank.',
  },
  {
    id: 'twin-energy-blade', code: 'HX-15', category: 'Object', browseCategory: 'ultra',
    name: 'Twin Energy Blade', primary: '#2c3442', accent: '#e84878', pack: 'handheld-fantasy-scifi',
    description: 'Altar display cradle holding a dual-emitter plasma blade hilt with pivoting presentation mount and sliding guard shrouds.',
  },
  {
    id: 'sonic-disruptor-emitter', code: 'HX-16', category: 'Object', browseCategory: 'ultra',
    name: 'Sonic Disruptor Emitter', primary: '#5a4c78', accent: '#f0a832', pack: 'handheld-fantasy-scifi',
    description: 'Bench stand holding a stepped-dish acoustic disruptor pistol with sliding harmonic focus rings and spinning frequency dial.',
  },
  {
    id: 'palm-holo-projector', code: 'HX-17', category: 'Object', browseCategory: 'ultra',
    name: 'Palm Holo-Projector', primary: '#2e465c', accent: '#3ae0d0', pack: 'handheld-fantasy-scifi',
    description: 'Pedestal dock powering an octagonal holo-emitter puck with rotating petal ring and spinning projected planetary hologram core.',
  },
  {
    id: 'power-gravity-gauntlet', code: 'HX-18', category: 'Object', browseCategory: 'ultra',
    name: 'Power Gravity Gauntlet', primary: '#b86828', accent: '#3ad4e0', pack: 'handheld-fantasy-scifi',
    description: 'Armored mechanical stand displaying a heavy hydraulic gravity gauntlet with palm core emitter and articulating finger claws.',
  },
  {
    id: 'portable-cyberdeck', code: 'HX-19', category: 'Object', browseCategory: 'ultra',
    name: 'Portable Cyberdeck', primary: '#242c38', accent: '#e84288', pack: 'handheld-fantasy-scifi',
    description: 'Retro-futuristic wedge hacking terminal in an angled dock with mechanical keybank, flip-up holo lid, and detachable data cart.',
  },
  {
    id: 'starfleet-tricorder', code: 'HX-20', category: 'Object', browseCategory: 'ultra',
    name: 'Starfleet Tricorder', primary: '#3c4b5e', accent: '#e0a838', pack: 'handheld-fantasy-scifi',
    description: 'Clamshell scientific field tricorder on a telemetry plinth with flip-open upper display flap and detachable mini hand scanner.',
  },
];
