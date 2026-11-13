/**
 * Base configuration for JavaScript projects.
 *
 * @link https://eslint.org/docs/rules/
 * @link https://eslint.style/rules
 */
import type {Linter} from 'eslint';
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import {flatConfigs as importConfigs} from 'eslint-plugin-import-x';
import globals from 'globals';
import servusrene from '../plugin.js';

export const rules: Linter.RulesRecord = {
    'block-scoped-var': 'error',
    'camelcase': 'warn',
    'curly': ['warn', 'all'],
    'default-case': 'error',
    'dot-notation': 'warn',
    'eqeqeq': 'error',
    'no-await-in-loop': 'error',
    'no-duplicate-imports': 'error',
    'no-else-return': 'warn',
    'no-template-curly-in-string': 'error',
    'no-unused-vars': 'error',
    'no-use-before-define': 'warn',
    'no-var': 'warn',
    'prefer-arrow-callback': 'warn',
    'prefer-const': 'warn',
    'require-await': 'error',
    'import-x/no-unresolved': 'off',
    'import-x/named': 'off',
    'servusrene/null-last': 'warn'
};

export const stylisticRules: Linter.RulesRecord = {
    '@stylistic/array-bracket-newline': ['warn', 'consistent'],
    '@stylistic/array-bracket-spacing': 'warn',
    '@stylistic/arrow-spacing': 'warn',
    '@stylistic/block-spacing': 'warn',
    '@stylistic/brace-style': 'warn',
    '@stylistic/comma-dangle': 'warn',
    '@stylistic/comma-spacing': 'warn',
    '@stylistic/comma-style': 'warn',
    '@stylistic/function-call-spacing': 'warn',
    '@stylistic/implicit-arrow-linebreak': 'warn',
    '@stylistic/indent': ['warn', 4, {SwitchCase: 1}],
    '@stylistic/newline-per-chained-call': 'warn',
    '@stylistic/no-whitespace-before-property': 'warn',
    '@stylistic/nonblock-statement-body-position': 'warn',
    '@stylistic/object-curly-spacing': ['warn', 'never'],
    '@stylistic/quotes': ['warn', 'single', {avoidEscape: true}],
    '@stylistic/rest-spread-spacing': ['warn', 'never'],
    '@stylistic/template-curly-spacing': ['warn', 'never']
};

const config: Linter.Config[] = [
    js.configs.recommended,
    importConfigs.recommended,
    {
        name: 'servusrene/recommended',
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser
            }
        },
        plugins: {
            '@stylistic': stylistic,
            servusrene
        },
        rules: {
            ...rules,
            ...stylisticRules
        }
    },
    {
        name: 'servusrene/node-files',
        files: [
            '**/*.config.{js,cjs,mjs,ts}',
            '**/*rc.{js,cjs,mjs}',
            '**/*.mix.js',
            '**/*-configuration.js'
        ],
        languageOptions: {
            globals: {
                ...globals.node
            }
        }
    },
    {
        name: 'servusrene/commonjs',
        files: ['**/*.cjs'],
        languageOptions: {
            sourceType: 'commonjs'
        }
    }
];

export default config;
