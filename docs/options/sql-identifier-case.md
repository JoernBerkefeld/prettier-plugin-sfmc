# `sqlIdentifierCase`

> Control the casing of unquoted SQL identifiers in `.sql` files.

| | |
|---|---|
| **Type** | `"upper"` \| `"lower"` \| `"preserve"` |
| **Default** | `"preserve"` |
| **Applied by** | `prettier --write` · VS Code format-on-save (requires the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) |

## What It Controls

Normalises the casing of **unquoted** identifiers — table names, aliases, and column names such as `SubscriberKey`, `s`, `_Sent`. The default is `preserve` because SFMC Data Extension and column names are often mixed-case by design, and recasing them makes queries harder to read against the schema.

### Asymmetry — bracketed names and variables are never recased

Even at `upper` or `lower`, two kinds of identifier are **always left untouched**:

- **`[bracketed]` names** — e.g. `[First Name]`, `[Sub Status]`, `[My Data Extension]`. These are quoted identifiers and pass through byte-for-byte.
- **`@variables`** — e.g. `@status`. Query parameters keep their original casing.

Because only bare identifiers are affected, `upper`/`lower` produce a mixed result (bare names recased, bracketed and `@` names preserved). For predictable output on SFMC queries — which routinely mix both — `preserve` is recommended.

## Settings

| Value | Effect |
|-------|--------|
| `"preserve"` (default) | Identifier casing is left exactly as written (recommended) |
| `"upper"` | Bare identifiers → `UPPERCASE`; `[bracketed]` names and `@vars` unchanged |
| `"lower"` | Bare identifiers → `lowercase`; `[bracketed]` names and `@vars` unchanged |

### `"preserve"` (default)

**Input:**

```sql
select s.SubscriberKey, s.EmailAddress, [First Name] from [My Data Extension] s where [Sub Status] = @status
```

**Output:**

```sql
SELECT
    s.SubscriberKey,
    s.EmailAddress,
    [First Name]
FROM
    [My Data Extension] s
WHERE
    [Sub Status] = @status
```

### `"upper"`

Note how `[First Name]`, `[Last Name]`, `[Sub Status]`, `[My Data Extension]`, and `@status` are **not** recased, while `s`, `SubscriberKey`, `_Sent`, etc. are.

**Output:**

```sql
SELECT
    S.SUBSCRIBERKEY,
    S.EMAILADDRESS,
    [First Name],
    [Last Name],
    [Sub Status]
FROM
    [My Data Extension] S
    INNER JOIN _SENT SNT ON SNT.SUBSCRIBERKEY = S.SUBSCRIBERKEY
WHERE
    [Sub Status] = @status
    AND S.EMAILADDRESS IS NOT NULL
```

### `"lower"`

Bare identifiers are lowercased; `[bracketed]` names and `@status` are preserved.

## Configuration Example

```json
{
    "plugins": ["prettier-plugin-sfmc"],
    "sqlIdentifierCase": "preserve"
}
```

## Legacy alias

Before the `sql*` rename this option was `identifierCase`. That key is still accepted but **deprecated**: it carries no default, so it only appears in Prettier's resolved options when you set it explicitly. When set, the legacy key **wins** over `sqlIdentifierCase` and Prettier's CLI prints a deprecation warning. It will be removed in the next major version — migrate to `sqlIdentifierCase`.
