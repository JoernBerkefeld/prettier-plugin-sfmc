# `ampscriptFunctionCase`

> Control the casing of AMPscript function names.

| | |
|---|---|
| **Type** | `"upper-camel"` \| `"lower-camel"` \| `"upper"` \| `"lower"` \| `"preserve"` |
| **Default** | `"upper-camel"` |
| **Applied by** | `prettier --write` · VS Code format-on-save (requires the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) |

## What It Controls

Normalises the casing of every known AMPscript function name. AMPscript function names are case-insensitive at runtime; this option chooses a consistent form for the formatted output. The `"upper-camel"` value uses the canonical PascalCase form as published in the Salesforce documentation (e.g. `Lookup`, `ContentBlockByKey`, `AttributeValue`).

## Settings

| Value | Effect |
|-------|--------|
| `"upper-camel"` (default) | Canonical PascalCase: `Lookup`, `ContentBlockByKey` |
| `"lower-camel"` | camelCase: `lookup`, `contentBlockByKey` |
| `"upper"` | ALL CAPS: `LOOKUP`, `CONTENTBLOCKBYKEY` |
| `"lower"` | all lowercase: `lookup`, `contentblockbykey` |
| `"preserve"` | Function casing is left exactly as written |

### `"upper-camel"` (default)

**Input:**

```ampscript
%%[
  var @result
  set @result = LOOKUP("MyDE", "Value", "Key", @key)
  set @html = contentblockbykey("my-block")
]%%
```

**Output:**

```ampscript
%%[
  var @result
  set @result = Lookup("MyDE", "Value", "Key", @key)
  set @html = ContentBlockByKey("my-block")
]%%
```

### `"lower-camel"`

Uses the same canonical name as `"upper-camel"`, but with the first character lowercased (camelCase).

**Input:**

```ampscript
%%[
  var @result
  set @result = LOOKUP("MyDE", "Value", "Key", @key)
  set @html = contentblockbykey("my-block")
]%%
```

**Output:**

```ampscript
%%[
  var @result
  set @result = lookup("MyDE", "Value", "Key", @key)
  set @html = contentBlockByKey("my-block")
]%%
```

### `"upper"`

**Output:**

```ampscript
%%[
  var @result
  set @result = LOOKUP("MyDE", "Value", "Key", @key)
  set @html = CONTENTBLOCKBYKEY("my-block")
]%%
```

### `"lower"`

**Output:**

```ampscript
%%[
  var @result
  set @result = lookup("MyDE", "Value", "Key", @key)
  set @html = contentblockbykey("my-block")
]%%
```

### `"preserve"`

Function names are emitted exactly as they appeared in the source.

## Configuration Example

```json
{
    "plugins": ["prettier-plugin-sfmc"],
    "ampscriptFunctionCase": "upper-camel"
}
```
