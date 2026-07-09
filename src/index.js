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
import { getHelper } from 'handlebars-data';
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
        if (Object.hasOwn(merged, key)) {
            merged[key].default = defaultValue;
        }
    }
    return merged;
}

// ── Handlebars (MCN) inner normalization ─────────────────────────────────────

/**
 * Recase a Handlebars helper name using the `handlebars-data` catalog.
 *
 * Only names that exist in the catalog (via `getHelper`) are recased; unknown
 * paths (`firstName`, `item.title`) are returned unchanged in every mode. MCN
 * Handlebars is case-insensitive at runtime, so recasing a known helper is safe.
 * Catalog names are lower-camel canonical (e.g. `formatDate`), so `upper-camel`
 * simply capitalizes the first character of the canonical form.
 *
 * @param {string} name Head token as written in the source.
 * @param {'upper-camel'|'lower-camel'|'upper'|'lower'|'preserve'} mode Casing mode.
 * @returns {string} Recased name, or the original `name` when not a known helper.
 */
function applyHelperCase(name, mode) {
    if (mode === 'preserve') {
        return name;
    }
    const helper = getHelper(name);
    if (!helper) {
        return name;
    }
    const canonical = helper.name;
    if (mode === 'upper') {
        return canonical.toUpperCase();
    }
    if (mode === 'lower') {
        return canonical.toLowerCase();
    }
    if (mode === 'lower-camel') {
        return canonical[0].toLowerCase() + canonical.slice(1);
    }
    // upper-camel
    return canonical[0].toUpperCase() + canonical.slice(1);
}

/** Leading sigils that may precede the head token of a mustache. */
const MUSTACHE_SIGILS = new Set(['#', '/', '^', '>', '&']);

/**
 * A head token is eligible for recasing only when it is a bare helper name:
 * a single identifier segment with no path separators (`.` / `/`), no `@`
 * data-variable prefix, and no `=` (hash key). This keeps `item.title`,
 * `@index`, and `key=value` untouched while still recasing `formatDate`.
 *
 * @param {string} token Candidate head token.
 * @returns {boolean} True when the token is a bare, recasable name.
 */
function isBareName(token) {
    return /^[A-Za-z_]\w*$/.test(token);
}

/**
 * Normalize the inner text of a single Handlebars expression.
 *
 * Whitespace outside quoted string literals is collapsed to a single space and
 * trimmed. When `helperCase` is not `preserve`, the head token (the first token
 * after an optional leading sigil) and the head token of every subexpression
 * (first token after each `(`) are recased via {@link applyHelperCase} — but
 * only when they are known catalog helpers. String literals, paths, hash keys,
 * block params (`as |x y|`), and unknown names are preserved byte-for-byte.
 *
 * Padding of the outer expression (per `handlebarsSpacing`) is applied by the
 * caller, not here.
 *
 * @param {string} inner Raw inner text of a mustache expression.
 * @param {{ helperCase?: 'upper-camel'|'lower-camel'|'upper'|'lower'|'preserve' }} [options] Options.
 * @returns {string} Normalized inner text (collapsed whitespace, recased heads).
 */
function normalizeMustacheInner(inner, options = {}) {
    const helperCase = options.helperCase || 'lower-camel';

    // First pass: collapse whitespace outside string literals, preserving quotes.
    let collapsed = '';
    /** @type {string|undefined} */
    let quote;
    for (const ch of inner) {
        if (quote) {
            collapsed += ch;
            if (ch === quote) {
                quote = undefined;
            }
            continue;
        }
        if (ch === '"' || ch === "'") {
            quote = ch;
            collapsed += ch;
            continue;
        }
        if ([' ', '\t', '\n', '\r', '\f', '\v'].includes(ch)) {
            if (collapsed.length > 0 && collapsed.at(-1) !== ' ') {
                collapsed += ' ';
            }
            continue;
        }
        collapsed += ch;
    }
    collapsed = collapsed.trim();

    if (helperCase === 'preserve' || collapsed.length === 0) {
        return collapsed;
    }

    // Second pass: recase the head token and each subexpression head token.
    // A head is expected at the very start (after an optional sigil) and
    // immediately after each `(`. We walk the collapsed string, tracking string
    // literals so `(` / heads inside quotes are ignored.
    let result = '';
    quote = undefined;
    let isExpectHead = true;
    let isLeadingSigilConsumed = false;
    let index = 0;
    const n = collapsed.length;
    while (index < n) {
        const ch = collapsed[index];
        if (quote) {
            result += ch;
            if (ch === quote) {
                quote = undefined;
            }
            index++;
            continue;
        }
        if (ch === '"' || ch === "'") {
            quote = ch;
            result += ch;
            isExpectHead = false;
            index++;
            continue;
        }
        // At the outermost head position, skip a single leading sigil.
        if (
            isExpectHead &&
            !isLeadingSigilConsumed &&
            result.length === 0 &&
            MUSTACHE_SIGILS.has(ch)
        ) {
            result += ch;
            isLeadingSigilConsumed = true;
            index++;
            continue;
        }
        if (ch === '(') {
            result += ch;
            isExpectHead = true;
            index++;
            continue;
        }
        if (ch === ' ') {
            result += ch;
            index++;
            continue;
        }
        if (isExpectHead) {
            // Read the head token up to the next whitespace, `(`, `)`, or quote.
            let index_ = index;
            while (index_ < n && !/[\s()'"]/.test(collapsed[index_])) {
                index_++;
            }
            const token = collapsed.slice(index, index_);
            result += isBareName(token) ? applyHelperCase(token, helperCase) : token;
            isExpectHead = false;
            index = index_;
            continue;
        }
        result += ch;
        index++;
    }
    return result;
}

/**
 * Token placeholder prefix used to shield MCN Handlebars `{{…}}` regions from
 * Prettier's HTML parser (which would otherwise collapse whitespace inside string
 * literals and reflow mustaches). Mirrors the `AMPSCRIPTPH…END` scheme.
 */
const HANDLEBARS_PH = 'HANDLEBARSPH';

/**
 * Scan forward from `start` for a Handlebars closing delimiter, ignoring any
 * occurrence that sits inside a single- or double-quoted string literal.
 *
 * @param {string} text Text being scanned.
 * @param {number} start Index to begin scanning at (just past the opener).
 * @param {string} closeDelim Closing delimiter to look for (`}}` or `}}}`).
 * @param {number} end Exclusive upper bound for scanning (usually `text.length`).
 * @returns {number} Index of the closing delimiter, or `-1` when not found.
 */
function findClosingDelimiter(text, start, closeDelim, end) {
    /** @type {string|undefined} */
    let quote;
    let index = start;
    while (index < end) {
        const ch = text[index];
        if (quote) {
            if (ch === quote) {
                quote = undefined;
            }
        } else if (ch === '"' || ch === "'") {
            quote = ch;
        } else if (text.startsWith(closeDelim, index)) {
            return index;
        }
        index++;
    }
    return -1;
}

/**
 * Extract every well-formed MCN Handlebars `{{…}}` region from a string, replacing
 * each with a `HANDLEBARSPH<n>END` placeholder and recording the normalized
 * replacement text. The HTML parser then never sees mustache internals, so it
 * cannot corrupt string literals or reflow them; normalization happens here.
 *
 * Guarantees:
 * - `{!$…}` merge-field bindings are never matched (they use single braces).
 * - AMPscript delimiters and `AMPSCRIPTPH…END` placeholders are never matched
 *   (they contain no `{{`).
 * - Handlebars comments (`{{! … }}`, `{{!-- … --}}`) are recorded verbatim.
 * - Triple-stache (`{{{ … }}}`) and the `&` sigil are preserved (not rewritten).
 * - String literals inside an expression keep their exact bytes and quote style.
 * - Unbalanced/never-closed mustaches are left verbatim in the returned string
 *   (no throw, no change), so the HTML parser passes them through untouched.
 *
 * @param {string} text Joined HTML/text (AMPscript already placeholdered).
 * @param {{ spacing?: boolean, helperCase?: 'upper-camel'|'lower-camel'|'upper'|'lower'|'preserve' }} [options]
 * Formatting options: `spacing` pads simple/triple mustaches (sigil mustaches stay
 * tight); `helperCase` recases known catalog helpers at head positions.
 * @returns {{ html: string, tokens: string[] }} Text with Handlebars placeholders
 * and the ordered list of normalized mustache replacements.
 */
function extractHandlebarsRegions(text, options = {}) {
    const isSpacing = options.spacing === true;
    const helperCase = options.helperCase || 'lower-camel';
    /** @type {string[]} */
    const tokens = [];
    if (typeof text !== 'string' || !text.includes('{{')) {
        return { html: text, tokens };
    }

    let out = '';
    let index = 0;
    const n = text.length;
    while (index < n) {
        const open = text.indexOf('{{', index);
        if (open === -1) {
            out += text.slice(index);
            break;
        }
        out += text.slice(index, open);

        const isTriple = text[open + 2] === '{';
        const openLength = isTriple ? 3 : 2;
        const afterOpen = text.slice(open + openLength);

        // Comments: record verbatim, never normalize their contents.
        if (!isTriple && afterOpen.startsWith('!')) {
            const isBlock = afterOpen.startsWith('!--');
            const closeString = isBlock ? '--}}' : '}}';
            const close = text.indexOf(closeString, open + openLength);
            if (close === -1) {
                out += text.slice(open);
                break;
            }
            const end = close + closeString.length;
            tokens.push(text.slice(open, end));
            out += `${HANDLEBARS_PH}${tokens.length - 1}END`;
            index = end;
            continue;
        }

        // Scan for the closing delimiter, ignoring `}}` inside string literals.
        const closeDelim = isTriple ? '}}}' : '}}';
        const foundClose = findClosingDelimiter(text, open + openLength, closeDelim, n);

        if (foundClose === -1) {
            // Unbalanced — leave the remainder exactly as-is for the HTML parser.
            out += text.slice(open);
            break;
        }

        const inner = text.slice(open + openLength, foundClose);
        const opener = text.slice(open, open + openLength);
        const normalized = normalizeMustacheInner(inner, { helperCase });
        // Pad simple mustaches (`{{ … }}`) and triple-stache (`{{{ … }}}`) when
        // `spacing` is enabled; sigil mustaches (`{{#…}}`, `{{/…}}`, `{{^…}}`,
        // `{{>…}}`, `{{&…}}`) always stay tight.
        const hasSigil = MUSTACHE_SIGILS.has(normalized[0]);
        const pad = isSpacing && !hasSigil && normalized.length > 0 ? ' ' : '';
        tokens.push(`${opener}${pad}${normalized}${pad}${closeDelim}`);
        out += `${HANDLEBARS_PH}${tokens.length - 1}END`;
        index = foundClose + closeDelim.length;
    }

    return { html: out, tokens };
}

// ── Languages ────────────────────────────────────────────────────────────────

export const languages = [
    {
        name: 'AMPscript',
        parsers: ['ampscript-parse'],
        extensions: ['.ampscript', '.amp'],
        vscodeLanguageIds: ['ampscript'],
    },
    {
        name: 'SFMC (AMPscript / SSJS)',
        parsers: ['ampscript-parse'],
        extensions: ['.html'],
        vscodeLanguageIds: ['sfmc'],
    },
    {
        name: 'Handlebars (MCN)',
        parsers: ['ampscript-parse'],
        extensions: ['.hbs'],
        vscodeLanguageIds: ['handlebars'],
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
            // Pure `.hbs` documents may contain no HTML tags at all — still run
            // the embed path so `{{…}}` mustaches are normalized.
            const hasHandlebars = node.children.some(
                (c) => c.type === 'Content' && c.value.includes('{{'),
            );
            if (!hasHtml && !hasHandlebars) {
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

                // Shield MCN Handlebars {{…}} from the HTML parser (which would
                // otherwise collapse whitespace inside string literals). The
                // mustache text is normalized (whitespace, helper casing, and
                // optional padding) during extraction.
                const { html, tokens: handlebarsTokens } = extractHandlebarsRegions(
                    htmlParts.join(''),
                    {
                        spacing: options.handlebarsSpacing === true,
                        helperCase: options.handlebarsHelperCase || 'lower-camel',
                    },
                );

                let htmlDocument;
                try {
                    htmlDocument = await textToDocument(html, { parser: 'html' });
                } catch {
                    return;
                }

                const re = new RegExp(String.raw`(?:${PH}(\d+)END|${HANDLEBARS_PH}(\d+)END)`, 'g');
                return prettier.doc.utils.mapDoc(htmlDocument, (d) => {
                    if (typeof d !== 'string') {
                        return d;
                    }
                    if (!d.includes(PH) && !d.includes(HANDLEBARS_PH)) {
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
                        if (m[1] === undefined) {
                            parts.push(handlebarsTokens[Number(m[2])]);
                        } else {
                            parts.push(print(['children', Number(m[1])]));
                        }
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
    handlebarsSpacing: {
        type: 'boolean',
        category: 'Handlebars',
        default: false,
        description:
            'Pad the inside of Marketing Cloud Next `{{…}}` expressions. ' +
            'When true, simple mustaches and triple-stache get one space of padding ' +
            '(`{{ foo bar }}`, `{{{ raw }}}`); sigil mustaches (`{{#each}}`, `{{/each}}`, ' +
            '`{{^x}}`, `{{>p}}`, `{{&x}}`) always stay tight. When false (default), all ' +
            'mustaches are tight. Internal runs of whitespace collapse to a single space ' +
            'either way, and string literals are preserved.',
    },
    handlebarsHelperCase: {
        type: 'choice',
        category: 'Handlebars',
        default: 'lower-camel',
        choices: [
            {
                value: 'upper-camel',
                description: 'Canonical PascalCase: FormatDate, TruncateWords',
            },
            {
                value: 'lower-camel',
                description: 'camelCase: formatDate, truncateWords',
            },
            { value: 'upper', description: 'UPPERCASE: FORMATDATE, TRUNCATEWORDS' },
            { value: 'lower', description: 'lowercase: formatdate, truncatewords' },
            { value: 'preserve', description: 'Keep original helper casing' },
        ],
        description:
            'Control the casing of Marketing Cloud Next Handlebars helper names. ' +
            'Only names found in the handlebars-data catalog are recased, at the ' +
            'mustache head, block open/close, and subexpression heads. Unknown paths ' +
            '(e.g. `firstName`, `item.title`) are always preserved.',
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
