import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import {join, relative} from 'node:path';
import {describe, test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {ESLint} from 'eslint';
import {configs} from '../dist/index.js';

const fixtures = fileURLToPath(new URL('./fixtures/', import.meta.url));
const eslint = new ESLint({
    cwd: fixtures,
    overrideConfigFile: true,
    overrideConfig: [
        ...configs.recommended,
        ...configs.typescript,
        ...configs.react,
        {settings: {react: {version: '19.0'}}}
    ]
});

const lint = async (file) => {
    const [result] = await eslint.lintFiles([join(fixtures, file)]);
    const fatal = result.messages.filter((message) => message.fatal);
    assert.deepEqual(fatal, [], `parse error in ${file}`);
    return result.messages;
};
const ruleIdsOf = async (file) => (await lint(file)).map((message) => message.ruleId);

/**
 * Rule fixtures live in `fixtures/rules/<group>/<rule-id>/`:
 * `invalid*.<ext>` must report the rule, `valid*.<ext>` must not.
 * Rules set to 'off' only need valid fixtures proving they stay silent.
 * Other files in a rule folder (e.g. `exports.js`) are helpers and not linted directly.
 */
const fixtureFile = /^(valid|invalid)(-\d+)?\.[cm]?[jt]sx?$/;

const collectRules = (groupDir) => {
    const rules = new Map();
    const walk = (dir) => {
        for (const entry of readdirSync(dir, {withFileTypes: true})) {
            const path = join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(path);
            } else if (fixtureFile.test(entry.name)) {
                const ruleId = relative(groupDir, dir).replaceAll('\\', '/');
                const kind = entry.name.startsWith('invalid') ? 'invalid' : 'valid';
                const rule = rules.get(ruleId) ?? {invalid: [], valid: []};
                rule[kind].push(relative(fixtures, path));
                rules.set(ruleId, rule);
            }
        }
    };
    walk(groupDir);
    return rules;
};

const groups = readdirSync(join(fixtures, 'rules'), {withFileTypes: true})
    .filter((entry) => entry.isDirectory())
    .map((entry) => [entry.name, collectRules(join(fixtures, 'rules', entry.name))]);

for (const [group, rules] of groups) {
    describe(`${group} rules`, () => {
        for (const [ruleId, {invalid, valid}] of rules) {
            test(ruleId, async () => {
                await Promise.all(invalid.map(async (file) => {
                    const ruleIds = await ruleIdsOf(file);
                    assert.ok(ruleIds.includes(ruleId), `expected ${ruleId} in ${file}, got: ${ruleIds.join(', ')}`);
                }));
                await Promise.all(valid.map(async (file) => {
                    const ruleIds = await ruleIdsOf(file);
                    assert.ok(!ruleIds.includes(ruleId), `unexpected ${ruleId} in ${file}`);
                }));
            });
        }
    });
}

describe('rule coverage', () => {
    test('every rule in a servusrene/* config block has a fixture', () => {
        const tested = new Set(groups.flatMap(([, rules]) => [...rules.keys()]));
        const configured = Object.values(configs)
            .flat()
            .filter((block) => block.name?.startsWith('servusrene/'))
            .flatMap((block) => Object.keys(block.rules ?? {}));
        const missing = [...new Set(configured)].filter((ruleId) => !tested.has(ruleId));
        assert.deepEqual(missing, [], `rules without fixture: ${missing.join(', ')}`);
    });

    test('no enabled rule is unknown or deprecated', async () => {
        await Promise.all(['case.js', 'case.ts', 'case.tsx', 'case.jsx'].map(async (file) => {
            const {rules} = await eslint.calculateConfigForFile(join(fixtures, file));
            const enabled = Object.keys(rules).filter((ruleId) => ![0, 'off'].includes([rules[ruleId]].flat()[0]));
            const meta = eslint.getRulesMetaForResults([{
                filePath: join(fixtures, file),
                messages: enabled.map((ruleId) => ({ruleId})),
                suppressedMessages: []
            }]);
            const deprecated = enabled.filter((ruleId) => meta[ruleId]?.deprecated);
            assert.deepEqual(deprecated, [], `${file}: deprecated rules enabled`);
            const unknown = enabled.filter((ruleId) => !meta[ruleId]);
            assert.deepEqual(unknown, [], `${file}: unknown rules enabled`);
        }));
    });
});

describe('file scoping (fixtures/scoping)', () => {
    test('browser globals are available in source files', async () => {
        assert.ok(!(await ruleIdsOf('scoping/src/browser-globals.js')).includes('no-undef'));
    });

    test('node globals are not available in browser source files', async () => {
        assert.ok((await ruleIdsOf('scoping/src/node-globals.js')).includes('no-undef'));
    });

    for (const file of ['vite.config.js', 'eslint.config.mjs', 'webpack.mix.js', '.prettierrc.js', 'app-configuration.js']) {
        test(`node globals are available in ${file}`, async () => {
            assert.ok(!(await ruleIdsOf(`scoping/${file}`)).includes('no-undef'));
        });
    }

    test('.cjs files are parsed as CommonJS', async () => {
        assert.deepEqual(await lint('scoping/tool.config.cjs'), []);
    });

    test('modern syntax parses (ecmaVersion latest)', async () => {
        await lint('scoping/modern-syntax.js');
    });

    for (const file of ['formatting.ts', 'formatting.tsx']) {
        test(`javascript and formatting rules also apply to ${file}`, async () => {
            const ruleIds = await ruleIdsOf(`scoping/${file}`);
            const expected = [
                'eqeqeq',
                'curly',
                '@stylistic/brace-style',
                '@stylistic/comma-dangle',
                '@stylistic/comma-spacing',
                '@stylistic/indent',
                '@stylistic/object-curly-spacing',
                '@stylistic/quotes'
            ];
            assert.deepEqual(expected.filter((ruleId) => !ruleIds.includes(ruleId)), []);
        });
    }

    test('typescript rules do not apply to .js files', async () => {
        const ruleIds = await ruleIdsOf('scoping/unused.js');
        assert.ok(ruleIds.includes('no-unused-vars'));
        assert.ok(!ruleIds.some((ruleId) => ruleId?.startsWith('@typescript-eslint/')));
    });

    test('typescript imports resolve without resolver errors', async () => {
        const messages = await lint('scoping/resolve.ts');
        assert.deepEqual(messages.filter((message) => message.message.includes('Resolve error')), []);
    });

    test('react rules apply to .tsx files', async () => {
        assert.ok((await ruleIdsOf('scoping/Component.tsx')).includes('react/function-component-definition'));
    });

    test('jsx runtime: React does not need to be in scope', async () => {
        assert.ok(!(await ruleIdsOf('scoping/jsx-runtime.jsx')).includes('react/react-in-jsx-scope'));
    });

    test('react-hooks rules are active', async () => {
        assert.ok((await ruleIdsOf('scoping/hooks.jsx')).includes('react-hooks/rules-of-hooks'));
    });
});
