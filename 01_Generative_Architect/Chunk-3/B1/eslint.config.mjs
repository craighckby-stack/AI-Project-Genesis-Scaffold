/**
 * ESLint configuration for the Brain System.
 * Resolves module specifier errors and browser sandbox dependency conflicts.
 *
 * @note This configuration targets TypeScript and JavaScript files with a strict set of rules to ensure maintainable and readable code.
 */
export default {
  // Glob patterns to match files
  files: ['**/*.{ts,tsx,js,jsx}'],

  // ESLint rules configuration
  rules: {
    'no-unused-vars': ['warn', { ignoreRestSiblings: true }],
    'no-undef': 'error',
    'no-console': 'off',
    // Enforce consistent use of semicolons
    semi: ['error', 'always'],
  },

  /**
   * Language options for ESLint.
   */
  languageOptions: {
    // ECMA version to target
    ecmaVersion: 'latest',
    // Source type to target
    sourceType: 'module',
    // Define global variables with 'readonly' access
    globals: {
      window: 'readonly',
      document: 'readonly',
      navigator: 'readonly',
      console: 'readonly',
      setTimeout: 'readonly',
      setInterval: 'readonly',
      clearTimeout: 'readonly',
      clearInterval: 'readonly',
      fetch: 'readonly',
      Uint8Array: 'readonly',
      DataView: 'readonly',
      TextEncoder: 'readonly',
      TextDecoder: 'readonly',
      atob: 'readonly',
      btoa: 'readonly',
      localStorage: 'readonly',
      performance: 'readonly',
    },
  },
};
```

**