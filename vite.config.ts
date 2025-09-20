import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
 // publicDir: 'public',
  plugins: [
    react(), 
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/pan-pages': 'http://localhost:9876/',
      '/api': 'http://localhost:9876/',
      '/admin-api': 'http://localhost:9876/'
    }
  },
})
