import { format, type Options, type Plugin } from 'prettier';
import 'prettier-plugin-sfmc';
import * as sfmcPlugin from 'prettier-plugin-sfmc';
import {
    defaultOptions,
    languages,
    options,
    parsers,
    printers,
} from 'prettier-plugin-sfmc';

const configuredOptions: Options = {
    plugins: ['prettier-plugin-sfmc'],
    parser: 'ampscript-parse',
    ampscriptSpacing: true,
    ampscriptEnforceVariableCasing: true,
    ampscriptRemoveUnnecessaryBrackets: true,
    ampscriptQuoteStyle: 'single',
    ampscriptKeywordCase: 'upper',
    ampscriptFunctionCase: 'upper-camel',
    ampscriptBlockLineBreaks: false,
    ampscriptVarDeclarationStyle: 'multi-line',
    handlebarsSpacing: false,
    handlebarsHelperCase: 'lower-camel',
    sqlKeywordCase: 'upper',
    sqlFunctionCase: 'upper',
    sqlIdentifierCase: 'preserve',
    sqlDataTypeCase: 'preserve',
    sqlIndentStyle: 'standard',
    sqlLogicalOperatorNewline: 'before',
    sqlExpressionWidth: 50,
    sqlDenseOperators: false,
    keywordCase: 'upper',
    functionCase: 'upper',
    identifierCase: 'preserve',
    dataTypeCase: 'preserve',
    indentStyle: 'standard',
    logicalOperatorNewline: 'before',
    expressionWidth: 50,
    denseOperators: false,
};

const checkedPlugin: Plugin = sfmcPlugin;

void format('%%=v(@name)=%%', configuredOptions);
void checkedPlugin;
void [languages, parsers, printers, options, defaultOptions];

// @ts-expect-error The package intentionally has no default export.
import nonexistentDefault from 'prettier-plugin-sfmc';
void nonexistentDefault;

// @ts-expect-error Invalid quote-style values must be rejected.
const invalidQuoteStyle: Options = { ampscriptQuoteStyle: 'preserve' };
// @ts-expect-error Invalid case values must be rejected.
const invalidCase: Options = { sqlKeywordCase: 'capitalized' };
// @ts-expect-error Invalid name-case values must be rejected.
const invalidNameCase: Options = { handlebarsHelperCase: 'pascal' };
// @ts-expect-error Invalid declaration-style values must be rejected.
const invalidDeclarationStyle: Options = { ampscriptVarDeclarationStyle: 'compact' };
// @ts-expect-error Invalid indent-style values must be rejected.
const invalidIndentStyle: Options = { indentStyle: 'tabs' };
// @ts-expect-error Invalid logical-newline values must be rejected.
const invalidLogicalNewline: Options = { sqlLogicalOperatorNewline: 'around' };
void [
    invalidQuoteStyle,
    invalidCase,
    invalidNameCase,
    invalidDeclarationStyle,
    invalidIndentStyle,
    invalidLogicalNewline,
];
