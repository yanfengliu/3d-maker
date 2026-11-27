import { createServer } from 'node:http';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { studioBrowser, waitFrames } from './browser.mjs';

const project = fileURLToPath(new URL('../', import.meta.url));
const site = '/3d-maker/';
const DEFAULT_VIEWS = ['Front', 'Back', 'Left', 'Right', 'Top', 'Bottom', 'Perspective'];
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

function parseArgs(argv) {
  const opts = {
    assets: [],
    glbs: [],
    variation: undefined,
    out: join(project, 'output/inspect'),
    projection: 'perspective',
    grid: false,
    width: 960,
    height: 720,
    views: DEFAULT_VIEWS,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--asset') opts.assets.push(argv[++i]);
    else if (arg === '--glb') opts.glbs.push(resolve(argv[++i]));
    else if (arg === '--variation') opts.variation = argv[++i];
    else if (arg === '--out') opts.out = resolve(argv[++i]);
    else if (arg === '--projection') opts.projection = argv[++i];
    else if (arg === '--grid') opts.grid = true;
    else if (arg === '--width') opts.width = Number(argv[++i]);
    else if (arg === '--height') opts.height = Number(argv[++i]);
    else if (arg === '--views') opts.views = argv[++i].split(',').map((v) => v.trim()).filter(Boolean);
    else if (!arg.startsWith('--')) opts.assets.push(arg);
    else throw new Error(`Unknown flag: ${arg}`);
  }
  if (!opts.assets.length && !opts.glbs.length) {
    throw new Error(
      'Usage: npm run inspect:model -- <asset-id...> [--variation <id>] [--glb <path.glb>...] [--out <dir>] [--projection perspective|orthographic] [--grid]',
    );
  }
  return opts;
}

async function measureViewportCoverage(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('#viewport canvas');
    const temp = document.createElement('canvas');
    const width = 320;
    const height = 240;
    temp.width = width;
    temp.height = height;
    const ctx = temp.getContext('2d');
    ctx.drawImage(canvas, 0, 0, width, height);
    const { data } = ctx.getImageData(0, 0, width, height);
    // Studio clear color is #e7e8e1 (231, 232, 225). Sample corner pixel to adapt if lighting changes.
    const bgR = data[0], bgG = data[1], bgB = data[2];
    let fg = 0;
    let minX = width, maxX = -1, minY = height, maxY = -1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
        const chroma = Math.max(r, g, b) - Math.min(r, g, b);
        // Ignore the #e7e8e1 backdrop and pale neutral ground cast shadow (~#cdcec8, diff ~22-35, chroma <= 12).
        if (diff <= 38 && chroma <= 14) continue;
        fg++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    const clippedEdges = [];
    if (fg > 0) {
      if (minX <= 1) clippedEdges.push('left');
      if (maxX >= width - 2) clippedEdges.push('right');
      if (minY <= 1) clippedEdges.push('top');
      if (maxY >= height - 2) clippedEdges.push('bottom');
    }
    return {
      coveragePct: Number(((fg / (width * height)) * 100).toFixed(2)),
      bounds: fg > 0
        ? {
            minX: Number((minX / width).toFixed(3)),
            maxX: Number(((maxX + 1) / width).toFixed(3)),
            minY: Number((minY / height).toFixed(3)),
            maxY: Number(((maxY + 1) / height).toFixed(3)),
          }
        : null,
      clippedEdges,
    };
  });
}

async function analyzeGlbInPage(metricsPage, glbBytes) {
  const b64 = Buffer.from(glbBytes).toString('base64');
  return metricsPage.evaluate(async (encoded) => {
    const T = await import('three');
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    const bin = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    const loader = new GLTFLoader();
    const gltf = await new Promise((resolve, reject) => loader.parse(bin.buffer, '', resolve, reject));
    const root = gltf.scene;
    root.updateMatrixWorld(true);

    const overall = new T.Box3();
    const meshBoxes = [];
    let meshes = 0;
    let vertices = 0;
    let triangles = 0;
    let nonFinite = 0;
    let doubleSidedMeshes = 0;
    const faceArea = { front: 0, back: 0, left: 0, right: 0, top: 0, bottom: 0 };

    const a = new T.Vector3();
    const b = new T.Vector3();
    const c = new T.Vector3();
    const ab = new T.Vector3();
    const ac = new T.Vector3();
    const n = new T.Vector3();

    root.traverse((node) => {
      if (!(node instanceof T.Mesh)) return;
      const geom = node.geometry;
      const pos = geom.getAttribute('position');
      if (!pos || !pos.count) return;
      meshes++;
      vertices += pos.count;
      const mats = Array.isArray(node.material) ? node.material : [node.material];
      const doubleSided = mats.some((m) => m && m.side === T.DoubleSide);
      if (doubleSided) doubleSidedMeshes++;

      const box = new T.Box3();
      const skinned = node instanceof T.SkinnedMesh;
      if (skinned) node.skeleton.update();
      const worldVerts = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        a.fromBufferAttribute(pos, i);
        if (skinned) node.applyBoneTransform(i, a);
        a.applyMatrix4(node.matrixWorld);
        if (!Number.isFinite(a.x) || !Number.isFinite(a.y) || !Number.isFinite(a.z)) {
          nonFinite++;
          continue;
        }
        worldVerts[i * 3] = a.x;
        worldVerts[i * 3 + 1] = a.y;
        worldVerts[i * 3 + 2] = a.z;
        box.expandByPoint(a);
        overall.expandByPoint(a);
      }
      if (!box.isEmpty()) meshBoxes.push({ name: node.name || `mesh-${meshes}`, box });

      const index = geom.getIndex();
      const triCount = index ? Math.floor(index.count / 3) : Math.floor(pos.count / 3);
      triangles += triCount;
      const addDir = (nx, ny, nz, area) => {
        if (nz > 0.25) faceArea.front += area * nz;
        if (nz < -0.25) faceArea.back += area * -nz;
        if (nx > 0.25) faceArea.right += area * nx;
        if (nx < -0.25) faceArea.left += area * -nx;
        if (ny > 0.25) faceArea.top += area * ny;
        if (ny < -0.25) faceArea.bottom += area * -ny;
      };
      for (let t = 0; t < triCount; t++) {
        const i0 = index ? index.getX(t * 3) : t * 3;
        const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
        const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;
        a.set(worldVerts[i0 * 3], worldVerts[i0 * 3 + 1], worldVerts[i0 * 3 + 2]);
        b.set(worldVerts[i1 * 3], worldVerts[i1 * 3 + 1], worldVerts[i1 * 3 + 2]);
        c.set(worldVerts[i2 * 3], worldVerts[i2 * 3 + 1], worldVerts[i2 * 3 + 2]);
        ab.subVectors(b, a);
        ac.subVectors(c, a);
        n.crossVectors(ab, ac);
        const len = n.length();
        if (len < 1e-10) continue;
        const area = len * 0.5;
        n.divideScalar(len);
        addDir(n.x, n.y, n.z, area);
        if (doubleSided) addDir(-n.x, -n.y, -n.z, area);
      }
    });

    const size = overall.isEmpty() ? new T.Vector3() : overall.getSize(new T.Vector3());
    const radius = Math.max(0.01, size.length() / 2);
    const eps = Math.max(0.02, radius * 0.015);
    const parent = meshBoxes.map((_, i) => i);
    const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    const boxesTouch = (b1, b2) =>
      b1.min.x - eps <= b2.max.x && b1.max.x + eps >= b2.min.x &&
      b1.min.y - eps <= b2.max.y && b1.max.y + eps >= b2.min.y &&
      b1.min.z - eps <= b2.max.z && b1.max.z + eps >= b2.min.z;
    for (let i = 0; i < meshBoxes.length; i++) {
      for (let j = i + 1; j < meshBoxes.length; j++) {
        if (boxesTouch(meshBoxes[i].box, meshBoxes[j].box)) parent[find(i)] = find(j);
      }
    }
    const groups = new Map();
    for (let i = 0; i < meshBoxes.length; i++) {
      const r = find(i);
      if (!groups.has(r)) groups.set(r, { count: 0, box: new T.Box3(), names: [] });
      const g = groups.get(r);
      g.count++;
      g.box.union(meshBoxes[i].box);
      if (g.names.length < 4) g.names.push(meshBoxes[i].name);
    }
    const sortedGroups = [...groups.values()].sort((x, y) => {
      const vx = x.box.getSize(new T.Vector3()).length();
      const vy = y.box.getSize(new T.Vector3()).length();
      return vy - vx;
    });
    const floatingComponents = sortedGroups
      .slice(1)
      .filter((g) => g.box.min.y > overall.min.y + Math.max(0.03, size.y * 0.02))
      .map((g) => ({
        meshes: g.count,
        names: g.names,
        minY: Number(g.box.min.y.toFixed(3)),
        size: g.box.getSize(new T.Vector3()).toArray().map((v) => Number(v.toFixed(3))),
      }));

    const round = (v) => Number(v.toFixed(4));
    const totalArea = Object.values(faceArea).reduce((s, v) => s + v, 0) || 1;
    return {
      meshes,
      vertices,
      triangles,
      doubleSidedMeshes,
      nonFinite,
      animations: gltf.animations.length,
      minY: overall.isEmpty() ? null : round(overall.min.y),
      size: size.toArray().map(round),
      connectedComponents: sortedGroups.length,
      floatingComponents,
      faceArea: Object.fromEntries(Object.entries(faceArea).map(([k, v]) => [k, round(v)])),
      bottomToTopRatio: faceArea.top > 1e-6 ? Number((faceArea.bottom / faceArea.top).toFixed(3)) : null,
      backToFrontRatio: faceArea.front > 1e-6 ? Number((faceArea.back / faceArea.front).toFixed(3)) : null,
      totalDirectionalArea: round(totalArea),
    };
  }, b64);
}

const opts = parseArgs(process.argv.slice(2));
await stat(join(project, 'dist/index.html'));

const server = createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/inspect-metrics') {
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
  const filePath = resolve(root, pathname.slice((dep ? '/deps/' : site).length) || 'index.html');
  if (!filePath.startsWith(root + '/')) {
    res.writeHead(404).end();
    return;
  }
  readFile(filePath)
    .then((bytes) => {
      res.setHeader('Content-Type', mime[extname(filePath)] || 'application/octet-stream');
      res.end(bytes);
    })
    .catch(() => res.writeHead(404).end());
});

await new Promise((ok, fail) => {
  server.once('error', fail);
  server.listen(0, '127.0.0.1', ok);
});
const origin = 'http://127.0.0.1:' + server.address().port;

const targets = [
  ...opts.assets.map((id) => ({
    kind: 'original',
    id,
    variation: opts.variation,
    slug: opts.variation ? `${id}--${opts.variation}` : id,
  })),
  ...opts.glbs.map((filePath) => ({
    kind: 'glb',
    filePath,
    slug: basename(filePath, extname(filePath)),
  })),
];

let browser;
try {
  browser = await studioBrowser();
  const context = await browser.newContext({ viewport: { width: opts.width, height: opts.height } });
  const metricsPage = await context.newPage();
  await metricsPage.goto(origin + '/inspect-metrics');

  const summary = [];
  for (const target of targets) {
    const outDir = join(opts.out, target.slug);
    await mkdir(outDir, { recursive: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    try {
      const gridParam = opts.grid ? '1' : '0';
      let glbBytes;
      if (target.kind === 'original') {
        const qs = new URLSearchParams({
          shot: '1',
          noui: '1',
          grid: gridParam,
          projection: opts.projection,
          asset: target.id,
        });
        if (target.variation) qs.set('variation', target.variation);
        await page.goto(`${origin}${site}?${qs.toString()}`);
        await page.waitForFunction(() => window.__shotReady, undefined, { timeout: 20_000 });
        await waitFrames(page, 4);
        const exportedB64 = await page.evaluate(async () => {
          const bytes = new Uint8Array(await window.forgeStudio.exportGLB());
          let out = '';
          for (let i = 0; i < bytes.length; i += 0x8000) out += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
          return btoa(out);
        });
        glbBytes = Buffer.from(exportedB64, 'base64');
      } else {
        glbBytes = await readFile(target.filePath);
        const qs = new URLSearchParams({ shot: '1', grid: gridParam, projection: opts.projection });
        await page.goto(`${origin}${site}?${qs.toString()}`);
        await page.waitForFunction(() => window.__shotReady, undefined, { timeout: 20_000 });
        await page.click('#import');
        await page.locator('input[type=file]').setInputFiles({
          name: basename(target.filePath),
          mimeType: 'model/gltf-binary',
          buffer: glbBytes,
        });
        await page.waitForFunction(
          () => !document.querySelector('dialog')?.open && window.forgeStudio.getRecipe() === null,
          undefined,
          { timeout: 20_000 },
        );
        await page.evaluate(() => {
          document.body.classList.add('shot-only');
          const toast = document.getElementById('toast');
          if (toast) toast.hidden = true;
        });
        await waitFrames(page, 5);
      }

      const views = {};
      for (const view of opts.views) {
        await page.evaluate((v) => {
          window.forgeStudio.setView(v);
        }, view);
        await waitFrames(page, 4);
        const fileName = `${view.toLowerCase()}.png`;
        await page.screenshot({ path: join(outDir, fileName) });
        views[view] = { file: fileName, ...(await measureViewportCoverage(page)) };
      }

      const geometry = await analyzeGlbInPage(metricsPage, glbBytes);
      const flags = [];
      if (geometry.nonFinite > 0) flags.push(`nonFinite=${geometry.nonFinite}`);
      if (geometry.minY !== null && Math.abs(geometry.minY) > 0.05) flags.push(`minY=${geometry.minY}`);
      if (geometry.floatingComponents.length > 0) flags.push(`floating=${geometry.floatingComponents.length}`);
      if (geometry.backToFrontRatio !== null && geometry.backToFrontRatio < 0.2) flags.push(`lowBackArea=${geometry.backToFrontRatio}`);
      if (geometry.bottomToTopRatio !== null && geometry.bottomToTopRatio < 0.1) flags.push(`openBottom=${geometry.bottomToTopRatio}`);
      for (const [v, info] of Object.entries(views)) {
        if (info.coveragePct < 1.5) flags.push(`${v}:lowCoverage(${info.coveragePct}%)`);
        if (info.clippedEdges.length) flags.push(`${v}:clipped(${info.clippedEdges.join(',')})`);
      }
      if (errors.length) flags.push(`errors=${errors.length}`);

      const record = {
        target,
        projection: opts.projection,
        outDir,
        geometry,
        views,
        errors,
        flags,
      };
      await writeFile(join(outDir, 'metrics.json'), JSON.stringify(record, null, 2) + '\n');
      summary.push(record);
      const sz = geometry.size.map((n) => n.toFixed(2)).join('x');
      console.log(
        `${target.slug}: ${geometry.triangles} tris, ${geometry.meshes} meshes, size=${sz}m, minY=${geometry.minY}, back/front=${geometry.backToFrontRatio}, bot/top=${geometry.bottomToTopRatio}, flags=[${flags.join('; ')}] -> ${outDir}`,
      );
    } finally {
      await page.close();
    }
  }
  await writeFile(join(opts.out, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
} finally {
  if (browser) await browser.close();
  await new Promise((ok) => server.close(ok));
}
