/**
 * TypeScript additions. Combine with the recommended config.
 *
 * @link https://typescript-eslint.io/rules/
 */
import type {Linter} from 'eslint';
import {createTypeScriptImportResolver} from 'eslint-import-resolver-typescript';
import {flatConfigs as importConfigs} from 'eslint-plugin-import-x';
import {configs as tseslintConfigs} from 'typescript-eslint';
import {rules} from './recommended.js';

const files = ['**/*.{ts,tsx,mts,cts}'];

const config: Linter.Config[] = [
    ...tseslintConfigs.recommended.map((config) => ({...config, files})),
    {
        ...importConfigs.typescript,
        files,
        settings: {
            ...importConfigs.typescript.settings,
            'import-x/resolver': undefined,
            'import-x/resolver-next': [createTypeScriptImportResolver()]
        }
    },
    {
        name: 'servusrene/typescript',
        files,
        rules: {
            'import-x/no-unresolved': 'off',
            'import-x/named': 'off',
            'no-duplicate-imports': 'off',
            'import-x/no-duplicates': rules['no-duplicate-imports'],
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': rules['no-unused-vars'],
            'no-use-before-define': 'off',
            '@typescript-eslint/no-use-before-define': rules['no-use-before-define'],
            '@stylistic/member-delimiter-style': 'warn'
        }
    }
];

export default config;
