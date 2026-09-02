# `sqlDataTypeCase`

> Control the casing of SQL data-type names in `.sql` files.

| | |
|---|---|
| **Type** | `"upper"` \| `"lower"` \| `"preserve"` |
| **Default** | `"preserve"` |
| **Applied by** | `prettier --write` · VS Code format-on-save (requires the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) |

## What It Controls

Normalises the casing of T-SQL data-type names where they appear in casts and conversions — for example the `INT` in `CAST(x AS int)` or the `DATE`/`VARCHAR` in `CONVERT(date, …)`. The default is `preserve` so existing type casing is kept unless you opt in to a house style.

## Settings

| Value | Effect |
|-------|--------|
| `"preserve"` (default) | Data-type casing is left exactly as written |
| `"upper"` | `INT`, `VARCHAR`, `DATE`, `DECIMAL`, … |
| `"lower"` | `int`, `varchar`, `date`, `decimal`, … |

### `"preserve"` (default)

**Input:**

```sql
select Cast(Age as int) as A, Convert(varchar(10), CreatedDate, 120) as C from Subscribers
```

**Output:**

```sql
SELECT
    CAST(Age AS int) AS A,
    CONVERT(varchar(10), CreatedDate, 120) AS C
FROM
    Subscribers
```

### `"upper"`

**Output:**

```sql
SELECT
    CAST(Age AS INT) AS A,
    CONVERT(VARCHAR(10), CreatedDate, 120) AS C
FROM
    Subscribers
```

### `"lower"`

Data-type names are lowercased (`int`, `varchar`, …); keyword and identifier casing follow their own options.

## Configuration Example

```json
{
    "plugins": ["prettier-plugin-sfmc"],
    "sqlDataTypeCase": "upper"
}
```

## Legacy alias

Before the `sql*` rename this option was `dataTypeCase`. That key is still accepted but **deprecated**: it carries no default, so it only appears in Prettier's resolved options when you set it explicitly. When set, the legacy key **wins** over `sqlDataTypeCase` and Prettier's CLI prints a deprecation warning. It will be removed in the next major version — migrate to `sqlDataTypeCase`.
