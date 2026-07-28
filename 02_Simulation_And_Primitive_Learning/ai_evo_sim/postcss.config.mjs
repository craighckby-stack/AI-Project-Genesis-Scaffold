/**
 * @file postcss.config.mjs
 * @description System-Integrity PostCSS Manifest for the Darlek Cann v3 ecosystem.
 * This file acts as the primary CSS transformation engine, orchestrating style
 * compilation, vendor prefixing, and production minification.
 * 
 * Role: Integrates with Tailwind CSS and the Agent Orchestra build pipeline.
 * Context: Part of the Darlek Cann v3.0 build orchestration layer.
 */

const config = {
  plugins: {
    // Resolve @import rules to support modular CSS architecture
    'postcss-import': {},
    
    // Enable nested CSS syntax for component-level styling
    'tailwindcss/nesting': {},
    
    // Tailwind CSS engine integration
    tailwindcss: {},
    
    // Automatic vendor prefixing for cross-browser compatibility
    autoprefixer: {},

    // Production-grade minification for optimized delivery
    ...(process.env.NODE_ENV === 'production' 
      ? { 
          cssnano: { 
            preset: ['default', { discardComments: { removeAll: true } }] 
          } 
        } 
      : {}
    ),
  },
};

export default config;





