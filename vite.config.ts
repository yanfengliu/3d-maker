import { defineConfig } from 'vite';

/**
 * The iPhone viewer is the only page in this repo so far, so it is the whole
 * build input. There is deliberately no index.html: the gallery arrives with
 * its own entry later.
 */
export default defineConfig({
  build: {
    rollupOptions: {
      input: { iphone: 'iphone.html' },
    },
  },
});
