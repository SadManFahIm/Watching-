import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import security from 'eslint-plugin-security';
import globals from 'globals';

// Mirrors the old `eslint . --ext ts,tsx` scope: every .ts/.tsx file outside
// the ignore list, including the root config files.
const sourceFiles = ['**/*.{ts,tsx}'];

export default [
  {
    ignores: ['dist', 'node_modules', '**/*.mjs'],
  },
  js.configs.recommended,
  {
    files: sourceFiles,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      security,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,

      // typescript-eslint owns undefined-identifier checking: `no-undef` cannot
      // see type-only references (PublicKeyCredentialDescriptor) or the automatic
      // JSX runtime, so it false-positives across the whole codebase.
      'no-undef': 'off',

      // Pinned to the eslint-plugin-react-hooks v5 baseline (rules-of-hooks +
      // exhaustive-deps). v7 added the React Compiler rule family
      // (set-state-in-effect, incompatible-library, preserve-manual-memoization, …);
      // enabling them is a separate refactor, not part of a version bump.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Also new in ESLint 10's eslint:recommended. Both are enabled: the
      // violations they surfaced were fixed in #52, so the rules now guard
      // against regressions rather than merely deferring the cleanup.
      'no-useless-assignment': 'error',
      'preserve-caught-error': 'error',

      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      // Security guardrails: keep these green going forward.
      'security/detect-eval-with-expression': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-non-literal-regexp': 'error',
    },
  },
];
