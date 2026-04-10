/**
 * AMPscript Printer
 *
 * Converts the AMPscript AST into Prettier's intermediate Doc representation.
 * Uses Prettier's recursive print callback for child traversal so that
 * hasPrettierIgnore, comment attachment, and embed work on all nodes.
 */

import * as prettier from 'prettier';
import { FUNCTION_CANONICAL_MAP, AMPSCRIPT_KEYWORDS } from 'ampscript-data';

const { group, indent, join, line, softline, hardline } = prettier.doc.builders;

/**
 * Collect all variable names in first-occurrence order for consistent casing.
 *
 * @param node
 */
function collectVariableMap(node) {
    const map = new Map(); // lowercase -> first-seen casing

    function walk(n) {
        if (!n || typeof n !== 'object') {
            return;
        }

        if (n.type === 'Variable' && n.value) {
            const lower = n.value.toLowerCase();
            if (!map.has(lower)) {
                map.set(lower, n.value);
            }
        }

        if (Array.isArray(n.children)) {
            n.children.forEach(walk);
        }
        if (Array.isArray(n.statements)) {
            n.statements.forEach(walk);
        }
        if (n.target) {
            walk(n.target);
        }
        if (n.value && typeof n.value === 'object') {
            walk(n.value);
        }
        if (n.expression) {
            walk(n.expression);
        }
        if (n.condition) {
            walk(n.condition);
        }
        if (n.left) {
            walk(n.left);
        }
        if (n.right) {
            walk(n.right);
        }
        if (n.argument) {
            walk(n.argument);
        }
        if (Array.isArray(n.arguments)) {
            n.arguments.forEach(walk);
        }
        if (Array.isArray(n.variables)) {
            n.variables.forEach(walk);
        }
        if (Array.isArray(n.consequent)) {
            n.consequent.forEach(walk);
        }
        if (Array.isArray(n.alternates)) {
            for (const alt of n.alternates) {
                if (alt.condition) {
                    walk(alt.condition);
                }
                if (Array.isArray(alt.body)) {
                    alt.body.forEach(walk);
                }
            }
        }
        if (Array.isArray(n.body)) {
            n.body.forEach(walk);
        }
        if (n.counter) {
            walk(n.counter);
        }
        if (n.startExpr) {
            walk(n.startExpr);
        }
        if (n.endExpr) {
            walk(n.endExpr);
        }
    }

    walk(node);
    return map;
}

/**
 * Detect needless parentheses around a single variable or literal.
 *
 * @param node
 */
function isNeedlessParenExpression(node) {
    if (node.type !== 'ParenExpression') {
        return false;
    }
    const inner = node.expression;
    return (
        inner.type === 'Variable' ||
        inner.type === 'StringLiteral' ||
        inner.type === 'NumberLiteral' ||
        inner.type === 'BooleanLiteral' ||
        inner.type === 'Identifier'
    );
}

const OPERATOR_PRECEDENCE = {
    or: 1,
    and: 2,
    not: 3,
    '==': 4,
    '!=': 4,
    '<': 4,
    '>': 4,
    '<=': 4,
    '>=': 4,
};

function getOperatorPrecedence(op) {
    return OPERATOR_PRECEDENCE[op.toLowerCase()] || 0;
}

/**
 * Context-aware check for whether a ParenExpression's parens can be removed.
 * Covers simple atoms, function calls, nested parens, statement-level
 * positions, and precedence-based removal inside binary expressions.
 *
 * @param path
 * @param node
 */
function canRemoveParens(path, node) {
    const inner = node.expression;

    if (isNeedlessParenExpression(node)) {
        return true;
    }

    if (inner.type === 'FunctionCall' || inner.type === 'ParenExpression') {
        return true;
    }

    const parent = path.getParentNode();
    if (!parent) {
        return false;
    }

    const STATEMENT_PARENTS = [
        'SetStatement',
        'IfStatement',
        'ElseIfClause',
        'ExpressionStatement',
        'ForStatement',
        'InlineExpression',
    ];
    if (STATEMENT_PARENTS.includes(parent.type)) {
        return true;
    }

    if (parent.type === 'BinaryExpression') {
        const parentPrec = getOperatorPrecedence(parent.operator);

        if (inner.type === 'BinaryExpression') {
            return getOperatorPrecedence(inner.operator) > parentPrec;
        }
        if (inner.type === 'UnaryExpression') {
            return getOperatorPrecedence(inner.operator) > parentPrec;
        }
    }

    return false;
}

/**
 * Build the Doc for a single AST node using Prettier's recursive print
 * callback so that hasPrettierIgnore, comment attachment, and embed
 * processing are applied to every child node.
 *
 * @param {import("prettier").AstPath} path
 * @param {object} options Merged Prettier + plugin options
 * @param {function} print Prettier recursive print callback
 */
function printAmpscriptNode(path, options, print) {
    const node = path.node;
    if (!node) {
        return '';
    }

    const variableMap = options.__ampscriptVariableMap || new Map();
    const enforceSpacing = options.ampscriptSpacing;
    const quoteChar = options.ampscriptQuoteStyle === 'single' ? "'" : '"';
    const enforceCasing = options.ampscriptEnforceVariableCasing;
    const removeBrackets = options.ampscriptRemoveUnnecessaryBrackets;
    const variableStyle = options.ampscriptVarDeclarationStyle || 'auto';
    const keywordCase = options.ampscriptKeywordCase || 'lower';
    const functionCase = options.ampscriptFunctionCase || 'upper-camel';
    const blockLineBreaks = options.ampscriptBlockLineBreaks !== false;

    function resolveVariable(variableName) {
        if (!enforceCasing) {
            return variableName;
        }
        const lower = variableName.toLowerCase();
        return variableMap.get(lower) || variableName;
    }

    /**
     * Apply keyword casing rule. Pass originalText for preserve mode.
     *
     * @param keyword
     * @param originalText
     */
    function kw(keyword, originalText) {
        if (keywordCase === 'upper') {
            return keyword.toUpperCase();
        }
        if (keywordCase === 'lower') {
            return keyword.toLowerCase();
        }
        return originalText || keyword;
    }

    /**
     * Apply function casing rule
     *
     * @param name
     */
    function function_(name) {
        if (functionCase === 'preserve') {
            return name;
        }
        if (functionCase === 'upper') {
            return name.toUpperCase();
        }
        if (functionCase === 'lower') {
            return name.toLowerCase();
        }
        const canonical = FUNCTION_CANONICAL_MAP.get(name.toLowerCase()) || name;
        if (functionCase === 'lower-camel') {
            return canonical[0].toLowerCase() + canonical.slice(1);
        }
        return canonical;
    }

    function printString(content, originalQuote) {
        const altChar = quoteChar === "'" ? '"' : "'";
        if (content.includes(quoteChar)) {
            if (!content.includes(altChar)) {
                return [altChar, content, altChar];
            }
            const safeQuote = originalQuote || quoteChar;
            return [safeQuote, content, safeQuote];
        }
        return [quoteChar, content, quoteChar];
    }

    switch (node.type) {
        case 'Document': {
            return path.map(print, 'children');
        }

        case 'Content': {
            return node.value;
        }

        case 'Block': {
            const stmts = path.map(print, 'statements');
            const stmtNodes = node.statements;
            const body = [];
            for (const [index, stmt] of stmts.entries()) {
                if (index > 0) {
                    body.push(hardline);
                    if (stmtNodes[index] && stmtNodes[index].blankLineBefore) {
                        body.push(hardline);
                    }
                }
                body.push(stmt);
            }
            const isScriptTag = node.syntax === 'script-tag';
            const blockOpen = isScriptTag ? '<script runat="server" language="ampscript">' : '%%[';
            const blockClose = isScriptTag ? '</script>' : ']%%';
            const blockDocument = group([
                blockOpen,
                indent([hardline, ...body]),
                hardline,
                blockClose,
            ]);
            if (blockLineBreaks) {
                return [hardline, blockDocument, hardline];
            }
            return blockDocument;
        }

        case 'InlineExpression': {
            const expr = print('expression');
            if (enforceSpacing) {
                return ['%%= ', expr, ' =%%'];
            }
            return ['%%=', expr, '=%%'];
        }

        case 'Comment': {
            return node.value;
        }

        case 'VarDeclaration': {
            const variables = path.map(print, 'variables');
            if (variableStyle === 'multi-line') {
                return [
                    kw('var', node.originalKeyword),
                    ' ',
                    indent(join([',', hardline], variables)),
                ];
            }
            if (variableStyle === 'single-line') {
                return [kw('var', node.originalKeyword), ' ', join(', ', variables)];
            }
            return group([
                kw('var', node.originalKeyword),
                ' ',
                indent(join([',', line], variables)),
            ]);
        }

        case 'SetStatement': {
            const target = node.target ? resolveVariable(node.target.value) : '';
            const value = print('value');
            return group([
                kw('set', node.originalKeyword),
                ' ',
                target,
                ' =',
                indent([line, value]),
            ]);
        }

        case 'IfStatement': {
            const okw = node.originalKeywords || {};
            const parts = [];
            parts.push(
                group([kw('if', okw.if), ' ', print('condition'), ' ', kw('then', okw.then)]),
            );
            if (node.consequent.length > 0) {
                parts.push(indent([hardline, join(hardline, path.map(print, 'consequent'))]));
            }
            const altDocs = path.map(print, 'alternates');
            for (const altDocument of altDocs) {
                parts.push(altDocument);
            }
            parts.push([hardline, kw('endif', okw.endif)]);
            return parts;
        }

        case 'ElseIfClause': {
            const akw = node.originalKeywords || {};
            const parts = [];
            parts.push(
                group([
                    hardline,
                    kw('elseif', akw.elseif),
                    ' ',
                    print('condition'),
                    ' ',
                    kw('then', akw.then),
                ]),
            );
            if (node.body.length > 0) {
                parts.push(indent([hardline, join(hardline, path.map(print, 'body'))]));
            }
            return parts;
        }

        case 'ElseClause': {
            const akw = node.originalKeywords || {};
            const parts = [];
            parts.push([hardline, kw('else', akw.else)]);
            if (node.body.length > 0) {
                parts.push(indent([hardline, join(hardline, path.map(print, 'body'))]));
            }
            return parts;
        }

        case 'ForStatement': {
            const okw = node.originalKeywords || {};
            const counterDocument = node.counter ? print('counter') : '';
            const startDocument = print('startExpr');
            const endDocument = print('endExpr');
            const dir = kw(node.direction, okw.direction);
            const parts = [];
            parts.push([
                kw('for', okw.for),
                ' ',
                counterDocument,
                ' = ',
                startDocument,
                ' ',
                dir,
                ' ',
                endDocument,
                ' ',
                kw('do', okw.do),
            ]);
            if (node.body.length > 0) {
                parts.push(indent([hardline, join(hardline, path.map(print, 'body'))]));
            }
            parts.push([hardline, kw('next', okw.next), ' ', counterDocument]);
            return parts;
        }

        case 'ExpressionStatement': {
            return print('expression');
        }

        case 'FunctionCall': {
            const arguments_ = path.map(print, 'arguments');
            const functionName = function_(node.name);
            return group([
                functionName,
                '(',
                indent([softline, join([',', line], arguments_)]),
                softline,
                ')',
            ]);
        }

        case 'Variable': {
            return resolveVariable(node.value);
        }

        case 'Identifier': {
            return node.value;
        }

        case 'StringLiteral': {
            return printString(node.value, node.quote);
        }

        case 'NumberLiteral': {
            return node.value;
        }

        case 'BooleanLiteral': {
            return kw(node.value, node.originalValue);
        }

        case 'BinaryExpression': {
            const left = print('left');
            const right = print('right');
            const opLower = node.operator.toLowerCase();
            const op = AMPSCRIPT_KEYWORDS.includes(opLower)
                ? kw(node.operator, node.originalOperator)
                : node.operator;
            if (opLower === 'and' || opLower === 'or') {
                return group([left, indent([line, op, ' ', right])]);
            }
            return group([left, ' ', op, ' ', right]);
        }

        case 'UnaryExpression': {
            const argument = print('argument');
            return [kw(node.operator, node.originalOperator), ' ', argument];
        }

        case 'ParenExpression': {
            if (removeBrackets && canRemoveParens(path, node)) {
                return print('expression');
            }
            return ['(', print('expression'), ')'];
        }

        case 'RawStatement': {
            return kw(node.value.toLowerCase(), node.keyword);
        }

        case 'Raw': {
            return node.value;
        }

        case 'Empty': {
            return '';
        }

        default: {
            return '';
        }
    }
}

export {
    printAmpscriptNode,
    collectVariableMap,
    isNeedlessParenExpression,
    canRemoveParens,
    getOperatorPrecedence,
};
