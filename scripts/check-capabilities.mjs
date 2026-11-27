import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { waitFrames } from './browser.mjs';

const origin = 'https://polyfork.dev';
const assetId = 'shopfront-fixture-01';

function linearByte(srgbByte) {
  const c = srgbByte / 255;
  const lin = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return Math.round(lin * 255);
}

function buildShopfrontFixtureGlb() {
  const bodyVerts = [];
  const bodyColors = [];
  // 40 slightly tone-varied wall triangles (>32 raw hexes) to exercise semantic zone clustering.
  for (let i = 0; i < 40; i++) {
    const col = i % 8, row = Math.floor(i / 8);
    const x0 = -1.6 + col * 0.4, y0 = row * 0.5;
    bodyVerts.push(x0, y0, 0, x0 + 0.38, y0, 0, x0 + 0.38, y0 + 0.48, 0);
    const v = 212 + (i % 40);
    for (let k = 0; k < 3; k++) bodyColors.push(linearByte(v), linearByte(v - 2), linearByte(v - 6), 255);
  }
  // Glowing window pane triangle matching sRGB #34322d (52, 50, 45) encoded in linear glTF COLOR_0.
  bodyVerts.push(0.2, 0.5, 0.08, 1.4, 0.5, 0.08, 0.8, 1.8, 0.08);
  for (let k = 0; k < 3; k++) bodyColors.push(linearByte(52), linearByte(50), linearByte(45), 255);

  // Hinged blue door leaf (#4678a8 -> 70, 120, 168), big front-facing quad.
  const doorVerts = new Float32Array([
    0, 0, 0, 0.9, 0, 0, 0.9, 2.0, 0,
    0, 0, 0, 0.9, 2.0, 0, 0, 2.0, 0,
  ]);
  const doorColors = new Uint8Array(Array.from({ length: 6 }, () => [linearByte(70), linearByte(120), linearByte(168), 255]).flat());

  // Detachable terracotta planter (#c0463e -> 192, 70, 62) centered in front of the wall so eyedropper visibly switches when hidden.
  const planterVerts = new Float32Array([-0.6, 0.6, 0, 0.6, 0.6, 0, 0, 1.9, 0]);
  const planterColors = new Uint8Array(Array.from({ length: 3 }, () => [linearByte(192), linearByte(70), linearByte(62), 255]).flat());

  const parts = [
    new Float32Array(bodyVerts), new Uint8Array(bodyColors),
    doorVerts, doorColors,
    planterVerts, planterColors,
  ];
  let byteLength = 0;
  const bufferViews = parts.map(p => {
    const view = { buffer: 0, byteOffset: byteLength, byteLength: p.byteLength };
    byteLength += p.byteLength;
    return view;
  });
  const doc = {
    asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [0] }],
    nodes: [
      {
        name: 'shopfront-fixture',
        extras: { decals: [{ name: 'fascia', at: [0.6, 2.2, 0.12], normal: [0, 0, 1], up: [0, 1, 0], size: [1.3, 0.24], describe: 'Shop fascia sign' }] },
        children: [1, 2, 4],
      },
      { name: 'shop-body', mesh: 0 },
      { name: 'door', translation: [-1.1, 0, 0.15], children: [3] },
      { name: 'door-leaf', mesh: 1 },
      { name: 'planter', translation: [0, 0, 0.25], children: [5] },
      { name: 'planter-mesh', mesh: 2 },
    ],
    meshes: [
      { primitives: [{ attributes: { POSITION: 0, COLOR_0: 1 }, material: 0 }] },
      { primitives: [{ attributes: { POSITION: 2, COLOR_0: 3 }, material: 0 }] },
      { primitives: [{ attributes: { POSITION: 4, COLOR_0: 5 }, material: 0 }] },
    ],
    materials: [{ pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1] } }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: bodyVerts.length / 3, type: 'VEC3', min: [-1.6, 0, 0], max: [1.6, 2.5, 0.1] },
      { bufferView: 1, componentType: 5121, normalized: true, count: bodyVerts.length / 3, type: 'VEC4' },
      { bufferView: 2, componentType: 5126, count: 6, type: 'VEC3', min: [0, 0, 0], max: [0.9, 2.0, 0] },
      { bufferView: 3, componentType: 5121, normalized: true, count: 6, type: 'VEC4' },
      { bufferView: 4, componentType: 5126, count: 3, type: 'VEC3', min: [-0.6, 0.6, 0], max: [0.6, 1.9, 0] },
      { bufferView: 5, componentType: 5121, normalized: true, count: 3, type: 'VEC4' },
    ],
    buffers: [{ byteLength }], bufferViews,
  };
  const json = Buffer.from(JSON.stringify(doc));
  const padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20);
  json.copy(padded);
  const head = Buffer.alloc(20);
  head.write('glTF'); head.writeUInt32LE(2, 4);
  head.writeUInt32LE(28 + padded.length + byteLength, 8);
  head.writeUInt32LE(padded.length, 12); head.write('JSON', 16);
  const binHead = Buffer.alloc(8);
  binHead.writeUInt32LE(byteLength, 0); binHead.write('BIN\0', 4);
  return Buffer.concat([head, padded, binHead, ...parts.map(p => Buffer.from(p.buffer))]);
}

async function canvasSample(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('#viewport canvas');
    const temp = document.createElement('canvas');
    temp.width = 200; temp.height = 140;
    const ctx = temp.getContext('2d');
    ctx.drawImage(canvas, 0, 0, 200, 140);
    const { data } = ctx.getImageData(0, 0, 200, 140);
    let darkBg = 0, warmGlow = 0, sig = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (r < 60 && g < 65 && b < 85) darkBg++;
      if (r > 180 && g > 130 && b < 145 && r > b + 60) warmGlow++;
      sig = (Math.imul(sig, 31) + r + g * 3 + b * 7) | 0;
    }
    return { darkBg, warmGlow, sig };
  });
}

export async function verifyCapabilities(browser, originUrl, site, out) {
  const glb = buildShopfrontFixtureGlb();
  const detail = {
    id: assetId, title: 'Shopfront Fixture', class: 'building', free: true, triangles: 43,
    description: 'Shopfront fixture with hinged door, detachable planter, night glass and fascia decal.',
    size_m: { x: 3.2, y: 2.5, z: 0.4 }, origin_y: 0, origin: 'ground level (minY = 0)',
    physics: { body: 'static', mass_kg: 12000, material: 'stone' },
    rigged_parts: { door: { axis: 'y', range: [0, 80], describe: 'shop door, hinged on its left edge, swings into the shop' } },
    detachable_parts: ['planter'],
    night: { pane: { color: '#ffc46b', intensity: 0.85, albedo: '#34322d', findable: true, describe: 'Warm amber display pane' } },
    params_url: `${origin}/cdn/${assetId}-params.json`,
    download: { glb: `${origin}/cdn/${assetId}.glb` },
  };
  const params = {
    params: {
      limewash: { type: 'color', default: '#eceae3', label: 'Limewash' },
      paint: { type: 'color', default: '#4678a8', label: 'Joinery paint' },
      pane: { type: 'color', default: '#34322d', label: 'Lit glass' },
      pot: { type: 'color', default: '#c0463e', label: 'Pot' },
      planter: { type: 'toggle', default: true, describe: 'Terracotta pot beside the door' },
    },
    presets: {
      'aegean-blue': { paint: '#4678a8' },
      'harbour-green': { paint: '#47582c' },
    },
  };

  const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, acceptDownloads: true });
  let failDetail = false;
  let failParams = false;
  try {
    await context.route(origin + '/**', async route => {
      const url = new URL(route.request().url());
      const headers = { 'access-control-allow-origin': '*' };
      if (url.pathname === '/api/assets') {
        await route.fulfill({ headers, json: { page: 1, per_page: 12, total: 1, assets: [detail] } });
      } else if (url.pathname === `/api/assets/${assetId}`) {
        if (failDetail) await route.fulfill({ status: 429, headers });
        else await route.fulfill({ headers, json: detail });
      } else if (url.pathname === `/cdn/${assetId}-params.json`) {
        if (failParams) await route.fulfill({ status: 429, headers });
        else await route.fulfill({ headers, json: params });
      } else if (url.pathname === `/cdn/${assetId}.glb`) {
        await route.fulfill({ headers, contentType: 'model/gltf-binary', body: glb });
      } else {
        await route.fulfill({ status: 404, headers });
      }
    });

    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(originUrl + site);
    await page.waitForFunction(() => window.__shotReady);

    await page.locator('[data-source-filter="polyfork"]').click();
    await page.getByRole('button', { name: 'Open Shopfront Fixture', exact: true }).click();
    await page.waitForFunction(() => document.getElementById('sceneName')?.textContent === 'Shopfront Fixture');
    await waitFrames(page, 4);

    // 1. Inspect capability manifest & UI controls.
    const inspected = await page.evaluate(() => window.forgeStudio.inspectModel());
    assert.deepEqual(inspected.riggedParts.map(p => p.name), ['door']);
    assert.deepEqual(inspected.detachableParts.map(p => p.name), ['planter']);
    assert.deepEqual(inspected.nightZones.map(z => z.name), ['pane']);
    assert.deepEqual(inspected.decals.map(d => d.name), ['fascia']);
    assert.ok(inspected.paintSlots.some(s => s.id === 'zone-limewash'));
    assert.match(await page.locator('#motionCount').innerText(), /1 interactive part/);

    // 2. Open door via real UI button and verify rendered pixels change.
    await waitFrames(page, 4);
    const beforeDoor = await canvasSample(page);
    await page.click('[data-part-toggle="door"]');
    await waitFrames(page, 4);
    const afterDoor = await canvasSample(page);
    assert.equal((await page.evaluate(() => window.forgeStudio.listParts().rigged[0].value)), 80);
    assert.notEqual(afterDoor.sig, beforeDoor.sig, 'Opening door did not change viewport pixels');

    // 3. Apply colorway preset, hide planter, set decal text, and turn on night mode.
    await page.click('[data-colorway="harbour-green"]');
    await page.uncheck('[data-detach-part="planter"]');
    await page.locator('[data-decal-input="fascia"]').fill('BAKERY');
    await page.click('#nightToggle');
    await waitFrames(page, 4);
    const nightSample = await canvasSample(page);
    assert.ok(nightSample.darkBg > 10000 && nightSample.warmGlow > 20, 'Night mode did not darken viewport and illuminate warm pane: ' + JSON.stringify(nightSample));
    await page.screenshot({ path: join(out, 'capabilities-night.png') });

    // 3b. Exercise decal toggle and Test animation loop, confirming opening AI tools stops Test cleanly.
    await page.click('#decalToggle');
    assert.equal(await page.locator('#decalToggle').getAttribute('aria-pressed'), 'false');
    await page.click('#decalToggle');
    assert.equal(await page.locator('#decalToggle').getAttribute('aria-pressed'), 'true');
    await page.click('[data-part-play="door"]');
    assert.equal(await page.locator('[data-part-play="door"]').getAttribute('aria-pressed'), 'true');
    await waitFrames(page, 4);

    // 4. Test AI tools stops running Test preview + natural-language command + capability reference disclosure.
    await page.click('#assistant');
    assert.equal(await page.locator('[data-part-play="door"]').getAttribute('aria-pressed'), 'false');
    const summaryText = await page.locator('dialog').innerText();
    assert.ok(summaryText.includes('Interactive parts and model capabilities'));
    await page.locator('#promptText').fill('close door, show planter');
    await page.click('#applyPrompt');
    await page.waitForFunction(() => !document.querySelector('dialog').open);
    await waitFrames(page, 3);
    assert.equal((await page.evaluate(() => window.forgeStudio.listParts().rigged[0].value)), 0);
    assert.equal((await page.evaluate(() => window.forgeStudio.listParts().detachable[0].visible)), true);

    // 4b. Test 3D viewport eyedropper picks visible planter at center, then ignores it once hidden (traverseVisible).
    await page.click('#pickColor');
    assert.equal(await page.locator('#pickColor').getAttribute('aria-pressed'), 'true');
    const vp = await page.locator('#viewport').boundingBox();
    await page.mouse.click(vp.x + vp.width * 0.5, vp.y + vp.height * 0.5);
    await waitFrames(page, 2);
    assert.equal(await page.locator('#paintSlot').inputValue(), 'zone-pot', 'Visible planter should be picked first');
    await page.uncheck('[data-detach-part="planter"]');
    await waitFrames(page, 2);
    await page.mouse.click(vp.x + vp.width * 0.5, vp.y + vp.height * 0.5);
    await waitFrames(page, 2);
    const pickedBehind = await page.locator('#paintSlot').inputValue();
    assert.ok(pickedBehind.startsWith('zone-') && pickedBehind !== 'zone-pot', 'Hidden planter was picked: ' + pickedBehind);
    await page.click('#pickColor');

    // 5. Re-open door, save remix, then simulate partial metadata outage (detail 200, params 429) on reload and verify all edits persist!
    await page.click('[data-part-toggle="door"]');
    await page.click('#save');
    await page.waitForFunction(() => document.querySelector('#save')?.textContent?.includes('Save changes'));
    failDetail = false;
    failParams = true;
    await page.reload();
    await page.waitForFunction(() => window.__shotReady);
    await page.locator('[data-source-filter="saved"]').click();
    await page.getByRole('button', { name: 'Open Shopfront Fixture', exact: true }).click();
    await page.waitForFunction(() => window.forgeStudio.getImportEdits()?.pose?.door === 80);
    const restoredEdits = await page.evaluate(() => window.forgeStudio.getImportEdits());
    assert.deepEqual(restoredEdits.hiddenParts, ['planter']);
    assert.equal(restoredEdits.night, true);
    assert.equal(restoredEdits.decalText.fascia, 'BAKERY');
    assert.equal(restoredEdits.paint['zone-paint'], '#47582c');
    failParams = false;

    // 6. Export GLB with default checked rigged-part clips, verify extras.formFoundry + clip, then re-import offline.
    await page.click('#export');
    assert.equal(await page.locator('#exportPartClips').isChecked(), true);
    const pending = page.waitForEvent('download');
    await page.click('#downloadGlb');
    const exportedBytes = await readFile(await (await pending).path());
    const doc = JSON.parse(exportedBytes.toString('utf8', 20, 20 + exportedBytes.readUInt32LE(12)));
    const manifest = doc.nodes.map(n => n.extras?.formFoundry).find(Boolean);
    assert.equal(manifest.version, 1);
    assert.deepEqual(manifest.riggedParts.map(p => p.name), ['door']);
    assert.deepEqual(doc.animations.map(a => a.name), ['Open door']);
    assert.equal(manifest.clips[0].synthesized, true);

    await page.click('#import');
    await page.locator('input[type=file]').setInputFiles({
      name: 'Offline Shopfront.glb', mimeType: 'model/gltf-binary', buffer: exportedBytes,
    });
    await page.waitForFunction(() => document.getElementById('sceneName')?.textContent === 'Offline Shopfront');
    assert.equal((await page.evaluate(() => window.forgeStudio.listParts().rigged[0].value)), 80);
    assert.deepEqual(await page.evaluate(() => window.forgeStudio.listClips().map(c => c.name)), ['Open door']);
    // Synthesized clip does NOT autoplay and Fit does NOT snap the posed door back to clip frame 0.
    assert.match(await page.locator('#play').innerText(), /Play clip/);
    await waitFrames(page, 4);
    const openReimportBeforeFit = await canvasSample(page);
    await page.click('#fit');
    await waitFrames(page, 4);
    assert.equal((await canvasSample(page)).sig, openReimportBeforeFit.sig, 'Fit snapped re-imported posed door to clip frame 0');
    // Detachable part survived export hidden and can be toggled visible again!
    assert.equal((await page.evaluate(() => window.forgeStudio.listParts().detachable[0].visible)), false);
    await page.check('[data-detach-part="planter"]');
    assert.equal((await page.evaluate(() => window.forgeStudio.listParts().detachable[0].visible)), true);
    // Colorway zone-paint survived repainted export intact and can switch back to Aegean blue.
    await page.click('[data-colorway="aegean-blue"]');
    assert.equal((await page.evaluate(() => window.forgeStudio.listPaintSlots().find(s => s.id === 'zone-paint')?.color)), '#4678a8');
    // Closing door after re-import and re-exporting must bake 0 deg on the actual glTF door node (not stale 80 deg)!
    await page.click('.parts-drawer summary');
    await page.click('[data-part-toggle="door"]');
    assert.equal((await page.evaluate(() => window.forgeStudio.listParts().rigged[0].value)), 0);
    const secondGlb = await page.evaluate(async () => {
      const bytes = await window.forgeStudio.exportGLB();
      const len = new DataView(bytes).getUint32(12, true);
      return JSON.parse(new TextDecoder().decode(new Uint8Array(bytes, 20, len)));
    });
    const secondManifest = secondGlb.nodes.map(n => n.extras?.formFoundry).find(Boolean);
    const secondDoor = secondGlb.nodes.find(n => n.name === 'door');
    assert.equal(secondManifest.state?.pose, undefined);
    const doorRot = secondDoor?.rotation ?? [0, 0, 0, 1];
    assert.ok(Math.abs(doorRot[1]) < 1e-4 && Math.abs(Math.abs(doorRot[3]) - 1) < 1e-4, 'Exported closed door had non-zero rotation: ' + JSON.stringify(doorRot));

    // 6b. Switch from 0-clip PolyFork model to original Cargo Pod: no leaked click handler, actual lid stays open in WebGL after swatch edit, Reset clears pose, and AI tools omits rigged parts.
    await page.locator('[data-source-filter="polyfork"]').click();
    await page.locator(`[data-key="polyfork:${assetId}"]`).click();
    await page.waitForFunction(() => document.getElementById('sceneName')?.textContent === 'Shopfront Fixture');
    await page.locator('[data-source-filter="original"]').click();
    await page.getByRole('button', { name: 'Open Cargo Pod', exact: true }).click();
    await page.waitForFunction(() => document.getElementById('sceneName')?.textContent === 'Cargo Pod');
    await page.click('.parts-drawer summary');
    await page.click('[data-part-toggle="CaseLid"]');
    await waitFrames(page, 3);
    assert.equal((await page.evaluate(() => window.forgeStudio.listParts().rigged[0].value)), -72);
    await page.getByRole('button', { name: 'Terracotta' }).click();
    await waitFrames(page, 3);
    const podOpenAfterSwatch = await canvasSample(page);
    assert.equal((await page.evaluate(() => window.forgeStudio.listParts().rigged[0].value)), -72);
    // Closing the lid after the swatch rebuild MUST change the actual rendered viewport pixels (proving lid stayed open in WebGL!).
    await page.click('[data-part-toggle="CaseLid"]');
    await waitFrames(page, 3);
    assert.equal((await page.evaluate(() => window.forgeStudio.listParts().rigged[0].value)), 0);
    assert.notEqual((await canvasSample(page)).sig, podOpenAfterSwatch.sig, 'Cargo Pod lid had snapped shut after swatch edit');
    // Re-open lid, click Reset, and verify Reset clears the pose instead of carrying it.
    await page.click('[data-part-toggle="CaseLid"]');
    assert.equal((await page.evaluate(() => window.forgeStudio.listParts().rigged[0].value)), -72);
    await page.click('#reset');
    assert.equal((await page.evaluate(() => window.forgeStudio.listParts().rigged[0].value)), 0);
    await page.click('#assistant');
    assert.ok(!(await page.locator('dialog').innerText()).includes('Interactive parts and model capabilities'));
    await page.click('#closeDialog');

    // 6c. Model variations: switch Bakery Shopfront to Winter Frost via UI select, toggle RoofSnow, and verify Cargo Lifter GLB + SDK.
    await page.locator('[data-category="building"]').click();
    await page.getByRole('button', { name: 'Open Bakery Shopfront', exact: true }).click();
    await page.waitForFunction(() => document.getElementById('sceneName')?.textContent === 'Bakery Shopfront');
    await waitFrames(page, 3);
    const bakeryDefault = await canvasSample(page);
    const variationOptions = await page.locator('#variation option').evaluateAll(opts => opts.map(o => o.value));
    assert.deepEqual(variationOptions, ['default', 'winter-frost', 'evening-bistro']);
    await page.selectOption('#variation', 'winter-frost');
    await page.waitForFunction(() => document.getElementById('sceneName')?.textContent === 'Bakery Shopfront (Winter)');
    await waitFrames(page, 4);
    assert.equal((await page.evaluate(() => window.forgeStudio.getRecipe()?.variation)), 'winter-frost');
    assert.notEqual((await canvasSample(page)).sig, bakeryDefault.sig, 'Switching to Winter Frost variation did not update viewport');
    await page.screenshot({ path: join(out, 'variation-bakery-winter.png') });
    assert.equal((await page.evaluate(() => window.forgeStudio.listParts().detachable.some(p => p.name === 'RoofSnow'))), true);
    await page.uncheck('[data-detach-part="RoofSnow"]');
    assert.equal((await page.evaluate(() => window.forgeStudio.listParts().detachable.find(p => p.name === 'RoofSnow')?.visible)), false);

    // Switch via agent API to Relay Drone Cargo Lifter and verify exported GLB self-describes its variation.
    await page.evaluate(() => { window.forgeStudio.selectVariation('cargo-lifter', 'relay-drone'); });
    await page.waitForFunction(() => document.getElementById('sceneName')?.textContent === 'Relay Drone (Cargo Lifter)');
    await waitFrames(page, 4);
    await page.screenshot({ path: join(out, 'variation-drone-cargo.png') });
    const droneVarGlb = await page.evaluate(async () => {
      const bytes = await window.forgeStudio.exportGLB();
      const len = new DataView(bytes).getUint32(12, true);
      return JSON.parse(new TextDecoder().decode(new Uint8Array(bytes, 20, len)));
    });
    const droneVarManifest = droneVarGlb.nodes.map(n => n.extras?.formFoundry).find(Boolean);
    assert.equal(droneVarManifest.source?.variation, 'cargo-lifter');
    assert.ok(droneVarManifest.riggedParts.some(p => p.name === 'CargoHook'));
    assert.ok(droneVarManifest.variations?.some(v => v.id === 'default'));

    // 6d. Parametric kit variation UI: open Harbor Timber Pavilion, drive #modelParams live controls, and confirm pixel & recipe updates.
    await page.evaluate(() => { window.forgeStudio.selectVariation('harbor-timber-kit', 'market-pavilion'); });
    await page.waitForFunction(() => document.getElementById('sceneName')?.textContent === 'Harbor Timber Pavilion');
    await waitFrames(page, 4);
    assert.equal(await page.locator('#param-bays').inputValue(), '3');
    assert.equal(await page.locator('#param-awning').isChecked(), true);
    assert.equal(await page.locator('#param-colorway').inputValue(), 'harbor-oak');
    await page.screenshot({ path: join(out, 'model-params.png') });
    const pavilionBefore = await canvasSample(page);
    await page.selectOption('#param-colorway', 'cedar-slate');
    await page.uncheck('#param-awning');
    await page.locator('#param-bays').evaluate(input => {
      input.value = '4';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await waitFrames(page, 4);
    const pavilionParams = await page.evaluate(() => window.forgeStudio.getRecipe()?.params);
    assert.equal(pavilionParams?.bays, 4);
    assert.equal(pavilionParams?.awning, false);
    assert.equal(pavilionParams?.colorway, 'cedar-slate');
    assert.notEqual((await canvasSample(page)).sig, pavilionBefore.sig, 'Editing #modelParams did not update viewport');
    const pavilionCaps = await page.evaluate(() => window.forgeStudio.inspectModel());
    assert.equal(pavilionCaps?.source?.kit, 'harbor-timber');
    assert.equal(pavilionCaps?.params?.length, 5);

    // 7. Verify SDK exports inspectAsset, createAssetController, listVariations, resolveVariationRecipe, deriveIkMetadata, and mergeStaticParts.
    const sdkPage = await context.newPage();
    await sdkPage.goto(originUrl + '/sdk-check');
    const sdkResult = await sdkPage.evaluate(async () => {
      const { createAsset, catalog, inspectAsset, createAssetController, listVariations, resolveVariationRecipe, deriveIkMetadata, mergeStaticParts } = await import('/3d-maker/studio-sdk.js');
      const pod = createAsset(catalog.find(row => row.id === 'cargo-pod').recipe);
      const info = inspectAsset(pod);
      const ctrl = createAssetController(pod);
      const opened = ctrl.openPart('CaseLid');
      const lifter = createAsset(resolveVariationRecipe('relay-drone', 'cargo-lifter'));
      const lifterInfo = inspectAsset(lifter);
      const pilot = createAsset(catalog.find(row => row.id === 'field-pilot').recipe);
      const pilotIk = deriveIkMetadata(pilot);
      return {
        parts: info.riggedParts.map(p => p.name),
        opened,
        lidRotX: pod.getObjectByName('CaseLid').rotation.x,
        variationCount: listVariations('bakery-shopfront').length,
        lifterVariation: lifterInfo.source?.variation,
        pilotIkType: pilotIk?.type,
        pilotLegCount: pilotIk?.legs?.limbs.length ?? 0,
        hasMergeStatic: typeof mergeStaticParts === 'function',
      };
    });
    assert.deepEqual(sdkResult.parts, ['CaseLid']);
    assert.equal(sdkResult.opened, -72);
    assert.ok(sdkResult.lidRotX < -1.2);
    assert.equal(sdkResult.variationCount, 3);
    assert.equal(sdkResult.lifterVariation, 'cargo-lifter');
    assert.equal(sdkResult.pilotIkType, 'legs');
    assert.equal(sdkResult.pilotLegCount, 2);
    assert.equal(sdkResult.hasMergeStatic, true);
    await sdkPage.close();
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}
