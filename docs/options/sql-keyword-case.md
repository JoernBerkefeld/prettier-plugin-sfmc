# `sqlKeywordCase`

> Control the casing of reserved SQL keywords in `.sql` files.

| | |
|---|---|
| **Type** | `"upper"` \| `"lower"` \| `"preserve"` |
| **Default** | `"upper"` |
| **Applied by** | `prettier --write` · VS Code format-on-save (requires the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) |

## What It Controls

Normalises the casing of reserved Transact-SQL keywords — `SELECT`, `FROM`, `WHERE`, `JOIN`, `INNER`, `AND`, `OR`, `IS`, `NOT`, `NULL`, and the like. SFMC Query Activities are case-insensitive on keywords, so this option simply picks one consistent style for the formatted output. It does not touch identifiers, function names, or data types (those have their own options).

## Settings

| Value | Effect |
|-------|--------|
| `"upper"` (default) | `SELECT`, `FROM`, `WHERE`, `INNER JOIN`, `AND`, … |
| `"lower"` | `select`, `from`, `where`, `inner join`, `and`, … |
| `"preserve"` | Keyword casing is left exactly as written |

### `"upper"` (default)

**Input:**

```sql
select s.SubscriberKey, s.EmailAddress, [Sub Status]
from [My Data Extension] s
inner join _Sent snt on snt.SubscriberKey = s.SubscriberKey
where [Sub Status] = @status and s.EmailAddress is not null
```

**Output:**

```sql
SELECT
    s.SubscriberKey,
    s.EmailAddress,
    [Sub Status]
FROM
    [My Data Extension] s
    INNER JOIN _Sent snt ON snt.SubscriberKey = s.SubscriberKey
WHERE
    [Sub Status] = @status
    AND s.EmailAddress IS NOT NULL
```

### `"lower"`

**Output:**

```sql
select
    s.SubscriberKey,
    s.EmailAddress,
    [Sub Status]
from
    [My Data Extension] s
    inner join _Sent snt on snt.SubscriberKey = s.SubscriberKey
where
    [Sub Status] = @status
    and s.EmailAddress is not null
```

### `"preserve"`

Keywords are emitted exactly as they appeared in the source.

## Configuration Example

```json
{
    "plugins": ["prettier-plugin-sfmc"],
    "sqlKeywordCase": "lower"
}
```

## Legacy alias

Before the `sql*` rename this option was `keywordCase`. That key is still accepted but **deprecated**: it carries no default, so it only appears in Prettier's resolved options when you set it explicitly. When set, the legacy key **wins** over `sqlKeywordCase` and Prettier's CLI prints a deprecation warning. It will be removed in the next major version — migrate to `sqlKeywordCase`.
