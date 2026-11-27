import assert from 'node:assert/strict';
import { join } from 'node:path';
import { inventoryFixture } from './check-inventory.mjs';

async function waitFrames(page, count = 4) {
  await page.evaluate(
    (n) =>
      new Promise((resolve) => {
        const step = (left) => {
          if (left <= 0) resolve();
          else requestAnimationFrame(() => step(left - 1));
        };
        step(n);
      }),
    count,
  );
}

async function selectClip(page, query, expected) {
  const search = page.getByRole('searchbox', { name: 'Search animations' });
  await search.fill(query);
  const target = page
    .locator('[data-clip]:visible')
    .filter({ has: page.locator('span', { hasText: new RegExp('^' + expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }) })
    .first();
  await target.click();
  assert.equal(await page.locator('#motionName').innerText(), expected);
  await page.click('#clearMotionSearch');
  assert.equal(await page.locator('[data-clip]:visible').count(), 87);
}

async function pauseAt(page, fraction) {
  if (/Pause/.test(await page.locator('#play').innerText())) await page.click('#play');
  await page.locator('#timeline').evaluate((input, value) => {
    input.value = String(value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, fraction);
  await waitFrames(page, 4);
}

async function subjectBounds(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('#viewport canvas');
    const temp = document.createElement('canvas');
    const width = 360,
      height = 240;
    temp.width = width;
    temp.height = height;
    const ctx = temp.getContext('2d');
    ctx.drawImage(canvas, 0, 0, width, height);
    const { data } = ctx.getImageData(0, 0, width, height);
    let minX = width,
      maxX = -1,
      minY = height,
      maxY = -1,
      count = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = data[i],
          g = data[i + 1],
          b = data[i + 2];
        // Match Field Pilot's warm suit, dark armor, or shaded helmet, excluding the #e7e8e1 backdrop and pale grid.
        const warm = r - b > 22 && r > g - 6;
        const dark = Math.max(r, g, b) < 135;
        if (!warm && !dark) continue;
        count++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    return {
      count,
      minX: minX / width,
      maxX: (maxX + 1) / width,
      minY: minY / height,
      maxY: (maxY + 1) / height,
      pixels: Array.from(data),
    };
  });
}

function meanChannelDiff(a, b) {
  let total = 0;
  for (let i = 0; i < a.length; i += 4) {
    total += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
  }
  return total / ((a.length / 4) * 3);
}

function exportedHipsMinY(bytes, clipName) {
  const buf = Buffer.from(bytes);
  const jsonLength = buf.readUInt32LE(12);
  const doc = JSON.parse(buf.toString('utf8', 20, 20 + jsonLength));
  const binOffset = 20 + jsonLength + 8;
  const clip = doc.animations.find((entry) => entry.name === clipName);
  assert.ok(clip, 'Missing exported clip ' + clipName);
  const channel = clip.channels.find(
    (entry) => entry.target.path === 'translation' && doc.nodes[entry.target.node]?.name === 'Hips',
  );
  assert.ok(channel, 'Missing exported Hips translation channel for ' + clipName);
  const accessor = doc.accessors[clip.samplers[channel.sampler].output];
  const view = doc.bufferViews[accessor.bufferView];
  const start = binOffset + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  let minY = Infinity;
  for (let i = 0; i < accessor.count; i++) {
    const y = buf.readFloatLE(start + i * 12 + 4);
    if (y < minY) minY = y;
  }
  return minY;
}

export async function verifyClipFraming(browser, origin, site, out) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  try {
    await inventoryFixture(context, join(out, '../..'));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(origin + site + '?asset=field-pilot');
    await page.waitForFunction(() => window.__shotReady);

    // Check Swimming and two other low poses (Treading water and Slide) through real controls.
    await selectClip(page, 'Swimming', 'Swimming');
    await pauseAt(page, 0.25);
    const swimDefault = await subjectBounds(page);
    await page.screenshot({ path: join(out, 'swimming-framed.png') });
    assert.ok(
      swimDefault.count > 200 && swimDefault.minY > 0.08 && swimDefault.maxY < 0.85 && swimDefault.minX > 0.08 && swimDefault.maxX < 0.92,
      'Swimming pose fell outside viewport bounds: ' + JSON.stringify({ ...swimDefault, pixels: undefined }),
    );

    await selectClip(page, 'Treading water', 'Treading water');
    await pauseAt(page, 0.35);
    const treading = await subjectBounds(page);
    await page.screenshot({ path: join(out, 'treading-water.png') });
    assert.ok(
      treading.count > 200 && treading.minY > 0.04 && treading.maxY < 0.88 && treading.minX > 0.08 && treading.maxX < 0.92,
      'Treading water pose fell outside viewport bounds: ' + JSON.stringify({ ...treading, pixels: undefined }),
    );

    await selectClip(page, 'Slide', 'Slide');
    await pauseAt(page, 0.3);
    const slide = await subjectBounds(page);
    await page.screenshot({ path: join(out, 'slide-pose.png') });
    assert.ok(
      slide.count > 200 && slide.minY > 0.08 && slide.maxY < 0.86 && slide.minX > 0.08 && slide.maxX < 0.92,
      'Slide pose fell outside viewport bounds: ' + JSON.stringify({ ...slide, pixels: undefined }),
    );

    // Orbit and zoom manually on Idle, switch through Swimming and Treading water, and confirm the orbit is preserved.
    await selectClip(page, 'Idle', 'Idle');
    await pauseAt(page, 0);
    const rect = await page.locator('#viewport').boundingBox();
    await page.mouse.move(rect.x + rect.width * 0.5, rect.y + rect.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(rect.x + rect.width * 0.72, rect.y + rect.height * 0.44, { steps: 10 });
    await page.mouse.up();
    await page.mouse.wheel(0, -120);
    await waitFrames(page, 6);
    const orbitedIdle = await subjectBounds(page);

    await selectClip(page, 'Swimming', 'Swimming');
    await pauseAt(page, 0.25);
    const swimOrbited = await subjectBounds(page);
    await page.screenshot({ path: join(out, 'swimming-orbited.png') });
    assert.ok(
      swimOrbited.count > 200 && swimOrbited.minY > 0.03 && swimOrbited.maxY < 0.92,
      'Orbited Swimming fell outside viewport: ' + JSON.stringify({ ...swimOrbited, pixels: undefined }),
    );
    assert.ok(
      meanChannelDiff(swimOrbited.pixels, swimDefault.pixels) > 3,
      'Selecting Swimming reset the user orbit back to default Perspective',
    );

    await selectClip(page, 'Treading water', 'Treading water');
    await waitFrames(page, 4);
    await selectClip(page, 'Idle', 'Idle');
    await pauseAt(page, 0);
    const restoredIdle = await subjectBounds(page);
    const drift = meanChannelDiff(orbitedIdle.pixels, restoredIdle.pixels);
    assert.ok(drift < 1.5, 'Switching clips drifted the user orbit (mean RGB diff ' + drift.toFixed(2) + ')');

    // Exported GLB motion must retain authored underwater Hips heights without preview framing offsets.
    await selectClip(page, 'Swimming', 'Swimming');
    await waitFrames(page, 3);
    const glb = await page.evaluate(async () => Array.from(new Uint8Array(await window.forgeStudio.exportGLB())));
    const swimMinY = exportedHipsMinY(glb, 'Swimming');
    const treadMinY = exportedHipsMinY(glb, 'Treading water');
    assert.ok(swimMinY < -0.04, 'Exported Swimming Hips Y lost its underwater depth: ' + swimMinY);
    assert.ok(treadMinY < -0.35, 'Exported Treading water Hips Y lost its underwater depth: ' + treadMinY);

    // Rigid models with spinning parts (Field Rover Traverse) must stay grounded at the same floor height as rest pose.
    await page.goto(origin + site + '?asset=field-rover&shot=1');
    await page.waitForFunction(() => window.__shotReady);
    await waitFrames(page, 4);
    const roverRest = await subjectBounds(page);
    await page.goto(origin + site + '?asset=field-rover');
    await page.waitForFunction(() => window.__shotReady);
    assert.equal(await page.locator('#motionName').innerText(), 'Traverse');
    await pauseAt(page, 0.2);
    const roverTraverse = await subjectBounds(page);
    await page.screenshot({ path: join(out, 'field-rover-traverse.png') });
    assert.ok(
      roverTraverse.count > 200 && Math.abs(roverTraverse.maxY - roverRest.maxY) < 0.025,
      'Field Rover drifted vertically during Traverse: ' +
        JSON.stringify({ restMaxY: roverRest.maxY, traverseMaxY: roverTraverse.maxY }),
    );
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}
