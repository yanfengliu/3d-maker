import type { DetachablePartSpec, RiggedPartSpec } from '../../../capabilities/schema';
import type { ProceduralAssetDef } from '../../collection-types';
import { sportsPlayMeta } from '../meta/sports-play';
import { det, rig } from './sports-play-kit';
import {
  boxingRingCorner,
  classicPinballMachine,
  foldingPingPongTable,
  motorizedTreadmill,
  parkSeesawPlank,
  playgroundMerryGoRound,
  powerSquatRack,
  spiralPlaygroundSlide,
  stadiumFoosballTable,
  streetBasketballHoop,
} from './sports-play-a';
import {
  alpineSkiLiftChair,
  archeryTargetStand,
  baseballPitchingMachine,
  bowlingPinsetterGate,
  climbingBoulderWall,
  gymnasticPommelHorse,
  rowingErgometer,
  slateBilliardTable,
  tabletopAirHockey,
  tennisUmpireChair,
} from './sports-play-b';

interface BuilderEntry {
  readonly physicsBody: 'static' | 'dynamic';
  readonly riggedParts: readonly RiggedPartSpec[];
  readonly detachableParts: readonly DetachablePartSpec[];
  readonly build: ProceduralAssetDef['build'];
}

const builders: Readonly<Record<string, BuilderEntry>> = {
  'street-basketball-hoop': {
    physicsBody: 'static',
    riggedParts: [
      rig('RimAssembly', 'Breakaway rim', 'x', [0, 24], 'Flexes the breakaway hoop rim downward'),
      rig('NetBasket', 'Swinging net', 'z', [-20, 20], 'Swishes the suspended cord net basket'),
    ],
    detachableParts: [det('CourtBall', 'Court basketball', 'Basketball resting on the weighted ballast base')],
    build: streetBasketballHoop,
  },
  'stadium-foosball-table': {
    physicsBody: 'static',
    riggedParts: [
      rig('RedStrikerRod', 'Red striker rod', 'x', [-75, 75], 'Spins the red forward striker player rod'),
      rig('BlueMidRod', 'Blue midfield rod', 'x', [-0.16, 0.16], 'Slides the blue midfield rod laterally', 'slide'),
    ],
    detachableParts: [det('ScoreBeads', 'Scoreboard beads', 'Abacus goal counter mounted on the end rail')],
    build: stadiumFoosballTable,
  },
  'classic-pinball-machine': {
    physicsBody: 'static',
    riggedParts: [
      rig('LeftFlipper', 'Left flipper', 'y', [0, 48], 'Swings the left playfield flipper paddle'),
      rig('RightFlipper', 'Right flipper', 'y', [0, -48], 'Swings the right playfield flipper paddle'),
      rig('BallPlunger', 'Ball plunger', 'z', [0, 0.14], 'Pulls back the spring-loaded launch plunger', 'slide'),
    ],
    detachableParts: [det('BackboxTopper', 'Marquee topper', 'Illuminated arcade crown atop the backbox')],
    build: classicPinballMachine,
  },
  'motorized-treadmill': {
    physicsBody: 'static',
    riggedParts: [
      rig('BeltRoller', 'Rear belt roller', 'x', [0, 360], 'Spins the running belt rear drive roller'),
      rig('ConsoleTilt', 'Display console', 'x', [-16, 16], 'Tilts the telemetry display console housing'),
    ],
    detachableParts: [det('WaterBottle', 'Water bottle', 'Sports bottle seated on the right console shelf')],
    build: motorizedTreadmill,
  },
  'power-squat-rack': {
    physicsBody: 'static',
    riggedParts: [
      rig('LoadedBarbell', 'Loaded barbell', 'y', [0, 0.42], 'Lifts the weighted Olympic barbell off the J-hooks', 'slide'),
    ],
    detachableParts: [det('SparePlates', 'Spare plates', 'Extra bumper plates racked on rear storage pegs')],
    build: powerSquatRack,
  },
  'folding-ping-pong-table': {
    physicsBody: 'static',
    riggedParts: [
      rig('FrontTableLeaf', 'Front table leaf', 'x', [0, -80], 'Folds the front playing leaf upright'),
      rig('RearTableLeaf', 'Rear table leaf', 'x', [0, 80], 'Folds the rear playing leaf upright'),
    ],
    detachableParts: [det('PaddleSet', 'Paddle caddy', 'Side-mounted paddle and ball storage holder')],
    build: foldingPingPongTable,
  },
  'boxing-ring-corner': {
    physicsBody: 'static',
    riggedParts: [
      rig('CornerBell', 'Corner bell', 'z', [-26, 26], 'Swings and strikes the brass timekeeper bell'),
    ],
    detachableParts: [det('RingStool', 'Corner stool', 'Three-legged trainer stool inside the ring corner')],
    build: boxingRingCorner,
  },
  'park-seesaw-plank': {
    physicsBody: 'static',
    riggedParts: [
      rig('SeesawBeam', 'Seesaw plank', 'x', [-16, 16], 'Rocks the balanced seesaw beam over its fulcrum'),
    ],
    detachableParts: [det('BumperTires', 'Bumper tires', 'Rubber shock-absorbing tires beneath each seat')],
    build: parkSeesawPlank,
  },
  'playground-merry-go-round': {
    physicsBody: 'static',
    riggedParts: [
      rig('CarouselDeck', 'Spinning deck', 'y', [0, 360], 'Rotates the circular playground carousel deck'),
    ],
    detachableParts: [det('CenterWheel', 'Center wheel', 'Spoked central steering wheel atop the hub')],
    build: playgroundMerryGoRound,
  },
  'spiral-playground-slide': {
    physicsBody: 'static',
    riggedParts: [
      rig('ActivityWheel', 'Activity wheel', 'z', [0, 360], 'Spins the tower guardrail sensory wheel'),
    ],
    detachableParts: [det('TowerRoof', 'Tower roof', 'Peaked shade roof canopy above the tower posts')],
    build: spiralPlaygroundSlide,
  },
  'slate-billiard-table': {
    physicsBody: 'static',
    riggedParts: [
      rig('CueStick', 'Cue stick', 'z', [-0.24, 0.24], 'Glides the wooden billiard cue along the rail', 'slide'),
    ],
    detachableParts: [det('BallRack', 'Racked balls', 'Triangular wooden rack and ten billiard balls')],
    build: slateBilliardTable,
  },
  'baseball-pitching-machine': {
    physicsBody: 'dynamic',
    riggedParts: [
      rig('PitchHead', 'Pitching head', 'x', [-22, 22], 'Tilts the dual-wheel pitching elevation angle'),
      rig('TopWheel', 'Upper launch wheel', 'x', [0, 360], 'Spins the upper pneumatic launch tire'),
      rig('BotWheel', 'Lower launch wheel', 'x', [0, -360], 'Counter-spins the lower launch tire'),
    ],
    detachableParts: [det('BallChute', 'Ball feeder chute', 'Curved tubular hopper loaded with baseballs')],
    build: baseballPitchingMachine,
  },
  'alpine-ski-lift-chair': {
    physicsBody: 'static',
    riggedParts: [
      rig('LiftChair', 'Suspended chair', 'x', [-18, 18], 'Swings the dual-seat chair beneath the gantry'),
      rig('SafetyBar', 'Safety bar', 'x', [0, -68], 'Raises and lowers the restraining bar and footrest'),
    ],
    detachableParts: [det('SkiPair', 'Alpine skis', 'Pair of skis stored in the side gantry rack')],
    build: alpineSkiLiftChair,
  },
  'bowling-pinsetter-gate': {
    physicsBody: 'static',
    riggedParts: [
      rig('SweepGate', 'Sweep rake gate', 'x', [0, 56], 'Drops the cushioned sweep rake across the lane'),
    ],
    detachableParts: [det('PinTriangle', 'Bowling pins', 'Ten lathed bowling pins racked on the maple deck')],
    build: bowlingPinsetterGate,
  },
  'rowing-ergometer': {
    physicsBody: 'dynamic',
    riggedParts: [
      rig('SeatCarriage', 'Seat carriage', 'z', [-0.45, 0.32], 'Slides the molded rowing seat along the monorail', 'slide'),
      rig('PullHandle', 'Pull handle', 'z', [0, -0.45], 'Draws the rowing T-bar handle through a stroke', 'slide'),
      rig('FlywheelFan', 'Flywheel fan', 'x', [0, 360], 'Spins the front perforated air-resistance turbine'),
    ],
    detachableParts: [det('MonitorArm', 'Performance monitor', 'Articulating split-time display on the front neck')],
    build: rowingErgometer,
  },
  'climbing-boulder-wall': {
    physicsBody: 'static',
    riggedParts: [
      rig('SummitBell', 'Summit bell', 'x', [-30, 30], 'Swings the top route finish anchor bell'),
    ],
    detachableParts: [det('CrashPad', 'Bouldering crash pad', 'Foldable foam landing mat in front of the wall')],
    build: climbingBoulderWall,
  },
  'archery-target-stand': {
    physicsBody: 'dynamic',
    riggedParts: [
      rig('WindFlag', 'Wind pennant', 'y', [-42, 42], 'Flutters the apex wind-direction pennant flag'),
      rig('TargetButt', 'Target easel', 'x', [-16, 16], 'Tilts the concentric straw target butt'),
    ],
    detachableParts: [det('ArrowQuiver', 'Arrow quiver', 'Leather quiver with spare arrows on the right leg')],
    build: archeryTargetStand,
  },
  'tabletop-air-hockey': {
    physicsBody: 'static',
    riggedParts: [
      rig('HockeyPuck', 'Glowing puck', 'z', [-0.62, 0.62], 'Glides the air-hockey puck down the table', 'slide'),
      rig('NearStriker', 'Near striker', 'x', [-0.32, 0.32], 'Slides the near player striker paddle', 'slide'),
      rig('FarStriker', 'Far striker', 'x', [-0.32, 0.32], 'Slides the far player striker paddle', 'slide'),
    ],
    detachableParts: [det('ScoreBridge', 'Electronic score bridge', 'Overhead arched digital scoreboard assembly')],
    build: tabletopAirHockey,
  },
  'tennis-umpire-chair': {
    physicsBody: 'static',
    riggedParts: [
      rig('SunCanopy', 'Sun canopy', 'x', [-22, 32], 'Tilts the hinged striped overhead shade awning'),
      rig('WritingTablet', 'Writing tablet', 'z', [0, 80], 'Folds the right-arm scorekeeper clipboard desk'),
    ],
    detachableParts: [det('ScoreFlipChart', 'Score flip chart', 'Courtside flip-card scoreboard on the footrest bar')],
    build: tennisUmpireChair,
  },
  'gymnastic-pommel-horse': {
    physicsBody: 'static',
    riggedParts: [
      rig('SpringBoard', 'Vaulting springboard', 'x', [0, 10], 'Flexes the coiled takeoff springboard downward'),
      rig('HorseBody', 'Adjustable horse body', 'y', [0, 0.22], 'Raises the telescoping leather pommel horse', 'slide'),
    ],
    detachableParts: [det('ChalkStand', 'Chalk stand', 'Tripod magnesium chalk bowl beside the landing mat')],
    build: gymnasticPommelHorse,
  },
};

export const sportsPlayPack: readonly ProceduralAssetDef[] = sportsPlayMeta.map(meta => {
  const entry = builders[meta.id];
  if (!entry) throw new Error(`Missing sports-play builder for ${meta.id}`);
  return {
    ...meta,
    physicsBody: entry.physicsBody,
    riggedParts: entry.riggedParts,
    detachableParts: entry.detachableParts,
    build: entry.build,
  };
});
