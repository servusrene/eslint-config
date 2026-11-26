/**
 * React components are exported as default, never by name:
 *
 *     export const Badge: FC = () => <span />;     // error
 *     const Badge: FC = () => <span />;
 *     export default Badge;                        // ok
 *
 * A component is a PascalCase function, arrow function or `memo`/`forwardRef` call.
 * Named exports of anything else (types, constants, render helpers) stay allowed.
 */
import type {Rule} from 'eslint';

interface Node {
    type: string;
    name?: string;
    id?: Node | null;
    init?: Node | null;
    callee?: Node;
    property?: Node;
    arguments?: Node[];
    declaration?: Node | null;
    declarations?: Node[];
    specifiers?: Node[];
    local?: Node;
    exported?: Node;
    source?: Node | null;
}

const isPascalCase = (name: string | undefined): boolean => name !== undefined && /^[A-Z]/.test(name);
const wrappers = new Set(['memo', 'forwardRef']);

const calleeName = (callee: Node | undefined): string | undefined => {
    if (callee?.type === 'Identifier') {
        return callee.name;
    }
    if (callee?.type === 'MemberExpression') {
        return callee.property?.name;
    }
    return undefined;
};

const isComponentValue = (node: Node | null | undefined): boolean => {
    if (node === null || node === undefined) {
        return false;
    }
    if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') {
        return true;
    }
    if (node.type === 'CallExpression' && wrappers.has(calleeName(node.callee) ?? '')) {
        return isComponentValue(node.arguments?.[0]);
    }
    return false;
};

const rule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Require React components to be exported as default'
        },
        schema: [],
        messages: {
            defaultExport: 'Export the component `{{name}}` as default: `export default {{name}};`'
        }
    },
    create(context) {
        const components = new Set<string>();

        const collect = (node: Node): void => {
            if (node.type === 'FunctionDeclaration' && isPascalCase(node.id?.name)) {
                components.add(node.id!.name!);
            }
            if (node.type === 'VariableDeclaration') {
                for (const declarator of node.declarations ?? []) {
                    if (declarator.id?.type === 'Identifier' && isPascalCase(declarator.id.name) && isComponentValue(declarator.init)) {
                        components.add(declarator.id.name!);
                    }
                }
            }
        };

        const report = (node: Node, name: string): void => {
            context.report({node: node as Rule.Node, messageId: 'defaultExport', data: {name}});
        };

        return {
            'Program > FunctionDeclaration, Program > VariableDeclaration'(node: Rule.Node) {
                collect(node as Node);
            },
            ExportNamedDeclaration(node: Rule.Node) {
                const exported = node as Node;
                const declaration = exported.declaration;
                if (declaration?.type === 'FunctionDeclaration' && isPascalCase(declaration.id?.name)) {
                    report(declaration.id!, declaration.id!.name!);
                }
                if (declaration?.type === 'VariableDeclaration') {
                    for (const declarator of declaration.declarations ?? []) {
                        if (declarator.id?.type === 'Identifier' && isPascalCase(declarator.id.name) && isComponentValue(declarator.init)) {
                            report(declarator.id, declarator.id.name!);
                        }
                    }
                }
            },
            'Program:exit'() {
                const program = context.sourceCode.ast as unknown as {body: Node[]};
                for (const statement of program.body) {
                    if (statement.type !== 'ExportNamedDeclaration' || statement.source) {
                        continue;
                    }
                    for (const specifier of statement.specifiers ?? []) {
                        const local = specifier.local?.name;
                        if (local !== undefined && components.has(local) && specifier.exported?.name !== 'default') {
                            report(specifier, local);
                        }
                    }
                }
            }
        };
    }
};

export default rule;
