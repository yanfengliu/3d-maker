import type * as T from 'three';
import type {
  AssetIkSpec,
  ClearanceZoneSpec,
  ColliderSpec,
  DecalSlotSpec,
  DetachablePartSpec,
  ModelParamSpec,
  ModelParamValues,
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
  kit?: string;
  params?: readonly ModelParamSpec[];
  physicsBody: 'static' | 'dynamic';
  riggedParts: readonly RiggedPartSpec[];
  detachableParts?: readonly DetachablePartSpec[];
  nightZones?: readonly NightZoneSpec[];
  decals?: readonly DecalSpec[];
  ik?: AssetIkSpec;
  colliders?: readonly ColliderSpec[];
  clearanceZones?: readonly ClearanceZoneSpec[];
  surfaces?: readonly SurfaceSpec[];
  build: (root: T.Group, p: Finish, detail: boolean, params?: ModelParamValues) => void;
}
