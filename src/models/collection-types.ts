import type * as T from 'three';
import type {
  ClearanceZoneSpec,
  ColliderSpec,
  DecalSlotSpec,
  DetachablePartSpec,
  NightZoneSpec,
  RiggedPartSpec,
  SurfaceSpec,
} from '../capabilities/schema';
import type { BrowseCategory } from '../data/browse';
import type { Finish } from './parts';

export type DecalSpec = DecalSlotSpec;

export interface ProceduralAssetDef {
  id: string;
  code: string;
  category: 'Object' | 'Character';
  browseCategory: BrowseCategory;
  name: string;
  primary: string;
  accent: string;
  description: string;
  physicsBody: 'static' | 'dynamic';
  riggedParts: readonly RiggedPartSpec[];
  detachableParts?: readonly DetachablePartSpec[];
  nightZones?: readonly NightZoneSpec[];
  decals?: readonly DecalSpec[];
  colliders?: readonly ColliderSpec[];
  clearanceZones?: readonly ClearanceZoneSpec[];
  surfaces?: readonly SurfaceSpec[];
  build: (root: T.Group, p: Finish, detail: boolean) => void;
}
