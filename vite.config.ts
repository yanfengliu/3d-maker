import { defineConfig } from 'vite';

/**
 * The iPhone viewer is the only page in this repo so far, so it is the whole
 * build input. There is deliberately no index.html: the gallery arrives with
 * its own entry later.
 *
 * The base differs by command because the built pages are published as a
 * GitHub Pages project site, which serves them under /3d-maker/ — asset URLs
 * without that prefix 404 there. The dev server serves from the origin root,
 * so it keeps '/'.
 */
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/3d-maker/' : '/',
  build: {
    rollupOptions: {
      input: { iphone: 'iphone.html' },
    },
  },
}));
