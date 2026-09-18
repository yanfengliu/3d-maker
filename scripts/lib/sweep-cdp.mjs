// The sweep's browser plumbing: it waits for Chrome's DevTools endpoint, opens the
// one page session the whole run uses, evaluates expressions in that page, and
// dispatches the trusted mouse input the harness exists to use. The settling and the
// revision fingerprint are their own modules and run through this one; neither
// touches a socket or an input event.
//
// Input is the page's real path — pressed, moved in 14 steps, released, one trusted
// `mouseWheel` event per notch — never an assigned camera pose, so a frame the
// controls could not have reached cannot be reported as one they did. The step count
// and the 24 ms between moves are what make the drag land as a drag; the notch is
// 120 px.
//
// The page's uncaught exceptions are collected here (`exceptions`), because the
// protocol handler is the only place that sees them, and the harness refuses a frame
// from a page that threw while it ran. `check-finishes.mjs` refuses one the same way.
//
// This is the sweep's own copy of the transport and not `shot-cdp.mjs`'s: the sweep
// keeps one long-lived page it navigates, reads and shoots repeatedly, while the look
// gate opens a fresh shot URL per readback and pins a 1400x1000 canvas the sweep is
// allowed to resize (`SHOT_W` / `SHOT_H`). The two share the protocol, not a contract.

/** How often the DevTools endpoint is polled while Chrome starts. */
const ENDPOINT_POLL_MS = 200;
/** How long the endpoint is given to come up before the run is a "did not run". */
const ENDPOINT_TIMEOUT_MS = 20000;
/** Moves in one drag stroke, and the pause after each: enough events for the page's
 *  damped controls to treat the stroke as a drag rather than a click. */
const DRAG_STEPS = 14;
const DRAG_STEP_MS = 24;
/** One wheel notch, and the pause after it. */
const WHEEL_NOTCH_PX = 120;
const WHEEL_NOTCH_MS = 120;

/** Resolves after `ms`. The harness's only timer: the settle counts frames rather
 *  than milliseconds, so nothing else here sleeps. */
export const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/** The page's uncaught exceptions: a page that threw while a sweep ran is not a page
 *  this harness measured. */
export const exceptions = [];

/** Waits for Chrome's DevTools endpoint on `port` and returns its version object.
 *  The endpoint never coming up is a plain error: the entry point reports it as
 *  `sweep-iphone DID NOT RUN` and exits 2. */
export async function waitForEndpoint(port) {
  const deadline = Date.now() + ENDPOINT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return await response.json();
    } catch {
      // not up yet
    }
    await sleep(ENDPOINT_POLL_MS);
  }
  throw new Error('Chrome DevTools endpoint never came up');
}

/** The protocol session: one socket, one id counter, and the pending replies. */
export class Cdp {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      const entry = this.pending.get(message.id);
      if (entry !== undefined) {
        this.pending.delete(message.id);
        if (message.error) entry.reject(new Error(JSON.stringify(message.error)));
        else entry.resolve(message.result);
      } else if (message.method === 'Runtime.exceptionThrown') {
        const details = message.params?.exceptionDetails;
        exceptions.push(details?.exception?.description ?? details?.text ?? 'unknown exception');
      }
    });
  }

  send(method, params = {}, sessionId = undefined) {
    const id = this.nextId;
    this.nextId += 1;
    return new Promise((resolvePromise, rejectPromise) => {
      this.pending.set(id, { resolve: resolvePromise, reject: rejectPromise });
      const message = { id, method, params };
      if (sessionId !== undefined) message.sessionId = sessionId;
      this.socket.send(JSON.stringify(message));
    });
  }
}

/** One page-side read, with promises awaited: the revision fingerprint fetches the
 *  modules and hashes them inside the page, and without this the CDP result would be
 *  a Promise handle rather than its value. Every other expression here is a plain
 *  value, which `awaitPromise` leaves unchanged. */
export async function evaluate(send, expression) {
  const { result } = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  return result.value;
}

/** Opens the one page session the run uses and sizes it to the sweep's viewport:
 *  creates the target, attaches to it flat, enables the domains, and returns `send`
 *  bound to that session. `Runtime.enable` comes before the first navigation, so a
 *  page that throws while a sweep runs is recorded against that sweep. */
export async function openSession(cdp, size) {
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  const send = (method, params = {}) => cdp.send(method, params, sessionId);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: size.width, height: size.height, deviceScaleFactor: 1, mobile: false });
  return send;
}

/** A drag is the page's real input path — pressed, moved in steps, released — never an
 *  assigned camera pose, so a frame the controls could not have reached cannot be
 *  reported as one they did. */
export async function drag(send, size, dx, dy) {
  const cx = size.width / 2;
  const cy = size.height / 2;
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: cx, y: cy, button: 'left', buttons: 1, clickCount: 1 });
  for (let index = 1; index <= DRAG_STEPS; index += 1) {
    await send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: cx + (dx * index) / DRAG_STEPS,
      y: cy + (dy * index) / DRAG_STEPS,
      button: 'left',
      buttons: 1,
    });
    await sleep(DRAG_STEP_MS);
  }
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cx + dx, y: cy + dy, button: 'left', buttons: 0, clickCount: 1 });
}

/** One wheel notch, as one trusted event on the page's own control. */
export async function wheel(send, size, notch) {
  await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: size.width / 2, y: size.height / 2, deltaX: 0, deltaY: notch * WHEEL_NOTCH_PX });
  await sleep(WHEEL_NOTCH_MS);
}
