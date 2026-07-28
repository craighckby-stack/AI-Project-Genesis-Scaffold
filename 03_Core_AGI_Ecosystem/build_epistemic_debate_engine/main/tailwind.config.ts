/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Extend Tailwind's default theme to use CSS variables
      // This allows using `text-primary`, `bg-secondary`, `border-accent-1` etc.
      // directly in your JSX/TSX files.
      colors: {
        background: {
          primary: 'var(--color-background-primary)',
          secondary: 'var(--color-background-secondary)',
          tertiary: 'var(--color-background-tertiary)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          accent: 'var(--color-text-accent)',
        },
        border: {
          primary: 'var(--color-border-primary)',
          secondary: 'var(--color-border-secondary)',
        },
        accent: {
          1: 'var(--color-accent-1)',
          '1-hover': 'var(--color-accent-1-hover)',
          2: 'var(--color-accent-2)',
          '2-hover': 'var(--color-accent-2-hover)',
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
        focus: 'var(--color-focus-ring)',
      },
      fontFamily: {
        sans: ['var(--font-family-sans)', 'sans-serif'],
        mono: ['var(--font-family-mono)', 'monospace'],
      },
      fontSize: {
        base: 'var(--font-size-base)',
      },
      lineHeight: {
        base: 'var(--line-height-base)',
      },
    },
  },
  plugins: [
    // Custom plugin to add a `data-theme` attribute to the html element
    // This enables easy theme switching if multiple themes are implemented.
    plugin(function ({ addBase, theme }) {
      addBase({
        'html': { 'font-family': theme('fontFamily.sans') },
        'html[data-theme="dark"]': {
          // You can define dark theme specific overrides here if needed,
          // but for now, :root already defines the dark theme.
        },
        // Example for a potential light theme:
        // 'html[data-theme="light"]': {
        //   '--color-background-primary': '#ffffff',
        //   '--color-text-primary': '#1f2937',
        //   // ... other light theme variables
        // },
      });
    }),
  ],
};
