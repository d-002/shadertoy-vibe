import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import stylistic from '@stylistic/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
    {
        ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
    },
    js.configs.recommended,
    reactHooks.configs.flat.recommended,
    {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        rules: {
            // Async fetch effects update UI state after their requests resolve.
            'react-hooks/set-state-in-effect': 'off',
            'no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
        },
    },
    prettier,
    {
        files: ['**/*.{js,jsx}'],
        plugins: { '@stylistic': stylistic },
        rules: {
            '@stylistic/indent': ['error', 4],
            '@stylistic/max-len': [
                'error',
                { code: 80, tabWidth: 4, ignoreUrls: true },
            ],
        },
    },
];
