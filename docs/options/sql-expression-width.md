# `sqlExpressionWidth`

> Set the character budget that decides when a parenthesised expression wraps onto multiple lines.

| | |
|---|---|
| **Type** | `number` (integer) |
| **Default** | `50` |
| **Applied by** | `prettier --write` · VS Code format-on-save (requires the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) |

## What It Controls

Sets the print width (in characters) at which a long parenthesised expression breaks onto multiple lines. It is what decides whether an `IN (...)` value list, a `CAST(...)` / `CONVERT(...)` call, or a parenthesised condition group stays on one line or expands with one item per line. When the inline form is **wider** than this budget the expression wraps to one item per line; when it fits **at or under** the budget it stays inline. Lower the number to wrap sooner; raise it to keep more on a single line.

## Settings

| Value | Effect |
|-------|--------|
| integer (default `50`) | An expression whose inline form is wider than this many characters wraps to one item per line; anything that fits at or under it stays inline. Smaller values wrap more aggressively. |

### Default `50`

The ten-value `IN` list below is wider than 50 characters inline, so at the default it wraps to one value per line:

**Input:**

```sql
select SubscriberKey from Subscribers where Country in ('DE', 'AT', 'CH', 'FR', 'IT', 'ES', 'NL', 'BE', 'PL', 'CZ')
```

**Output:**

```sql
SELECT
    SubscriberKey
FROM
    Subscribers
WHERE
    Country IN (
        'DE',
        'AT',
        'CH',
        'FR',
        'IT',
        'ES',
        'NL',
        'BE',
        'PL',
        'CZ'
    )
```

### `60`

Raising the budget so the whole list fits keeps the same query inline:

**Output:**

```sql
SELECT
    SubscriberKey
FROM
    Subscribers
WHERE
    Country IN ('DE', 'AT', 'CH', 'FR', 'IT', 'ES', 'NL', 'BE', 'PL', 'CZ')
```

## Configuration Example

```json
{
    "plugins": ["prettier-plugin-sfmc"],
    "sqlExpressionWidth": 60
}
```

## Legacy alias

Before the `sql*` rename this option was `expressionWidth`. That key is still accepted but **deprecated**: it carries no default, so it only appears in Prettier's resolved options when you set it explicitly. When set, the legacy key **wins** over `sqlExpressionWidth` and Prettier's CLI prints a deprecation warning. It will be removed in the next major version — migrate to `sqlExpressionWidth`.
