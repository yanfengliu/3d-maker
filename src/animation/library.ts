/// <reference types="vite/client" />
import { gunzipSync, strFromU8 } from 'three/addons/libs/fflate.module.js';
import type { Object3D } from 'three';
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
    const studioRig = rig.joints.some(joint => joint.sources.length > 1);
    const additions = [];
    for (const [path, url] of Object.entries(packed)) {
      const {name, motion} = readMotion(path, url);
      // The two original studio cycles have independent choreography.
      const label = studioRig && (name === 'Idle' || name === 'Walk') && embedded.has(name)
        ? name + ' (library)' : name;
      if (!embedded.has(label)) additions.push(bindCharacterClip(rig, label, motion));
    }
    model.animations.push(...additions);
  }
  visited.add(model);
  return model;
}
