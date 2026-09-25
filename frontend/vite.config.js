import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Auto-update the service worker in the background and take over
      // as soon as the user next navigates (see ReloadPrompt for the
      // "new version available" toast this pairs with).
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'bg.jpeg',
        'bg2.jpg',
      ],
      manifest: {
        name: 'SwasthyaSetu - AI Healthcare Assistant',
        short_name: 'SwasthyaSetu',
        description: 'AI Healthcare Assistance Platform for Rural Communities',
        theme_color: '#4a7856',
        background_color: '#f3efe4',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache the built app shell (JS/CSS/HTML/images) so the app
        // still loads with no connection.
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,webp}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Backend API calls: try the network first (data should be
            // fresh whenever possible), fall back to the last cached
            // response if the device is offline.
            urlPattern: ({ url, sameOrigin }) =>
              !sameOrigin || url.pathname.startsWith('/api'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 8,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Images: cache-first, since they rarely change.
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
      devOptions: {
        // Lets you test the service worker with `npm run dev` too.
        enabled: true,
        type: 'module',
      },
    }),
  ],
  server: {
    port: 5173,
  },
})
