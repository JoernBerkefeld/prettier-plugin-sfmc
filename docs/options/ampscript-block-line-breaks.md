# `ampscriptBlockLineBreaks`

> Optionally insert line breaks before and after `%%[ … ]%%` block expressions when they are **not** already at a line boundary in the source.

| | |
|---|---|
| **Type** | `boolean` |
| **Default** | `false` |
| **Applied by** | `prettier --write` · VS Code format-on-save (requires the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) |

## What It Controls

When set to `true`, Prettier may add a **single** mandatory line break before the opening delimiter and/or after the closing delimiter so the block is not glued to other text on the same line (for example `</p>%%[` or `]%%<p>`).

Breaks are **not** added when the opening is already at the start of a logical line (beginning of file after optional UTF-8 BOM, optional spaces/tabs only before `%%[`, or immediately after `\n` / `\r\n` / `\r`), or when the closing is already at the end of a logical line (only horizontal whitespace until the next line break or end of file). That keeps formatting **idempotent** on repeated save instead of growing extra blank lines.

Inline expressions (`%%= … =%%`) are never affected.

The default is `false` so SMS and other line-break–sensitive templates are not altered unless you opt in.

## Settings

| Value | Effect |
|-------|--------|
| `false` (default) | No extra outer line breaks from this option; inner block layout still normalizes |
| `true` | Add outer line breaks only where the block is not already isolated on its own line |

### `true` — inline-adjacent block

**Input:**

```html
<p>Hello</p>%%[
var @name
set @name = "Alice"
]%%<p>%%=v(@name)=%%</p>
```

**Output** (illustrative; exact HTML wrapping may include normal Prettier line breaks):

- A line break is inserted so `%%[` is not on the same line as `</p>`.
- A line break is inserted so `]%%` is not on the same line as `<p>`.

### `true` — already line-isolated (no extra outer breaks)

If the source already has `%%[` at the beginning of a line (after optional BOM / spaces / tabs) and `]%%` at the end of a line (before optional spaces and `\n` or EOF), enabling this option does **not** add further outer breaks, so the document does not grow on every format.

### `false` (default)

**Output:** blocks stay flush with surrounding content except for whatever the HTML / AMPscript printers do for normal indentation and line wrapping.

## Configuration Example

Opt in when you want blocks separated from inline HTML only where needed:

```json
{
    "plugins": ["prettier-plugin-sfmc"],
    "ampscriptBlockLineBreaks": true
}
```
