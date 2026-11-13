import type {ESLint} from 'eslint';
import jsxNoLeakedRender from './rules/jsx-no-leaked-render.js';
import jsxWrapReturn from './rules/jsx-wrap-return.js';
import nullLast from './rules/null-last.js';

const plugin: ESLint.Plugin = {
    meta: {
        name: '@servusrene/eslint-plugin'
    },
    rules: {
        'jsx-no-leaked-render': jsxNoLeakedRender,
        'jsx-wrap-return': jsxWrapReturn,
        'null-last': nullLast
    }
};

export default plugin;
