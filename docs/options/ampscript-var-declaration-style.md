# `ampscriptVarDeclarationStyle`

> Control how `var` declarations with multiple variables are formatted.

| | |
|---|---|
| **Type** | `"auto"` \| `"single-line"` \| `"multi-line"` |
| **Default** | `"auto"` |
| **Applied by** | `prettier --write` · VS Code format-on-save (requires the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) |

## What It Controls

Determines whether multiple variables in a single `var` statement are kept on one line, split to one variable per line, or left to Prettier's `printWidth` heuristic. AMPscript allows both `var @a, @b, @c` (all on one line) and separate `var` statements for each variable.

## Settings

| Value | Effect |
|-------|--------|
| `"auto"` (default) | Single line when it fits within `printWidth`; one-per-line when it doesn't |
| `"single-line"` | Always `var @a, @b, @c` on one line regardless of width |
| `"multi-line"` | Always one variable per `var` statement |

### `"auto"` (default)

**Input:**

```ampscript
%%[
  var @firstName, @lastName, @email, @address, @city, @postalCode
]%%
```

**Output (when line is short enough for `printWidth`):**

```ampscript
%%[
  var @firstName, @lastName, @email
]%%
```

**Output (when line exceeds `printWidth`):**

```ampscript
%%[
  var @firstName
  var @lastName
  var @email
  var @address
  var @city
  var @postalCode
]%%
```

### `"single-line"`

**Output:**

```ampscript
%%[
  var @firstName, @lastName, @email, @address, @city, @postalCode
]%%
```

### `"multi-line"`

**Output:**

```ampscript
%%[
  var @firstName
  var @lastName
  var @email
  var @address
  var @city
  var @postalCode
]%%
```

## Configuration Example

```json
{
    "plugins": ["prettier-plugin-sfmc"],
    "ampscriptVarDeclarationStyle": "multi-line"
}
```
