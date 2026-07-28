import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const __root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = mode === 'development';
  const serverPort = Number(env.VITE_PORT) || 5173;

  return {
    resolve: {
      alias: {
        '@': resolve(__root, 'src'),
      },
    },
    plugins: [
      react({
        babel: {
          plugins: ['babel-plugin-macros'],
        },
      }),
      tailwind(),
      wasm(),
      topLevelAwait(),
    ],
    server: {
      port: serverPort,
      host: true,
      strictPort: true,
      cors: true,
      hmr: env.VITE_HMR_DISABLE !== 'true' && {
        overlay: { errors: true, warnings: false },
        clientPort: serverPort,
      },
      watch: {
        usePolling: true,
        interval: 100,
        ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/coverage/**'],
      },
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
      cssMinify: true,
      cssCodeSplit: true,
      sourcemap: isDev,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'vendor-react';
              if (id.includes('brotli-wasm')) return 'vendor-wasm';
              return 'vendor-libs';
            }
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },
    },
    envPrefix: ['VITE_', 'GEMINI_'],
    optimizeDeps: {
      exclude: ['brotli-wasm'],
      include: ['react', 'react-dom', 'react/jsx-runtime'],
      esbuildOptions: {
        target: 'esnext',
        supported: {
          'top-level-await': true,
        },
      },
    },
    worker: {
      format: 'es',
      plugins: () => [wasm(), topLevelAwait()],
    },
  };
});