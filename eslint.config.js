import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
    js.configs.recommended,
    prettier,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        },
    },
    // Node.js / config files
    {
        files: ['**/*.{js,mjs,cjs}', 'scripts/**/*', 'vite.config.js', 'vitest.config.js'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
    // Test files
    {
        files: ['**/__tests__/**/*.{js,ts}', '**/*.test.{js,ts}'],
        languageOptions: {
            globals: {
                ...globals.jest,
            },
        },
        rules: {
            'no-unused-vars': 'off',
        },
    },
    {
        ignores: ['vendor/', 'node_modules/', 'public/build/', 'storage/'],
    },
];
