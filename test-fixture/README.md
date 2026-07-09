# test-fixture — prettier-plugin-sfmc

Ad-hoc harness to try the **local** plugin source (including the Marketing
Cloud Next `{{…}}` Handlebars normalization — whitespace, helper casing, and
optional padding) without building or publishing anything. It loads
`../src/index.js` directly.

The Jest fixtures live in `../tests/fixtures/`; this folder holds the manual
runner (`format.mjs`) and editable sample files for each language:

| Sample file | Demonstrates |
|---|---|
| `sample.html` | Mixed HTML + AMPscript + Marketing Cloud Next Handlebars |
| `sample.hbs` | Standalone Handlebars (`.hbs`) |
| `sample.amp` | AMPscript-only (blocks + inline `%%= … =%%`) |
| `sample.ssjs` | SSJS (routed through Prettier's `babel` parser) |
| `sample-mixed.html` | All three: AMPscript, SSJS (`<script runat="server">`), and Handlebars in one HTML file |

All sample files start out **intentionally messy** so you can watch the plugin
clean them up.

## Prerequisites

Install the package's dependencies once (from the package root, per the
monorepo convention):

```powershell
cd c:\EDF\Git\sfmc-amscript-language\prettier-plugin-sfmc
npm ci --no-workspaces
```

## Run it

From `prettier-plugin-sfmc/test-fixture/`:

```powershell
# Format a bundled sample and print the result (source file unchanged)
node format.mjs sample.html          # mixed HTML + AMPscript + Handlebars
node format.mjs sample.amp           # AMPscript-only
node format.mjs sample.ssjs          # SSJS (babel)
node format.mjs sample-mixed.html    # AMPscript + SSJS + Handlebars

# Standalone Handlebars file
node format.mjs sample.hbs

# Format every fixture in ../tests/fixtures (print-only, idempotency report)
node format.mjs --fixtures

# Format every supported file in any folder
node format.mjs ../tests/fixtures

# Try the Handlebars options (repeatable --opt key=value)
node format.mjs sample.hbs --opt handlebarsHelperCase=upper-camel
node format.mjs sample.hbs --opt handlebarsSpacing=true

# Overwrite a file in place with the formatted output
node format.mjs sample.html --write

# Point it at any file you like
node format.mjs "C:\path\to\your-template.html"
```

### Live editing in VS Code / Cursor (recommended)

`prettier-plugin-sfmc` is a **Prettier plugin**, not a VS Code extension — so it
can't be launched as an "extension host". Instead, open this folder as its own
editor window with the **Prettier extension** (`esbenp.prettier-vscode`) loading
the local plugin, then edit and save to see it format **live**.

From the workspace-level **Run and Debug** dropdown, pick
**prettier-plugin-sfmc: live edit window**. It opens a new window rooted at this
folder. Then:

1. Open `sample.html` or `sample.hbs`.
2. Edit it (mess up the `{{…}}` whitespace, change helper casing, etc.).
3. **Save** — format-on-save runs the plugin. Or run **Format Document**
   (`Shift+Alt+F`).

Configuration used by the window:

- `.prettierrc.json` — loads `../src/index.js` and sets the Handlebars options.
  **Change `handlebarsSpacing` / `handlebarsHelperCase` here** and re-format to
  experiment.
- `.vscode/settings.json` — Prettier as default formatter + format-on-save.

**After editing plugin source** (`../src/index.js`), restart the Prettier server
in that window (**Command Palette → “Prettier: Restart”**, or reload the window)
so it re-reads the plugin.

### Other F5 entries

The **Run and Debug** dropdown also has (breakpoints work in `src/**/*.js`):

- **format all test-fixtures** — batch-format `../tests/fixtures/` (print-only,
  idempotency report)
- **run test suite** — run the Jest suite under the debugger

See `.vscode/launch.json` at the workspace root.

Supported extensions (parser auto-selected): `.html`, `.hbs`, `.amp`,
`.ampscript`, `.ssjs`, `.sql`.

### Handlebars options

| Flag | Effect |
|---|---|
| `--opt handlebarsSpacing=true` | Pad simple/triple mustaches (`{{ foo }}`); sigil mustaches stay tight |
| `--opt handlebarsHelperCase=upper-camel` | Recase known helpers (`FormatCurrency`); also `lower-camel` (default), `upper`, `lower`, `preserve` |

Each run also does an **idempotency check** (formats the output a second time
and compares) and prints a short summary to stderr:

```
────────────────────────────────────────────────────────────
parser:      ampscript-parse
changed:     yes
idempotent:  yes
```

## What the samples demonstrate

**Handlebars** (`sample.html`, `sample.hbs`, `sample-mixed.html`):

- Whitespace inside `{{ … }}` collapsed and trimmed → `{{firstName}}`,
  `{{formatDate order.date "yyyy-MM-dd"}}`
- Block helpers (`{{#each … as |item index|}}`) normalized
- **String literals preserved byte-for-byte** — `{{concat "a   b   c"}}` is
  left exactly as written
- Triple-stache delimiters kept: `{{{ rawHtml }}}`
- Handlebars comments preserved verbatim: `{{! … }}`, `{{!-- … --}}`
- `{!$Contact.Email}` SFMC binding untouched
- Unbalanced `{{#if broken }}` left as-is, no error

**AMPscript** (`sample.amp`, and blocks inside the `.html` samples):

- `%%[ … ]%%` blocks re-indented; `set`/`if`/`for` bodies aligned
- Inline `%%= … =%%` expressions spaced consistently
- Function-call arguments and string quoting normalized

**SSJS** (`sample.ssjs`, and `<script runat="server">` in `sample-mixed.html`):

- Routed through Prettier's `babel` parser — standard JS formatting
  (indentation, spacing, object/array layout)

## Alternative — real Prettier CLI

You can also exercise it through the actual `prettier` binary with `--plugin`:

```powershell
cd c:\EDF\Git\sfmc-amscript-language\prettier-plugin-sfmc
npx prettier --plugin ./src/index.js test-fixture/sample.html
```

## Notes

- This folder is a scratch area for local testing. It is fine to add throwaway
  `.html` files here while experimenting.
