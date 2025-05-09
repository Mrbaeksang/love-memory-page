// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: '혜은❤️상현',
        short_name: '혜은상현',
        description: '우리가 함께한 시간, 혜은과 상현의 추억',
        start_url: '/',
        display: 'standalone',
        background_color: '#fdf6e3',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        runtimeCaching: [{
          urlPattern: ({ url }) => url.origin === self.location.origin,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'app-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24 * 7
            }
          }
        }]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['jsmediatags'],
  },
  ssr: {
    noExternal: ['jsmediatags'],
  }
});
