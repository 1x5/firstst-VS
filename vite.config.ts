import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { githubPages404 } from './vite-plugin-github-pages-404'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    githubPages404(), // Automatically creates 404.html for GitHub Pages SPA routing
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    host: true, // Доступ с телефона через WiFi
  },
})

