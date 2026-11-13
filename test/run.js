import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {ESLint} from 'eslint';
import {configs} from '../dist/index.js';

const cwd = fileURLToPath(new URL('./fixtures/', import.meta.url));
const eslint = new ESLint({
    cwd,
    overrideConfigFile: true,
    overrideConfig: [
        ...configs.recommended,
        ...configs.typescript,
        ...configs.react,
        {settings: {react: {version: '19.0'}}}
    ]
});

const results = await eslint.lintFiles(['.']);
const byFile = Object.fromEntries(results.map((result) => [
    result.filePath.slice(cwd.length),
    result.messages.map((message) => message.ruleId)
]));

const expect = (file, ruleIds) => {
    for (const ruleId of ruleIds) {
        assert.ok(byFile[file].includes(ruleId), `${file}: expected ${ruleId}, got ${byFile[file].join(', ')}`);
    }
};

assert.ok(results.every((result) => result.fatalErrorCount === 0), 'no fatal parse errors');
assert.deepEqual(byFile['clean.js'], []);
expect('sample.js', ['no-var', 'no-unused-vars', '@stylistic/quotes', 'eqeqeq', 'curly', '@stylistic/indent']);
expect('sample.ts', ['@typescript-eslint/no-unused-vars', '@typescript-eslint/no-explicit-any', '@stylistic/member-delimiter-style']);
expect('Component.tsx', ['react/function-component-definition', 'react-hooks/rules-of-hooks', 'no-restricted-syntax']);
assert.ok(!byFile['Component.tsx'].includes('react/react-in-jsx-scope'));

console.log('All config tests passed');
