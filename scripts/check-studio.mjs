import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { studioBrowser } from './browser.mjs';
import { inventoryFixture, showSaved, verifyBrowsing, verifyInitialInventory } from './check-inventory.mjs';
import { verifyClipFraming } from './check-framing.mjs';
import { verifyCapabilities } from './check-capabilities.mjs';
import { verifyRemixes } from './check-remixes.mjs';

const project = fileURLToPath(new URL('../', import.meta.url));
const out = join(project, 'output/studio');
const site = '/3d-maker/';
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};
const server = createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/sdk-check') {
    res.setHeader('Content-Type', 'text/html');
    res.end(
      '<script type="importmap">{"imports":{"three":"/deps/build/three.module.js","three/addons/":"/deps/examples/jsm/"}}</script>',
    );
    return;
  }
  const dep = pathname.startsWith('/deps/');
  if (!dep && !pathname.startsWith(site)) {
    res.writeHead(404).end();
    return;
  }
  const root = join(project, dep ? 'node_modules/three' : 'dist');
  const path = resolve(root, pathname.slice((dep ? '/deps/' : site).length) || 'index.html');
  if (!path.startsWith(root + '/')) {
    res.writeHead(404).end();
    return;
  }
  readFile(path)
    .then((bytes) => {
      res.setHeader('Content-Type', mime[extname(path)] || 'application/octet-stream');
      res.end(bytes);
    })
    .catch(() => res.writeHead(404).end());
});
await mkdir(out, { recursive: true });
await stat(join(project, 'dist/studio-sdk.js'));
await new Promise((ok, fail) => {
  server.once('error', fail);
  server.listen(0, '127.0.0.1', ok);
});
const origin = 'http://127.0.0.1:' + server.address().port;
let browser;
try {
  browser = await studioBrowser();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const fixture = await inventoryFixture(context, project);
  const page = await context.newPage();
  const failures = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('response', (response) => {
    if (response.url().startsWith(origin + site) && response.status() >= 400)
      failures.push(response.status() + ' ' + response.url());
  });
  await page.goto(origin + site + '?shot=1');
  await page.waitForFunction(() => window.__shotReady);
  await verifyInitialInventory(page);
  // Compare actual rendered pixels and check that meaningful model features are on screen.
  const pixels = () =>
    page.evaluate(() => {
      const canvas = document.querySelector('#viewport canvas'),
        temp = document.createElement('canvas');
      temp.width = 180;
      temp.height = 100;
      const ctx = temp.getContext('2d');
      ctx.drawImage(canvas, 0, 0, 180, 100);
      const { data } = ctx.getImageData(0, 0, 180, 100);
      let dark = 0,
        paint = 0,
        signature = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (Math.max(data[i], data[i + 1], data[i + 2]) < 140) dark++;
        if (data[i] - data[i + 2] > 28 && data[i] > data[i + 1]) paint++;
        signature = (Math.imul(signature, 31) + data[i] + data[i + 1] * 3 + data[i + 2] * 7) | 0;
      }
      return { dark, paint, signature };
    });
  const before = await pixels();
  assert.ok(before.dark > 200 && before.paint > 100, JSON.stringify(before));
  await page.screenshot({ path: join(out, 'desktop.png'), fullPage: true });
  const rect = await page.locator('#viewport').boundingBox();
  await page.mouse.move(rect.x + rect.width * 0.5, rect.y + rect.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(rect.x + rect.width * 0.64, rect.y + rect.height * 0.59, { steps: 9 });
  await page.mouse.up();
  await page.mouse.wheel(0, -100);
  await page.waitForTimeout(200);
  assert.notEqual((await pixels()).signature, before.signature);
  await page.screenshot({ path: join(out, 'orbit.png') });
  await page.selectOption('#view', 'Top');
  await page.waitForTimeout(120);
  assert.notEqual((await pixels()).signature, before.signature);
  assert.match(await page.locator('#play').innerText(), /Play clip/);
  assert.equal(await page.locator('#timeline').inputValue(), '0');
  for (const area of ['Properties','Animation']) {
    assert.ok(await page.getByRole('region', {name:area, exact:true}).isVisible());
  }
  await page.setViewportSize({width:1408,height:960});
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const resized = await pixels();
  assert.ok(resized.dark > 200 && resized.paint > 100, 'Resizing the workspace cleared the viewport');
  await page.setViewportSize({width:1440,height:1000});
  await verifyBrowsing(page, fixture, out);
  await page.locator('#assetName').fill('Game Pilot');
  await page.locator('#assetName').press('Tab');
  await page.getByRole('button', { name: 'Terracotta' }).click();
  await page.selectOption('#quality', 'standard');
  await page.click('#save');
  await showSaved(page);
  await page.getByRole('button', { name: 'Open Game Pilot', exact: true }).waitFor();
  await page.reload();
  await page.waitForFunction(() => window.__shotReady);
  await showSaved(page);
  await page.getByRole('button', { name: 'Open Game Pilot', exact: true }).click();
  const recipe = await page.evaluate(() => window.forgeStudio.getRecipe());
  assert.equal(recipe.name, 'Game Pilot');
  assert.equal(recipe.quality, 'standard');
  assert.equal(recipe.primary, '#cb714d');
  assert.ok(await page.locator('#assetName').isVisible());
  assert.ok(await page.locator('#motionSearch').isVisible());
  const originalClips = await page.evaluate(() => window.forgeStudio.listClips().map(clip => clip.name));
  assert.equal(originalClips.length, 87);
  const motionSearch = page.getByRole('searchbox', { name:'Search animations' });
  const showAll = page.getByRole('button', { name:'Show all 87 animations' });
  assert.equal(await motionSearch.inputValue(), '');
  assert.equal(await page.locator('[data-clip]:visible').count(), 87);
  assert.equal(await page.locator('#motionCount').innerText(), '87 clips');
  await motionSearch.fill('unmatched motion');
  assert.ok(await page.locator('#noMotionMatches').isVisible());
  assert.equal(await page.locator('#motionCount').innerText(), '0 of 87 clips');
  await motionSearch.fill('swimm');
  assert.equal(await page.locator('[data-clip]:visible').count(), 1);
  assert.equal(await page.locator('#motionCount').innerText(), '1 of 87 clips');
  await page.locator('[data-clip]:visible').click();
  assert.equal(await page.locator('#motionName').innerText(), 'Swimming');
  assert.equal(await page.locator('#motionSearch').inputValue(), 'swimm');
  await showAll.click();
  assert.equal(await motionSearch.inputValue(), '');
  assert.equal(await page.locator('[data-clip]:visible').count(), 87);
  assert.equal(await page.locator('#motionCount').innerText(), '87 clips');
  assert.ok(await showAll.isHidden());
  assert.equal(await page.locator('#motionName').innerText(), 'Swimming');
  assert.match(await page.locator('#play').innerText(), /Pause/);
  await page.waitForFunction(() => Number(document.querySelector('#timeline')?.value) > 0.03);
  await page.click('#play');
  const pausedAt = Number(await page.locator('#timeline').inputValue());
  await page.getByRole('button', { name:'Sage' }).click();
  assert.equal(await page.locator('#motionName').innerText(), 'Swimming');
  await page.waitForFunction(at => Math.abs(Number(document.querySelector('#timeline').value) - at) < 0.02, pausedAt);
  assert.match(await page.locator('#play').innerText(), /Play clip/);
  await page.click('#export');
  const pending = page.waitForEvent('download');
  await page.click('#downloadGlb');
  const download = await pending;
  const glbPath = join(out, 'pilot.glb');
  await download.saveAs(glbPath);
  const glb = await readFile(glbPath);
  assert.equal(glb.toString('ascii', 0, 4), 'glTF');
  assert.equal(glb.readUInt32LE(8), glb.length);
  const doc = JSON.parse(glb.toString('utf8', 20, 20 + glb.readUInt32LE(12)));
  assert.ok(doc.skins[0].joints.length >= 15);
  assert.deepEqual(doc.animations.map(clip => clip.name), originalClips);
  assert.ok(doc.animations.every(clip => clip.channels.length > 0));
  await page.click('#import');
  // Include a legitimate, unnamed animated node. The loader binds it by UUID.
  const channel=doc.animations[0].channels[0], anonymous=doc.nodes.push({})-1;
  doc.scenes[doc.scene??0].nodes.push(anonymous);
  doc.animations[0].channels.push({sampler:channel.sampler,target:{node:anonymous,path:channel.target.path}});
  const json=Buffer.from(JSON.stringify(doc)), padded=Buffer.alloc(Math.ceil(json.length/4)*4, 0x20);
  json.copy(padded);
  const header=Buffer.from(glb.subarray(0,20)), bin=glb.subarray(20+glb.readUInt32LE(12));
  header.writeUInt32LE(20+padded.length+bin.length,8);header.writeUInt32LE(padded.length,12);
  await page.locator('input[type=file]').setInputFiles({name:'pilot.glb',mimeType:'model/gltf-binary',buffer:Buffer.concat([header,padded,bin])});
  await page.waitForFunction(
    () => !document.querySelector('dialog').open && window.forgeStudio.getRecipe() === null,
  );
  assert.deepEqual(await page.evaluate(() => window.forgeStudio.listClips().map(clip => clip.name)), originalClips);
  await page.click('#wire');
  const roundTrip=await page.evaluate(async()=>{
    const bytes=await window.forgeStudio.exportGLB(),length=new DataView(bytes).getUint32(12,true);
    const gltf=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,length)));
    return {channels:gltf.animations.map(c=>c.channels.length), triangles:gltf.meshes.every(m=>m.primitives.every(p=>(p.mode??4)===4))};
  });
  assert.deepEqual(roundTrip.channels,doc.animations.map(clip=>clip.channels.length));
  assert.ok(roundTrip.triangles,'Wireframe preview leaked into the exported GLB');
  await page.locator('#assetName').fill('Imported pilot');
  await page.locator('#assetName').press('Tab');
  const ids = await page.evaluate(() => {
    const api=window.forgeStudio, first=api.save();
    api.setImportEdits({...api.getImportEdits(),name:'Imported pilot final', tint:'#aabbcc'});
    return Promise.all([first,api.save()]);
  });
  assert.equal(ids[0], ids[1]);
  const saved=await page.evaluate(async id=>(await window.forgeStudio.listInventory()).find(a=>a.id===id),ids[0]);
  assert.equal(saved.name,'Imported pilot final');assert.equal(saved.edits.tint,'#aabbcc');
  await page.waitForFunction(async () => (await window.forgeStudio.listInventory()).length === 2);
  await showSaved(page);
  await page.getByRole('button', { name: 'Open Imported pilot final', exact: true }).click();
  await page.waitForFunction(() => window.forgeStudio.getImportEdits()?.name === 'Imported pilot final');
  await showSaved(page);
  const stale=await page.context().newPage();await stale.goto(origin+site);await stale.waitForFunction(()=>window.__shotReady);
  await showSaved(stale);
  await stale.getByRole('button', { name: 'Open Imported pilot final', exact: true }).click();
  await stale.waitForFunction(()=>window.forgeStudio.getImportEdits()?.name==='Imported pilot final');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete Imported pilot' }).click();
  await page.waitForFunction(async () => (await window.forgeStudio.listInventory()).length === 1);
  const staleError=await stale.evaluate(async()=>{try{await window.forgeStudio.save();return '';}catch(error){return error.message;}});
  assert.match(staleError,/removed|no longer|deleted/i);await stale.close();
  const playback = await context.newPage();
  await playback.goto(origin + site + '?asset=field-pilot');
  assert.match(await playback.locator('#play').innerText(), /Pause/);
  await playback.waitForFunction(() => Number(document.querySelector('#timeline')?.value) > .03);
  await playback.keyboard.press('Space');
  assert.match(await playback.locator('#play').innerText(), /Play clip/);
  const search = playback.getByRole('searchbox', {name:'Search animations'});
  await search.fill('Zombie');
  await search.press('End');
  await search.press('Space');
  assert.equal(await search.inputValue(), 'Zombie ');
  assert.match(await playback.locator('#play').innerText(), /Play clip/);
  await playback.getByRole('searchbox', {name:'Search animations'}).fill('Zombie walk');
  await playback.locator('[data-clip]:visible').click();
  assert.match(await playback.locator('#play').innerText(), /Pause/);
  await playback.keyboard.press('Space');
  assert.match(await playback.locator('#play').innerText(), /Play clip/);
  await playback.keyboard.press('Space');
  assert.match(await playback.locator('#play').innerText(), /Pause/);
  await playback.check('#playAllClips');
  await playback.locator('#timeline').press('End');
  await playback.waitForFunction(() => document.querySelector('#motionName').textContent === 'Idle');
  // Rebuilding a character during a native clip must keep the entire playlist.
  await playback.getByRole('button', {name:'Sage'}).click();
  // A property edit must preserve the full active playlist and its viewport transport.
  await playback.waitForFunction(() => document.querySelector('#play')?.title === 'Play or pause Agree (Space)', undefined, {timeout:15000});
  await playback.close();
  const sdk = await browser.newPage();
  await sdk.goto(origin + '/sdk-check');
  const result = await sdk.evaluate(async () => {
    const { createAsset, catalog } = await import('/3d-maker/studio-sdk.js');
    const { Group, AnimationMixer } = await import('three');
    return {
      expected: catalog.length,
      rows: catalog.map((row) => {
        const group = createAsset(row.recipe);
        const mixer = new AnimationMixer(group);
        mixer.clipAction(group.animations[0]).play();
        mixer.update(0.1);
        return { id: row.id, group: group instanceof Group, clips: group.animations.length };
      }),
    };
  });
  assert.ok(result.expected >= 6 && result.rows.length === result.expected);
  assert.ok(result.rows.every((r) => r.group && r.clips > 0));
  assert.deepEqual(failures, []);
  await verifyClipFraming(browser, origin, site, out);
  await verifyCapabilities(browser, origin, site, out);
  await verifyRemixes(browser, origin, site, project);
  console.log(
    'Verified unified browsing, categories, search, pagination, catalog recovery and same-page selection alongside the editor, inventory round-trips, animation, GLB and SDK checks.',
  );
  console.log('Viewport pixel sample', before);
} finally {
  if (browser) await browser.close();
  await new Promise((ok) => server.close(ok));
}
