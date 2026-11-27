import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { inventoryFixture, showSaved } from './check-inventory.mjs';

async function openCard(page, name) {
  await page.getByRole('button', { name: 'Open ' + name, exact: true }).click();
  await page.waitForFunction(title => document.querySelector('#sceneName').textContent === title, name);
}

async function save(page) {
  await page.click('#save');
  await page.waitForFunction(() => {
    const button = document.querySelector('#save');
    return !button.disabled && button.textContent.includes('Save changes');
  });
}

function inventory(page) {
  return page.evaluate(() => window.forgeStudio.listInventory());
}

async function startRemix(page, name) {
  const source = await page.locator('#assetName').inputValue();
  const savedBefore = await inventory(page);
  await page.click('#remix');
  const input = page.locator('#assetName');
  assert.equal(await input.inputValue(), source + ' remix');
  assert.ok(await input.evaluate(element => element === document.activeElement));
  assert.deepEqual(await inventory(page), savedBefore, 'Starting a draft wrote into the saved inventory');
  await input.fill(name);
  await input.press('Tab');
}

async function download(page) {
  await page.click('#export');
  const pending = page.waitForEvent('download');
  await page.click('#downloadGlb');
  const file = await pending;
  const bytes = await readFile(await file.path());
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
  const doc = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)));
  return { bytes, doc };
}

async function settleRenderer(page) {
  await page.evaluate(
    () =>
      new Promise(resolve => {
        let left = 14;
        const tick = () => {
          if (--left <= 0) setTimeout(resolve, 220);
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
  );
}

async function waitFrames(page, count = 3) {
  await page.evaluate(
    n =>
      new Promise(resolve => {
        const tick = left => {
          if (left <= 0) resolve();
          else requestAnimationFrame(() => tick(left - 1));
        };
        tick(n);
      }),
    count,
  );
}

async function viewportColors(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('#viewport canvas');
    const temp = document.createElement('canvas');
    temp.width = 240;
    temp.height = 160;
    const ctx = temp.getContext('2d');
    ctx.drawImage(canvas, 0, 0, 240, 160);
    const { data } = ctx.getImageData(0, 0, 240, 160);
    let red = 0, green = 0, blue = 0, signature = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (r - g > 45 && r - b > 45) red++;
      if (g - r > 35 && g - b > 35) green++;
      if (b - r > 40 && b - g > 20) blue++;
      signature = (Math.imul(signature, 31) + r + g * 3 + b * 7) | 0;
    }
    return { red, green, blue, signature };
  });
}

function staticRotorGlb() {
  const hullPos = new Float32Array([
    -1, 0, -0.6, 1, 0.5, 0.6, 1, 0, -0.6,
    -1, 0, -0.6, -1, 0.5, 0.6, 1, 0.5, 0.6,
  ]);
  const hullCol = new Uint8Array([
    95, 101, 112, 255, 95, 101, 112, 255, 95, 101, 112, 255,
    95, 101, 112, 255, 95, 101, 112, 255, 95, 101, 112, 255,
  ]);
  const rotorPos = new Float32Array([
    0.1, 0.55, 0.1, 1.3, 0.65, 1.1, 1.3, 0.55, 0.1,
    0.1, 0.55, 0.1, 0.1, 0.65, 1.1, 1.3, 0.65, 1.1,
  ]);
  const rotorCol = new Uint8Array([
    61, 63, 71, 255, 61, 63, 71, 255, 61, 63, 71, 255,
    61, 63, 71, 255, 61, 63, 71, 255, 61, 63, 71, 255,
  ]);
  const parts = [hullPos, hullCol, rotorPos, rotorCol];
  let byteLength = 0;
  const bufferViews = parts.map(part => {
    const view = { buffer: 0, byteOffset: byteLength, byteLength: part.byteLength };
    byteLength += part.byteLength;
    return view;
  });
  const doc = {
    asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [0, 1] }],
    nodes: [{ name: 'survey-drone', mesh: 0 }, { name: 'rotor-fr', mesh: 1 }],
    meshes: [
      { primitives: [{ attributes: { POSITION: 0, COLOR_0: 1 }, material: 0 }] },
      { primitives: [{ attributes: { POSITION: 2, COLOR_0: 3 }, material: 0 }] },
    ],
    materials: [{ name: 'Hull finish', pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1] } }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 6, type: 'VEC3', min: [-1, 0, -0.6], max: [1, 0.5, 0.6] },
      { bufferView: 1, componentType: 5121, normalized: true, count: 6, type: 'VEC4' },
      { bufferView: 2, componentType: 5126, count: 6, type: 'VEC3', min: [0.1, 0.55, 0.1], max: [1.3, 0.65, 1.1] },
      { bufferView: 3, componentType: 5121, normalized: true, count: 6, type: 'VEC4' },
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

async function originalRemix(page, project) {
  await page.locator('[data-source-filter=original]').click();
  const sourceRecipe = await page.evaluate(() => window.forgeStudio.getRecipe());
  await save(page);
  const [source] = await inventory(page);
  await page.locator('#motionSearch').fill('Swimming');
  await page.locator('[data-clip]:visible').click();
  await page.click('#clearMotionSearch');
  assert.equal(await page.locator('[data-clip]:visible').count(), 87);
  await waitFrames(page, 4);
  await page.screenshot({ path: join(project, 'output/studio/available-animations.png') });
  await startRemix(page, 'Lagoon pilot');
  assert.equal(await page.locator('#motionName').innerText(), 'Swimming');
  assert.match(await page.locator('#play').innerText(), /Pause/);
  await page.waitForFunction(() => Number(document.querySelector('#timeline').value) > .05);
  await page.getByRole('button', { name: 'Sage', exact: true }).click();
  await save(page);
  const saved = await inventory(page);
  const copy = saved.find(entry => entry.recipe.name === 'Lagoon pilot');
  assert.notEqual(copy.id, source.id);
  assert.deepEqual(saved.find(entry => entry.id === source.id).recipe, sourceRecipe);
  assert.equal(copy.recipe.primary, '#8c9e83');
  await page.reload();
  await showSaved(page);
  await openCard(page, 'Lagoon pilot');
  await page.getByRole('button', { name: 'Glacier', exact: true }).click();
  await save(page);
  const updated = await inventory(page);
  assert.equal(updated.length, 2);
  assert.equal(updated.find(entry => entry.id === copy.id).recipe.primary, '#839eae');
  assert.deepEqual(updated.find(entry => entry.id === source.id).recipe, sourceRecipe);
  const exported = await download(page);
  assert.equal(exported.doc.animations.length, 87);
  assert.ok(exported.doc.skins[0].joints.length > 0);
  return exported;
}

async function setPaint(page, color) {
  // Browser color pickers use OS chrome. Exercise the DOM control's input and commit events.
  await page.locator('#slotColor').evaluate((input, value) => {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, color);
}

async function paintedRemix(page, source, name, slot) {
  await page.selectOption('#paintSlot', slot.id);
  await setPaint(page, '#8054ba');
  await save(page);
  const savedBefore = await inventory(page);
  const sourceEntry = savedBefore.find(entry => entry.name === source);
  assert.equal(sourceEntry.edits.paint[slot.id], '#8054ba');
  await page.evaluate(id => {
    const studio = window.forgeStudio;
    const edits = studio.getImportEdits();
    studio.setImportEdits({ ...edits, paint: { ...edits.paint, [id]: '#aa5522' } });
  }, slot.id);
  await startRemix(page, name);
  await page.selectOption('#paintSlot', slot.id);
  assert.equal(await page.locator('#slotColor').inputValue(), '#aa5522', 'Remix dropped an unsaved edit');
  await setPaint(page, '#00ff00');
  assert.equal(await page.evaluate(id => window.forgeStudio.getImportEdits().paint[id], slot.id), '#00ff00');
  await page.click('#resetSlot');
  assert.equal(await page.locator('#slotColor').inputValue(), slot.color);
  assert.equal(await page.evaluate(id => window.forgeStudio.getImportEdits().paint?.[id], slot.id), undefined);
  await setPaint(page, '#ff00ff');
  await save(page);
  const saved = await inventory(page);
  const copy = saved.find(entry => entry.name === name);
  assert.equal(saved.length, savedBefore.length + 1);
  assert.notEqual(copy.id, sourceEntry.id);
  assert.deepEqual(saved.find(entry => entry.id === sourceEntry.id), sourceEntry);
  assert.deepEqual(copy.source, sourceEntry.source);
  assert.equal(copy.edits.paint[slot.id], '#ff00ff');
  await page.reload();
  await showSaved(page);
  await openCard(page, source);
  assert.equal(await page.evaluate(id => window.forgeStudio.getImportEdits().paint?.[id], slot.id), '#8054ba');
  await openCard(page, name);
  await page.selectOption('#paintSlot', slot.id);
  assert.equal(await page.locator('#slotColor').inputValue(), '#ff00ff');
  await setPaint(page, '#00ff00');
  await save(page);
  const updated = await inventory(page);
  assert.equal(updated.length, saved.length);
  assert.equal(updated.find(entry => entry.id === copy.id).edits.paint[slot.id], '#00ff00');
  assert.deepEqual(updated.find(entry => entry.id === sourceEntry.id), sourceEntry);
  return (await download(page)).doc;
}

function exportedVertexColors(bytes, doc) {
  const jsonLength = bytes.readUInt32LE(12);
  const binOffset = 20 + jsonLength + 8;
  const colors = [];
  for (const mesh of doc.meshes ?? []) {
    for (const primitive of mesh.primitives ?? []) {
      const accessorIndex = primitive.attributes?.COLOR_0;
      if (accessorIndex === undefined) continue;
      const accessor = doc.accessors[accessorIndex];
      const view = doc.bufferViews[accessor.bufferView];
      const comps = accessor.type === 'VEC4' ? 4 : 3;
      const stride = view.byteStride ?? comps * (accessor.componentType === 5126 ? 4 : accessor.componentType === 5123 ? 2 : 1);
      const start = binOffset + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
      for (let i = 0; i < accessor.count; i++) {
        const at = start + i * stride;
        const read = (c) =>
          accessor.componentType === 5126
            ? bytes.readFloatLE(at + c * 4)
            : accessor.componentType === 5123
              ? bytes.readUInt16LE(at + c * 2) / 65535
              : bytes.readUInt8(at + c) / 255;
        colors.push([read(0), read(1), read(2)]);
      }
    }
  }
  return colors;
}

async function verifyStaticRepaintAndAiDialog(page, glbName, glbBuffer, outDir, shotPrefix) {
  await page.click('#import');
  await page.locator('input[type=file]').setInputFiles({
    name: glbName, mimeType: 'model/gltf-binary', buffer: glbBuffer,
  });
  const baseName = glbName.replace(/\.glb$/i, '');
  await page.waitForFunction(expected => window.forgeStudio.getImportEdits()?.name === expected, baseName);
  assert.equal(await page.evaluate(() => window.forgeStudio.listClips().length), 0, 'Expected a static model');
  const slots = await page.evaluate(() => window.forgeStudio.listPaintSlots());
  const rotor = slots.find(slot => /rotor fr/i.test(slot.label)) ?? slots[0];
  const secondary = slots.find(slot => slot.id !== rotor.id && slot.id.startsWith('vertex-')) ?? slots.find(slot => slot.id !== rotor.id);
  assert.ok(rotor && secondary, 'Expected at least two paint slots on the static drone');

  // Let the on-demand renderer fully settle, then repaint one rotor via Properties without moving the camera.
  await settleRenderer(page);
  if (shotPrefix) await page.screenshot({ path: join(outDir, shotPrefix + '-before.png') });
  const beforeUi = await viewportColors(page);
  await page.selectOption('#paintSlot', rotor.id);
  await setPaint(page, '#ff1133');
  await waitFrames(page, 3);
  const afterUi = await viewportColors(page);
  if (shotPrefix) await page.screenshot({ path: join(outDir, shotPrefix + '-ui-repainted.png') });
  assert.notEqual(afterUi.signature, beforeUi.signature, 'Properties repaint did not redraw settled static model');
  assert.ok(afterUi.red > beforeUi.red + 15, 'Repainted rotor did not show red pixels: ' + JSON.stringify({ beforeUi, afterUi }));

  // Settle again, then repaint via the agent API without moving the camera.
  await settleRenderer(page);
  const beforeApi = await viewportColors(page);
  await page.evaluate(id => {
    const studio = window.forgeStudio;
    const edits = studio.getImportEdits();
    studio.setImportEdits({ ...edits, paint: { ...edits.paint, [id]: '#00ee44' } });
  }, rotor.id);
  await waitFrames(page, 3);
  const afterApi = await viewportColors(page);
  if (shotPrefix) await page.screenshot({ path: join(outDir, shotPrefix + '-api-repainted.png') });
  assert.notEqual(afterApi.signature, beforeApi.signature, 'Agent API repaint did not redraw settled static model');
  assert.ok(afterApi.green > beforeApi.green + 15, 'API rotor repaint did not show green pixels: ' + JSON.stringify({ beforeApi, afterApi }));

  // Save the source model, remix it, and exercise AI tools (named-region prompt + JSON edit) through the real dialog.
  await save(page);
  const sourceSnapshot = (await inventory(page)).find(entry => entry.name === baseName);
  assert.equal(sourceSnapshot.edits.paint[rotor.id], '#00ee44');
  const remixName = baseName + ' AI remix';
  await startRemix(page, remixName);

  await settleRenderer(page);
  const beforePrompt = await viewportColors(page);
  await page.click('#assistant');
  await page.locator('#promptText').waitFor({ state: 'visible' });
  await page.locator('dialog details summary').click();
  const paletteList = await page.locator('dialog details ul').innerText();
  assert.ok(paletteList.includes(rotor.label) && paletteList.includes(rotor.id), 'AI tools dialog did not list paint slots');
  await page.locator('#promptText').fill(`Paint "${rotor.label}" #ee2244`);
  await page.click('#applyPrompt');
  await page.waitForFunction(() => !document.querySelector('dialog').open);
  await waitFrames(page, 3);
  const afterPrompt = await viewportColors(page);
  assert.equal(await page.evaluate(id => window.forgeStudio.getImportEdits().paint?.[id], rotor.id), '#ee2244');
  assert.notEqual(afterPrompt.signature, beforePrompt.signature, 'Prompt repaint did not redraw settled static model');

  await page.click('#assistant');
  await page.click('#recipeTab');
  await page.locator('#recipeText').waitFor({ state: 'visible' });
  const currentJson = JSON.parse(await page.locator('#recipeText').inputValue());
  assert.equal(currentJson.paint[rotor.id], '#ee2244');
  currentJson.proportion = 1.12;
  currentJson.paint = { ...currentJson.paint, [secondary.id]: '#1166ff' };
  await page.locator('#recipeText').fill(JSON.stringify(currentJson, null, 2));
  await page.click('#applyRecipe');
  await page.waitForFunction(() => !document.querySelector('dialog').open);
  await waitFrames(page, 3);
  const editsAfterJson = await page.evaluate(() => window.forgeStudio.getImportEdits());
  assert.equal(editsAfterJson.paint[rotor.id], '#ee2244');
  assert.equal(editsAfterJson.paint[secondary.id], '#1166ff');
  assert.equal(editsAfterJson.proportion, 1.12);

  await save(page);
  await page.reload();
  await page.waitForFunction(() => window.__shotReady);
  await showSaved(page);
  await openCard(page, remixName);
  const reopenedRemix = await page.evaluate(() => window.forgeStudio.getImportEdits());
  assert.equal(reopenedRemix.paint[rotor.id], '#ee2244');
  assert.equal(reopenedRemix.paint[secondary.id], '#1166ff');
  assert.equal(reopenedRemix.proportion, 1.12);
  await page.selectOption('#paintSlot', rotor.id);
  assert.equal(await page.locator('#slotColor').inputValue(), '#ee2244');
  const exported = await download(page);
  const vertexColors = exportedVertexColors(exported.bytes, exported.doc);
  assert.ok(
    vertexColors.some(([r, g, b]) => r > 0.7 && g < 0.06 && b < 0.1),
    'Exported GLB did not bake the repainted #ee2244 vertex region into COLOR_0',
  );
  if (secondary.id.startsWith('vertex-')) {
    assert.ok(
      vertexColors.some(([r, g, b]) => b > 0.75 && r < 0.06),
      'Exported GLB did not bake the JSON-edited #1166ff vertex region into COLOR_0',
    );
  }

  await openCard(page, baseName);
  const reopenedSource = await page.evaluate(() => window.forgeStudio.getImportEdits());
  assert.deepEqual(reopenedSource, sourceSnapshot.edits, 'AI tools remix mutated the saved source model');
}

export async function verifyRemixes(browser, origin, site, project) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, acceptDownloads: true });
  try {
    await inventoryFixture(context, project);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + site + '?asset=field-pilot');
    await page.waitForFunction(() => window.__shotReady);
    const pilot = await originalRemix(page, project);

    await page.click('#import');
    await page.locator('input[type=file]').setInputFiles({
      name: 'Local pilot.glb', mimeType: 'model/gltf-binary', buffer: pilot.bytes,
    });
    await page.waitForFunction(() => window.forgeStudio.getImportEdits()?.name === 'Local pilot');
    const slots = await page.evaluate(() => window.forgeStudio.listPaintSlots());
    const primary = slots.find(slot => slot.color === '#839eae');
    assert.ok(primary, 'The imported pilot needs its authored body paint');
    const local = await paintedRemix(page, 'Local pilot', 'Green pilot', primary);
    const bodyColor = local.materials.find(material => material.name === 'Primary paint').pbrMetallicRoughness.baseColorFactor;
    assert.deepEqual(bodyColor, [0, 1, 0, 1]);
    assert.deepEqual(local.animations.map(clip => [clip.name, clip.channels.length]),
      pilot.doc.animations.map(clip => [clip.name, clip.channels.length]));
    // GLTFLoader can split the suit's primitives into meshes bound to the same skeleton.
    const joints = pilot.doc.skins[0].joints.map(index => pilot.doc.nodes[index].name);
    assert.ok(local.skins.length > 0);
    for (const skin of local.skins) {
      assert.deepEqual(skin.joints.map(index => local.nodes[index].name), joints);
    }

    await page.locator('[data-source-filter=polyfork]').click();
    await openCard(page, 'Survey Rover 01');
    const [roverSlot] = await page.evaluate(() => window.forgeStudio.listPaintSlots());
    assert.ok(roverSlot);
    const remote = await paintedRemix(page, 'Survey Rover 01', 'Green rover', roverSlot);
    assert.deepEqual(remote.materials[0].pbrMetallicRoughness.baseColorFactor, [0, 1, 0, 1]);
    const credit = remote.nodes.map(node => node.extras?.attribution).find(Boolean);
    assert.equal(credit.url, 'https://polyfork.dev/asset/survey-rover-01');
    assert.equal(credit.license, 'CC BY 4.0');
    assert.equal(credit.title, 'Survey Rover 01');

    // Deterministic static-model settled repaint (Properties + API) and AI tools dialog check.
    const outDir = join(project, 'output/studio');
    await verifyStaticRepaintAndAiDialog(page, 'Static Drone Fixture.glb', staticRotorGlb(), outDir);
    const realDrone = join(project, 'dataset/polyfork/survey-drone-7c71f9.glb');
    if (existsSync(realDrone)) {
      await verifyStaticRepaintAndAiDialog(page, 'Survey Drone.glb', await readFile(realDrone), outDir, 'survey-drone');
    }
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}
