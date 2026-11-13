/**
 * JSX that is returned (`return <X />` or `() => <X />`) must always be wrapped
 * in parentheses on their own lines, even when it fits on a single line:
 *
 *     return (
 *         <X />
 *     );
 *
 *     const Foo = () => (
 *         <X />
 *     );
 *
 * This also applies to JSX in ternary branches of a returned value (at any depth):
 *
 *     return a ? (
 *         <X />
 *     ) : null;
 *
 * Non-JSX return values like `() => a + b` are not affected.
 */
import type {AST, Rule} from 'eslint';

const isJsx = (node: {type: string}): boolean => node.type === 'JSXElement' || node.type === 'JSXFragment';

const rule: Rule.RuleModule = {
    meta: {
        type: 'layout',
        fixable: 'code',
        docs: {
            description: 'Require returned JSX to be wrapped in parentheses on their own lines'
        },
        schema: [],
        messages: {
            missingParens: 'Returned JSX must be wrapped in parentheses: `(` and `)` on their own lines.',
            parensNewLine: 'Returned JSX must start on a new line after `(` and `)` must be on its own line.'
        }
    },
    create(context) {
        const {sourceCode} = context;

        const check = (node: Rule.Node, keyword: AST.Token | null): void => {
            const before = sourceCode.getTokenBefore(node);
            const after = sourceCode.getTokenAfter(node);
            const wrapped = before?.value === '(' && after?.value === ')'
                && sourceCode.getTokenBefore(before) === keyword;

            if (!wrapped) {
                context.report({
                    node,
                    messageId: 'missingParens',
                    fix: (fixer) => [
                        fixer.insertTextBefore(node, '(\n'),
                        fixer.insertTextAfter(node, '\n)')
                    ]
                });
                return;
            }

            const openOnOwnLine = before.loc.end.line < node.loc!.start.line;
            const closeOnOwnLine = after.loc.start.line > node.loc!.end.line;
            if (!openOnOwnLine || !closeOnOwnLine) {
                context.report({
                    node,
                    messageId: 'parensNewLine',
                    fix: (fixer) => [
                        ...openOnOwnLine ? [] : [fixer.insertTextAfter(before, '\n')],
                        ...closeOnOwnLine ? [] : [fixer.insertTextBefore(after, '\n')]
                    ]
                });
            }
        };

        /**
         * Checks returned JSX and recurses into ternary branches.
         * `opener` is the token that must directly precede the wrapping `(`.
         */
        const visit = (node: Rule.Node, opener: AST.Token | null): void => {
            if (isJsx(node)) {
                check(node, opener);
            } else if (node.type === 'ConditionalExpression') {
                const consequent = node.consequent as Rule.Node;
                const alternate = node.alternate as Rule.Node;
                visit(consequent, sourceCode.getTokenBefore(consequent, (token) => token.value === '?'));
                visit(alternate, sourceCode.getTokenBefore(alternate, (token) => token.value === ':'));
            }
        };

        return {
            ReturnStatement(node) {
                if (node.argument) {
                    visit(node.argument as Rule.Node, sourceCode.getFirstToken(node));
                }
            },
            ArrowFunctionExpression(node) {
                if (node.expression) {
                    const body = node.body as Rule.Node;
                    visit(body, sourceCode.getTokenBefore(body, (token) => token.value === '=>'));
                }
            }
        };
    }
};

export default rule;
