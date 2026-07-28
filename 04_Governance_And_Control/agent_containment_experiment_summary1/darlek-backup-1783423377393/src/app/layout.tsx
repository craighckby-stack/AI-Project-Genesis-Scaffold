/**
 * @file src/app/layout.tsx
 * @description The root layout component for the Next.js application.
 * This file defines the foundational HTML structure, including the `<html>` and `<body>` tags,
 * and integrates global styles and theme management. It serves as the entry point for all pages
 * and components, ensuring consistent application-wide styling and behavior.
 *
 * Key Responsibilities:
 * - **Global Styling**: Imports `globals.css` to apply base styles, resets, and design tokens,
 *   leveraging the CSS variable-based theme engine for dynamic styling.
 * - **Theme Management**: Implements a client-side script to detect and apply the user's preferred
 *   color scheme (dark/light mode) or a stored theme from `localStorage` to the `<html>` element
 *   via the `data-theme` attribute. This script runs before React hydration to prevent a
 *   flash-of-unstyled-content (FOUC) and ensure the correct theme is applied immediately.
 * - **Structural Foundation**: Provides the `<html>` and `<body>` elements, wrapping all child
 *   components (`children`) within the application's main content area.
 * - **Accessibility**: Sets the `lang` attribute for accessibility and applies base utility classes
 *   for typography and layout, which are now complemented by the global CSS variables for colors.
 *
 * Integrates with:
 * - `src/app/globals.css`: Consumes CSS variables and theme definitions for dynamic background
 *   and text colors, replacing hardcoded Tailwind classes for theme-specific styling.
 * - All page components: Renders `children` as the main content of the application.
 */
'use client';

import React from 'react';
import './globals.css';

// This script runs before React hydrates to prevent a flash of unstyled content (FOUC)
// by setting the data-theme attribute on the html element based on user preference or stored theme.
const setInitialTheme = `
  (function() {
    const getInitialTheme = () => {
      if (typeof window !== 'undefined' && window.localStorage.getItem('theme')) {
        return window.localStorage.getItem('theme');
      }
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      return 'light'; // Default theme if no preference is found
    };
    const theme = getInitialTheme();
    document.documentElement.setAttribute('data-theme', theme);
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Script to set initial theme before React hydration to prevent FOUC */}
        <script dangerouslySetInnerHTML={{ __html: setInitialTheme }} />
      </head>
      {/* 
        The body classes for background and text color (e.g., bg-slate-950 text-slate-100)
        have been removed. These are now managed by the CSS variable-based theme engine
        defined in globals.css, which applies colors based on the data-theme attribute
        set on the html element.
      */}
      <body className="antialiased min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}