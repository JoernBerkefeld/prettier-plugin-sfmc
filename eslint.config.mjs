import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import jsdoc from 'eslint-plugin-jsdoc';
import js from '@eslint/js';

/** Flat ESLint config — aligned with `.cursor/rules/new-subproject-setup.mdc` (JSDoc rules relaxed for large catalogs). */
export default [
    {
        ignores: ['**/node_modules/**', '**/dist/**', '**/out/**', '**/coverage/**'],
    },
    js.configs.recommended,
    eslintPluginPrettierRecommended,
    jsdoc.configs['flat/recommended'],
    eslintPluginUnicorn.configs['recommended'],
    {
        languageOptions: {
            globals: {
                ...globals.nodeBuiltin,
                Atomics: 'readonly',
                SharedArrayBuffer: 'readonly',
            },
            ecmaVersion: 2022,
            sourceType: 'module',
        },
        settings: {
            jsdoc: {
                mode: 'typescript',
                preferredTypes: {
                    array: 'Array',
                    'array.<>': '[]',
                    'Array.<>': '[]',
                    'array<>': '[]',
                    'Array<>': '[]',
                    Object: 'object',
                    'object.<>': 'Object.<>',
                    'object<>': 'Object.<>',
                    'Object<>': 'Object.<>',
                    set: 'Set',
                    'set.<>': 'Set.<>',
                    'set<>': 'Set.<>',
                    'Set<>': 'Set.<>',
                    promise: 'Promise',
                    'promise.<>': 'Promise.<>',
                    'promise<>': 'Promise.<>',
                    'Promise<>': 'Promise.<>',
                },
            },
        },
        rules: {
            'logical-assignment-operators': ['error', 'always'],
            'arrow-body-style': ['error', 'as-needed'],
            curly: 'error',
            'no-console': 'warn',
            'jsdoc/check-line-alignment': 2,
            'jsdoc/require-jsdoc': 'off',
            'jsdoc/require-param-type': 'off',
            'jsdoc/tag-lines': ['warn', 'any', { startLines: 1 }],
            'jsdoc/no-undefined-types': 'off',
            'jsdoc/valid-types': 'off',
            'spaced-comment': [
                'warn',
                'always',
                {
                    block: {
                        exceptions: ['*'],
                        balanced: true,
                    },
                },
            ],
        },
    },
    {
        files: ['**/*.{js,mjs,cjs}'],
        rules: {
            'no-var': 'error',
            'prefer-const': 'error',
            'prettier/prettier': 'warn',
            'prefer-arrow-callback': 'warn',
        },
    },
    {
        files: ['tests/**/*.js'],
        languageOptions: {
            globals: {
                ...globals.jest,
            },
        },
        rules: {
            'unicorn/import-style': 'off',
        },
    },
    {
        files: ['src/**/*.js', 'scripts/**/*.{js,mjs}'],
        rules: {
            'unicorn/no-array-for-each': 'off',
            'unicorn/no-array-method-this-argument': 'off',
            'unicorn/no-immediate-mutation': 'off',
            'unicorn/import-style': 'off',
            'unicorn/no-process-exit': 'off',
            'no-console': 'off',
            'jsdoc/require-param-description': 'off',
            'jsdoc/require-returns': 'off',
        },
    },
    {
        // Ad-hoc CLI harness — console output and process.exit are intentional.
        files: ['testFixture/**/*.{js,mjs,cjs}'],
        rules: {
            'unicorn/import-style': 'off',
            'unicorn/no-process-exit': 'off',
            'no-console': 'off',
        },
    },
];
