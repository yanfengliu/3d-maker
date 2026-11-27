import { defineConfig } from 'vite';
import { starterCatalog } from './src/data/publish.ts';

export default defineConfig(({ mode }) =>
  mode === 'sdk'
    ? {
        build: {
          emptyOutDir: false,
          lib: { entry: 'src/sdk.ts', formats: ['es'], fileName: () => 'studio-sdk.js' },
          rolldownOptions: { external: (id) => id === 'three' || id.startsWith('three/') },
          copyPublicDir: false,
        },
      }
    : {
        base: './',
        plugins: [starterCatalog()],
        build: {
          rolldownOptions: {
            output: {
              codeSplitting: {
                groups: [{ name: 'three-vendor', test: /node_modules[\\/]three[\\/](?:build|src|examples[\\/]jsm[\\/](?:controls|environments))/ }],
              },
            },
          },
        },
      },
);
