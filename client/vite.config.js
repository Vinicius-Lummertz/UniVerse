import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tailwindcss(), 
    react(),
    VitePWA({
      // registerType: 'autoUpdate', // Atualiza o PWA automaticamente
      workbox: {
        // Define quais ficheiros estáticos devem ser guardados em cache
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,webp}'],
        
        // --- Caching Dinâmico (A CHAVE) ---
        // Configura como guardar em cache as chamadas à API e as imagens
        runtimeCaching: [
          {
            // Estratégia "NetworkFirst" para a nossa API Django
            // Tenta a rede; se falhar (offline), usa o cache.
            // Perfeito para feeds sociais.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,      // Guardar até 100 pedidos
                maxAgeSeconds: 60 * 60 * 24 // 1 dia
              },
              cacheableResponse: {
                statuses: [0, 200], // Guarda respostas OK
              },
            },
          },
          {
            // Estratégia "CacheFirst" para as imagens de media (uploads)
            // Se a imagem estiver em cache, usa-a imediatamente.
            // Perfeito para fotos de perfil e posts.
            urlPattern: ({ url }) => url.pathname.startsWith('/media/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'media-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 dias
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          }
        ]
      },
      
      // 3. Configurar o "manifest.json"
      // Isto define o nome, ícones e cores da aplicação
      manifest: {
        name: 'UniVerse',
        short_name: 'UniVerse',
        description: 'A rede social universitária UniVerse.',
        theme_color: '#3b82f6', // Cor principal (azul)
        background_color: '#ffffff', // Cor de fundo do splash screen
        display: 'standalone', // Abre como uma app nativa
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/icons/icon1.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon2.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  publicDir: 'public'

});