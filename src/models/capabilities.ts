import * as T from 'three';
import type { Recipe } from '../data/recipe';
import { writeCapabilities, type AssetCapabilities, type RiggedPartSpec } from '../capabilities/schema';
import { extraAssets } from './collections';

const starterDescriptions: Record<string, string> = {
  'relay-drone': 'Quad-rotor autonomous survey drone with articulated rotors and dual-axis camera gimbal.',
  'field-rover': 'Six-wheeled planetary survey rover with rotating optical turret.',
  'survey-bot': 'Rigged humanoid survey robot compatible with the 85-motion humanoid repertoire.',
  'cargo-pod': 'Rugged field transport case with hinged top lid revealing an interior tray.',
  'signal-tower': 'Ground-mounted communications beacon with rotating and tilting parabolic dish.',
  'field-pilot': 'Rigged humanoid field pilot compatible with the 85-motion humanoid repertoire.',
};

const starterParts: Record<string, readonly RiggedPartSpec[]> = {
  'relay-drone': [
    { name: 'CameraYaw', label: 'Camera yaw', type: 'rotate', axis: 'y', range: [-45, 45], describe: 'Pans the front optical gimbal left and right' },
    { name: 'CameraPitch', label: 'Camera pitch', type: 'rotate', axis: 'x', range: [-30, 30], describe: 'Tilts the optical lens up and down' },
    { name: 'RotorFL', label: 'Front-left rotor', type: 'rotate', axis: 'y', range: [0, 360], describe: 'Spins the front-left ducted rotor' },
    { name: 'RotorFR', label: 'Front-right rotor', type: 'rotate', axis: 'y', range: [0, -360], describe: 'Spins the front-right ducted rotor' },
    { name: 'RotorRL', label: 'Rear-left rotor', type: 'rotate', axis: 'y', range: [0, -360], describe: 'Spins the rear-left ducted rotor' },
    { name: 'RotorRR', label: 'Rear-right rotor', type: 'rotate', axis: 'y', range: [0, 360], describe: 'Spins the rear-right ducted rotor' },
  ],
  'field-rover': [
    { name: 'SurveyHead', label: 'Survey turret', type: 'rotate', axis: 'y', range: [-70, 70], describe: 'Pans the mast-mounted camera turret' },
    { name: 'WheelL0', label: 'Rear-left wheel', type: 'rotate', axis: 'x', range: [0, 360], describe: 'Rolls the rear-left wheel' },
    { name: 'WheelL1', label: 'Mid-left wheel', type: 'rotate', axis: 'x', range: [0, 360], describe: 'Rolls the middle-left wheel' },
    { name: 'WheelL2', label: 'Front-left wheel', type: 'rotate', axis: 'x', range: [0, 360], describe: 'Rolls the front-left wheel' },
    { name: 'WheelR0', label: 'Rear-right wheel', type: 'rotate', axis: 'x', range: [0, 360], describe: 'Rolls the rear-right wheel' },
    { name: 'WheelR1', label: 'Mid-right wheel', type: 'rotate', axis: 'x', range: [0, 360], describe: 'Rolls the middle-right wheel' },
    { name: 'WheelR2', label: 'Front-right wheel', type: 'rotate', axis: 'x', range: [0, 360], describe: 'Rolls the front-right wheel' },
  ],
  'cargo-pod': [
    { name: 'CaseLid', label: 'Case lid', type: 'rotate', axis: 'x', range: [0, -72], describe: 'Hinged top lid that swings upward to open the inner tray' },
  ],
  'signal-tower': [
    { name: 'DishMount', label: 'Dish azimuth', type: 'rotate', axis: 'y', range: [0, 360], describe: 'Rotates the parabolic dish mount horizontally' },
    { name: 'DishTilt', label: 'Dish elevation', type: 'rotate', axis: 'x', range: [-27, 22], describe: 'Tilts the parabolic dish elevation angle' },
  ],
  'survey-bot': [],
  'field-pilot': [],
};

const extraById = new Map(extraAssets.map(asset => [asset.id, asset]));

/** Attach self-describing Form Foundry capabilities to a built procedural original Group. */
export function attachOriginalCapabilities(root: T.Group, recipe: Recipe): AssetCapabilities {
  root.updateMatrixWorld(true);
  const box = new T.Box3().setFromObject(root);
  const size = box.isEmpty() ? new T.Vector3(1, 1, 1) : box.getSize(new T.Vector3());
  const round = (n: number) => Math.round(n * 1000) / 1000;
  const extra = extraById.get(recipe.template);
  const description = extra?.description ?? starterDescriptions[recipe.template];
  const riggedSource = extra?.riggedParts ?? starterParts[recipe.template] ?? [];
  const riggedParts = riggedSource.filter(part => Boolean(root.getObjectByName(part.name)));
  const detachableParts = (extra?.detachableParts ?? []).filter(part => Boolean(root.getObjectByName(part.name)));
  const capabilities: AssetCapabilities = {
    version: 1,
    name: recipe.name,
    ...(description ? { description } : {}),
    source: { kind: 'original', id: recipe.template },
    riggedParts,
    detachableParts,
    nightZones: [...(extra?.nightZones ?? [])],
    decals: [...(extra?.decals ?? [])],
    dimensions: {
      sizeM: { x: round(size.x), y: round(size.y), z: round(size.z) },
      originY: round(box.isEmpty() ? 0 : box.min.y),
      origin: 'ground level (minY = 0): the model sits on y=0 as-is',
    },
    physics: {
      body: extra?.physicsBody ?? (recipe.template === 'signal-tower' ? 'static' : 'dynamic'),
    },
    ...(root.animations.length ? { clips: root.animations.map(c => ({ name: c.name, duration: Math.round(c.duration * 1000) / 1000 })) } : {}),
  };
  writeCapabilities(root, capabilities);
  return capabilities;
}
