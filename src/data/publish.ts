import type { Plugin } from 'vite';
import { catalog } from './recipe';

/** Publish the in-app catalog for CLI and agent discovery at the same URL in dev and production. */
export function starterCatalog(): Plugin {
  const filename = 'catalog.json';
  const source = JSON.stringify(catalog, null, 2) + '\n';
  return {
    name: 'form-foundry-starter-catalog',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url?.split('?')[0] !== '/' + filename || (request.method !== 'GET' && request.method !== 'HEAD')) {
          next();
          return;
        }
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.end(source);
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: filename, source });
    },
  };
}
