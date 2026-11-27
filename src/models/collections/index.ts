import type { ProceduralAssetDef } from '../collection-types';
import { animalsPack } from './animals-pack';
import { buildingsSciA } from './buildings-sci-a';
import { buildingsSciB } from './buildings-sci-b';
import { buildingsTownA } from './buildings-town-a';
import { buildingsTownB } from './buildings-town-b';
import { charactersA } from './characters-a';
import { charactersB } from './characters-b';
import { gearPack } from './gear-pack';
import { propsPack } from './props-pack';
import { terrainPack } from './terrain-pack';
import { vehiclesA } from './vehicles-a';
import { vehiclesB } from './vehicles-b';

export const extraAssets: readonly ProceduralAssetDef[] = [
  ...buildingsTownA,
  ...buildingsTownB,
  ...buildingsSciA,
  ...buildingsSciB,
  ...charactersA,
  ...charactersB,
  ...vehiclesA,
  ...vehiclesB,
  ...animalsPack,
  ...terrainPack,
  ...propsPack,
  ...gearPack,
];
