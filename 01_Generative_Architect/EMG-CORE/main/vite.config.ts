import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import checker from 'vite-plugin-checker';
import viteCompression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';

  return {
    plugins: [
      react(),
      tailwindcss(),
      checker({
        typescript: true,
        eslint: {
          lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
        },
      }),
      isProduction && viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
      }),
      visualizer({
        filename: './stats.html',
        gzipSize: true,
        brotliSize: true,
      }),
    ].filter(Boolean),

    define: Object.keys(env).reduce((acc, key) => {
      if (key.startsWith('VITE_') || key.startsWith('DARLEK_') || key === 'GEMINI_API_KEY') {
        acc[`process.env.${key}`] = JSON.stringify(env[key]);
      }
      return acc;
    }, {}),

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@src': path.resolve(__dirname, './src'),
        '@core': path.resolve(__dirname, './src/core'),
        '@engine': path.resolve(__dirname, './src/engine'),
        '@components': path.resolve(__dirname, './src/components'),
        '@lib': path.resolve(__dirname, './src/lib'),
      },
    },

    build: {
      target: 'esnext',
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-ai': ['@google/generative-ai'],
          },
        },
      },
      sourcemap: !isProduction,
      chunkSizeWarningLimit: 1000,
    },

    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : [],
    },

    server: {
      port: 3000,
      strictPort: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: {
        usePolling: true,
        ignored: ['**/node_modules/**', '**/dist/**'],
      },
    },

    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
  };
});























