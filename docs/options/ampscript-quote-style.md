# `ampscriptQuoteStyle`

> Select whether strings should be wrapped in single or double quotes.

| | |
|---|---|
| **Type** | `"single"` \| `"double"` |
| **Default** | `"single"` |
| **Applied by** | `prettier --write` · VS Code format-on-save (requires the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) |

## What It Controls

Normalises all AMPscript string literals to use a single consistent quote character. This applies to function arguments, `set` values, and any other string expression throughout the file.

## Settings

| Value | Effect |
|-------|--------|
| `"single"` (default) | All strings use single quotes: `'value'` |
| `"double"` | All strings use double quotes: `"value"` |

### `"single"` (default)

**Input:**

```ampscript
%%[
  var @name
  set @name = Lookup("MyDE", "Name", "Key", "abc")
]%%
```

**Output:**

```ampscript
%%[
  var @name
  set @name = Lookup('MyDE', 'Name', 'Key', 'abc')
]%%
```

### `"double"`

**Input:**

```ampscript
%%[
  var @name
  set @name = Lookup('MyDE', 'Name', 'Key', 'abc')
]%%
```

**Output:**

```ampscript
%%[
  var @name
  set @name = Lookup("MyDE", "Name", "Key", "abc")
]%%
```

## Configuration Example

```json
{
    "plugins": ["prettier-plugin-sfmc"],
    "ampscriptQuoteStyle": "double"
}
```
