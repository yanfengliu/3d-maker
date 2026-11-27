import { defineConfig } from 'vite';
import { starterCatalog } from './src/data/publish';

export default defineConfig(({ mode }) => mode === 'sdk' ? {
  build: {
    emptyOutDir: false,
    lib: { entry: 'src/sdk.ts', formats: ['es'], fileName: () => 'studio-sdk.js' },
    rolldownOptions: { external: id => id === 'three' || id.startsWith('three/') },
    copyPublicDir: false,
  },
} : {
  base: './',
  plugins: [starterCatalog()],
});
