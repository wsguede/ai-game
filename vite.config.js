import { defineConfig } from 'vite';

export default defineConfig({
  base: '/ai-game/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
});
