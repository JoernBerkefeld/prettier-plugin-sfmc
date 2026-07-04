# `handlebarsSpacing`

> Pad the inside of Marketing Cloud Next `{{…}}` expressions.

| | |
|---|---|
| **Type** | `boolean` |
| **Default** | `false` |
| **Applied by** | `prettier --write` · VS Code format-on-save (requires the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) |

## What It Controls

Controls whether one space of padding is emitted just inside the delimiters of a Marketing Cloud Next Handlebars expression. When `true`, simple mustaches (`{{ … }}`) and triple-stache (`{{{ … }}}`) are padded. Sigil mustaches — block open (`{{#each}}`), block close (`{{/each}}`), inverse (`{{^x}}`), partial (`{{>p}}`), and unescaped (`{{&x}}`) — always stay tight regardless of this option.

Internal runs of whitespace are collapsed to a single space either way, and the contents of quoted string literals are preserved byte-for-byte.

## Settings

| Value | Effect |
|-------|--------|
| `false` (default) | Tight: `{{foo bar}}`, `{{{raw}}}` |
| `true` | Padded simple/triple, tight sigils: `{{ foo bar }}`, `{{{ raw }}}`, `{{#each items}}` |

### `false` (default)

**Input:**

```handlebars
{{ foo   bar }}
{{{  raw  }}}
{{#each items}}{{ item.title }}{{/each}}
```

**Output:**

```handlebars
{{foo bar}}
{{{raw}}}
{{#each items}}{{item.title}}{{/each}}
```

### `true`

**Input:**

```handlebars
{{foo bar}}
{{{raw}}}
{{#each items}}{{item.title}}{{/each}}
```

**Output:**

```handlebars
{{ foo bar }}
{{{ raw }}}
{{#each items}}{{ item.title }}{{/each}}
```

Note how the block open/close (`{{#each}}` / `{{/each}}`) remain tight while the simple mustache (`{{ item.title }}`) is padded.

## Configuration Example

```json
{
    "plugins": ["prettier-plugin-sfmc"],
    "handlebarsSpacing": true
}
```
