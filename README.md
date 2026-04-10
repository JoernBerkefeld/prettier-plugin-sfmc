# prettier-plugin-sfmc

Unified Prettier plugin for **Salesforce Marketing Cloud** — formats **AMPscript** (`.ampscript`, `.amp`, `.html`) and registers **SSJS** (`.ssjs`) files with Prettier's built-in JavaScript formatter.

## Installation

```bash
npm install prettier-plugin-sfmc --save-dev
```

Requires Prettier 3.7+.

## Quick Start

Prettier auto-discovers plugins installed in `node_modules`. No config needed for `.ampscript`, `.amp`, and `.ssjs` files.

For `.html` files containing AMPscript, the plugin's parser handles AMPscript regions while delegating HTML to Prettier's built-in HTML formatter. SSJS `<script runat="server">` blocks are formatted as JavaScript by Prettier's HTML pipeline automatically.

To use explicitly in `.prettierrc`:

```json
{
  "plugins": ["prettier-plugin-sfmc"]
}
```

## Options

All options use the `ampscript` prefix — they control AMPscript formatting behavior.

| Option                                                                                        | Type                                                                         | Default         | Description                                    |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------- | ---------------------------------------------- |
| [`ampscriptSpacing`](docs/options/ampscript-spacing.md)                                       | boolean                                                                      | `true`          | Spacing in inline expressions: `%%= V(@x) =%%` |
| [`ampscriptEnforceVariableCasing`](docs/options/ampscript-enforce-variable-casing.md)         | boolean                                                                      | `true`          | Normalize variable casing to first occurrence  |
| [`ampscriptRemoveUnnecessaryBrackets`](docs/options/ampscript-remove-unnecessary-brackets.md) | boolean                                                                      | `true`          | Remove needless parentheses                    |
| [`ampscriptQuoteStyle`](docs/options/ampscript-quote-style.md)                                | `"single"` \| `"double"`                                                     | `"single"`      | String quote style                             |
| [`ampscriptKeywordCase`](docs/options/ampscript-keyword-case.md)                              | `"lower"` \| `"upper"` \| `"preserve"`                                       | `"lower"`       | Keyword casing                                 |
| [`ampscriptFunctionCase`](docs/options/ampscript-function-case.md)                            | `"upper-camel"` \| `"lower-camel"` \| `"upper"` \| `"lower"` \| `"preserve"` | `"upper-camel"` | Function name casing                           |
| [`ampscriptBlockLineBreaks`](docs/options/ampscript-block-line-breaks.md)                     | boolean                                                                      | `true`          | Line breaks before/after `%%[ ]%%` blocks      |
| [`ampscriptVarDeclarationStyle`](docs/options/ampscript-var-declaration-style.md)             | `"auto"` \| `"single-line"` \| `"multi-line"`                                | `"auto"`        | Var declaration formatting                     |

### Example `.prettierrc`

```json
{
  "plugins": ["prettier-plugin-sfmc"],
  "ampscriptKeywordCase": "upper",
  "ampscriptFunctionCase": "upper-camel",
  "ampscriptQuoteStyle": "single"
}
```

## Supported File Types

| Extension    | Parser             | What happens                                    |
| ------------ | ------------------ | ----------------------------------------------- |
| `.ampscript` | `ampscript-parse`  | Full AMPscript formatting                       |
| `.amp`       | `ampscript-parse`  | Full AMPscript formatting                       |
| `.html`      | `ampscript-parse`  | AMPscript formatted; HTML delegated to Prettier |
| `.ssjs`      | `babel` (built-in) | Standard JavaScript formatting                  |

## HTML Embedding

When formatting `.html` files, the plugin:

1. Parses AMPscript regions (`%%[ ]%%`, `%%= =%%`, `<script language="ampscript">`)
2. Delegates HTML content to Prettier's built-in HTML formatter
3. Prettier's HTML formatter handles `<script runat="server">` SSJS blocks as JavaScript

This means a single plugin handles all SFMC formatting in HTML email templates.

## Ignoring Code

Prettier provides two ways to exclude code from formatting: ignore comments for specific code sections, and `.prettierignore` for entire files.

### SSJS

SSJS uses Prettier's built-in JavaScript formatter. Use `// prettier-ignore` to exclude the next statement from formatting:

```js
// prettier-ignore
var config = {
    clientId:     "abc123",
    clientSecret: "xyz789",
    endpoint:     "https://example.com"
};
```

Without the comment, Prettier would collapse the aligned spacing.

### AMPscript

AMPscript uses block comment syntax. Use `/* prettier-ignore */` to exclude the next statement from formatting:

```ampscript
%%[
/* prettier-ignore */
set @matrix = Concat(
    '1, 0, 0,',
    '0, 1, 0,',
    '0, 0, 1'
)
]%%
```

### Ignoring Files: .prettierignore

To exclude entire files from formatting, create a `.prettierignore` file in the root of your project. It uses [gitignore syntax](https://git-scm.com/docs/gitignore#_pattern_format).

Example:

```text
# Ignore artifacts:
build
coverage

# Ignore all HTML files:
**/*.html
```

By default Prettier ignores files in version control directories (`.git`, `.svn`, `.hg`) and `node_modules`. Prettier also follows rules in `.gitignore` if present.

#### SMS and Mobile Messages

For SMS or MobilePush messages, line breaks and exact character placement often matter for delivery and display. Excluding these files from formatting prevents Prettier from altering whitespace that affects message rendering.

Example pattern for SFMC DevTools mobile message assets:

```text
# Preserve exact formatting in mobile messages
**/*.asset-mobile-meta.amp
```

## License

MIT
