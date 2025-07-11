import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // This first block is for your main application source code
  {
    files: ['src/**/*.{ts,tsx}'], // Specifically targets files in the src directory
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.app.json', // Point directly to the app's tsconfig
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommendedWithTypeChecking.rules, // Use type-checked rules
      ...reactHooks.configs.recommended.rules,
    },
  },

  // This second block is for your configuration files
  {
    files: ['vite.config.ts', 'eslint.config.js'], // Target only config files
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.node.json', // Point directly to the node tsconfig
      },
      globals: {
        ...globals.node, // Use Node.js globals
      },
    },
    rules: {
      // Relax some rules for config files if needed
      // For example, you might not need type-checking for simple configs
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
    },
  },

  // A global ignore block
  {
    ignores: ['dist/'],
  },
);
