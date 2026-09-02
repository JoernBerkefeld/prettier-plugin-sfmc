# `sqlDenseOperators`

> Remove the spaces around binary operators such as `=`.

| | |
|---|---|
| **Type** | `boolean` |
| **Default** | `false` |
| **Applied by** | `prettier --write` · VS Code format-on-save (requires the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) |

## What It Controls

Controls whitespace around binary operators like `=`, `<`, `>`, `+`, `-`. When `false` (default) operators are padded with a space on each side (`x = y`). When `true` the padding is removed for a denser layout (`x=y`). The `AND` / `OR` logical operators are word operators and are **not** affected — only symbol operators tighten up.

## Settings

| Value | Effect |
|-------|--------|
| `false` (default) | Operators are spaced: `snt.SubscriberKey = s.SubscriberKey`, `[Sub Status] = @status` |
| `true` | Operators are dense: `snt.SubscriberKey=s.SubscriberKey`, `[Sub Status]=@status` (`AND`/`OR` unchanged) |

### `false` (default)

**Input:**

```sql
select s.SubscriberKey, s.EmailAddress, [Sub Status] from [My Data Extension] s inner join _Sent snt on snt.SubscriberKey = s.SubscriberKey where [Sub Status] = @status and s.EmailAddress is not null
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

### `true`

Spaces around `=` are removed; `AND` / `OR` keep their spacing.

**Output:**

```sql
SELECT
    s.SubscriberKey,
    s.EmailAddress,
    [Sub Status]
FROM
    [My Data Extension] s
    INNER JOIN _Sent snt ON snt.SubscriberKey=s.SubscriberKey
WHERE
    [Sub Status]=@status
    AND s.EmailAddress IS NOT NULL
```

## Configuration Example

```json
{
    "plugins": ["prettier-plugin-sfmc"],
    "sqlDenseOperators": true
}
```

## Legacy alias

Before the `sql*` rename this option was `denseOperators`. That key is still accepted but **deprecated**: it carries no default, so it only appears in Prettier's resolved options when you set it explicitly. When set, the legacy key **wins** over `sqlDenseOperators` and Prettier's CLI prints a deprecation warning. It will be removed in the next major version — migrate to `sqlDenseOperators`.
