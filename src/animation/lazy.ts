import type { Object3D } from 'three';
import { characterRig } from './rig';

type AttachFn = <T extends Object3D>(model: T) => T;
let loaded: AttachFn | null = null;
let pending: Promise<AttachFn> | null = null;

/** Load the 85-clip humanoid motion bundle on demand (separate chunk so initial studio load stays small). */
export function loadCharacterAnimations(): Promise<AttachFn> {
  pending ??= import('./library').then(mod => {
    loaded = mod.addCharacterAnimations;
    return mod.addCharacterAnimations;
  });
  return pending;
}

/** Attach character clips synchronously if already loaded, or asynchronously for humanoid rigs. */
export function attachCharacterAnimations(model: Object3D, onLoaded?: () => void): void {
  if (!characterRig(model)) return;
  if (loaded) {
    loaded(model);
    return;
  }
  const before = model.animations.length;
  void loadCharacterAnimations().then(attach => {
    attach(model);
    if (model.animations.length !== before) onLoaded?.();
  });
}

/** Ensure all character clips are attached before export or API inspection of a humanoid rig. */
export async function ensureCharacterAnimations<T extends Object3D>(model: T): Promise<T> {
  if (!characterRig(model)) return model;
  const attach = loaded ?? (await loadCharacterAnimations());
  return attach(model);
}
