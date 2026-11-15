/**
 * Lossless-parse check for AMPscript blocks and inline expressions.
 *
 * `ampscript-parser` recovers from syntax errors silently: it closes a missing
 * `)`, ends an unterminated string, assumes a missing `then` and skips tokens
 * it cannot place — without reporting any of it. Printing such a tree would
 * rewrite what the author wrote.
 *
 * The check here rebuilds the token sequence that the syntax tree stands for
 * and compares it with the tokens that are really in the source. They only
 * match when the parser used every token and invented none; otherwise the
 * node has to be emitted verbatim.
 */

import { tokenizeBlock, TokenType } from 'ampscript-parser';

/**
 * Stands for the counter variable that may follow `next`. The parser accepts
 * and drops it, so it is allowed in the source but not required.
 */
const OPTIONAL_VARIABLE = 'OPTIONAL_VARIABLE';

const TRIVIA = new Set([TokenType.WHITESPACE, TokenType.NEWLINE]);

const COMPARISON_TOKENS = {
    '==': TokenType.EQ,
    '!=': TokenType.NEQ,
    '>': TokenType.GT,
    '<': TokenType.LT,
    '>=': TokenType.GTE,
    '<=': TokenType.LTE,
};

const RAW_STATEMENT_TOKENS = new Map([
    ['endif', TokenType.ENDIF],
    ['else', TokenType.ELSE],
    ['elseif', TokenType.ELSEIF],
    ['next', TokenType.NEXT],
    ['then', TokenType.THEN],
    ['do', TokenType.DO],
]);

const SCRIPT_OPEN_RE = /^<script\b[^>]*>/i;
const SCRIPT_CLOSE_RE = /<\/script\s*>$/i;

/**
 * Thrown while rebuilding the token sequence when the tree contains something
 * that only error recovery produces.
 */
class RecoveredParseError extends Error {}

/**
 * Appends the token types of an expression node.
 *
 * @param {object} node Expression node.
 * @param {string[]} out Receives the token types.
 * @returns {void}
 */
function pushExpression(node, out) {
    switch (node?.type) {
        case 'FunctionCall': {
            out.push(TokenType.IDENTIFIER, TokenType.LPAREN);
            for (const [index, argument] of node.arguments.entries()) {
                if (index > 0) {
                    out.push(TokenType.COMMA);
                }
                pushExpression(argument, out);
            }
            out.push(TokenType.RPAREN);
            return;
        }
        case 'ParenExpression': {
            out.push(TokenType.LPAREN);
            pushExpression(node.expression, out);
            out.push(TokenType.RPAREN);
            return;
        }
        case 'BinaryExpression': {
            const operator = node.operator.toLowerCase();
            pushExpression(node.left, out);
            if (operator === 'and') {
                out.push(TokenType.AND);
            } else if (operator === 'or') {
                out.push(TokenType.OR);
            } else {
                out.push(COMPARISON_TOKENS[operator]);
            }
            pushExpression(node.right, out);
            return;
        }
        case 'UnaryExpression': {
            out.push(TokenType.NOT);
            pushExpression(node.argument, out);
            return;
        }
        case 'Identifier': {
            out.push(TokenType.IDENTIFIER);
            return;
        }
        case 'Variable': {
            out.push(TokenType.VARIABLE);
            return;
        }
        case 'PersonalizationString': {
            out.push(TokenType.PERSONALIZATION);
            return;
        }
        case 'StringLiteral': {
            out.push(TokenType.STRING);
            return;
        }
        case 'NumberLiteral': {
            out.push(TokenType.NUMBER);
            return;
        }
        case 'BooleanLiteral': {
            out.push(TokenType.BOOLEAN);
            return;
        }
        default: {
            // `Raw` (a token that is no expression), `Empty` (nothing where an
            // expression belongs) or a statement in expression position.
            throw new RecoveredParseError(`unexpected ${node?.type} expression`);
        }
    }
}

/**
 * Appends the token types of a list of statements.
 *
 * @param {object[]} statements Statement nodes.
 * @param {string[]} out Receives the token types.
 * @returns {void}
 */
function pushStatements(statements, out) {
    for (const statement of statements) {
        pushStatement(statement, out);
    }
}

/**
 * Appends the token types of a statement node.
 *
 * @param {object} node Statement node.
 * @param {string[]} out Receives the token types.
 * @returns {void}
 */
function pushStatement(node, out) {
    switch (node?.type) {
        case 'Comment': {
            out.push(TokenType.COMMENT);
            return;
        }
        case 'VarDeclaration': {
            out.push(TokenType.VAR);
            for (let index = 0; index < node.variables.length; index++) {
                out.push(...(index > 0 ? [TokenType.COMMA] : []), TokenType.VARIABLE);
            }
            return;
        }
        case 'SetStatement': {
            if (!node.target) {
                throw new RecoveredParseError('set without a target');
            }
            out.push(TokenType.SET, TokenType.VARIABLE, TokenType.EQUALS);
            pushExpression(node.value, out);
            return;
        }
        case 'IfStatement': {
            out.push(TokenType.IF);
            pushExpression(node.condition, out);
            out.push(TokenType.THEN);
            pushStatements(node.consequent, out);
            for (const alternate of node.alternates) {
                if (alternate.type === 'ElseIfClause') {
                    out.push(TokenType.ELSEIF);
                    pushExpression(alternate.condition, out);
                    out.push(TokenType.THEN);
                } else {
                    out.push(TokenType.ELSE);
                }
                pushStatements(alternate.body, out);
            }
            // No `endif` is fine: it may sit in a later block.
            if ('endif' in node.originalKeywords) {
                out.push(TokenType.ENDIF);
            }
            return;
        }
        case 'ForStatement': {
            const keywords = node.originalKeywords;
            if (!node.counter || !('direction' in keywords) || !('do' in keywords)) {
                throw new RecoveredParseError('incomplete for statement');
            }
            out.push(TokenType.FOR, TokenType.VARIABLE, TokenType.EQUALS);
            pushExpression(node.startExpr, out);
            out.push(node.direction === 'downto' ? TokenType.DOWNTO : TokenType.TO);
            pushExpression(node.endExpr, out);
            out.push(TokenType.DO);
            pushStatements(node.body, out);
            // No `next` is fine: it may sit in a later block.
            if ('next' in keywords) {
                out.push(TokenType.NEXT, OPTIONAL_VARIABLE);
            }
            return;
        }
        case 'ExpressionStatement': {
            pushExpression(node.expression, out);
            return;
        }
        case 'RawStatement': {
            // A closing or continuing keyword whose opener sits in an earlier block.
            const keyword = String(node.value).toLowerCase();
            out.push(RAW_STATEMENT_TOKENS.get(keyword));
            if (keyword === 'next') {
                out.push(OPTIONAL_VARIABLE);
            }
            return;
        }
        default: {
            // An inline expression holds a bare expression instead of a statement.
            pushExpression(node, out);
        }
    }
}

/**
 * Works out which part of a Block / InlineExpression node is AMPscript code,
 * i.e. the text between its delimiters.
 *
 * @param {object} node Block or InlineExpression node.
 * @param {string} text Full source text.
 * @returns {string|undefined} The code, or `undefined` when the closing
 * delimiter is missing.
 */
function getCode(node, text) {
    if (node.syntax === 'script-tag') {
        const source = text.slice(node.start, node.end);
        const open = SCRIPT_OPEN_RE.exec(source);
        const close = SCRIPT_CLOSE_RE.exec(source);
        return open && close ? source.slice(open[0].length, close.index) : undefined;
    }
    // The parser moves past a closing delimiter even when the text ends first.
    return node.end > text.length ? undefined : text.slice(node.start + 3, node.end - 3);
}

/**
 * Tells whether the parser understood a Block / InlineExpression node without
 * error recovery, so that printing its syntax tree cannot change the code.
 *
 * @param {object} node Block or InlineExpression node.
 * @param {string} text Full source text the node was parsed from.
 * @returns {boolean} `false` when the node must be emitted verbatim.
 */
export function isLosslessParse(node, text) {
    const code = getCode(node, text);
    if (code === undefined) {
        return false;
    }

    const actual = [];
    for (const token of tokenizeBlock(code)) {
        if (TRIVIA.has(token.type)) {
            continue;
        }
        const isUnterminatedString =
            token.type === TokenType.STRING &&
            (token.value.length < 2 || token.value.at(-1) !== token.value[0]);
        if (isUnterminatedString) {
            return false;
        }
        actual.push(token.type);
    }

    const expected = [];
    try {
        if (node.type === 'Block') {
            pushStatements(node.statements, expected);
        } else if (node.expression) {
            pushStatement(node.expression, expected);
        }
    } catch (error) {
        if (error instanceof RecoveredParseError) {
            return false;
        }
        throw error;
    }

    let position = 0;
    for (const type of expected) {
        if (type === OPTIONAL_VARIABLE) {
            if (actual[position] === TokenType.VARIABLE) {
                position++;
            }
        } else if (actual[position] === type) {
            position++;
        } else {
            return false;
        }
    }
    return position === actual.length;
}
