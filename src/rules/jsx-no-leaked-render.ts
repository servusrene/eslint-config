/**
 * Reports `&&` and `||` expressions whose result is rendered as a JSX child,
 * including when they are nested in ternary branches or logical chains:
 *
 *     {a && <X />}
 *     {error ? <E /> : isLoaded && data && <X />}
 *
 * A falsy left side like `0` or `''` would otherwise be rendered.
 * @link https://stackoverflow.com/q/53048037
 */
import type {Rule} from 'eslint';

/** Minimal node shape: ESTree types do not include JSX nodes. */
interface Node {
    type: string;
    parent?: Node | null;
    test?: Node;
    left?: Node;
    right?: Node;
}

const isRenderedJsxChild = (start: Node): boolean => {
    let node = start;
    let parent = node.parent;
    while (parent) {
        if (parent.type === 'ConditionalExpression' && parent.test !== node) {
            node = parent;
        } else if (parent.type === 'LogicalExpression' && parent.right === node) {
            node = parent;
        } else if (parent.type === 'JSXExpressionContainer') {
            const owner = parent.parent;
            return owner?.type === 'JSXElement' || owner?.type === 'JSXFragment';
        } else {
            return false;
        }
        parent = node.parent;
    }
    return false;
};

const rule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow `&&` and `||` expressions that may render falsy values like 0 as JSX children'
        },
        schema: [],
        messages: {
            and: 'Please use `condition ? <Jsx /> : null`. Otherwise, there is a chance of rendering \'0\' instead of \'\' in some cases.',
            or: 'Please use `value ?? fallbackValue`. Otherwise, there is a chance of rendering \'0\' instead of \'\' in some cases.'
        }
    },
    create(context) {
        return {
            LogicalExpression(node) {
                if (node.operator === '??') {
                    return;
                }
                // `a && b && <X />` is reported once, on the outermost expression.
                if (node.parent.type === 'LogicalExpression' && node.parent.left === node && node.parent.operator === node.operator) {
                    return;
                }
                if (isRenderedJsxChild(node as Node)) {
                    context.report({node, messageId: node.operator === '&&' ? 'and' : 'or'});
                }
            }
        };
    }
};

export default rule;
