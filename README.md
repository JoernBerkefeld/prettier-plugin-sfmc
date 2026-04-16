# prettier-plugin-sfmc

Unified Prettier plugin for **Salesforce Marketing Cloud** — formats **AMPscript** (`.ampscript`, `.amp`, `.html`), registers **SSJS** (`.ssjs`) with Prettier’s JavaScript formatter, and formats **SQL** (`.sql`) via embedded [prettier-plugin-sql](https://www.npmjs.com/package/prettier-plugin-sql).

## Installation

```bash
npm install prettier-plugin-sfmc --save-dev
```

Requires Prettier 3.7+.

## Quick Start

Prettier auto-discovers plugins installed in `node_modules`. No config needed for `.ampscript`, `.amp`, `.ssjs`, and `.sql` files.

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
| [`ampscriptBlockLineBreaks`](docs/options/ampscript-block-line-breaks.md)                     | boolean                                                                      | `false`         | Optional line breaks around `%%[ ]%%` when not already at a line boundary |
| [`ampscriptVarDeclarationStyle`](docs/options/ampscript-var-declaration-style.md)             | `"auto"` \| `"single-line"` \| `"multi-line"`                                | `"multi-line"`  | Var declaration formatting                     |

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
| `.sql`       | `sql`              | SQL via composed `prettier-plugin-sql`          |

## Core Prettier defaults (AMPscript, HTML, SQL, JavaScript / SSJS)

This plugin exports [Prettier `defaultOptions`](https://prettier.io/docs/plugins#defaultoptions). Prettier merges them from whichever plugin **owns the active printer** for the file being formatted. This package supplies printers for **AMPscript**, **SQL** (via composed `prettier-plugin-sql`), and the shared **`estree`** printer (the same implementation Prettier ships for JavaScript). User plugins are loaded **after** built-ins, so this plugin becomes the effective `estree` printer—meaning **`.ssjs`** files (typically `parser: "babel"`) pick up the table below **without** copying these keys into `.prettierrc`.

| Option | Default | Rationale |
| ------ | ------- | --------- |
| `useTabs` | `false` | SFMC often normalizes tabs away on save; spaces keep layout stable. |
| `tabWidth` | `4` | Readable indentation (override in config if you prefer 2). |
| `printWidth` | `100` | Fits typical editor panes better than Prettier’s 80. |
| `singleQuote` | `true` | Common JS style; aligns with `ampscriptQuoteStyle: 'single'` where the core quote option applies. |
| `trailingComma` | `'none'` | Avoids trailing commas that can break SSJS in some SFMC contexts. |

String delimiters inside AMPscript blocks still follow `ampscriptQuoteStyle`. See [Prettier options](https://prettier.io/docs/options) for every standard flag.

**Overrides:** Add options to `.prettierrc` or [overrides](https://prettier.io/docs/configuration#configuration-overrides) only when you want to **diverge** (for example `tabWidth: 2` for the whole project, or different rules per file glob).

**Scope:** With this plugin enabled, any file Prettier formats using the **`estree`** printer uses these defaults—not only `.ssjs`. If another plugin in your config also registers `printers.estree`, plugin **order** matters (the last one wins).

## SQL (Transact-SQL / SFMC)

`.sql` formatting is provided by [prettier-plugin-sql](https://github.com/un-ts/prettier/tree/master/packages/sql) (npm: [prettier-plugin-sql](https://www.npmjs.com/package/prettier-plugin-sql)). You only need `prettier` and `prettier-plugin-sfmc`; do not add a second entry in `plugins` for SQL.

**Defaults for SFMC-style T-SQL** (from composed [prettier-plugin-sql](https://www.npmjs.com/package/prettier-plugin-sql)):

| Option | Default | Other values | Rationale |
| ------ | ------- | ------------ | --------- |
| `language` | `tsql` | n/a | Must stay `tsql` for SFMC T-SQL. Other dialects are not supported for SFMC SQL; changing this can break formatting or behaviour. |
| `formatter` | `sql-formatter` | n/a | Must stay `sql-formatter` for SFMC SQL. Other formatters are not supported in this context; changing this can break. |
| `keywordCase` | `upper` | `preserve`, `lower` | Casing for reserved keywords. |
| `functionCase` | `upper` | `preserve`, `lower` | Casing for function names. |
| `identifierCase` | `preserve` | `upper`, `lower` | Unquoted identifiers only (upstream treats this as experimental). |
| `dataTypeCase` | `preserve` | `upper`, `lower` | Casing for data type names. |

Do **not** override `language` or `formatter` for SFMC. You may override the **casing** options in `.prettierrc` or under `overrides` with `files: "*.sql"` if you want different keyword/function/identifier/data-type casing.

Core layout still follows [Prettier options](https://prettier.io/docs/options). SQL-specific knobs (`expressionWidth`, `linesBetweenQueries`, etc.) are documented in the upstream package README.

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
