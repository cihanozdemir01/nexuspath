import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // Bu ayar, Editor.js'in ve diğer kütüphanelerin çalışmasını engelleyen
      // Content Security Policy (CSP) başlığını geliştirme sunucusundan kaldırır.
      'Content-Security-Policy': "" 
    }
  }
})