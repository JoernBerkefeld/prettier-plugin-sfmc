# `sqlIndentStyle`

> Control how clauses are indented and aligned in `.sql` files.

| | |
|---|---|
| **Type** | `"standard"` \| `"tabularLeft"` \| `"tabularRight"` |
| **Default** | `"standard"` |
| **Applied by** | `prettier --write` · VS Code format-on-save (requires the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) |

## What It Controls

Chooses the overall indentation layout of the query. `standard` puts each top-level keyword on its own line with the clause body indented beneath it. The two `tabular*` modes instead reserve a fixed-width column for the leading keyword and align the clause bodies into a single column.

> **`tabularLeft` and `tabularRight` ignore `tabWidth`.** In tabular modes the indentation is driven by the fixed keyword column, not by the `tabWidth` core option — setting `tabWidth` has no effect on the alignment.

## Settings

| Value | Effect |
|-------|--------|
| `"standard"` (default) | Keyword on its own line, body indented beneath it |
| `"tabularLeft"` | Fixed keyword column, keywords left-aligned within it |
| `"tabularRight"` | Fixed keyword column, keywords right-aligned within it |

### `"standard"` (default)

**Input:**

```sql
select s.SubscriberKey, s.EmailAddress, [First Name], [Last Name], [Sub Status] from [My Data Extension] s inner join _Sent snt on snt.SubscriberKey = s.SubscriberKey where [Sub Status] = @status and s.EmailAddress is not null
```

**Output:**

```sql
SELECT
    s.SubscriberKey,
    s.EmailAddress,
    [First Name],
    [Last Name],
    [Sub Status]
FROM
    [My Data Extension] s
    INNER JOIN _Sent snt ON snt.SubscriberKey = s.SubscriberKey
WHERE
    [Sub Status] = @status
    AND s.EmailAddress IS NOT NULL
```

### `"tabularLeft"`

Keywords are left-aligned in a fixed column; clause bodies line up to its right. `tabWidth` is ignored.

**Output:**

```sql
SELECT    s.SubscriberKey,
          s.EmailAddress,
          [First Name],
          [Last Name],
          [Sub Status]
FROM      [My Data Extension] s
INNER     JOIN _Sent snt ON snt.SubscriberKey = s.SubscriberKey
WHERE     [Sub Status] = @status
AND       s.EmailAddress IS NOT NULL
```

### `"tabularRight"`

Keywords are right-aligned in the fixed column; clause bodies line up to its right. `tabWidth` is ignored.

**Output:**

```sql
   SELECT s.SubscriberKey,
          s.EmailAddress,
          [First Name],
          [Last Name],
          [Sub Status]
     FROM [My Data Extension] s
    INNER JOIN _Sent snt ON snt.SubscriberKey = s.SubscriberKey
    WHERE [Sub Status] = @status
      AND s.EmailAddress IS NOT NULL
```

## Configuration Example

```json
{
    "plugins": ["prettier-plugin-sfmc"],
    "sqlIndentStyle": "tabularLeft"
}
```

## Legacy alias

Before the `sql*` rename this option was `indentStyle`. That key is still accepted but **deprecated**: it carries no default, so it only appears in Prettier's resolved options when you set it explicitly. When set, the legacy key **wins** over `sqlIndentStyle` and Prettier's CLI prints a deprecation warning. It will be removed in the next major version — migrate to `sqlIndentStyle`.
