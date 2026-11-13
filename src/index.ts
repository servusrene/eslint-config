import type {Linter} from 'eslint';
import react from './configs/react.js';
import recommended from './configs/recommended.js';
import typescript from './configs/typescript.js';

export const configs: Record<'recommended' | 'typescript' | 'react', Linter.Config[]> = {
    recommended,
    typescript,
    react
};

export default recommended;
