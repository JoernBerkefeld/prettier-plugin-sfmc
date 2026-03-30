# `ampscriptBlockLineBreaks`

> Enforce blank lines before and after `%%[ … ]%%` block expressions.

| | |
|---|---|
| **Type** | `boolean` |
| **Default** | `true` |
| **Applied by** | `prettier --write` · VS Code format-on-save (requires the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) |

## What It Controls

Adds an empty line before and after every AMPscript block (`%%[ … ]%%`) to visually separate logic from surrounding HTML or text content. Inline expressions (`%%= … =%%`) are never affected. Set to `false` when blocks are embedded in contexts — such as attribute values or tightly formatted output sections — where extra blank lines would break the template layout.

## Settings

| Value | Effect |
|-------|--------|
| `true` (default) | Blank line inserted before and after every `%%[ ]%%` block |
| `false` | No blank lines added; blocks formatted flush with surrounding content |

### `true` (default)

**Input:**

```html
<p>Hello</p>%%[
var @name
set @name = "Alice"
]%%<p>%%=v(@name)=%%</p>
```

**Output:**

```html
<p>Hello</p>

%%[
  var @name
  set @name = "Alice"
]%%

<p>%%= v(@name) =%%</p>
```

### `false`

**Output:**

```html
<p>Hello</p>%%[
  var @name
  set @name = "Alice"
]%%<p>%%= v(@name) =%%</p>
```

## Configuration Example

```json
{
    "plugins": ["prettier-plugin-sfmc"],
    "ampscriptBlockLineBreaks": false
}
```
