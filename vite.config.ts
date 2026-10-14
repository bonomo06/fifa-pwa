import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // caminhos relativos: o build funciona em qualquer subpasta (GitHub Pages, Netlify, etc.)
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'FC 27 Carreira',
        short_name: 'FC27 Carreira',
        description: 'Scouting, elenco, escalação e transferências para o modo carreira do EA SPORTS FC 27.',
        lang: 'pt-BR',
        theme_color: '#0b121c',
        background_color: '#0b121c',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,json}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        runtimeCaching: [
          {
            // fotos dos jogadores, escudos, bandeiras e ícones de PlayStyle da EA
            urlPattern: /^https:\/\/(ratings-images-prod\.pulse\.ea\.com|drop-assets\.ea\.com)\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ea-images',
              expiration: { maxEntries: 3000, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
