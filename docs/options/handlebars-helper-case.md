# `handlebarsHelperCase`

> Control the casing of Marketing Cloud Next Handlebars helper names.

| | |
|---|---|
| **Type** | `"upper-camel"` \| `"lower-camel"` \| `"upper"` \| `"lower"` \| `"preserve"` |
| **Default** | `"lower-camel"` |
| **Applied by** | `prettier --write` · VS Code format-on-save (requires the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) |

## What It Controls

Normalises the casing of every **known** Marketing Cloud Next Handlebars helper name. MCN Handlebars helper names are case-insensitive at runtime; this option chooses a consistent form for the formatted output. The canonical names come from the [`handlebars-data`](https://www.npmjs.com/package/handlebars-data) catalog (e.g. `formatCurrency`, `getContentBlock`, `each`).

Recasing is applied at every head position of an expression:

- the mustache head — `{{formatCurrency …}}`
- a block open — `{{#each …}}`
- a block close — `{{/each}}`
- a subexpression head — `{{iif (isEmpty x) a b}}`

**Only names present in the catalog are recased.** Unknown paths — data fields, personalization strings, and dotted property access such as `{{firstName}}` or `{{item.Title}}` — are always preserved exactly as written, in every mode (including their casing).

## Settings

| Value | Effect (for the known helper `getContentBlock`) |
|-------|--------|
| `"lower-camel"` (default) | camelCase: `getContentBlock` |
| `"upper-camel"` | Canonical PascalCase: `GetContentBlock` |
| `"upper"` | ALL CAPS: `GETCONTENTBLOCK` |
| `"lower"` | all lowercase: `getcontentblock` |
| `"preserve"` | Helper casing is left exactly as written |

### `"lower-camel"` (default)

**Input:**

```handlebars
{{GetContentBlock key="my-block"}}
{{#EACH items}}{{firstName}}{{/EACH}}
```

**Output:**

```handlebars
{{getContentBlock key="my-block"}}
{{#each items}}{{firstName}}{{/each}}
```

Note that `firstName` is not a catalog helper, so its casing is left untouched.

### `"upper-camel"`

**Output:**

```handlebars
{{GetContentBlock key="my-block"}}
{{#Each items}}{{firstName}}{{/Each}}
```

### `"upper"`

**Output:**

```handlebars
{{GETCONTENTBLOCK key="my-block"}}
{{#EACH items}}{{firstName}}{{/EACH}}
```

### `"lower"`

**Output:**

```handlebars
{{getcontentblock key="my-block"}}
{{#each items}}{{firstName}}{{/each}}
```

### `"preserve"`

Helper names are emitted exactly as they appeared in the source. Whitespace is still normalised.

## Unknown paths are never touched

In every mode, a path that is not a known helper keeps its exact casing:

```handlebars
{{firstName}}
{{item.Title}}
{{Contact.EmailAddress}}
```

These are personalization fields, not helpers, so recasing them would change their meaning. They pass through unchanged.

## Configuration Example

```json
{
    "plugins": ["prettier-plugin-sfmc"],
    "handlebarsHelperCase": "upper-camel"
}
```
