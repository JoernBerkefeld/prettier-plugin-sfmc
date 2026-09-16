import type {
    Parser,
    Printer,
    RequiredOptions,
    SupportLanguage,
    SupportOption,
} from 'prettier';

type CaseOption = 'upper' | 'lower' | 'preserve';
type NameCaseOption = 'upper-camel' | 'lower-camel' | 'upper' | 'lower' | 'preserve';

interface SfmcOptions {
    ampscriptSpacing?: boolean;
    ampscriptEnforceVariableCasing?: boolean;
    ampscriptRemoveUnnecessaryBrackets?: boolean;
    ampscriptQuoteStyle?: 'single' | 'double';
    ampscriptKeywordCase?: CaseOption;
    ampscriptFunctionCase?: NameCaseOption;
    ampscriptBlockLineBreaks?: boolean;
    ampscriptVarDeclarationStyle?: 'auto' | 'single-line' | 'multi-line';
    handlebarsSpacing?: boolean;
    handlebarsHelperCase?: NameCaseOption;
    sqlKeywordCase?: CaseOption;
    sqlFunctionCase?: CaseOption;
    sqlIdentifierCase?: CaseOption;
    sqlDataTypeCase?: CaseOption;
    sqlIndentStyle?: 'standard' | 'tabularLeft' | 'tabularRight';
    sqlLogicalOperatorNewline?: 'before' | 'after';
    sqlExpressionWidth?: number;
    sqlDenseOperators?: boolean;
    /** @deprecated Use sqlKeywordCase instead. */
    keywordCase?: CaseOption;
    /** @deprecated Use sqlFunctionCase instead. */
    functionCase?: CaseOption;
    /** @deprecated Use sqlIdentifierCase instead. */
    identifierCase?: CaseOption;
    /** @deprecated Use sqlDataTypeCase instead. */
    dataTypeCase?: CaseOption;
    /** @deprecated Use sqlIndentStyle instead. */
    indentStyle?: 'standard' | 'tabularLeft' | 'tabularRight';
    /** @deprecated Use sqlLogicalOperatorNewline instead. */
    logicalOperatorNewline?: 'before' | 'after';
    /** @deprecated Use sqlExpressionWidth instead. */
    expressionWidth?: number;
    /** @deprecated Use sqlDenseOperators instead. */
    denseOperators?: boolean;
}

declare module 'prettier' {
    interface Options extends SfmcOptions {}
}

export const languages: SupportLanguage[];
export const parsers: Record<string, Parser>;
export const printers: Record<string, Printer>;
export const options: { [Key in keyof SfmcOptions]-?: SupportOption };
export const defaultOptions: Partial<RequiredOptions>;
