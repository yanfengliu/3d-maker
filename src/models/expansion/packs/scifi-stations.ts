import type { ProceduralAssetDef } from '../../collection-types';
import { scifiStationsMeta, type ExpansionMetaItem } from '../meta/scifi-stations';
import {
  buildBulkheadAirlockConsole,
  buildHighYieldPlasmaBattery,
  buildMedbayDiagnosticScanner,
  buildNeonCyberdeckTerminal,
  buildPulsingWarpCore,
  buildQuadDroneChargingDock,
  buildSpecimenStasisTube,
  buildTacticalHoloMapTable,
  buildVerticalCryoSleepPod,
  buildVerticalHydroponicColumn,
} from './scifi-stations-a';
import {
  buildAutomatedCargoLoader,
  buildDroidRepairBay,
  buildFusionCoolantTower,
  buildHexagonalShieldEmitter,
  buildMagneticGravityAnchor,
  buildNeuralLinkChair,
  buildOrbitalBatteryTurret,
  buildQuantumTeleporterPad,
  buildStarshipHelmConsole,
  buildSubspaceCommsDish,
} from './scifi-stations-b';
import { det, rig, type DetachablePartSpec, type RiggedPartSpec } from './scifi-stations-kit';

interface BuilderSpec {
  readonly physicsBody: 'static' | 'dynamic';
  readonly riggedParts: readonly RiggedPartSpec[];
  readonly detachableParts: readonly DetachablePartSpec[];
  readonly build: ProceduralAssetDef['build'];
}

const specsById: Record<string, BuilderSpec> = {
  'vertical-cryo-sleep-pod': {
    physicsBody: 'static',
    riggedParts: [
      rig('CanopyHatch', 'Canopy hatch', 'y', [0, -105], 'Swings the curved cryo chamber canopy hatch open'),
      rig('VitalMonitor', 'Vital monitor', 'y', [-35, 35], 'Swivels the side vital-sign diagnostic display arm'),
    ],
    detachableParts: [det('CryoTankPack', 'Cryo tank pack', 'Rear twin pressurized cryogenic coolant manifold canisters')],
    build: buildVerticalCryoSleepPod,
  },
  'tactical-holo-map-table': {
    physicsBody: 'static',
    riggedParts: [
      rig('HoloProjector', 'Holo projector', 'y', [0, 360], 'Rotates the holographic topographic terrain display'),
      rig('MarkerRing', 'Marker ring', 'y', [0, -360], 'Orbits the overhead tactical tracking marker ring'),
    ],
    detachableParts: [det('HoloTerrain', 'Holo terrain', 'Translucent glowing holographic topographic projection')],
    build: buildTacticalHoloMapTable,
  },
  'pulsing-warp-core': {
    physicsBody: 'static',
    riggedParts: [
      rig('UpperFieldRing', 'Upper field ring', 'y', [-0.32, 0.32], 'Oscillates the upper magnetic containment ring vertically', 'slide'),
      rig('LowerFieldRing', 'Lower field ring', 'y', [-0.32, 0.32], 'Oscillates the lower magnetic containment ring vertically', 'slide'),
    ],
    detachableParts: [det('InjectorCrown', 'Injector crown', 'Top antimatter injector spire and stabilizer fin assembly')],
    build: buildPulsingWarpCore,
  },
  'bulkhead-airlock-console': {
    physicsBody: 'static',
    riggedParts: [
      rig('LeftShutter', 'Left shutter', 'x', [0, -0.44], 'Slides the left armored blast shutter open', 'slide'),
      rig('RightShutter', 'Right shutter', 'x', [0, 0.44], 'Slides the right armored blast shutter open', 'slide'),
      rig('LockWheel', 'Lock wheel', 'z', [0, 360], 'Turns the manual bulkhead dogging lockwheel'),
    ],
    detachableParts: [det('OverrideKeypad', 'Override keypad', 'Side illuminated airlock override keypad terminal')],
    build: buildBulkheadAirlockConsole,
  },
  'specimen-stasis-tube': {
    physicsBody: 'static',
    riggedParts: [
      rig('ScannerCollar', 'Scanner collar', 'y', [0, 360], 'Rotates the exterior bio-scanner collar around the glass sleeve'),
      rig('SpecimenStem', 'Specimen stem', 'y', [0, 360], 'Rotates the internal alien specimen probe axis'),
    ],
    detachableParts: [det('BioFilterPack', 'Bio-filter pack', 'Rear biological filtration canister unit')],
    build: buildSpecimenStasisTube,
  },
  'quad-drone-charging-dock': {
    physicsBody: 'static',
    riggedParts: [
      rig('ClampArmL', 'Left clamp arm', 'z', [0, 48], 'Pivots the left recharging clamp arm outward'),
      rig('ClampArmR', 'Right clamp arm', 'z', [0, -48], 'Pivots the right recharging clamp arm outward'),
    ],
    detachableParts: [det('DockedDrone', 'Docked mini-drone', 'Quad-rotor utility mini-drone seated on the charging cradle')],
    build: buildQuadDroneChargingDock,
  },
  'vertical-hydroponic-column': {
    physicsBody: 'static',
    riggedParts: [
      rig('GrowHalo', 'Grow-light halo', 'y', [0, 360], 'Spins the overhead LED grow-light halo'),
      rig('NutrientTurret', 'Middle foliage tier', 'y', [0, 360], 'Rotates the middle radial plant tray tier'),
    ],
    detachableParts: [det('PumpModule', 'Pump module', 'Side nutrient circulation pump mounted on the reservoir')],
    build: buildVerticalHydroponicColumn,
  },
  'high-yield-plasma-battery': {
    physicsBody: 'dynamic',
    riggedParts: [
      rig('TerminalCover', 'Terminal cover', 'x', [0, -85], 'Lifts the hinged armored high-voltage terminal cover'),
      rig('LockValve', 'Lock valve', 'z', [0, 360], 'Rotates the front plasma containment lock valve'),
    ],
    detachableParts: [det('SideHeatsink', 'Side heatsink', 'Bolt-on side ribbed cooling radiator cassette')],
    build: buildHighYieldPlasmaBattery,
  },
  'medbay-diagnostic-scanner': {
    physicsBody: 'static',
    riggedParts: [
      rig('ScannerArch', 'Scanner arch', 'z', [-0.55, 0.55], 'Slides the curved diagnostic gantry arch along the bed rails', 'slide'),
      rig('HoloMonitorArm', 'Holo monitor arm', 'y', [-40, 40], 'Swings the articulated biometric holo-monitor arm'),
    ],
    detachableParts: [det('MedTray', 'Medical tray', 'Side surgical instrument tray mounted on the bed frame')],
    build: buildMedbayDiagnosticScanner,
  },
  'neon-cyberdeck-terminal': {
    physicsBody: 'static',
    riggedParts: [
      rig('NeuralJackBoom', 'Neural-jack boom', 'y', [0, -68], 'Pivots the side neural-jack interface boom forward'),
      rig('CoolingFan', 'Cooling fan', 'z', [0, 360], 'Spins the rear server tower exhaust cooling fan'),
    ],
    detachableParts: [det('DataCartridge', 'Data cartridge', 'Removable cyberdeck memory cartridge in the side slot')],
    build: buildNeonCyberdeckTerminal,
  },
  'magnetic-gravity-anchor': {
    physicsBody: 'static',
    riggedParts: [
      rig('OuterGyroRing', 'Outer gyro ring', 'y', [0, 360], 'Rotates the outer magnetic stabilization gyroscope ring'),
      rig('InnerGyroRing', 'Inner gyro ring', 'y', [0, -360], 'Counter-rotates the inner gravity flux ring'),
    ],
    detachableParts: [det('TopBeaconCap', 'Top beacon cap', 'Removable overhead magnetic field telemetry beacon')],
    build: buildMagneticGravityAnchor,
  },
  'subspace-comms-dish': {
    physicsBody: 'static',
    riggedParts: [
      rig('AzimuthTurret', 'Azimuth turret', 'y', [0, 360], 'Rotates the parabolic communications array in azimuth'),
      rig('DishElevation', 'Dish elevation', 'x', [-40, 35], 'Elevates and depresses the parabolic reflector dish'),
    ],
    detachableParts: [det('TransceiverBox', 'Transceiver box', 'Side diagnostic subspace transceiver module')],
    build: buildSubspaceCommsDish,
  },
  'quantum-teleporter-pad': {
    physicsBody: 'static',
    riggedParts: [
      rig('CollectorRing', 'Collector ring', 'y', [0, 360], 'Rotates the overhead quantum phase collector ring'),
      rig('PhaseCoreDeck', 'Phase core deck', 'y', [0, -360], 'Rotates the central illuminated transport platform disc'),
    ],
    detachableParts: [det('ControlPillar', 'Control pillar', 'Side operator initiation console pedestal')],
    build: buildQuantumTeleporterPad,
  },
  'hexagonal-shield-emitter': {
    physicsBody: 'static',
    riggedParts: [
      rig('ProjectorTilt', 'Projector tilt', 'x', [-35, 30], 'Tilts the shield projector yoke in elevation'),
      rig('HexProjector', 'Hex projector', 'z', [0, 360], 'Spins the hexagonal phased-array energy projector face'),
    ],
    detachableParts: [det('RearCapacitor', 'Rear capacitor', 'Removable rear mast field-coil capacitor bank')],
    build: buildHexagonalShieldEmitter,
  },
  'automated-cargo-loader': {
    physicsBody: 'dynamic',
    riggedParts: [
      rig('TurretColumn', 'Turret column', 'y', [-120, 120], 'Swivels the crane turret column on the tracked base'),
      rig('LowerBoom', 'Lower boom', 'x', [-25, 35], 'Raises and lowers the primary robotic crane boom'),
      rig('ForearmBoom', 'Forearm boom', 'x', [-45, 30], 'Articulates the upper robotic forearm and grapple claw'),
    ],
    detachableParts: [det('CounterweightBlock', 'Counterweight block', 'Removable rear turret ballast block')],
    build: buildAutomatedCargoLoader,
  },
  'orbital-battery-turret': {
    physicsBody: 'static',
    riggedParts: [
      rig('TurretHousing', 'Turret housing', 'y', [0, 360], 'Rotates the armored orbital turret 360 degrees'),
      rig('RailgunMantlet', 'Railgun barrels', 'x', [-45, 12], 'Elevates and depresses the twin heavy railgun barrels'),
    ],
    detachableParts: [det('AmmoPod', 'Ammo pod', 'Side armored ordnance drum and railgun capacitor pod')],
    build: buildOrbitalBatteryTurret,
  },
  'neural-link-chair': {
    physicsBody: 'static',
    riggedParts: [
      rig('NeuralVisorArm', 'Neural visor arm', 'x', [0, 52], 'Lowers the overhead neural-visor helmet into place'),
      rig('ChairAssembly', 'Chair swivel', 'y', [-60, 60], 'Swivels the contoured neural-link seat on its pedestal'),
    ],
    detachableParts: [det('HeadrestPod', 'Headrest pod', 'Rear spine neural telemetry processor module')],
    build: buildNeuralLinkChair,
  },
  'fusion-coolant-tower': {
    physicsBody: 'static',
    riggedParts: [
      rig('ExhaustTurbineL', 'Left exhaust turbine', 'y', [0, 360], 'Spins the left cooling stack exhaust turbine fan'),
      rig('ExhaustTurbineR', 'Right exhaust turbine', 'y', [0, -360], 'Counter-spins the right cooling stack exhaust turbine fan'),
    ],
    detachableParts: [det('CoolantManifoldBox', 'Manifold controller', 'Front diagnostic coolant pump controller cabinet')],
    build: buildFusionCoolantTower,
  },
  'droid-repair-bay': {
    physicsBody: 'static',
    riggedParts: [
      rig('WeldArmL', 'Left welding arm', 'y', [-42, 42], 'Swings the left robotic welding manipulator arm'),
      rig('WeldArmR', 'Right calibrator arm', 'y', [-42, 42], 'Swings the right robotic calibrating manipulator arm'),
    ],
    detachableParts: [det('ToolRack', 'Tool rack', 'Side gantry rack stocked with droid service tools')],
    build: buildDroidRepairBay,
  },
  'starship-helm-console': {
    physicsBody: 'static',
    riggedParts: [
      rig('ThrottleLevers', 'Throttle levers', 'x', [-32, 36], 'Pushes the dual illuminated flight throttle levers forward and back'),
      rig('NavTrackball', 'Nav trackball', 'y', [0, 360], 'Rotates the illuminated bridge navigation trackball'),
    ],
    detachableParts: [det('HudCanopy', 'HUD canopy', 'Removable wraparound holographic glare-hood wing')],
    build: buildStarshipHelmConsole,
  },
};

function toAssetDef(meta: ExpansionMetaItem): ProceduralAssetDef {
  const spec = specsById[meta.id];
  if (!spec) throw new Error(`Missing builder spec for ${meta.id}`);
  return {
    ...meta,
    physicsBody: spec.physicsBody,
    riggedParts: spec.riggedParts,
    detachableParts: spec.detachableParts,
    build: spec.build,
  };
}

export const scifiStationsPack: readonly ProceduralAssetDef[] = scifiStationsMeta.map(toAssetDef);
