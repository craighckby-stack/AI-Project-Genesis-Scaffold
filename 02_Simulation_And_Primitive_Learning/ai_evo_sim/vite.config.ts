/**
 * @file vite.config.ts
 * @description This file configures Vite for the project, defining how the development server behaves, how modules are resolved, and which plugins are used for the build process. It is a critical component for the frontend development and build pipeline.
 *
 * @module vite.config
 * @author DARLEK CANN
 * @date 2023-10-27
 *
 * @role
 *   - Defines the core development environment settings for a React/TypeScript/Tailwind application.
 *   - Integrates essential plugins for React support and Tailwind CSS processing.
 *   - Configures module aliases for cleaner import paths.
 *   - Manages development server behavior, including Hot Module Replacement (HMR) and file watching, with specific considerations for an 'AI Studio' environment.
 *
 * @connections
 *   - **Plugins**: Directly integrates `@vitejs/plugin-react` for React Fast Refresh and `@tailwindcss/vite` for Tailwind CSS compilation.
 *   - **Module Resolution**: The `resolve.alias` configuration influences how `import` statements are resolved, working in conjunction with the `paths` configuration in `tsconfig.json`.
 *   - **Environment Variables**: Reads `process.env.DISABLE_HMR` to conditionally enable/disable HMR and file watching, crucial for specific operational contexts like agent-driven development environments.
 *   - **Project Structure**: Assumes a standard project structure, with module aliases designed to simplify imports across the application.
 *
 * @architecture_siphon
 *   - Leverages standard Vite configuration patterns, aligning with modern frontend development practices seen in `vercel/next.js` and `microsoft/TypeScript` projects.
 *   - Incorporates robust documentation principles from `microsoft/vscode` and `facebook/docusaurus` to ensure clarity and maintainability.
 *   - Adopts environment-driven configuration for development server behavior, a common pattern for adaptable build systems.
 */

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    // Vite plugins to extend functionality.
    // - `react()`: Provides React Fast Refresh and other React-specific optimizations.
    // - `tailwindcss()`: Integrates Tailwind CSS for automatic processing of utility classes.
    plugins: [react(), tailwindcss()],

    // Module resolution configuration.
    resolve: {
      // Defines aliases for import paths to simplify module imports.
      alias: {
        // The '@' alias currently points to the project root directory.
        // This allows imports like `@/components/Button` to resolve to `src/components/Button`
        // if your project structure places components directly under the root, or if your
        // tsconfig.json paths are configured to map '@/*' to `./*`.
        //
        // COMMON EVOLUTION PATH:
        // For projects following a `src/` directory structure (e.g., `src/components`, `src/utils`),
        // it is more conventional to point this alias to the `src` directory:
        // `@`: path.resolve(__dirname, './src'),
        // This would allow imports like `@/components/Button` to resolve to `src/components/Button`.
        //
        // CRITICAL: Ensure this alias configuration is consistent with the `paths` configuration
        // in your `tsconfig.json` to avoid module resolution errors in both Vite and TypeScript.
        '@': path.resolve(__dirname, '.'),
      },
    },

    // Development server configuration.
    server: {
      // Hot Module Replacement (HMR) configuration.
      // HMR is conditionally disabled in the 'AI Studio' environment via the `DISABLE_HMR` environment variable.
      // This is a deliberate design choice to prevent flickering or unexpected reloads during agent-driven edits,
      // ensuring a stable environment for AI agent operations. Do not modify without understanding the impact
      // on the AI Studio's operational stability.
      hmr: process.env.DISABLE_HMR !== 'true',

      // File watching configuration.
      // File watching is disabled when `DISABLE_HMR` is true to conserve CPU resources during intensive
      // agent editing sessions, further optimizing the 'AI Studio' environment.
      // Setting `watch: null` explicitly disables file system watching.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});



