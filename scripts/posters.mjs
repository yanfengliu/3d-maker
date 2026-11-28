import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { studioBrowser } from './browser.mjs';

const onlyMissing = process.argv.includes('--only-missing');
await mkdir('public/previews', { recursive: true });

const skipIds = [];
if (onlyMissing) {
  for (const name of await readdir('public/previews')) {
    if (!name.endsWith('.webp')) continue;
    const info = await stat('public/previews/' + name);
    if (info.size >= 1000) skipIds.push(name.slice(0, -'.webp'.length));
  }
}

const browser = await studioBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  page.on('pageerror', (error) => console.error(error.message));
  await page.goto(process.env.SHOT_BASE || 'http://127.0.0.1:5199/');
  const rows = await page.evaluate(
    async (skip) => (await import('./src/studio/thumbnails.ts')).starterPosters(skip.length ? skip : undefined),
    skipIds,
  );
  for (const { id, image } of rows) {
    const bytes = Buffer.from(image.split(',')[1], 'base64');
    if (bytes.byteLength < 1000) throw new Error('Empty poster: ' + id);
    await writeFile('public/previews/' + id + '.webp', bytes);
    console.log(id, bytes.byteLength);
  }
  if (onlyMissing) {
    console.log(`Posters complete (--only-missing): rendered ${rows.length}, skipped ${skipIds.length} existing.`);
  }
} finally {
  await browser.close();
}
