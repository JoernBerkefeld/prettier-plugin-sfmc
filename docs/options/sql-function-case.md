# `sqlFunctionCase`

> Control the casing of SQL function names in `.sql` files.

| | |
|---|---|
| **Type** | `"upper"` \| `"lower"` \| `"preserve"` |
| **Default** | `"upper"` |
| **Applied by** | `prettier --write` · VS Code format-on-save (requires the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) |

## What It Controls

Normalises the casing of recognised T-SQL function names — `COUNT`, `ISNULL`, `CAST`, `CONVERT`, `GETDATE`, and similar. Only names the formatter recognises as functions are affected; column and table identifiers are governed by [`sqlIdentifierCase`](sql-identifier-case.md) instead.

## Settings

| Value | Effect |
|-------|--------|
| `"upper"` (default) | `COUNT`, `ISNULL`, `CAST`, `CONVERT`, … |
| `"lower"` | `count`, `isnull`, `cast`, `convert`, … |
| `"preserve"` | Function-name casing is left exactly as written |

### `"upper"` (default)

**Input:**

```sql
select Count(*) as Total, IsNull(FirstName, 'x') as N from Subscribers
```

**Output:**

```sql
SELECT
    COUNT(*) AS Total,
    ISNULL(FirstName, 'x') AS N
FROM
    Subscribers
```

### `"lower"`

**Output:**

```sql
SELECT
    count(*) AS Total,
    isnull(FirstName, 'x') AS N
FROM
    Subscribers
```

### `"preserve"`

Function names are emitted exactly as they appeared in the source.

## Configuration Example

```json
{
    "plugins": ["prettier-plugin-sfmc"],
    "sqlFunctionCase": "lower"
}
```

## Legacy alias

Before the `sql*` rename this option was `functionCase`. That key is still accepted but **deprecated**: it carries no default, so it only appears in Prettier's resolved options when you set it explicitly. When set, the legacy key **wins** over `sqlFunctionCase` and Prettier's CLI prints a deprecation warning. It will be removed in the next major version — migrate to `sqlFunctionCase`.
