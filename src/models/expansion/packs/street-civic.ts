import type { DetachablePartSpec, RiggedPartSpec } from '../../../capabilities/schema';
import type { ProceduralAssetDef } from '../../collection-types';
import { streetCivicMeta } from '../meta/street-civic';
import {
  britishTelephoneBox, cantileverTrafficSignal, castIronFireHydrant, castPillarPostbox,
  coinNewspaperBox, coveredBikeRack, glazedBusShelter, snackVendingKiosk,
  stoneDrinkingFountain, twinParkingMeter,
} from './street-civic-a';
import {
  automatedTollBarrier, crosswalkSignalBollard, harborMooringBollard, metroTicketTurnstile,
  parisianMorrisKiosk, parkBenchLamp, smartEvFastCharger, solarTrashCompactor,
  threeBinRecyclingBank, townNoticeBoard,
} from './street-civic-b';
import { det, rig } from './street-civic-kit';

interface BuilderSpec {
  readonly physicsBody: 'static' | 'dynamic';
  readonly riggedParts: readonly RiggedPartSpec[];
  readonly detachableParts: readonly DetachablePartSpec[];
  readonly build: ProceduralAssetDef['build'];
}

const specsById: Record<string, BuilderSpec> = {
  'cantilever-traffic-signal': {
    physicsBody: 'static',
    riggedParts: [rig('CrosswalkSignal', 'Crosswalk signal', 'z', [-22, 22], 'Swings the hanging pedestrian crosswalk indicator')],
    detachableParts: [det('StreetNameBlade', 'Street name blade', 'Mounted street-name sign plate along the cantilever arm')],
    build: cantileverTrafficSignal,
  },
  'british-telephone-box': {
    physicsBody: 'static',
    riggedParts: [rig('PhoneDoor', 'Phone box door', 'y', [0, -86], 'Swings the mullioned glazed entry door open')],
    detachableParts: [det('InteriorPayphone', 'Interior payphone', 'Wall-mounted payphone coin box and receiver console')],
    build: britishTelephoneBox,
  },
  'twin-parking-meter': {
    physicsBody: 'static',
    riggedParts: [
      rig('FlagLeft', 'Left expired flag', 'z', [0, -65], 'Pivots the left meter expired-time flag'),
      rig('FlagRight', 'Right expired flag', 'z', [0, 65], 'Pivots the right meter expired-time flag'),
    ],
    detachableParts: [det('RateSignPlate', 'Rate sign plate', 'Post-mounted parking rate plaque')],
    build: twinParkingMeter,
  },
  'snack-vending-kiosk': {
    physicsBody: 'static',
    riggedParts: [rig('DeliveryFlap', 'Delivery flap', 'x', [0, -60], 'Pushes the lower delivery chute flap open')],
    detachableParts: [det('SnackStock', 'Snack stock', 'Rows of stocked snack packs and spiral coils')],
    build: snackVendingKiosk,
  },
  'coin-newspaper-box': {
    physicsBody: 'static',
    riggedParts: [rig('DispenserDoor', 'Dispenser door', 'x', [0, -68], 'Pulls the top-hinged glazed newsstand door open')],
    detachableParts: [det('NewsprintStack', 'Newsprint stack', 'Stacked newspapers inside the dispenser bay')],
    build: coinNewspaperBox,
  },
  'glazed-bus-shelter': {
    physicsBody: 'static',
    riggedParts: [rig('RouteSign', 'Route sign', 'y', [0, 360], 'Rotates the circular bus-stop route medallion')],
    detachableParts: [det('WaitingBench', 'Waiting bench', 'Slatted transit bench inside the shelter')],
    build: glazedBusShelter,
  },
  'stone-drinking-fountain': {
    physicsBody: 'static',
    riggedParts: [rig('PushValve', 'Push valve', 'x', [0, 38], 'Depresses the brass bubbler push-valve handle')],
    detachableParts: [det('DogBowl', 'Side dog bowl', 'Low-level stone pet drinking bowl')],
    build: stoneDrinkingFountain,
  },
  'cast-pillar-postbox': {
    physicsBody: 'static',
    riggedParts: [
      rig('SlotFlap', 'Letter slot flap', 'x', [0, -52], 'Lifts the hinged brass letter-slot weather flap'),
      rig('MailDoor', 'Collection door', 'y', [0, -82], 'Swings the front mail-collection service door open'),
    ],
    detachableParts: [det('TimetablePlate', 'Timetable plate', 'Collection hours timetable plaque mounted on the door')],
    build: castPillarPostbox,
  },
  'cast-iron-fire-hydrant': {
    physicsBody: 'static',
    riggedParts: [rig('OperatingNut', 'Operating nut', 'y', [0, 360], 'Turns the pentagon valve operating nut atop the bonnet')],
    detachableParts: [det('SteamerCap', 'Steamer cap', 'Removable front pumper nozzle cap')],
    build: castIronFireHydrant,
  },
  'covered-bike-rack': {
    physicsBody: 'static',
    riggedParts: [rig('SecurityBar', 'Security lock bar', 'z', [0, 58], 'Lifts the swinging bicycle security lock bar')],
    detachableParts: [det('SideWindPanel', 'Rear wind panel', 'Translucent rear polycarbonate windscreen panel')],
    build: coveredBikeRack,
  },
  'automated-toll-barrier': {
    physicsBody: 'static',
    riggedParts: [rig('BarrierArm', 'Barrier arm', 'z', [0, 82], 'Raises and lowers the counterweighted striped barrier arm')],
    detachableParts: [det('StatusBeacon', 'Status beacon', 'Roof-mounted LED status warning beacon')],
    build: automatedTollBarrier,
  },
  'parisian-morris-kiosk': {
    physicsBody: 'static',
    riggedParts: [rig('PosterDrum', 'Poster drum', 'y', [0, 360], 'Rotates the octagonal interior poster display drum')],
    detachableParts: [det('CupolaFinial', 'Cupola finial', 'Ornate gilded spire finial atop the dome')],
    build: parisianMorrisKiosk,
  },
  'smart-ev-fast-charger': {
    physicsBody: 'static',
    riggedParts: [rig('ChargeNozzleArm', 'Charge nozzle arm', 'z', [0, -56], 'Pivots the tethered CCS charge nozzle arm outward')],
    detachableParts: [det('CanopyVisor', 'Canopy visor', 'Cantilevered rain visor above the touchscreen bay')],
    build: smartEvFastCharger,
  },
  'three-bin-recycling-bank': {
    physicsBody: 'static',
    riggedParts: [
      rig('PaperFlap', 'Paper chute flap', 'x', [0, -56], 'Pushes the blue paper sorting flap inward'),
      rig('GlassFlap', 'Glass chute flap', 'x', [0, -56], 'Pushes the green glass sorting flap inward'),
      rig('MetalFlap', 'Metal chute flap', 'x', [0, -56], 'Pushes the gold metal sorting flap inward'),
    ],
    detachableParts: [det('SortingHeaderSign', 'Sorting header sign', 'Rear-mounted civic recycling header rail')],
    build: threeBinRecyclingBank,
  },
  'park-bench-lamp': {
    physicsBody: 'static',
    riggedParts: [rig('LanternHead', 'Lantern head', 'z', [-22, 22], 'Sways the suspended streetlamp lantern head')],
    detachableParts: [det('LampCrossbar', 'Lamp crossbar', 'Decorative ladder-rest crossbar on the lamp post')],
    build: parkBenchLamp,
  },
  'crosswalk-signal-bollard': {
    physicsBody: 'static',
    riggedParts: [rig('WarningBeacon', 'Warning beacon', 'y', [0, 360], 'Rotates the amber crosswalk warning beacon')],
    detachableParts: [det('TactileSignHood', 'Tactile sign hood', 'Instruction plaque above the pedestrian push button')],
    build: crosswalkSignalBollard,
  },
  'harbor-mooring-bollard': {
    physicsBody: 'static',
    riggedParts: [rig('MooringRing', 'Mooring ring', 'x', [0, -76], 'Swings the forged iron dockside mooring ring')],
    detachableParts: [det('RopeCoil', 'Hawser rope coil', 'Coiled dockside mooring rope bundle on the quay block')],
    build: harborMooringBollard,
  },
  'metro-ticket-turnstile': {
    physicsBody: 'static',
    riggedParts: [
      rig('LeftPaddle', 'Left barrier paddle', 'y', [0, 82], 'Swings the left acrylic fare barrier paddle open'),
      rig('RightPaddle', 'Right barrier paddle', 'y', [0, -82], 'Swings the right acrylic fare barrier paddle open'),
      rig('TripodHub', 'Tripod rotor', 'x', [0, 360], 'Rotates the stainless three-arm tripod barrier'),
    ],
    detachableParts: [det('CardReaderHood', 'Card reader hood', 'Elevated ticket-validation terminal atop the right console')],
    build: metroTicketTurnstile,
  },
  'solar-trash-compactor': {
    physicsBody: 'static',
    riggedParts: [
      rig('HopperChute', 'Hopper chute', 'x', [0, 50], 'Pulls down the front armored hopper chute handle'),
      rig('FootPedal', 'Foot pedal', 'x', [0, 22], 'Depresses the lower toe-kick compaction pedal'),
    ],
    detachableParts: [det('SolarPanelArray', 'Solar panel array', 'Angled photovoltaic roof collector assembly')],
    build: solarTrashCompactor,
  },
  'town-notice-board': {
    physicsBody: 'static',
    riggedParts: [
      rig('LeftDoor', 'Left showcase door', 'y', [0, -86], 'Swings the left glazed showcase door open'),
      rig('RightDoor', 'Right showcase door', 'y', [0, 86], 'Swings the right glazed showcase door open'),
    ],
    detachableParts: [det('CommunityFlyers', 'Community flyers', 'Assorted pinned flyers and maps on the bulletin board')],
    build: townNoticeBoard,
  },
};

export const streetCivicPack: readonly ProceduralAssetDef[] = streetCivicMeta.map(meta => {
  const spec = specsById[meta.id];
  if (!spec) throw new Error(`Missing street-civic builder for ${meta.id}`);
  return {
    ...meta,
    physicsBody: spec.physicsBody,
    riggedParts: spec.riggedParts,
    detachableParts: spec.detachableParts,
    build: spec.build,
  };
});
