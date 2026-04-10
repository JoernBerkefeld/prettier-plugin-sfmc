# `ampscriptVarDeclarationStyle`

> Control how `var` declarations with multiple variables are formatted.

| | |
|---|---|
| **Type** | `"auto"` \| `"single-line"` \| `"multi-line"` |
| **Default** | `"multi-line"` |
| **Applied by** | `prettier --write` · VS Code format-on-save (requires the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) |

## What It Controls

Determines whether multiple variables in a single `var` statement stay on one line, break after each comma (still a single `var` keyword), or follow Prettier’s `printWidth` heuristic. AMPscript allows `var @a, @b, @c` on one line; this option does not split into separate `var` statements.

## Settings

| Value | Effect |
|-------|--------|
| `"multi-line"` (default) | One `var` keyword; variables separated by comma and line breaks (indented under `var`) |
| `"auto"` | Single line when it fits within `printWidth`; otherwise same comma-and-line-break layout as `"multi-line"` |
| `"single-line"` | Always `var @a, @b, @c` on one line regardless of width |

### `"multi-line"` (default)

**Input:**

```ampscript
%%[
  var @firstName, @lastName, @email, @address, @city, @postalCode
]%%
```

**Output** (indentation follows your Prettier `tabWidth`; shown with the plugin default of 4):

```ampscript
%%[
    var @firstName,
        @lastName,
        @email,
        @address,
        @city,
        @postalCode
]%%
```

### `"auto"`

**Input:**

```ampscript
%%[
  var @firstName, @lastName, @email
]%%
```

**Output (when the line fits within `printWidth`):**

```ampscript
%%[
    var @firstName, @lastName, @email
]%%
```

**Output (when the line exceeds `printWidth`):**

Same wrapped shape as `"multi-line"`: one `var`, commas at end of lines, continuation lines indented.

### `"single-line"`

**Output:**

```ampscript
%%[
    var @firstName, @lastName, @email, @address, @city, @postalCode
]%%
```

## Configuration Example

```json
{
    "plugins": ["prettier-plugin-sfmc"],
    "ampscriptVarDeclarationStyle": "auto"
}
```
