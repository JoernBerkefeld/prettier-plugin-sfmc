/**
 * prettier-plugin-sfmc
 *
 * A unified Prettier plugin for Salesforce Marketing Cloud.
 * Handles AMPscript formatting (.ampscript, .amp, .html), SSJS file
 * registration (.ssjs), and SQL (.sql) via composed prettier-plugin-sql.
 * Re-exports Prettier’s `estree` printer so `defaultOptions` apply to JS/SSJS.
 *
 * Exports: languages, parsers, printers, options, defaultOptions
 * Following the Prettier v3 plugin API (ESM).
 */

import { parse } from 'ampscript-parser';
import sqlPlugin from 'prettier-plugin-sql';
import { printers as prettierEstreePrinters } from 'prettier/plugins/estree';
import { printAmpscriptNode, collectVariableMap } from './printer.js';
import * as prettier from 'prettier';

/**
 * Clone sql plugin option descriptors and set SFMC-friendly defaults.
 *
 * @param {Record<string, object>} sqlOptions
 * @returns {Record<string, object>} Option map with adjusted defaults.
 */
function mergeSqlOptionsWithSfmcDefaults(sqlOptions) {
    /** @type {Record<string, object>} */
    const merged = {};
    for (const [key, descriptor] of Object.entries(sqlOptions)) {
        merged[key] = { ...descriptor };
    }
    const defaults = {
        language: 'tsql',
        keywordCase: 'upper',
        functionCase: 'upper',
        identifierCase: 'preserve',
        dataTypeCase: 'preserve',
    };
    for (const [key, defaultValue] of Object.entries(defaults)) {
        if (merged[key]) {
            merged[key].default = defaultValue;
        }
    }
    return merged;
}

// ── Languages ────────────────────────────────────────────────────────────────

export const languages = [
    {
        name: 'AMPscript',
        parsers: ['ampscript-parse'],
        extensions: ['.ampscript', '.amp', '.html'],
        vscodeLanguageIds: ['ampscript'],
    },
    {
        name: 'SSJS',
        parsers: ['babel'],
        extensions: ['.ssjs'],
        vscodeLanguageIds: ['ssjs'],
    },
    ...sqlPlugin.languages,
];

// ── Parsers ──────────────────────────────────────────────────────────────────

const PRAGMA_RE = /^\s*\/\*\*?\s*@(?:format|prettier)\s*\*\//;

export const parsers = {
    ...sqlPlugin.parsers,
    'ampscript-parse': {
        parse(text) {
            return parse(text);
        },
        astFormat: 'ampscript-ast',
        locStart(node) {
            return node.start;
        },
        locEnd(node) {
            return node.end;
        },
        hasPragma(text) {
            const blockOpen = text.indexOf('%%[');
            if (blockOpen !== -1) {
                const blockClose = text.indexOf(']%%', blockOpen);
                if (blockClose !== -1) {
                    const blockContent = text.slice(blockOpen + 3, blockClose);
                    if (PRAGMA_RE.test(blockContent)) {
                        return true;
                    }
                }
            }
            return PRAGMA_RE.test(text);
        },
    },
};

// ── Printers ─────────────────────────────────────────────────────────────────

export const printers = {
    ...sqlPlugin.printers,
    estree: prettierEstreePrinters.estree,
    'ampscript-ast': {
        print(path, options, print) {
            const node = path.node;

            if (node.type === 'Document' && !options.__ampscriptVariableMap) {
                options.__ampscriptVariableMap = collectVariableMap(node);
            }

            return printAmpscriptNode(path, options, print);
        },

        embed(path, options) {
            const node = path.node;
            if (node.type !== 'Document') {
                return;
            }

            const hasHtml = node.children.some(
                (c) => c.type === 'Content' && /<[a-zA-Z!/]/.test(c.value),
            );
            if (!hasHtml) {
                return;
            }

            return async (textToDocument, print) => {
                if (!options.__ampscriptVariableMap) {
                    options.__ampscriptVariableMap = collectVariableMap(node);
                }

                const PH = 'AMPSCRIPTPH';
                const htmlParts = [];

                for (let index = 0; index < node.children.length; index++) {
                    const child = node.children[index];
                    if (child.type === 'Content') {
                        htmlParts.push(child.value);
                    } else {
                        htmlParts.push(`${PH}${index}END`);
                    }
                }

                const html = htmlParts.join('');

                let htmlDocument;
                try {
                    htmlDocument = await textToDocument(html, { parser: 'html' });
                } catch {
                    return;
                }

                const re = new RegExp(String.raw`${PH}(\d+)END`, 'g');
                return prettier.doc.utils.mapDoc(htmlDocument, (d) => {
                    if (typeof d !== 'string') {
                        return d;
                    }
                    if (!d.includes(PH)) {
                        return d;
                    }

                    const parts = [];
                    let last = 0;
                    let m;
                    re.lastIndex = 0;
                    while ((m = re.exec(d)) !== null) {
                        if (m.index > last) {
                            parts.push(d.slice(last, m.index));
                        }
                        parts.push(print(['children', Number.parseInt(m[1], 10)]));
                        last = m.index + m[0].length;
                    }
                    if (last < d.length) {
                        parts.push(d.slice(last));
                    }
                    return parts.length === 1 ? parts[0] : parts;
                });
            };
        },

        insertPragma(text) {
            return '%%[ /** @format */ ]%%\n' + text;
        },

        canAttachComment(node) {
            return node.type && node.type !== 'Comment' && node.type !== 'Content';
        },

        isBlockComment(comment) {
            return comment.type === 'Comment';
        },

        printComment(path) {
            const comment = path.node;
            if (comment.type === 'Comment') {
                return comment.value;
            }
            return '';
        },

        hasPrettierIgnore(path) {
            return path.node && path.node.prettierIgnore === true;
        },

        getVisitorKeys(node) {
            switch (node.type) {
                case 'Document': {
                    return ['children'];
                }
                case 'Block': {
                    return ['statements'];
                }
                case 'InlineExpression': {
                    return ['expression'];
                }
                case 'IfStatement': {
                    return ['condition', 'consequent', 'alternates'];
                }
                case 'ElseIfClause': {
                    return ['condition', 'body'];
                }
                case 'ElseClause': {
                    return ['body'];
                }
                case 'ForStatement': {
                    return ['counter', 'startExpr', 'endExpr', 'body'];
                }
                case 'SetStatement': {
                    return ['target', 'value'];
                }
                case 'VarDeclaration': {
                    return ['variables'];
                }
                case 'ExpressionStatement': {
                    return ['expression'];
                }
                case 'FunctionCall': {
                    return ['arguments'];
                }
                case 'BinaryExpression': {
                    return ['left', 'right'];
                }
                case 'UnaryExpression': {
                    return ['argument'];
                }
                case 'ParenExpression': {
                    return ['expression'];
                }
                default: {
                    return [];
                }
            }
        },
    },
};

// ── Options ──────────────────────────────────────────────────────────────────

const sfmcOptions = {
    ampscriptSpacing: {
        type: 'boolean',
        category: 'AMPscript',
        default: true,
        description:
            'Enforce consistent spacing around operators and inside inline expressions. ' +
            'When true, prints `%%= v(@name) =%%` instead of `%%=v(@name)=%%`.',
    },
    ampscriptEnforceVariableCasing: {
        type: 'boolean',
        category: 'AMPscript',
        default: true,
        description:
            'Enforce consistent casing for AMPscript variables. ' +
            'When true, all occurrences of a variable will use the casing from ' +
            'its first appearance in the file.',
    },
    ampscriptRemoveUnnecessaryBrackets: {
        type: 'boolean',
        category: 'AMPscript',
        default: true,
        description:
            'Automatically remove parentheses where they are not needed. ' +
            'For example, `(@name)` becomes `@name` when the parens add no grouping value. ' +
            'When false, unnecessary brackets are preserved as-is.',
    },
    ampscriptQuoteStyle: {
        type: 'choice',
        category: 'AMPscript',
        default: 'single',
        choices: [
            {
                value: 'double',
                description: 'Use double quotes for strings: "value"',
            },
            {
                value: 'single',
                description: "Use single quotes for strings: 'value'",
            },
        ],
        description: 'Select whether strings should be wrapped in single or double quotes.',
    },
    ampscriptKeywordCase: {
        type: 'choice',
        category: 'AMPscript',
        default: 'lower',
        choices: [
            { value: 'lower', description: 'Lowercase keywords: if, set, var, for' },
            { value: 'upper', description: 'Uppercase keywords: IF, SET, VAR, FOR' },
            { value: 'preserve', description: 'Keep original keyword casing' },
        ],
        description: 'Control the casing of AMPscript keywords (if, else, set, var, for, etc.).',
    },
    ampscriptFunctionCase: {
        type: 'choice',
        category: 'AMPscript',
        default: 'upper-camel',
        choices: [
            {
                value: 'upper-camel',
                description: 'Canonical PascalCase: Lookup, ContentBlockByKey',
            },
            {
                value: 'lower-camel',
                description: 'camelCase: lookup, contentBlockByKey',
            },
            { value: 'upper', description: 'UPPERCASE: LOOKUP, CONTENTBLOCKBYKEY' },
            { value: 'lower', description: 'lowercase: lookup, contentblockbykey' },
            { value: 'preserve', description: 'Keep original function casing' },
        ],
        description:
            'Control the casing of AMPscript function names. ' +
            '"upper-camel" uses the canonical PascalCase form of each function name.',
    },
    ampscriptBlockLineBreaks: {
        type: 'boolean',
        category: 'AMPscript',
        default: false,
        description:
            'When true, insert line breaks before and after %%[ ... ]%% blocks only when the ' +
            'opening/closing delimiters are not already at a line boundary in the source. ' +
            'Inline expressions (%%= ... =%%) are never affected. ' +
            'Default is false to avoid surprising line breaks in SMS and similar contexts.',
    },
    ampscriptVarDeclarationStyle: {
        type: 'choice',
        category: 'AMPscript',
        default: 'multi-line',
        choices: [
            {
                value: 'auto',
                description:
                    'Let Prettier decide based on printWidth: single line when it fits, otherwise break after each comma.',
            },
            {
                value: 'single-line',
                description: 'Always place all variables on one line: var @a, @b, @c',
            },
            {
                value: 'multi-line',
                description:
                    'Always break after each comma: one `var` keyword, variables listed on separate lines.',
            },
        ],
        description: 'Control how var declarations with multiple variables are formatted.',
    },
};

export const options = {
    ...mergeSqlOptionsWithSfmcDefaults(sqlPlugin.options),
    ...sfmcOptions,
};

// ── Default Options ──────────────────────────────────────────────────────────

export const defaultOptions = {
    useTabs: false,
    tabWidth: 4,
    printWidth: 100,
    singleQuote: true,
    trailingComma: 'none',
};
