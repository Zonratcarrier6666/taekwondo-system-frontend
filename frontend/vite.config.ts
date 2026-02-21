// vite.config.js  (o .ts si usas typescript)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),           // ← este es el cambio clave
  ],
})