import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { studioBrowser } from './browser.mjs';

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
  const page = await context.newPage();
  const failures = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('response', (response) => {
    if (response.url().startsWith(origin + site) && response.status() >= 400)
      failures.push(response.status() + ' ' + response.url());
  });
  await page.goto(origin + site + '?shot=1');
  await page.waitForFunction(
    () =>
      window.__shotReady &&
      [...document.querySelectorAll('.cardpic img')].every((img) => img.complete && img.naturalWidth > 0),
  );
  assert.equal(await page.locator('.card').count(), 6);
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
  await page.locator('#filters [data-filter=Character]').click();
  assert.equal(await page.locator('#starterCards button').count(), 2);
  await page.getByRole('button', { name: 'Open Field Pilot' }).click();
  await page.locator('#assetName').fill('Game Pilot');
  await page.locator('#assetName').press('Tab');
  await page.getByRole('button', { name: 'Terracotta' }).click();
  await page.selectOption('#quality', 'standard');
  await page.click('#save');
  await page.click('#navInventory');
  await page.getByRole('button', { name: /Game Pilot Character/ }).waitFor();
  await page.reload();
  await page.waitForFunction(() => window.__shotReady);
  await page.click('#navInventory');
  await page.getByRole('button', { name: /Game Pilot Character/ }).click();
  const recipe = await page.evaluate(() => window.forgeStudio.getRecipe());
  assert.equal(recipe.name, 'Game Pilot');
  assert.equal(recipe.quality, 'standard');
  assert.equal(recipe.primary, '#cb714d');
  await page.click('#animationTab');
  await page.locator('[data-clip]').last().click();
  await page.click('#play');
  await page.waitForFunction(() => Number(document.querySelector('#timeline')?.value) > 0.03);
  await page.click('#play');
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
  assert.ok(doc.skins[0].joints.length >= 15 && doc.animations.length >= 2);
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
  assert.ok((await page.evaluate(() => window.forgeStudio.listClips())).length >= 2);
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
  await page.click('#navInventory');
  await page.locator('.openasset').filter({ hasText: 'Imported pilot' }).click();
  await page.waitForFunction(() => window.forgeStudio.getImportEdits()?.name === 'Imported pilot final');
  await page.click('#navInventory');
  const stale=await page.context().newPage();await stale.goto(origin+site);await stale.waitForFunction(()=>window.__shotReady);
  await stale.click('#navInventory');await stale.locator('.openasset').filter({hasText:'Imported pilot'}).click();
  await stale.waitForFunction(()=>window.forgeStudio.getImportEdits()?.name==='Imported pilot final');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete Imported pilot' }).click();
  await page.waitForFunction(async () => (await window.forgeStudio.listInventory()).length === 1);
  const staleError=await stale.evaluate(async()=>{try{await window.forgeStudio.save();return '';}catch(error){return error.message;}});
  assert.match(staleError,/removed|no longer|deleted/i);await stale.close();
  const sdk = await browser.newPage();
  await sdk.goto(origin + '/sdk-check');
  const result = await sdk.evaluate(async () => {
    const { createAsset, catalog } = await import('/3d-maker/studio-sdk.js');
    const { Group, AnimationMixer } = await import('three');
    return catalog.map((row) => {
      const group = createAsset(row.recipe);
      const mixer = new AnimationMixer(group);
      mixer.clipAction(group.animations[0]).play();
      mixer.update(0.1);
      return { id: row.id, group: group instanceof Group, clips: group.animations.length };
    });
  });
  assert.equal(result.length, 6);
  assert.ok(result.every((r) => r.group && r.clips > 0));
  assert.deepEqual(failures, []);
  console.log(
    'Verified six rendered starters, orbit and preset controls, editing, inventory across reload, animation playback, GLB export/import, and the three.js SDK.',
  );
  console.log('Viewport pixel sample', before);
} finally {
  if (browser) await browser.close();
  await new Promise((ok) => server.close(ok));
}
