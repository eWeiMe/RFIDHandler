import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'devtools',
  build: {
    outDir: resolve(__dirname, '../dist-devtools'),
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  }
}); 