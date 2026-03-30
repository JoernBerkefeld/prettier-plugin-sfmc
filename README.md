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

| Option                               | Type                                                                         | Default         | Description                                    |
| ------------------------------------ | ---------------------------------------------------------------------------- | --------------- | ---------------------------------------------- |
| [`ampscriptSpacing`](docs/options/ampscript-spacing.md)                   | boolean                                                                      | `true`          | Spacing in inline expressions: `%%= V(@x) =%%` |
| [`ampscriptEnforceVariableCasing`](docs/options/ampscript-enforce-variable-casing.md)     | boolean                                                                      | `true`          | Normalize variable casing to first occurrence  |
| [`ampscriptRemoveUnnecessaryBrackets`](docs/options/ampscript-remove-unnecessary-brackets.md) | boolean                                                                      | `true`          | Remove needless parentheses                    |
| [`ampscriptQuoteStyle`](docs/options/ampscript-quote-style.md)                | `"single"` \| `"double"`                                                     | `"single"`      | String quote style                             |
| [`ampscriptKeywordCase`](docs/options/ampscript-keyword-case.md)               | `"lower"` \| `"upper"` \| `"preserve"`                                       | `"lower"`       | Keyword casing                                 |
| [`ampscriptFunctionCase`](docs/options/ampscript-function-case.md)              | `"upper-camel"` \| `"lower-camel"` \| `"upper"` \| `"lower"` \| `"preserve"` | `"upper-camel"` | Function name casing                           |
| [`ampscriptBlockLineBreaks`](docs/options/ampscript-block-line-breaks.md)           | boolean                                                                      | `true`          | Line breaks before/after `%%[ ]%%` blocks      |
| [`ampscriptVarDeclarationStyle`](docs/options/ampscript-var-declaration-style.md)       | `"auto"` \| `"single-line"` \| `"multi-line"`                                | `"auto"`        | Var declaration formatting                     |

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

## Migration from `prettier-plugin-ampscript` / `prettier-plugin-ssjs`

Both plugins have been merged into this single package:

1. Replace `prettier-plugin-ampscript` and `prettier-plugin-ssjs` with `prettier-plugin-sfmc`
2. Update the `plugins` array in `.prettierrc` if explicitly configured
3. All `ampscript*` option names are unchanged

## License

MIT
