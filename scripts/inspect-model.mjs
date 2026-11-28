import { createServer } from 'node:http';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { studioBrowser, waitFrames } from './browser.mjs';
import { inspectGlb } from './inspect-glb.mjs';

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
        views[view] = { file: fileName, ...(await page.evaluate(() => window.forgeStudio.measureViewCoverage())) };
      }

      const analyzed = await metricsPage.evaluate(inspectGlb, Buffer.from(glbBytes).toString('base64'));
      const geometry = analyzed.metrics;
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
      await writeFile(join(outDir, 'trace.json'), JSON.stringify(analyzed.trace, null, 2) + '\n');
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
