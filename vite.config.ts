import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  
  // GitHub Pages deployment configuration
  // Replace 'escape-topology' with your repository name if different
  base: process.env.NODE_ENV === 'production' ? '/escape-topology/' : '/',
})