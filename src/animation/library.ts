/// <reference types="vite/client" />
import { gunzipSync, strFromU8 } from 'three/addons/libs/fflate.module.js';
import type { Object3D } from 'three';
import { sameMotion } from './duplicates';
import { bindCharacterClip, characterRig } from './rig';

// Vite inlines these small, individually compressed release assets in the portable game SDK too.
const packed = import.meta.glob<string>('./motions/*.clip.gz', {
  eager: true, import: 'default', query: '?url&inline',
});
const decoded = new Map<string, {name: string; motion: unknown}>();
const visited = new WeakSet<Object3D>();

function readMotion(path: string, url: string) {
  const previous = decoded.get(path);
  if (previous) return previous;
  const bytes = Uint8Array.from(atob(url.slice(url.indexOf(',') + 1)), char => char.charCodeAt(0));
  const motion: unknown = JSON.parse(strFromU8(gunzipSync(bytes)));
  if (!motion || typeof motion !== 'object' || !('name' in motion) || typeof motion.name !== 'string') {
    throw new Error('Invalid packaged character motion: ' + path);
  }
  const entry = { name: motion.name, motion };
  decoded.set(path, entry);
  return entry;
}

/** Attach the redistributable repertoire once. Keep native clips and their public indices stable. */
export function addCharacterAnimations<T extends Object3D>(model: T): T {
  if (visited.has(model)) return model;
  const rig = characterRig(model);
  if (rig) {
    const embedded = new Set(model.animations.map(clip => clip.name));
    const additions = [];
    for (const [path, url] of Object.entries(packed)) {
      const {name, motion} = readMotion(path, url);
      const candidate = bindCharacterClip(rig, name, motion);
      // A custom clip can use a publisher's title or even its collision suffix.
      // Keep each distinct motion and recognize our tracks again after a GLB round trip.
      let label = name, suffix = 1;
      while (embedded.has(label)) {
        if (model.animations.some(clip => clip.name === label && sameMotion(model, clip, candidate))) break;
        label = suffix === 1 ? name + ' (library)' : name + ' (library ' + String(suffix) + ')';
        suffix++;
      }
      if (embedded.has(label)) continue;
      candidate.name = label;
      additions.push(candidate);
    }
    model.animations.push(...additions);
  }
  visited.add(model);
  return model;
}
