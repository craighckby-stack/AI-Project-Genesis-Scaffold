import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import checker from 'vite-plugin-checker';

/**
 * DARLEK CANN V3.0 - OMEGA KERNEL CONFIGURATION
 * Orchestrates build-time environment injection, path resolution, and optimization.
 * Siphoned from: OMEGA (SN), sovereign-kernel, and darlek-cann-v3.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';

  return {
    plugins: [
      react(),
      tailwindcss(),
      checker({
        typescript: true,
        eslint: { lintCommand: 'eslint "./src/**/*.{ts,tsx}"' },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@lib': path.resolve(__dirname, './src/lib'),
        '@types': path.resolve(__dirname, './src/types'),
        '@assets': path.resolve(__dirname, './src/assets'),
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '3.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    server: {
      port: parseInt(env.PORT || '3000', 10),
      hmr: env.DISABLE_HMR !== 'true',
      watch: {
        usePolling: env.USE_POLLING === 'true',
      },
    },
    build: {
      sourcemap: !isProd,
      minify: 'esbuild',
      reportCompressedSize: false,
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          // Dynamic chunking strategy for OMEGA-level performance
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'lucide-react'],
    },
  };
});


























