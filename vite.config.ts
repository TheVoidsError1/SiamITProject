import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: true, // Allow all hosts for ngrok
    port: parseInt(process.env.VITE_DEV_SERVER_PORT || '8081'),
    host: process.env.VITE_DEV_SERVER_HOST || 'localhost',
    open: true,
<<<<<<< HEAD
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "tasty-sites-fly.loca.lt",
      "easy-buckets-pull.loca.lt",
      "*.loca.lt"
    ],
=======
    hmr: {
      overlay: false, // Disable error overlay to prevent HMR issues
    },
>>>>>>> 0795594fdc88dd54d5eee95988ff2250c7f2ffac
    proxy: {
      "/api": {
        target: process.env.VITE_API_BASE_URL || "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-i18next', 'i18next'],
  },
});
