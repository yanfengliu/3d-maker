import { existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

export async function studioBrowser() {
  const executablePath = process.env.SHOT_CHROME || [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    chromium.executablePath(),
  ].find(path => existsSync(path));
  if (!executablePath) throw new Error('Set SHOT_CHROME to Chrome or run npx playwright-core install chromium.');
  return chromium.launch({ executablePath, headless:true, args:['--enable-webgl', '--ignore-gpu-blocklist'] });
}
