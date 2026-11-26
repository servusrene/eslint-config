import type {ESLint} from 'eslint';
import componentDefaultExport from './rules/component-default-export.js';
import jsxNoLeakedRender from './rules/jsx-no-leaked-render.js';
import jsxWrapReturn from './rules/jsx-wrap-return.js';
import nullLast from './rules/null-last.js';

const plugin: ESLint.Plugin = {
    meta: {
        name: '@servusrene/eslint-plugin'
    },
    rules: {
        'component-default-export': componentDefaultExport,
        'jsx-no-leaked-render': jsxNoLeakedRender,
        'jsx-wrap-return': jsxWrapReturn,
        'null-last': nullLast
    }
};

export default plugin;
