import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import os from 'os';

// Função para pegar o IP local
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const LOCAL_IP = getLocalIP();

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0', // Permite acesso externo
      port: 5173,
      strictPort: false,
      // Proxy para o backend (opcional - pode usar direto)
      proxy: {
        '/api': {
          target: `http://${LOCAL_IP}:10000`,
          changeOrigin: true,
          secure: false,
        }
      },
      hmr: {
        host: LOCAL_IP,
        port: 5173,
      },
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});