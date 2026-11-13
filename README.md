# @servusrene/eslint-config

Shareable [ESLint flat config](https://eslint.org/docs/latest/use/configure/configuration-files) for JavaScript, TypeScript and React projects.

Requires ESLint 9 (`eslint-plugin-react` does not support ESLint 10 yet). All plugins are bundled as dependencies, so a project only needs `eslint` (and `typescript` for TS projects).

| Config        | Contents                                                                    |
|---------------|-----------------------------------------------------------------------------|
| `recommended` | `@eslint/js` recommended, `import-x`, stylistic rules (4 spaces, single quotes, `{a}` without spaces) |
| `typescript`  | `typescript-eslint` recommended for `*.ts`/`*.tsx`, TS import resolver      |
| `react`       | `eslint-plugin-react`, `react-hooks`, JSX style rules                       |

`typescript` and `react` are add-ons: always combine them with `recommended`.

## Installation

### Via Git tag (no token needed)

```sh
npm install --save-dev eslint@9 github:servusrene/eslint-config#1.0.0
```

npm builds the package automatically during installation (`prepare` script).

### Via GitHub Packages

GitHub Packages needs a token with `read:packages` to install, even for public packages. In the project's `.npmrc`:

```ini
@servusrene:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```sh
npm install --save-dev eslint@9 @servusrene/eslint-config
```

### Local development

```sh
cd eslint-config && npm install        # builds dist/
cd ../my-project && npm install --save-dev ../eslint-config
```

## Usage

`eslint.config.js` (or `eslint.config.ts` with `jiti` installed):

```js
import {configs} from '@servusrene/eslint-config';

export default [
    {ignores: ['dist/**']},
    ...configs.recommended,
    ...configs.typescript,
    ...configs.react
];
```

Individual configs are also available as subpaths: `@servusrene/eslint-config/recommended`, `/typescript`, `/react`.

## Release

1. Raise `version` in `package.json` and commit.
2. Create a GitHub release with the tag `<version>` without a `v` prefix (e.g. `1.0.0`).
3. The `release` workflow runs the tests and publishes to GitHub Packages.

## Development

```sh
npm run build      # src/*.ts -> dist/
npm test           # build + rule tests
npm run lint       # lints this repo with its own config
```

Every configured rule needs fixtures in `test/fixtures/rules/<javascript|typescript|react>/<rule-id>/`:
`invalid*.js` must report the rule, `valid*.js` must not (`.ts` for typescript, `.jsx` for react).
The test fails if a rule in a `servusrene/*` config block has no fixture folder.
File-specific behaviour (globals, CommonJS, resolver, …) is covered by `test/fixtures/scoping/`.

## License

[MIT](LICENSE) © servusrene
