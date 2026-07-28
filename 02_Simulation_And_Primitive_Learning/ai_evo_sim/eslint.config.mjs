/**
 * @file eslint.config.mjs
 * @description Primary Linting Orchestrator for DARLEK_CAAN_ENGINE.
 * 
 * This configuration enforces strict type safety, React best practices, and security standards
 * siphoned from Microsoft/TypeScript, Google/styleguide, and Vercel/Next.js repositories.
 * 
 * Role: Ensures system integrity by preventing common code smells, memory leaks, and 
 * unsafe type assertions across the repository swarm. Acts as the first line of defense
 * for the DARLEK_CAAN_ENGINE self-evolution loop.
 */

import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import reactCompiler from "eslint-plugin-react-compiler";
import importPlugin from "eslint-plugin-import";
import securityPlugin from "eslint-plugin-security";
import sonarjs from "eslint-plugin-sonarjs";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    plugins: {
      "react-compiler": reactCompiler,
      "import": importPlugin,
      "security": securityPlugin,
      "sonarjs": sonarjs,
    },
    rules: {
      // Strict TypeScript Enforcement
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { "prefer": "type-imports" }],

      // React Integrity
      "react-hooks/exhaustive-deps": "error",
      "react/no-unescaped-entities": "error",
      "react-compiler/react-compiler": "error",

      // Next.js Best Practices
      "@next/next/no-img-element": "error",
      "@next/next/no-html-link-for-pages": "error",

      // Security & Import Hygiene
      "security/detect-object-injection": "error",
      "security/detect-non-literal-fs-filename": "error",
      "import/order": ["error", { 
        "newlines-between": "always", 
        "alphabetize": { "order": "asc", "caseInsensitive": true } 
      }],
      "import/no-duplicates": "error",
      "import/no-cycle": "error",

      // SonarJS Code Quality
      "sonarjs/no-identical-functions": "error",
      "sonarjs/no-nested-template-literals": "warn",
      "sonarjs/cognitive-complexity": ["error", 15],

      // General System Hygiene
      "no-console": ["warn", { "allow": ["warn", "error", "info"] }],
      "no-debugger": "error",
      "prefer-const": "error",
      "no-unused-vars": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "*.config.js",
      "next-env.d.ts",
      "examples/**",
      "skills/**",
      "**/__tests__/**",
      "**/*.tmp",
      "**/*.log",
      "coverage/**",
      "public/**",
      "*.md"
    ],
  },
];

export default eslintConfig;




