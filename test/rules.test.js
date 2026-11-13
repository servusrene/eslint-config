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

describe('servusrene/jsx-no-leaked-render at any depth', () => {
    const depth = 100;
    const vars = Array.from({length: depth}, (_, i) => `v${i}`);
    const component = (expression) => `export const Foo = ({${vars.join(', ')}}) => <div>{${expression}}</div>;\n`;
    const reports = async (code) => {
        const [result] = await eslint.lintText(code, {filePath: join(fixtures, 'depth.jsx')});
        assert.deepEqual(result.messages.filter((message) => message.fatal), []);
        return result.messages.filter((message) => message.ruleId === 'servusrene/jsx-no-leaked-render');
    };
    // v0 ? <i /> : v1 ? <i /> : ... : <tail>
    const ternaryChain = (tail) => vars.reduceRight((rest, name) => `${name} ? <i /> : ${rest}`, tail);
    // v0 ? (v1 ? (... <tail> ...) : null) : null
    const nestedConsequent = (tail) => vars.reduceRight((rest, name) => `${name} ? (${rest}) : null`, tail);
    const andChain = `${vars.join(' && ')} && <b />`;

    test(`&& chain of ${depth} operands is reported once`, async () => {
        assert.equal((await reports(component(andChain))).length, 1);
    });

    test(`&& chain after ${depth} ternary alternates is reported once`, async () => {
        assert.equal((await reports(component(ternaryChain(`(${andChain})`)))).length, 1);
    });

    test(`&& chain inside ${depth} nested ternary consequents is reported once`, async () => {
        assert.equal((await reports(component(nestedConsequent(andChain)))).length, 1);
    });

    test(`|| after ${depth} ternary alternates is reported`, async () => {
        assert.equal((await reports(component(ternaryChain('v0 || \'x\'')))).length, 1);
    });

    test(`${depth} nested ternaries with && only in conditions are valid`, async () => {
        const conditions = vars.reduceRight((rest, name, i) => `${name} && v${(i + 1) % depth} ? <i /> : ${rest}`, 'null');
        assert.deepEqual(await reports(component(conditions)), []);
        assert.deepEqual(await reports(component(nestedConsequent('<b />'))), []);
    });
});

describe('servusrene/jsx-wrap-return autofix', () => {
    const fixer = new ESLint({
        cwd: fixtures,
        fix: true,
        overrideConfigFile: true,
        overrideConfig: [...configs.recommended, ...configs.react, {settings: {react: {version: '19.0'}}}]
    });
    const fix = async (code) => {
        const [result] = await fixer.lintText(code, {filePath: join(fixtures, 'fix.jsx')});
        return result.output ?? code;
    };

    test('wraps a returned single-line element', async () => {
        assert.equal(
            await fix('export const Foo = (props) => {\n    return <div {...props} />;\n};\n'),
            'export const Foo = (props) => {\n    return (\n        <div {...props} />\n    );\n};\n'
        );
    });

    test('wraps an arrow body, including nested callbacks', async () => {
        assert.equal(
            await fix('export const List = ({items}) => <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>;\n'),
            'export const List = ({items}) => (\n    <ul>{items.map((item) => (\n        <li key={item}>{item}</li>\n    ))}</ul>\n);\n'
        );
    });

    test('wraps JSX in ternary branches of a returned value', async () => {
        assert.equal(
            await fix('export const Foo = ({a, b}) => {\n    return a ? <span /> : b ? <i /> : null;\n};\n'),
            'export const Foo = ({a, b}) => {\n    return a ? (\n        <span />\n    ) : b ? (\n        <i />\n    ) : null;\n};\n'
        );
        assert.equal(
            await fix('export const Foo = ({a}) => a ? <span /> : null;\n'),
            'export const Foo = ({a}) => a ? (\n    <span />\n) : null;\n'
        );
    });

    test('moves existing parentheses onto their own lines', async () => {
        assert.equal(
            await fix('export const Foo = () => (<div />);\n'),
            'export const Foo = () => (\n    <div />\n);\n'
        );
    });
});

describe('servusrene/null-last autofix', () => {
    const fixer = new ESLint({
        cwd: fixtures,
        fix: true,
        overrideConfigFile: true,
        overrideConfig: [...configs.recommended, ...configs.react, {settings: {react: {version: '19.0'}}}]
    });
    const fix = async (code) => {
        const [result] = await fixer.lintText(code, {filePath: join(fixtures, 'fix.jsx')});
        return result.output ?? code;
    };
    const wrapped = (test) => `export const Foo = ({a, b}) => {\n    return ${test} ? (\n        <span />\n    ) : null;\n};\n`;
    const nullFirst = (test) => `export const Foo = ({a, b}) => {\n    return ${test} ? null : (\n        <span />\n    );\n};\n`;

    test('removes a negation: !a ? null : <X /> -> a ? <X /> : null', async () => {
        assert.equal(await fix(nullFirst('!a')), wrapped('a'));
    });

    test('adds a negation: a ? null : <X /> -> !a ? <X /> : null', async () => {
        assert.equal(await fix(nullFirst('a')), wrapped('!a'));
        assert.equal(await fix(nullFirst('a.b')), wrapped('!a.b'));
    });

    test('flips comparisons', async () => {
        assert.equal(await fix(nullFirst('a === b')), wrapped('a !== b'));
        assert.equal(await fix(nullFirst('a != null')), wrapped('a == null'));
    });

    test('wraps compound conditions', async () => {
        assert.equal(await fix(nullFirst('a && b')), wrapped('!(a && b)'));
        assert.equal(await fix(nullFirst('a > b')), wrapped('!(a > b)'));
        assert.equal(await fix(nullFirst('!(a || b)')), wrapped('(a || b)'));
    });

    test('also wraps single-line JSX while moving it', async () => {
        assert.equal(
            await fix('export const Foo = ({a}) => a ? null : <span />;\n'),
            'export const Foo = ({a}) => !a ? (\n    <span />\n) : null;\n'
        );
    });

    test('applies to plain values outside of JSX and returns', async () => {
        assert.equal(
            await fix('export const find = (items, id) => {\n    return id ? null : items[0];\n};\n'),
            'export const find = (items, id) => {\n    return !id ? items[0] : null;\n};\n'
        );
        assert.equal(
            await fix('export const options = (a, b) => ({value: a === b ? null : a});\n'),
            'export const options = (a, b) => ({value: a !== b ? a : null});\n'
        );
    });

    test('applies to JSX children', async () => {
        assert.equal(
            await fix('export const Foo = ({a}) => (\n    <div>{a ? null : <span />}</div>\n);\n'),
            'export const Foo = ({a}) => (\n    <div>{!a ? <span /> : null}</div>\n);\n'
        );
    });

    test('is reported but not fixed when the other branch is a ternary', async () => {
        const code = 'export const Foo = ({a, b}) => {\n    return a ? null : b ? (\n        <i />\n    ) : null;\n};\n';
        assert.equal(await fix(code), code);
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
