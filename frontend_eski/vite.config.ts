import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // YENİ EKLENEN KISIM
  server: {
    headers: {
      // Bu ayar, geliştirme sunucusunun gönderdiği CSP başlığını kaldırır.
      // Bu, Editor.js gibi 'unsafe-inline' veya 'eval' kullanan kütüphanelerin
      // geliştirme sırasında çalışmasına izin verir.
      'Content-Security-Policy': "" 
    }
  }
})