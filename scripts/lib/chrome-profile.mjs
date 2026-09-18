// The throwaway Chrome profile every harness here starts its browser on, and its
// removal. `capture-shots.mjs` says why each harness needs its own: a shared profile
// makes sequential runs flaky. Chrome creates the `--user-data-dir` it is given and
// never removes it, so a harness that only spawns leaves about 30 MB behind on every
// run — measured at 22 GB across 744 `iphone-*` directories on this machine before
// this module existed, and a concurrent session's profiles sit in the same place.
//
// What guarantees only this process's own directory is ever removed: `create()`
// builds the path from `tmpdir()` and a fresh `randomUUID()` and records that exact
// resolved string in this module's own map. `remove()` refuses any path that is not
// the key of a record in that map, so the only string it can ever hand to `rmSync` is
// one this process built a moment earlier. Nothing here globs, matches a prefix,
// lists a directory or walks the temp tree to *find* something to delete — which is
// what makes a concurrent session's `iphone-shot-*` or `iphone-finishes-*` profile
// unreachable even by a mistyped or borrowed path. The name check (`iphone-<what>-<uuid>`
// directly under `tmpdir()`) is a second line of defence against a bug in this file,
// not the guarantee.
//
// Removal retries because a Chrome that has just been killed holds its profile for a
// moment, and the failure is a Windows `EPERM` on the directory itself. Measured on
// this machine at the moment `chrome.kill()` returns: `rmSync` throws `EPERM` within a
// millisecond, and the directory is free about 280 ms later. Node's own `maxRetries`
// does not cover it — with `maxRetries: 9, retryDelay: 100` it still threw at +1 ms,
// the same as `maxRetries: 0` — so the retry loop below is this module's own, sleeping
// synchronously (`Atomics.wait`, the only sleep an exit handler can make) between
// attempts. It is bounded: an attempt immediately, then 50, 100, 200, 250, 250… ms,
// giving up after 3 s and leaving the directory in place.
//
// Removal is best-effort and never throws — `force: true` makes a directory that is
// already gone, or was never created because Chrome failed to start, a no-op rather
// than an error — so it cannot replace the error a harness is about to throw or
// change the exit code it has already computed. A directory that survives the budget
// is reported through the return value as a sentence; each caller prints that
// sentence to stderr, which is why a run that cleaned up prints exactly what it
// printed before this module existed.
//
// Every profile this process created is also removed from a `process.once('exit')`
// hook, so the exit paths a harness cannot reach — a thrown error, an uncaught
// exception, a non-zero exit code — clean up the same way the normal end does. That
// is what covers `check-finishes.mjs`, whose own `finally` only kills the browser.
//
// The bound: that hook is the last thing a process can run. A hard kill that never
// runs Node's exit handlers (SIGKILL, a force-kill, a job object) leaves the directory
// behind, exactly as it leaves the browser behind; no JavaScript runs then to remove
// either. Signals a Node process handles by default (Ctrl-C) are in that same class:
// they end the process without an `exit` event, so a harness interrupted that way can
// still leave one.
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';

/** How long a profile is given to come free, and the wait before each retry: the
 *  first attempt is immediate, then these cap at 250 ms. Ten times the ~280 ms
 *  measured on a machine that was also running another session's browsers. */
const BUDGET_MS = 3000;
const FIRST_WAIT_MS = 50;
const MAX_WAIT_MS = 250;

/** The name `create()` gives a profile: `iphone-<what>-<uuid>`, nothing else. */
const PROFILE_NAME = /^iphone-[a-z]+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** The exact resolved paths this process created, and whether each is gone — the
 *  whole of what `remove()` is allowed to delete. */
const created = new Map();

let hooked = false;

/** Sleeps without yielding to the event loop, so an exit handler can wait for a lock
 *  a dying Chrome still holds. `Atomics.wait` is the only synchronous sleep Node has
 *  (and is allowed on this thread, unlike a browser's). */
const sleepSync = (ms) => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
};

/** The profile path for one browser this process is about to start, named for what
 *  is using it (`shot`, `finishes`, `sweep`) and unique enough that no other process
 *  — and no other run of this one — can hold the same path. The directory itself is
 *  left to Chrome, which is the thing that creates it. */
export function createChromeProfile(kind) {
  const dir = resolve(join(tmpdir(), `iphone-${kind}-${randomUUID()}`));
  created.set(dir, { removed: false });
  if (!hooked) {
    hooked = true;
    process.once('exit', removeCreated);
  }
  return dir;
}

/** Removes the profile `createChromeProfile()` returned, and only that one. Returns
 *  `null` once it is gone (or was never there), or a sentence saying why it was
 *  refused or could not be removed. Never throws, so a call at the end of a harness
 *  cannot mask the harness's own failure or its exit code. */
export function removeChromeProfile(dir) {
  const target = resolve(dir);
  const record = created.get(target);
  if (record === undefined) return `refused to remove ${target}: this process did not create it`;
  if (record.removed) return null;
  if (!PROFILE_NAME.test(basename(target)) || dirname(target) !== resolve(tmpdir())) {
    return `refused to remove ${target}: it is not an iphone-<what>-<uuid> directory directly under ${resolve(tmpdir())}`;
  }

  const deadline = Date.now() + BUDGET_MS;
  let wait = FIRST_WAIT_MS;
  let last = null;
  for (;;) {
    try {
      rmSync(target, { recursive: true, force: true });
      record.removed = true;
      return null;
    } catch (error) {
      last = error;
      if (Date.now() >= deadline) break;
      sleepSync(wait);
      wait = Math.min(wait * 2, MAX_WAIT_MS);
    }
  }
  const code = last instanceof Error ? String(last.code ?? last.message) : String(last);
  return `${target} was still locked after ${String(BUDGET_MS)} ms of attempts (${code}), so it is left in place`;
}

/** The exit hook: every profile this process created that no harness removed. */
function removeCreated() {
  for (const dir of [...created.keys()]) {
    const failure = removeChromeProfile(dir);
    if (failure !== null) console.error(`chrome-profile: ${failure}`);
  }
}
