import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        hmr: false,
        strictPort: true,
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || process.env.API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || process.env.API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        target: 'esnext',
        sourcemap: false,
        reportCompressedSize: false,
        chunkSizeWarningLimit: 2000,
        minify: 'esbuild',
        cssMinify: true,
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('katex') || id.includes('rehype-katex') || id.includes('remark-math')) {
                  return 'vendor-katex';
                }
                if (id.includes('recharts') || id.includes('d3')) {
                  return 'vendor-charts';
                }
                if (id.includes('lucide-react')) {
                  return 'vendor-icons';
                }
                if (id.includes('motion') || id.includes('framer-motion')) {
                  return 'vendor-motion';
                }
                return 'vendor';
              }
            }
          }
        }
      }
    };
});
