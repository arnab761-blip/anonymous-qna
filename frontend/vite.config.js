import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:5000',
      '/questions': 'http://localhost:5000',
      '/like': 'http://localhost:5000',
      '/upload': 'http://localhost:5000',
      '/reports': 'http://localhost:5000',
      '/admin': 'http://localhost:5000'
    }
  }
});
