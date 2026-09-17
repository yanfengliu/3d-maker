// Dev-time capture harness: drives headless Chrome over the DevTools protocol,
// waits for the page's own `window.__shotReady` flag (which the viewer sets
// after five rendered frames), then writes a PNG.
//
// `chrome --screenshot` is not usable here: with `--virtual-time-budget` it
// captures before the WebGL scene has presented, and its shared profile makes
// sequential runs flaky. CDP gives an exact "the page says it is ready" point.
//
// Usage: node scripts/capture-shots.mjs
// env: SHOT_BASE, SHOT_OUT, SHOT_W, SHOT_H, SHOT_LIST as `view:color,...`,
//      SHOT_PAGE as the page path under the base (default `iphone.html`).
//      The index page ignores view and color, so a library capture is
//      `SHOT_PAGE=index.html SHOT_LIST=hero:cosmic-orange`.
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.env['SHOT_BASE'] ?? 'http://localhost:5199';
const OUT = resolve(process.env['SHOT_OUT'] ?? '.shots');
const WIDTH = Number(process.env['SHOT_W'] ?? 1200);
const HEIGHT = Number(process.env['SHOT_H'] ?? 900);
const SHOTS = (process.env['SHOT_LIST'] ?? 'hero:cosmic-orange').split(',');
// The page path is the only thing that differs between shooting the viewer and
// shooting the index; the default keeps every existing caller on the viewer.
const PAGE = process.env['SHOT_PAGE'] ?? 'iphone.html';
const READY_TIMEOUT_MS = 30000;

async function waitForEndpoint(port) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return await response.json();
    } catch {
      // endpoint not up yet
    }
    await new Promise((done) => setTimeout(done, 200));
  }
  throw new Error('Chrome DevTools endpoint never came up');
}

class Cdp {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = [];
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      const entry = this.pending.get(message.id);
      if (entry !== undefined) {
        this.pending.delete(message.id);
        if (message.error) entry.reject(new Error(JSON.stringify(message.error)));
        else entry.resolve(message.result);
        return;
      }
      for (const listener of this.listeners) listener(message);
    });
  }

  onMessage(listener) {
    this.listeners.push(listener);
  }

  send(method, params = {}, sessionId = undefined) {
    const id = this.nextId;
    this.nextId += 1;
    return new Promise((resolvePromise, rejectPromise) => {
      this.pending.set(id, { resolve: resolvePromise, reject: rejectPromise });
      const message = { id, method, params };
      // Flat protocol: the session rides beside `params`, not inside it.
      if (sessionId !== undefined) message.sessionId = sessionId;
      this.socket.send(JSON.stringify(message));
    });
  }
}

async function connect(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  await new Promise((done, fail) => {
    socket.addEventListener('open', done, { once: true });
    socket.addEventListener('error', fail, { once: true });
  });
  return new Cdp(socket);
}

const port = 9300 + Math.floor(Math.random() * 400);
const profile = `${tmpdir()}\\iphone-shot-${randomUUID()}`;
const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--enable-unsafe-swiftshader',
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${port}`,
    `--window-size=${WIDTH},${HEIGHT}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);

let failures = 0;

try {
  const version = await waitForEndpoint(port);
  const cdp = await connect(version.webSocketDebuggerUrl);
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  const send = (method, params = {}) => cdp.send(method, params, sessionId);

  const problems = [];
  cdp.onMessage((message) => {
    if (message.method !== 'Runtime.exceptionThrown') return;
    const details = message.params?.exceptionDetails;
    problems.push(details?.exception?.description ?? details?.text ?? 'unknown exception');
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: 1,
    mobile: false,
  });

  mkdirSync(OUT, { recursive: true });
  for (const shot of SHOTS) {
    const parts = shot.split(':');
    const [view = 'hero', color = 'cosmic-orange', ...extra] = parts;
    const suffix = extra.length > 0 ? `&${extra.join('&')}` : '';
    problems.length = 0;
    await send('Page.navigate', {
      url: `${BASE}/${PAGE}?shot=1&view=${view}&color=${color}${suffix}`,
    });

    let ready = false;
    const deadline = Date.now() + READY_TIMEOUT_MS;
    while (Date.now() < deadline) {
      const { result } = await send('Runtime.evaluate', {
        expression: 'window.__shotReady === true',
        returnByValue: true,
      });
      if (result.value === true) {
        ready = true;
        break;
      }
      await new Promise((done) => setTimeout(done, 150));
    }

    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    const file = `${OUT}\\${color}_${view}.png`;
    writeFileSync(file, Buffer.from(data, 'base64'));
    if (!ready) failures += 1;
    console.log(
      `${ready ? 'ready  ' : 'TIMEOUT'} ${file}${problems.length > 0 ? `  CONSOLE: ${problems.join(' | ')}` : ''}`,
    );
  }
} finally {
  chrome.kill();
}

process.exitCode = failures === 0 ? 0 : 1;
