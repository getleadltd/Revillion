import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { imagetools } from 'vite-imagetools';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    imagetools({
      defaultDirectives: (url) => {
        if (url.searchParams.has('partner')) {
          return new URLSearchParams({
            format: 'webp',
            quality: '85',
            w: '150'
          });
        }
        return new URLSearchParams();
      }
    }),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-scroll-area', 'lucide-react'],
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        experimentalMinChunkSize: 10000,
      },
    },
    cssCodeSplit: true,
    cssMinify: true,
    minify: 'esbuild',
    chunkSizeWarningLimit: 500,
  },
}));
