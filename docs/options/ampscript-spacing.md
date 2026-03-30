# `ampscriptSpacing`

> Enforce consistent spacing around operators and inside inline expressions.

| | |
|---|---|
| **Type** | `boolean` |
| **Default** | `true` |
| **Applied by** | `prettier --write` · VS Code format-on-save (requires the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) |

## What It Controls

Controls whether spaces are emitted inside inline expressions (`%%= … =%%`) — between the `=%%` / `%%=` delimiters and the expression content — and around binary operators inside expressions. When `true`, the output is spaced for readability. When `false`, delimiters are printed flush against the content.

## Settings

| Value | Effect |
|-------|--------|
| `true` (default) | Prints `%%= V(@name) =%%` — spaces inside delimiters and around operators |
| `false` | Prints `%%=V(@name)=%%` — no spaces inside delimiters |

### `true` (default)

**Input:**

```ampscript
%%=V(@firstName)=%%
%%=Lookup("MyDE","Value","Key",@key)=%%
```

**Output:**

```ampscript
%%= V(@firstName) =%%
%%= Lookup("MyDE", "Value", "Key", @key) =%%
```

### `false`

**Input / Output:**

```ampscript
%%=V(@firstName)=%%
%%=Lookup("MyDE","Value","Key",@key)=%%
```

## Configuration Example

```json
{
    "plugins": ["prettier-plugin-sfmc"],
    "ampscriptSpacing": false
}
```
