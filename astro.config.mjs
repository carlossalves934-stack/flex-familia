import { defineConfig } from 'astro/config';

export default defineConfig({
  vite: {
    build: {
      rollupOptions: {
        output: {
          // O teste e2e bloqueia qualquer URL com "youtube"; o chunk do player não pode ter esse nome.
          manualChunks: id => (id.includes('/lib/youtube') ? 'player' : undefined),
        },
      },
    },
  },
});
