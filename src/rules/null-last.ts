/**
 * `null` must always be the last branch of a ternary:
 *
 *     a ? null : value     // error
 *     !a ? value : null    // ok
 *
 * Applies to every ternary: returns, JSX children, assignments, arguments, ...
 * The autofix negates the condition and swaps the branches; it is skipped
 * when the other branch is itself a ternary (reported only).
 */
import type {AST, Rule} from 'eslint';

interface Node {
    type: string;
    range?: [number, number];
    value?: unknown;
    raw?: string;
    operator?: string;
    argument?: Node;
    left?: Node;
    right?: Node;
    test?: Node;
    consequent?: Node;
    alternate?: Node;
}

const isNull = (node: Node): boolean => node.type === 'Literal' && node.value === null && node.raw === 'null';

const flippedOperators: Record<string, string> = {'===': '!==', '!==': '===', '==': '!=', '!=': '=='};
const simpleTests = new Set(['Identifier', 'MemberExpression', 'CallExpression', 'ChainExpression', 'ThisExpression']);
const lowPrecedence = new Set(['AssignmentExpression', 'SequenceExpression', 'ConditionalExpression', 'ArrowFunctionExpression', 'YieldExpression']);

const rule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        fixable: 'code',
        docs: {
            description: 'Require `null` to be the last branch of a ternary'
        },
        schema: [],
        messages: {
            nullLast: '`null` must be the last branch: use `!condition ? value : null` instead of `condition ? null : value`.'
        }
    },
    create(context) {
        const {sourceCode} = context;
        const text = (start: number, end: number): string => sourceCode.text.slice(start, end).trim();

        const negate = (test: Node, start: number, end: number): string => {
            const source = text(start, end);
            const exact = source === sourceCode.getText(test as Rule.Node);
            if (exact && test.type === 'UnaryExpression' && test.operator === '!') {
                const bang = sourceCode.getFirstToken(test as Rule.Node)!;
                const argument = text(bang.range[1], end);
                return lowPrecedence.has(test.argument!.type) && !argument.startsWith('(') ? `(${argument})` : argument;
            }
            if (exact && test.type === 'BinaryExpression' && flippedOperators[test.operator!]) {
                const operator = sourceCode.getFirstTokenBetween(
                    test.left as Rule.Node,
                    test.right as Rule.Node,
                    (token) => token.value === test.operator
                )!;
                return text(start, operator.range[0]) + ` ${flippedOperators[test.operator!]} ` + text(operator.range[1], end);
            }
            return exact && simpleTests.has(test.type) ? `!${source}` : `!(${source})`;
        };

        return {
            ConditionalExpression(conditional) {
                const node = conditional as Node;
                const {test, consequent, alternate} = node as Required<Node>;
                if (!isNull(consequent) || isNull(alternate)) {
                    return;
                }
                const question = sourceCode.getTokenBefore(consequent as Rule.Node, (token) => token.value === '?') as AST.Token;
                const colon = sourceCode.getTokenBefore(alternate as Rule.Node, (token) => token.value === ':') as AST.Token;
                const [start, end] = node.range!;
                context.report({
                    node: consequent as Rule.Node,
                    messageId: 'nullLast',
                    fix: alternate.type !== 'ConditionalExpression' ? (fixer) => fixer.replaceTextRange(
                        [start, end],
                        `${negate(test, start, question.range[0])} ? ${text(colon.range[1], end)} : ${text(question.range[1], colon.range[0])}`
                    ) : null
                });
            }
        };
    }
};

export default rule;
