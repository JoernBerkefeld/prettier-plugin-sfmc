# `ampscriptKeywordCase`

> Control the casing of AMPscript keywords.

| | |
|---|---|
| **Type** | `"lower"` \| `"upper"` \| `"preserve"` |
| **Default** | `"lower"` |
| **Applied by** | `prettier --write` · VS Code format-on-save (requires the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) |

## What It Controls

Normalises the casing of AMPscript control-flow keywords: `if`, `then`, `elseif`, `else`, `endif`, `for`, `to`, `downto`, `do`, `next`, `var`, `set`, `and`, `or`, `not`, `true`, `false`. AMPscript keywords are case-insensitive at runtime; this option picks a single style for the formatted output.

## Settings

| Value | Effect |
|-------|--------|
| `"lower"` (default) | `if`, `set`, `var`, `for`, `then`, `endif`, … |
| `"upper"` | `IF`, `SET`, `VAR`, `FOR`, `THEN`, `ENDIF`, … |
| `"preserve"` | Keyword casing is left exactly as written |

### `"lower"` (default)

**Input:**

```ampscript
%%[
  VAR @name
  SET @name = "Alice"
  IF @name == "Alice" THEN
    output(v(@name))
  ENDIF
]%%
```

**Output:**

```ampscript
%%[
  var @name
  set @name = "Alice"
  if @name == "Alice" then
    output(v(@name))
  endif
]%%
```

### `"upper"`

**Output:**

```ampscript
%%[
  VAR @name
  SET @name = "Alice"
  IF @name == "Alice" THEN
    output(v(@name))
  ENDIF
]%%
```

### `"preserve"`

Keywords are emitted exactly as they appeared in the source.

## Configuration Example

```json
{
    "plugins": ["prettier-plugin-sfmc"],
    "ampscriptKeywordCase": "upper"
}
```
