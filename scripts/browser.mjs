import { existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

export async function studioBrowser() {
  const executablePath =
    process.env.SHOT_CHROME ||
    [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
      chromium.executablePath(),
    ].find((path) => existsSync(path));
  if (!executablePath)
    throw new Error('Set SHOT_CHROME to Chrome or run npx playwright-core install chromium.');
  const args = ['--enable-webgl', '--ignore-gpu-blocklist'];
  if (process.platform === 'linux') args.push('--enable-unsafe-swiftshader');
  return chromium.launch({
    executablePath,
    headless: true,
    args,
  });
}

export async function waitFrames(page, count = 4, timeoutMs = 10_000) {
  await page.evaluate(
    ({ n, ms }) =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`waitFrames(${n}) timed out after ${ms}ms`)), ms);
        const step = (left) => {
          if (left <= 0) {
            clearTimeout(timer);
            resolve();
          } else {
            requestAnimationFrame(() => step(left - 1));
          }
        };
        step(n);
      }),
    { n: count, ms: timeoutMs },
  );
}
