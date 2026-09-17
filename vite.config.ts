import { defineConfig } from 'vite';

/**
 * Two pages are build inputs: the index at the root, which lists the model
 * registry, and the iPhone viewer it links to. The gallery at the root of the
 * vision is still to come — it arrives as its own entry and its own rollup
 * input, the same way these two did.
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
      input: { index: 'index.html', iphone: 'iphone.html' },
    },
  },
}));
