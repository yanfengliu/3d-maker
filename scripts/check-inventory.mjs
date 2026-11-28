import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const origin = 'https://polyfork.dev';
const fixtures = [
  ['vehicle', 'Survey Rover', 'field-rover'],
  ['character', 'Field Operator', 'field-pilot'],
  ['prop', 'Field Case', 'cargo-pod'],
  ['building', 'Relay Station', 'signal-tower'],
  ['animal', 'Scout Hound', 'survey-bot'],
  ['terrain', 'Survey Ridge', 'cargo-pod'],
  ['ultra', 'Hand Scanner', 'field-rover'],
  ['attachment', 'Hip Holster', 'cargo-pod'],
  ['hand', 'Utility Hand', 'survey-bot'],
];
const rows = Array.from({ length: 27 }, (_, i) => {
  const [category, name, poster] = fixtures[i % fixtures.length];
  const suffix = String(Math.floor(i / fixtures.length) + 1).padStart(2, '0');
  const id = name.toLowerCase().replaceAll(' ', '-') + '-' + suffix;
  return {
    id, title: name + ' ' + suffix, class: category, free: true, triangles: 1242, poster,
    has_rig: category === 'character', remixable: true,
    page: origin + '/asset/' + id, thumbnail: origin + '/files/' + id + '/renders/hero.png',
    download: { glb: origin + '/cdn/' + id + '.glb' },
  };
});

function meshFixture() {
  const positions = new Float32Array([-1, 0, 0, 1, 0, 0, 0, 1, 0.3]);
  const binary = Buffer.from(positions.buffer);
  const json = Buffer.from(JSON.stringify({
    asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [-1, 0, 0], max: [1, 1, 0.3] }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: binary.length, target: 34962 }],
    buffers: [{ byteLength: binary.length }],
  }));
  const padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20);
  json.copy(padded);
  const prefix = Buffer.alloc(20);
  prefix.write('glTF'); prefix.writeUInt32LE(2, 4);
  prefix.writeUInt32LE(28 + padded.length + binary.length, 8);
  prefix.writeUInt32LE(padded.length, 12); prefix.write('JSON', 16);
  const chunk = Buffer.alloc(8);
  chunk.writeUInt32LE(binary.length); chunk.write('BIN\0', 4);
  return Buffer.concat([prefix, padded, chunk, binary]);
}

// Exercise the actual HTTP adapter and browser image paths on a stable catalog.
// All intercepted metadata is synthetic. GLBs are fetched only after a card is selected.
export async function inventoryFixture(context, project) {
  const glb = meshFixture();
  const downloads = [];
  let failStatus = 0;
  let glbFailStatus = 0;
  await context.route(origin + '/**', async route => {
    const url = new URL(route.request().url());
    const headers = { 'access-control-allow-origin': '*' };
    if (url.pathname === '/api/assets') {
      const query = (url.searchParams.get('q') ?? '').toLowerCase();
      const category = url.searchParams.get('class');
      const results = rows.filter(row =>
        (!category || row.class === category) && row.title.toLowerCase().includes(query)
      );
      if (failStatus) {
        const status = failStatus;
        failStatus = 0;
        await route.fulfill({ status, headers, body: status === 429 ? 'Rate limited' : 'Unavailable' });
        return;
      }
      const perPage = Number(url.searchParams.get('per_page'));
      const page = Number(url.searchParams.get('page'));
      await route.fulfill({ headers, json: {
        page, per_page: perPage, total: results.length,
        assets: results.slice((page - 1) * perPage, page * perPage),
      } });
      return;
    }
    const image = rows.find(row => row.thumbnail === url.origin + url.pathname);
    if (image) {
      await route.fulfill({ headers, contentType: 'image/webp', body: await readFile(join(project, 'public/previews', image.poster + '.webp')) });
      return;
    }
    const mesh = rows.find(row => row.download.glb === url.origin + url.pathname);
    if (mesh) {
      if (glbFailStatus) {
        const status = glbFailStatus;
        glbFailStatus = 0;
        await route.fulfill({ status, headers, body: 'Retry later' });
        return;
      }
      downloads.push(mesh.id);
      await route.fulfill({ headers, contentType: 'model/gltf-binary', body: glb });
      return;
    }
    await route.fulfill({ status: 404, headers });
  });
  return {
    downloads,
    failNext: (status = 503) => { failStatus = status; },
    failNextGlb: (status = 429) => { glbFailStatus = status; },
  };
}

const grid = '#assetGrid .inv-card';
const PAGE_SIZE = 36;
const open = (page, title) => page.getByRole('button', { name: 'Open ' + title, exact: true });
const source = (page, value) => page.locator('[data-source-filter="' + value + '"]');
const category = (page, value) => page.locator('[data-category="' + value + '"]');

async function waitGrid(page, expected) {
  await page.waitForFunction(({ selector, length }) => document.querySelectorAll(selector).length === length,
    { selector: grid, length: expected });
}

async function visibleWorkspace(page) {
  for (const selector of ['#inventoryPanel', '#viewport', '.inspector']) {
    await page.locator(selector).waitFor({ state: 'visible' });
  }
}

export async function verifyInitialInventory(page) {
  await visibleWorkspace(page);
  const originalCount = await page.evaluate(() => window.forgeStudio.listTemplates().length);
  const totalAssets = originalCount + rows.length;
  const firstPageOriginals = Math.min(PAGE_SIZE, originalCount);
  const firstPageRemote = PAGE_SIZE - firstPageOriginals;
  await page.waitForFunction(
    expected => new RegExp('\\b' + expected + '\\b').test(document.querySelector('#inventoryTotal')?.textContent ?? ''),
    String(totalAssets),
  );
  if (firstPageRemote > 0) await open(page, 'Survey Rover 01').waitFor();
  await waitGrid(page, PAGE_SIZE);
  assert.equal(await page.locator('#inventoryPageSize').inputValue(), String(PAGE_SIZE));
  assert.equal(await page.locator(grid + '[data-source=original]').count(), firstPageOriginals);
  assert.equal(await page.locator(grid + '[data-source=polyfork]').count(), firstPageRemote);
  assert.match(await page.locator('#inventoryTotal').textContent(), new RegExp('\\b' + totalAssets + '\\b'));
  await page.waitForFunction(expected => {
    const posters = [...document.querySelectorAll('#assetGrid [data-source="original"] img')];
    return posters.length === expected && posters.every(img => img.complete && img.naturalWidth > 0);
  }, firstPageOriginals);
}

export async function showSaved(page) {
  await source(page, 'saved').click();
  await category(page, 'all').click();
  await page.locator('#inventorySearch').fill('');
}

async function deleteDuringOpen(page) {
  // Reload onto Field Pilot so the session GLB cache is cold and opening the saved PolyFork entry hits network fetch.
  const returnUrl = page.url();
  await page.goto(returnUrl + (returnUrl.includes('?') ? '&' : '?') + 'asset=field-pilot');
  await page.waitForFunction(() => window.__shotReady && window.forgeStudio.getRecipe()?.template === 'field-pilot');
  await showSaved(page);
  const title = 'Survey Rover 02', url = origin + '/cdn/survey-rover-02.glb';
  // Hold an already received GLB before the importer gets it, as can happen with slow parsing.
  await page.evaluate(target => {
    const nativeFetch = window.fetch;
    window.fetch = async (input, init) => {
      const response = await nativeFetch(input, init);
      if (String(input) !== target) return response;
      window.fetch = nativeFetch;
      const bytes = await response.arrayBuffer();
      await new Promise(release => { window.pendingInventoryDownload = { release, signal: init.signal }; });
      return new Response(bytes, { headers: response.headers });
    };
  }, url);
  await open(page, title).click();
  await page.waitForFunction(() => !!window.pendingInventoryDownload);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Delete ' + title, exact: true }).click();
  await open(page, title).waitFor({ state: 'detached' });
  const canceled = await page.evaluate(() => {
    const { signal, release } = window.pendingInventoryDownload;
    delete window.pendingInventoryDownload;
    release();
    return signal.aborted;
  });
  assert.ok(canceled, 'Deleting a loading entry must cancel its open');
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await page.evaluate(() => window.forgeStudio.getRecipe()?.template), 'field-pilot');
}

export async function verifyBrowsing(page, fixture, out) {
  const priorUrl = page.url();
  assert.deepEqual(fixture.downloads, []);
  for (const value of ['character','vehicle','prop','building','animal','terrain','ultra','attachment','hand']) {
    assert.ok(await category(page, value).isVisible(), 'Missing visible category ' + value);
  }

  // Exercise every paginated page across originals and remote hits, including the original/remote boundary.
  const templates = await page.evaluate(() => window.forgeStudio.listTemplates());
  const originalCount = templates.length;
  const totalAssets = originalCount + rows.length;
  const totalPages = Math.ceil(totalAssets / PAGE_SIZE);
  const firstTitleOnPage = p => {
    const idx = (p - 1) * PAGE_SIZE;
    return idx < originalCount ? templates[idx].recipe.name : rows[idx - originalCount].title;
  };
  const names = new Set();
  for (let p = 1; p <= totalPages; p++) {
    const start = (p - 1) * PAGE_SIZE;
    await open(page, firstTitleOnPage(p)).waitFor();
    if (start < originalCount && start + PAGE_SIZE > originalCount) await open(page, rows[0].title).waitFor();
    const expectedCount = Math.min(PAGE_SIZE, totalAssets - start);
    await waitGrid(page, expectedCount);
    const labels = await page.locator(grid).evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-label')));
    assert.equal(labels.length, expectedCount);
    for (const label of labels) {
      assert.ok(!names.has(label), 'Duplicate paginated card ' + label);
      names.add(label);
    }
    if (p !== totalPages) await page.locator('#inventoryNext').click();
  }
  assert.equal(names.size, totalAssets);
  assert.ok(await page.locator('#inventoryNext').isDisabled());
  // Switching models-per-page live updates grid density and total page count, then restores 24/page.
  await page.selectOption('#inventoryPageSize', '48');
  await waitGrid(page, Math.min(48, totalAssets));
  assert.equal(await page.locator('#pageLimit').textContent(), 'of ' + Math.ceil(totalAssets / 48).toLocaleString());
  await page.selectOption('#inventoryPageSize', String(PAGE_SIZE));
  await waitGrid(page, PAGE_SIZE);
  await page.locator('#inventoryPageNumber').fill(String(totalPages));
  await page.locator('#inventoryPageNumber').press('Enter');
  await open(page, firstTitleOnPage(totalPages)).waitFor();
  // An expired catalog count can temporarily leave only local pages available; Retry restores the requested page.
  const prevPage = totalPages - 1;
  await page.clock.setFixedTime(new Date(Date.now() + 180_000));
  fixture.failNext();
  await page.locator('#inventoryPrev').click();
  await page.locator('#inventoryRetry').waitFor();
  await page.locator('#inventoryRetry').click();
  await open(page, firstTitleOnPage(prevPage)).waitFor();
  assert.equal(await page.locator('#inventoryPageNumber').inputValue(), String(prevPage));
  await page.locator('#inventoryNext').click();
  await open(page, firstTitleOnPage(totalPages)).waitFor();
  await page.locator('#inventoryPageNumber').fill(String(prevPage));
  await page.locator('#inventoryPageNumber').press('Enter');
  await open(page, firstTitleOnPage(prevPage)).waitFor();
  await page.locator('#inventoryPrev').click();
  await open(page, firstTitleOnPage(prevPage - 1)).waitFor();
  if (prevPage - 1 > 1) {
    await page.locator('#inventoryPageNumber').fill('1');
    await page.locator('#inventoryPageNumber').press('Enter');
  }
  await open(page, 'Relay Drone').waitFor();

  await source(page, 'polyfork').click();
  await category(page, 'vehicle').click();
  await page.locator('#inventorySearch').fill('Survey');
  await open(page, 'Survey Rover 03').waitFor();
  await waitGrid(page, 3);
  await open(page, 'Survey Rover 02').click();
  await page.waitForFunction(() => window.forgeStudio.getImportEdits()?.name === 'Survey Rover 02');
  assert.equal((await page.locator('#inventorySearch').inputValue()), 'Survey');
  assert.deepEqual(fixture.downloads, ['survey-rover-02']);
  assert.equal(await page.locator('#assetSource').getAttribute('href'), 'https://polyfork.dev/asset/survey-rover-02');
  assert.ok(await page.locator('#assetSource').isVisible());
  assert.equal(page.url(), priorUrl);
  await visibleWorkspace(page);
  assert.equal(await page.locator('dialog[open]').count(), 0);
  await page.locator('#save').click();
  await page.waitForFunction(() => document.querySelector('#save').textContent.includes('Save changes'));

  // Draw the category view with a known original character after checking the remote import path.
  const origChars = templates.filter(row => row.category === 'Character').length;
  const totalChars = origChars + 3;
  await page.locator('#inventorySearch').fill('');
  await source(page, 'all').click();
  await category(page, 'character').click();
  await open(page, 'Field Pilot').click();
  await page.waitForFunction(() => window.forgeStudio.getRecipe()?.template === 'field-pilot');
  assert.ok(await page.locator('#assetSource').isHidden());
  await page.waitForFunction(
    expected => new RegExp('\\b' + expected + '\\b').test(document.querySelector('#inventoryTotal')?.textContent ?? ''),
    String(totalChars),
  );
  if (totalChars <= PAGE_SIZE) await open(page, 'Field Operator 03').waitFor();
  await waitGrid(page, Math.min(PAGE_SIZE, totalChars));
  await page.screenshot({ path: join(out, 'inventory-category.png') });

  // A failed remote search leaves the current model intact and the page can recover in place.
  const fieldOrigChars = templates.filter(row => row.category === 'Character' && row.recipe.name.toLowerCase().includes('field')).length;
  fixture.failNext();
  await page.locator('#inventorySearch').fill('Field');
  await page.locator('#inventoryRetry').waitFor();
  await open(page, 'Field Pilot').waitFor();
  assert.equal(await page.evaluate(() => window.forgeStudio.getRecipe()?.template), 'field-pilot');
  await page.locator('#inventoryRetry').click();
  await open(page, 'Field Operator 03').waitFor();
  await waitGrid(page, Math.min(PAGE_SIZE, fieldOrigChars + 3));

  await deleteDuringOpen(page);

  // A 429 without CORS-exposed Retry-After must recover automatically (and on Retry) instead of locking out Buildings for 60s.
  await page.locator('#inventorySearch').fill('');
  await source(page, 'all').click();
  fixture.failNext(429);
  await category(page, 'building').click();
  await page.locator('#inventoryNotice').waitFor({ state: 'visible' });
  await open(page, 'Signal Tower').waitFor();
  assert.match(await page.locator('#inventoryNoticeText').textContent(), /limiting catalog requests/i);
  const localBuildingText = await page.locator('#inventoryTotal').textContent();
  const origBuildings = Number((localBuildingText ?? '').replaceAll(',', '').match(/\d+/)?.[0] ?? 1);
  const totalBuildings = origBuildings + 3;
  await page.locator('#inventoryNotice').waitFor({ state: 'hidden', timeout: 6000 });
  await page.waitForFunction(
    expected => new RegExp('\\b' + expected + '\\b').test(document.querySelector('#inventoryTotal')?.textContent ?? ''),
    String(totalBuildings),
  );
  if (totalBuildings > PAGE_SIZE) {
    await page.locator('#inventoryPageNumber').fill(String(Math.ceil(totalBuildings / PAGE_SIZE)));
    await page.locator('#inventoryPageNumber').press('Enter');
  }
  await open(page, 'Relay Station 01').waitFor({ timeout: 6000 });
  await waitGrid(page, totalBuildings > PAGE_SIZE ? totalBuildings - Math.floor((totalBuildings - 1) / PAGE_SIZE) * PAGE_SIZE : totalBuildings);
  assert.ok(await page.locator('#inventoryNotice').isHidden());
  // Opening a PolyFork GLB recovers automatically from a transient 429 download error.
  fixture.failNextGlb(429);
  await open(page, 'Relay Station 01').click();
  await page.waitForFunction(() => window.forgeStudio.getImportEdits()?.name === 'Relay Station 01', undefined, { timeout: 6000 });

  await page.locator('#inventorySearch').fill('');
  await source(page, 'original').click();
  await category(page, 'character').click();
  await waitGrid(page, Math.min(PAGE_SIZE, origChars));
  // Combined source + category filters must show matching/total badge, combined heading, active chips, and one-click clear.
  assert.equal(await source(page, 'original').getAttribute('aria-pressed'), 'true');
  assert.equal(await category(page, 'character').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('[data-source-filter="original"] small').textContent(), `${origChars}/${originalCount}`);
  assert.equal(await page.locator('#listingTitle').textContent(), 'Originals · Characters');
  await page.locator('#activeFilters').waitFor({ state: 'visible' });
  assert.match(await page.locator('#activeFilters [data-clear-filter="source"]').textContent(), /Source: Originals/);
  assert.match(await page.locator('#activeFilters [data-clear-filter="category"]').textContent(), /Category: Characters/);
  await page.locator('#activeFilters [data-clear-filter="all"]').waitFor({ state: 'visible' });
  await page.waitForFunction(expected => {
    const imgs = [...document.querySelectorAll('#assetGrid [data-source="original"] img')];
    return imgs.length === expected && imgs.every(img => img.complete && img.naturalWidth > 0);
  }, Math.min(PAGE_SIZE, origChars));
  await page.clock.fastForward(200);
  await page.screenshot({ path: join(out, 'filter-toggles-combined.png') });
  // Removing the category filter chip restores all Originals and resets the sidebar count back to the full total.
  await page.locator('#activeFilters [data-clear-filter="category"]').click();
  await page.waitForFunction(
    expected => new RegExp('\\b' + expected + '\\b').test(document.querySelector('#inventoryTotal')?.textContent ?? ''),
    String(originalCount),
  );
  assert.equal(await page.locator('#listingTitle').textContent(), 'Originals');
  assert.equal(await page.locator('[data-source-filter="original"] small').textContent(), String(originalCount));
  await page.clock.fastForward(200);
  await page.screenshot({ path: join(out, 'filter-toggles-originals.png') });
  await category(page, 'character').click();
  await waitGrid(page, Math.min(PAGE_SIZE, origChars));
  await open(page, 'Field Pilot').click();
}
