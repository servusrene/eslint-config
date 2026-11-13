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
            '@stylistic/jsx-indent-props': ['warn', 'first'],
            '@stylistic/jsx-pascal-case': 'error',
            '@stylistic/jsx-wrap-multilines': ['warn', {
                declaration: 'parens-new-line',
                assignment: 'parens-new-line',
                return: 'parens-new-line',
                arrow: 'parens-new-line',
                condition: 'parens-new-line',
                logical: 'parens-new-line',
                prop: 'parens-new-line'
            }],
            'no-restricted-syntax': [
                'error',
                // Avoid rendering '0' instead of nothing: https://stackoverflow.com/q/53048037
                {
                    selector: ':matches(JSXElement, JSXFragment) > JSXExpressionContainer > LogicalExpression[operator=\'&&\']',
                    message: 'Please use `condition ? <Jsx /> : null`. Otherwise, there is a chance of rendering \'0\' instead'
                        + ' of \'\' in some cases. Context: https://stackoverflow.com/q/53048037'
                },
                {
                    selector: ':matches(JSXElement, JSXFragment) > JSXExpressionContainer > LogicalExpression[operator=\'||\']',
                    message: 'Please use `value ?? fallbackValue`. Otherwise, there is a chance of rendering \'0\' instead of \'\''
                        + ' in some cases. Context: https://stackoverflow.com/q/53048037'
                }
            ]
        }
    }
];

export default config;
