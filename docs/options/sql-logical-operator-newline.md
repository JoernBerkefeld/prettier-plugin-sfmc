# `sqlLogicalOperatorNewline`

> Control whether `AND` / `OR` sit before or after the line break when a condition wraps.

| | |
|---|---|
| **Type** | `"before"` \| `"after"` |
| **Default** | `"before"` |
| **Applied by** | `prettier --write` · VS Code format-on-save (requires the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) |

## What It Controls

When a `WHERE` (or `ON`, `HAVING`, …) clause spans multiple lines, each `AND` / `OR` logical operator sits at a line boundary. This option decides which side of the break it lands on: `before` starts the new line with the operator (operator leads the following condition), while `after` leaves the operator trailing at the end of the preceding condition.

## Settings

| Value | Effect |
|-------|--------|
| `"before"` (default) | The new line **begins** with `AND` / `OR` |
| `"after"` | The previous line **ends** with `AND` / `OR` |

### `"before"` (default)

**Input:**

```sql
select SubscriberKey from Subscribers where Status = 'Active' and (Country = 'DE' or Country = 'AT') and EmailAddress is not null
```

**Output:**

```sql
SELECT
    SubscriberKey
FROM
    Subscribers
WHERE
    Status = 'Active'
    AND (
        Country = 'DE'
        OR Country = 'AT'
    )
    AND EmailAddress IS NOT NULL
```

### `"after"`

**Output:**

```sql
SELECT
    SubscriberKey
FROM
    Subscribers
WHERE
    Status = 'Active' AND
    (
        Country = 'DE' OR
        Country = 'AT'
    ) AND
    EmailAddress IS NOT NULL
```

## Configuration Example

```json
{
    "plugins": ["prettier-plugin-sfmc"],
    "sqlLogicalOperatorNewline": "after"
}
```

## Legacy alias

Before the `sql*` rename this option was `logicalOperatorNewline`. That key is still accepted but **deprecated**: it carries no default, so it only appears in Prettier's resolved options when you set it explicitly. When set, the legacy key **wins** over `sqlLogicalOperatorNewline` and Prettier's CLI prints a deprecation warning. It will be removed in the next major version — migrate to `sqlLogicalOperatorNewline`.
