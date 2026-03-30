# `ampscriptEnforceVariableCasing`

> Normalize all occurrences of a variable to the casing of its first appearance in the file.

| | |
|---|---|
| **Type** | `boolean` |
| **Default** | `true` |
| **Applied by** | `prettier --write` · VS Code format-on-save (requires the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) |

## What It Controls

AMPscript variables are case-insensitive at runtime — `@firstName`, `@FirstName`, and `@FIRSTNAME` all refer to the same variable. This option enforces a consistent casing across all references to the same variable within a file. When `true`, the casing of the first declaration (or first use if there is no `var`) is treated as canonical, and all subsequent occurrences are normalised to match it.

## Settings

| Value | Effect |
|-------|--------|
| `true` (default) | All occurrences of a variable adopt the casing of its first appearance |
| `false` | Variable casing is preserved as-is |

### `true` (default)

**Input:**

```ampscript
%%[
  var @firstName
  set @FirstName = "Alice"
  output(v(@FIRSTNAME))
]%%
```

**Output:**

```ampscript
%%[
  var @firstName
  set @firstName = "Alice"
  output(v(@firstName))
]%%
```

### `false`

**Input / Output** (casing preserved):

```ampscript
%%[
  var @firstName
  set @FirstName = "Alice"
  output(v(@FIRSTNAME))
]%%
```

## Configuration Example

```json
{
    "plugins": ["prettier-plugin-sfmc"],
    "ampscriptEnforceVariableCasing": false
}
```
