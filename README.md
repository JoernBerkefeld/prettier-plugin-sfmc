# prettier-plugin-sfmc

Unified Prettier plugin for **Salesforce Marketing Cloud** — formats **AMPscript** (`.ampscript`, `.amp`, `.html`), normalizes **Marketing Cloud Next Handlebars** (`.hbs` and `{{…}}` inside `.html`), registers **SSJS** (`.ssjs`) with Prettier’s JavaScript formatter, and formats **SQL** (`.sql`) directly with [sql-formatter](https://www.npmjs.com/package/sql-formatter), fixed to the Transact-SQL dialect.

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

AMPscript options use the `ampscript` prefix; Handlebars options use the `handlebars` prefix.

| Option                                                                                        | Type                                                                         | Default         | Description                                                               |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------- |
| [`ampscriptSpacing`](docs/options/ampscript-spacing.md)                                       | boolean                                                                      | `true`          | Spacing in inline expressions: `%%= v(@x) =%%`                            |
| [`ampscriptEnforceVariableCasing`](docs/options/ampscript-enforce-variable-casing.md)         | boolean                                                                      | `true`          | Normalize variable casing to first occurrence                             |
| [`ampscriptRemoveUnnecessaryBrackets`](docs/options/ampscript-remove-unnecessary-brackets.md) | boolean                                                                      | `true`          | Remove needless parentheses                                               |
| [`ampscriptQuoteStyle`](docs/options/ampscript-quote-style.md)                                | `"single"` \| `"double"`                                                     | `"single"`      | String quote style                                                        |
| [`ampscriptKeywordCase`](docs/options/ampscript-keyword-case.md)                              | `"lower"` \| `"upper"` \| `"preserve"`                                       | `"lower"`       | Keyword casing                                                            |
| [`ampscriptFunctionCase`](docs/options/ampscript-function-case.md)                            | `"upper-camel"` \| `"lower-camel"` \| `"upper"` \| `"lower"` \| `"preserve"` | `"upper-camel"` | Function name casing                                                      |
| [`ampscriptBlockLineBreaks`](docs/options/ampscript-block-line-breaks.md)                     | boolean                                                                      | `false`         | Optional line breaks around `%%[ ]%%` when not already at a line boundary |
| [`ampscriptVarDeclarationStyle`](docs/options/ampscript-var-declaration-style.md)             | `"auto"` \| `"single-line"` \| `"multi-line"`                                | `"multi-line"`  | Var declaration formatting                                                |
| [`handlebarsSpacing`](docs/options/handlebars-spacing.md)                                     | boolean                                                                      | `false`         | Pad simple/triple `{{…}}`; sigil mustaches stay tight                     |
| [`handlebarsHelperCase`](docs/options/handlebars-helper-case.md)                              | `"upper-camel"` \| `"lower-camel"` \| `"upper"` \| `"lower"` \| `"preserve"` | `"lower-camel"` | Casing of known MCN Handlebars helper names                               |

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

| Extension    | VS Code language ID | Parser             | What happens                                                                                                                                                          |
| ------------ | ------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.ampscript` | `ampscript`         | `ampscript-parse`  | Full AMPscript formatting                                                                                                                                             |
| `.amp`       | `ampscript`         | `ampscript-parse`  | Full AMPscript formatting                                                                                                                                             |
| `.html`      | `sfmc`              | `ampscript-parse`  | AMPscript formatted; HTML and `<script runat="server">` delegated to Prettier; MCN `{{…}}` Handlebars normalized (see [Handlebars](#handlebars-marketing-cloud-next)) |
| `.hbs`       | `handlebars`        | `ampscript-parse`  | Marketing Cloud Next Handlebars normalized (see [Handlebars](#handlebars-marketing-cloud-next)); embedded HTML delegated to Prettier                                  |
| `.ssjs`      | `ssjs`              | `babel` (built-in) | Standard JavaScript formatting                                                                                                                                        |
| `.sql`       | `sql`               | `sql`              | SQL via `sql-formatter`, fixed to the Transact-SQL dialect                                                                                                            |

`.html` files are auto-detected as `sfmc` by the `vscode-sfmc-language` extension (v1.6.0+) when they contain AMPscript or SSJS content. Plain HTML files (language ID `html`) are out of scope and handled by Prettier's built-in HTML formatter directly.

## Core Prettier defaults (AMPscript, HTML, SQL, JavaScript / SSJS)

This plugin exports [Prettier `defaultOptions`](https://prettier.io/docs/plugins#defaultoptions). Prettier merges them from whichever plugin **owns the active printer** for the file being formatted. This package supplies printers for **AMPscript**, **SQL** (via `sql-formatter`), and the shared **`estree`** printer (the same implementation Prettier ships for JavaScript). User plugins are loaded **after** built-ins, so this plugin becomes the effective `estree` printer—meaning **`.ssjs`** files (typically `parser: "babel"`) pick up the table below **without** copying these keys into `.prettierrc`.

| Option          | Default  | Rationale                                                                                         |
| --------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `useTabs`       | `false`  | SFMC often normalizes tabs away on save; spaces keep layout stable.                               |
| `tabWidth`      | `4`      | Readable indentation (override in config if you prefer 2).                                        |
| `printWidth`    | `100`    | Fits typical editor panes better than Prettier’s 80.                                              |
| `singleQuote`   | `true`   | Common JS style; aligns with `ampscriptQuoteStyle: 'single'` where the core quote option applies. |
| `trailingComma` | `'none'` | Avoids trailing commas that can break SSJS in some SFMC contexts.                                 |

String delimiters inside AMPscript blocks still follow `ampscriptQuoteStyle`. See [Prettier options](https://prettier.io/docs/options) for every standard flag.

**Overrides:** Add options to `.prettierrc` or [overrides](https://prettier.io/docs/configuration#configuration-overrides) only when you want to **diverge** (for example `tabWidth: 2` for the whole project, or different rules per file glob).

**Scope:** With this plugin enabled, any file Prettier formats using the **`estree`** printer uses these defaults—not only `.ssjs`. If another plugin in your config also registers `printers.estree`, plugin **order** matters (the last one wins).

## SQL (Transact-SQL / SFMC)

`.sql` formatting is powered directly by [sql-formatter](https://www.npmjs.com/package/sql-formatter), with the dialect **fixed to Transact-SQL** (SFMC Query Activities are T-SQL only). You only need `prettier` and `prettier-plugin-sfmc`; do not add a second entry in `plugins` for SQL.

### Why not `prettier-plugin-sql`?

Earlier releases formatted `.sql` through [`prettier-plugin-sql`](https://www.npmjs.com/package/prettier-plugin-sql). It is a solid, well-maintained package — but it does more than SFMC needs. It bundles the ~90 MB `node-sql-parser` backend to support parsing-based features and many SQL dialects, none of which SFMC uses. This plugin only needs the whitespace-and-casing path that `sql-formatter` provides for T-SQL, so it now depends on `sql-formatter` alone. Dropping the parser backend keeps the plugin small enough to bundle inside mcdev's VS Code extension, with **byte-identical** SFMC defaults (see below).

### Dialect and defaults

The dialect is fixed to **T-SQL** and cannot be changed. A minimal config still yields the SFMC defaults, byte-identical to previous releases:

```json
{
  "plugins": ["prettier-plugin-sfmc"]
}
```

The eight SQL options use the `sql*` prefix. Each has a **legacy alias** (the pre-rename, un-prefixed key) that is still accepted but **deprecated**. A legacy key has no default, so it only takes effect when you set it explicitly; when set it **wins** over its `sql*` counterpart and Prettier's CLI prints a deprecation warning. Legacy aliases will be **removed in the next major version**.

| Option                                                                | Type                                     | Default      | Description                                                       | Legacy alias (deprecated) |
| --------------------------------------------------------------------- | ---------------------------------------- | ------------ | ---------------------------------------------------------------- | ------------------------- |
| [`sqlKeywordCase`](docs/options/sql-keyword-case.md)                  | `"upper"` \| `"lower"` \| `"preserve"`   | `"upper"`    | Casing of reserved keywords (`SELECT`, `FROM`, `WHERE`, …)       | `keywordCase`             |
| [`sqlFunctionCase`](docs/options/sql-function-case.md)                | `"upper"` \| `"lower"` \| `"preserve"`   | `"upper"`    | Casing of function names (`COUNT`, `ISNULL`, `CAST`, …)          | `functionCase`            |
| [`sqlIdentifierCase`](docs/options/sql-identifier-case.md)            | `"upper"` \| `"lower"` \| `"preserve"`   | `"preserve"` | Casing of unquoted identifiers (`[bracketed]` / `@vars` exempt)  | `identifierCase`          |
| [`sqlDataTypeCase`](docs/options/sql-data-type-case.md)               | `"upper"` \| `"lower"` \| `"preserve"`   | `"preserve"` | Casing of data-type names in `CAST` / `CONVERT`                  | `dataTypeCase`            |
| [`sqlIndentStyle`](docs/options/sql-indent-style.md)                  | `"standard"` \| `"tabularLeft"` \| `"tabularRight"` | `"standard"` | Indentation layout (tabular modes ignore `tabWidth`) | `indentStyle`             |
| [`sqlLogicalOperatorNewline`](docs/options/sql-logical-operator-newline.md) | `"before"` \| `"after"`            | `"before"`   | Whether wrapped `AND` / `OR` lead or trail the line break        | `logicalOperatorNewline`  |
| [`sqlExpressionWidth`](docs/options/sql-expression-width.md)          | `number`                                 | `50`         | Width budget before `IN (...)` / `CAST(...)` / conditions wrap   | `expressionWidth`         |
| [`sqlDenseOperators`](docs/options/sql-dense-operators.md)            | `boolean`                                | `false`      | Remove spaces around `=` and other symbol operators              | `denseOperators`          |

You may override the `sql*` options in `.prettierrc` or under `overrides` with `files: "*.sql"`. Core layout still follows [Prettier options](https://prettier.io/docs/options).

### Removed options

The following options from the old `prettier-plugin-sql` surface are **no longer recognised** and have no alias. A leftover key in `.prettierrc` is ignored — Prettier's CLI prints a `[warn] Ignored unknown option { … }` message once per `.sql` file until you remove it.

| Removed option          | Why it is gone                                                              |
| ----------------------- | -------------------------------------------------------------------------- |
| `language`              | Dialect is fixed to T-SQL; no dialect selection is offered.                |
| `dialect`               | Same — the T-SQL dialect table is hard-coded.                              |
| `formatter`             | Formatting always uses `sql-formatter`; there is nothing to switch.        |
| `type`                  | Belonged to the removed `node-sql-parser` backend.                         |
| `database`              | Belonged to the removed `node-sql-parser` backend.                         |
| `params`                | Parser-backend parameter substitution; unused by SFMC.                     |
| `paramTypes`            | Parser-backend parameter typing; unused by SFMC.                           |
| `uppercase`             | Superseded by the granular `sql*Case` options.                             |
| `linesBetweenQueries`   | Multi-statement spacing knob SFMC single-query activities never need.      |
| `newlineBeforeSemicolon`| Statement-terminator styling not applicable to SFMC queries.               |

**Migration note:** if your `.prettierrc` still lists any removed key, delete it — otherwise Prettier logs `[warn] Ignored unknown option { … }` for each `.sql` file it formats.

## HTML Embedding

When formatting `.html` files, the plugin:

1. Parses AMPscript regions (`%%[ ]%%`, `%%= =%%`, `<script language="ampscript">`)
2. Delegates HTML content to Prettier's built-in HTML formatter
3. Prettier's HTML formatter handles `<script runat="server">` SSJS blocks as JavaScript
4. Normalizes Marketing Cloud Next `{{…}}` Handlebars expressions (see [Handlebars](#handlebars-marketing-cloud-next))

This means a single plugin handles all SFMC formatting in HTML email templates.

## Handlebars (Marketing Cloud Next)

Marketing Cloud Next templates use [Handlebars](https://developer.salesforce.com/docs/marketing/handlebars-for-marketing-cloud-next) `{{…}}` expressions. These can co-exist with classic AMPscript and HTML in a single `.html` file, or stand alone in a dedicated `.hbs` file. The plugin normalizes each Handlebars expression it finds in both file types.

Normalization is driven by two options:

- [`handlebarsSpacing`](docs/options/handlebars-spacing.md) (default `false`) — internal whitespace runs always collapse to a single space (`{{ formatCurrency   x }}` becomes `{{formatCurrency x}}`). When `true`, simple mustaches and triple-stache also get one space of padding (`{{ formatCurrency x }}`, `{{{ raw }}}`); sigil mustaches (`{{#each}}`, `{{/each}}`, `{{^x}}`, `{{>p}}`, `{{&x}}`) always stay tight.
- [`handlebarsHelperCase`](docs/options/handlebars-helper-case.md) (default `"lower-camel"`) — recases **known** MCN Handlebars helper names (from the [`handlebars-data`](https://www.npmjs.com/package/handlebars-data) catalog) at the mustache head, block open/close, and subexpression heads. Unknown paths such as `{{firstName}}` or `{{item.Title}}` are always preserved.

Everything else is left exactly as written:

- **String literals are preserved byte-for-byte**, including their whitespace and quote character: `{{concat "a   b"}}` and `{{concat 'x   y'}}` are unchanged.
- **Handlebars comments are preserved verbatim**: `{{! … }}` and `{{!-- … --}}` keep their inner spacing.
- **Malformed or unbalanced expressions are left untouched** (for example a `{{#if}}` with no matching `{{/if}}` in the fragment) and never cause a formatting error.
- **`{!$…}` merge-field bindings are never touched** — these are SFMC personalization bindings, not Handlebars syntax, and pass through byte-for-byte.
- Formatting is **idempotent**: running it a second time produces identical output.

AMPscript delimiters (`%%[`, `]%%`, `%%=`, `=%%`) and their contents are unaffected.

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
