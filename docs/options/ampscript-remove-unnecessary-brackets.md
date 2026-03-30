# `ampscriptRemoveUnnecessaryBrackets`

> Automatically remove parentheses that add no grouping value.

| | |
|---|---|
| **Type** | `boolean` |
| **Default** | `true` |
| **Applied by** | `prettier --write` · VS Code format-on-save (requires the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) |

## What It Controls

Removes redundant parentheses around simple expressions where they contribute no grouping semantics. For example, `(@name)` used as a function argument or assignment value is simplified to `@name`. Parentheses that are genuinely required for operator precedence are always preserved.

## Settings

| Value | Effect |
|-------|--------|
| `true` (default) | Redundant parentheses are stripped |
| `false` | Parentheses are preserved exactly as written |

### `true` (default)

**Input:**

```ampscript
%%[
  var @result
  set @result = (Lookup("MyDE", "Value", "Key", (@key)))
  output(v((@result)))
]%%
```

**Output:**

```ampscript
%%[
  var @result
  set @result = Lookup("MyDE", "Value", "Key", @key)
  output(v(@result))
]%%
```

### `false`

**Input / Output** (parentheses preserved):

```ampscript
%%[
  var @result
  set @result = (Lookup("MyDE", "Value", "Key", (@key)))
  output(v((@result)))
]%%
```

## Configuration Example

```json
{
    "plugins": ["prettier-plugin-sfmc"],
    "ampscriptRemoveUnnecessaryBrackets": false
}
```
