import assert from 'node:assert/strict';
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

async function originalRemix(page, project) {
  await page.locator('[data-source-filter=original]').click();
  const sourceRecipe = await page.evaluate(() => window.forgeStudio.getRecipe());
  await save(page);
  const [source] = await inventory(page);
  await page.locator('#motionSearch').fill('Swimming');
  await page.locator('[data-clip]:visible').click();
  await page.click('#clearMotionSearch');
  assert.equal(await page.locator('[data-clip]:visible').count(), 87);
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
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}
