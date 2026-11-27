import { PropertyBinding, type AnimationClip, type KeyframeTrack, type Object3D } from 'three';

function target(root: Object3D, track: KeyframeTrack) {
  const path = PropertyBinding.parseTrackName(track.name);
  const node = PropertyBinding.findNode(root, path.nodeName);
  return JSON.stringify([node && 'uuid' in node ? node.uuid : path.nodeName, path.objectName, path.objectIndex, path.propertyName, path.propertyIndex]);
}

function close(a: ArrayLike<number>, b: ArrayLike<number>) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (Math.abs(Number(a[i]) - Number(b[i])) > 1e-5) return false;
  }
  return true;
}

/** GLB import can rename tracks from bone UUIDs to node names, and reorder their channels. */
export function sameMotion(root: Object3D, first: AnimationClip, second: AnimationClip) {
  if (first.tracks.length !== second.tracks.length || Math.abs(first.duration - second.duration) > 1e-5) return false;
  const tracks = new Map(first.tracks.map(track => [target(root, track), track]));
  return second.tracks.every(track => {
    const original = tracks.get(target(root, track));
    return original && original.ValueTypeName === track.ValueTypeName &&
      original.getInterpolation() === track.getInterpolation() && close(original.times, track.times) && close(original.values, track.values);
  });
}
