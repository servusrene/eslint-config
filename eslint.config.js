import {configs} from './dist/index.js';

export default [
    {ignores: ['dist/**', 'test/fixtures/**']},
    ...configs.recommended,
    ...configs.typescript
];
