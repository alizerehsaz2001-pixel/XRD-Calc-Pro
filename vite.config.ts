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
        ws: false,
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
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'react-i18next',
          'i18next',
          'motion/react',
          'lucide-react',
          'recharts',
        ],
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
                if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-i18next') || id.includes('i18next')) {
                  return 'vendor-react';
                }
                if (id.includes('firebase')) {
                  return 'vendor-firebase';
                }
                if (id.includes('jspdf') || id.includes('html2canvas')) {
                  return 'vendor-pdf';
                }
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
              if (id.includes('materialDB') || id.includes('materialsHelper')) {
                return 'app-material-db';
              }
              if (id.includes('/i18n.ts') || id.includes('/i18n.')) {
                return 'app-i18n';
              }
            }
          }
        }
      }
    };
});
