/**
 * React additions. Combine with the recommended config.
 *
 * @link https://github.com/jsx-eslint/eslint-plugin-react#list-of-supported-rules
 * @link https://react.dev/reference/rules/rules-of-hooks
 */
import type {Linter} from 'eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import servusrene from '../plugin.js';

const files = ['**/*.{js,jsx,mjs,ts,tsx}'];

const config: Linter.Config[] = [
    {
        ...react.configs.flat.recommended,
        files
    },
    {
        ...react.configs.flat['jsx-runtime'],
        files
    },
    {
        ...reactHooks.configs.flat.recommended,
        files
    },
    {
        name: 'servusrene/react',
        files,
        plugins: {
            servusrene
        },
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                }
            },
            globals: {
                ...globals.browser
            }
        },
        settings: {
            react: {
                version: 'detect'
            }
        },
        rules: {
            'react/function-component-definition': ['error', {
                namedComponents: 'arrow-function',
                unnamedComponents: 'arrow-function'
            }],
            'react/jsx-boolean-value': ['warn', 'always'],
            'react/jsx-no-useless-fragment': 'warn',
            'react/prop-types': 'off',
            '@stylistic/jsx-curly-brace-presence': ['warn', 'never'],
            '@stylistic/jsx-curly-spacing': ['warn', 'never'],
            '@stylistic/jsx-equals-spacing': ['warn', 'never'],
            // JSX attributes are aligned by jsx-indent-props, so indent must not fight over them
            '@stylistic/indent': ['warn', 4, {SwitchCase: 1, ignoredNodes: ['JSXAttribute', 'JSXSpreadAttribute']}],
            '@stylistic/jsx-indent-props': ['warn', 'first'],
            '@stylistic/jsx-pascal-case': 'error',
            '@stylistic/jsx-wrap-multilines': ['warn', {
                declaration: 'parens-new-line',
                assignment: 'parens-new-line',
                // return and arrow bodies are handled by servusrene/jsx-wrap-return
                return: 'ignore',
                arrow: 'ignore',
                condition: 'parens-new-line',
                logical: 'parens-new-line',
                prop: 'parens-new-line'
            }],
            'servusrene/jsx-no-leaked-render': 'error',
            'servusrene/jsx-wrap-return': 'warn'
        }
    },
    {
        name: 'servusrene/react-components',
        files: ['**/*.{jsx,tsx}'],
        ignores: ['**/*.{test,spec}.{jsx,tsx}'],
        plugins: {
            servusrene
        },
        rules: {
            'react/no-multi-comp': ['error', {ignoreStateless: false}],
            'servusrene/component-default-export': 'error'
        }
    }
];

export default config;
