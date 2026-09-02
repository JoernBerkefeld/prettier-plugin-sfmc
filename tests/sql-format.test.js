/**
 * SQL characterization tests for prettier-plugin-sfmc.
 *
 * Every expected string below was captured by running the plugin BEFORE the
 * `prettier-plugin-sql` → direct `sql-formatter` swap and pasted verbatim. They
 * are deliberately inline (no Jest snapshots) so nothing can be re-accepted
 * with `-u` by accident. If an assertion here starts failing, fix the plugin
 * glue — do not edit the expectation.
 *
 * Resolved versions when the baseline was captured:
 * - sql-formatter 15.7.3 (hoisted to the monorepo root node_modules)
 * - prettier 3.9.6 (prettier-plugin-sfmc/node_modules/prettier)
 *
 * The option sweep in `legacy option names` uses the pre-rename keys
 * (`keywordCase`, …). After the rename to `sql*` those keys stay registered as
 * deprecated aliases, so that block doubles as the alias regression test.
 */

import { createRequire } from 'node:module';
import * as prettier from 'prettier';
import * as plugin from '../src/index.js';

const require = createRequire(import.meta.url);

async function formatSql(code, options = {}) {
    return prettier.format(code, {
        parser: 'sql',
        plugins: [plugin],
        ...options,
    });
}

const BASE =
    'select s.SubscriberKey, s.EmailAddress, [First Name], [Last Name], [Sub Status] from [My Data Extension] s inner join _Sent snt on snt.SubscriberKey = s.SubscriberKey where [Sub Status] = @status and s.EmailAddress is not null';

const BASE_EXPECTED =
    'SELECT\n    s.SubscriberKey,\n    s.EmailAddress,\n    [First Name],\n    [Last Name],\n    [Sub Status]\nFROM\n    [My Data Extension] s\n    INNER JOIN _Sent snt ON snt.SubscriberKey = s.SubscriberKey\nWHERE\n    [Sub Status] = @status\n    AND s.EmailAddress IS NOT NULL\n';

const WHERE_AND_OR =
    "select SubscriberKey from Subscribers where Status = 'Active' and (Country = 'DE' or Country = 'AT') and EmailAddress is not null";

const WHERE_AND_OR_EXPECTED =
    "SELECT\n    SubscriberKey\nFROM\n    Subscribers\nWHERE\n    Status = 'Active'\n    AND (\n        Country = 'DE'\n        OR Country = 'AT'\n    )\n    AND EmailAddress IS NOT NULL\n";

const LONG_IN =
    "select SubscriberKey from Subscribers where Country in ('DE', 'AT', 'CH', 'FR', 'IT', 'ES', 'NL', 'BE', 'PL', 'CZ')";

const LONG_IN_EXPECTED =
    "SELECT\n    SubscriberKey\nFROM\n    Subscribers\nWHERE\n    Country IN (\n        'DE',\n        'AT',\n        'CH',\n        'FR',\n        'IT',\n        'ES',\n        'NL',\n        'BE',\n        'PL',\n        'CZ'\n    )\n";

const CASING_SOURCE =
    "Select Count(*) As Total, IsNull(s.FirstName, 'n/a') As Name, Cast(s.Age As Int) As AgeInt, Convert(VarChar(10), s.CreatedDate, 120) As Created, [First Name] From [My Data Extension] s Where s.SubscriberKey = @key";

/**
 * Expected output of CASING_SOURCE for each casing option value. Keyed by the
 * sql-formatter option name (also the legacy alias name in this plugin).
 */
const CASING_EXPECTED = {
    keywordCase: {
        upper: "SELECT\n    COUNT(*) AS Total,\n    ISNULL(s.FirstName, 'n/a') AS Name,\n    CAST(s.Age AS Int) AS AgeInt,\n    CONVERT(VarChar(10), s.CreatedDate, 120) AS Created,\n    [First Name]\nFROM\n    [My Data Extension] s\nWHERE\n    s.SubscriberKey = @key\n",
        lower: "select\n    COUNT(*) as Total,\n    ISNULL(s.FirstName, 'n/a') as Name,\n    CAST(s.Age as Int) as AgeInt,\n    CONVERT(VarChar(10), s.CreatedDate, 120) as Created,\n    [First Name]\nfrom\n    [My Data Extension] s\nwhere\n    s.SubscriberKey = @key\n",
        preserve:
            "Select\n    COUNT(*) As Total,\n    ISNULL(s.FirstName, 'n/a') As Name,\n    CAST(s.Age As Int) As AgeInt,\n    CONVERT(VarChar(10), s.CreatedDate, 120) As Created,\n    [First Name]\nFrom\n    [My Data Extension] s\nWhere\n    s.SubscriberKey = @key\n",
    },
    functionCase: {
        upper: "SELECT\n    COUNT(*) AS Total,\n    ISNULL(s.FirstName, 'n/a') AS Name,\n    CAST(s.Age AS Int) AS AgeInt,\n    CONVERT(VarChar(10), s.CreatedDate, 120) AS Created,\n    [First Name]\nFROM\n    [My Data Extension] s\nWHERE\n    s.SubscriberKey = @key\n",
        lower: "SELECT\n    count(*) AS Total,\n    isnull(s.FirstName, 'n/a') AS Name,\n    cast(s.Age AS Int) AS AgeInt,\n    convert(VarChar(10), s.CreatedDate, 120) AS Created,\n    [First Name]\nFROM\n    [My Data Extension] s\nWHERE\n    s.SubscriberKey = @key\n",
        preserve:
            "SELECT\n    Count(*) AS Total,\n    IsNull(s.FirstName, 'n/a') AS Name,\n    Cast(s.Age AS Int) AS AgeInt,\n    Convert(VarChar(10), s.CreatedDate, 120) AS Created,\n    [First Name]\nFROM\n    [My Data Extension] s\nWHERE\n    s.SubscriberKey = @key\n",
    },
    identifierCase: {
        upper: "SELECT\n    COUNT(*) AS TOTAL,\n    ISNULL(S.FIRSTNAME, 'n/a') AS NAME,\n    CAST(S.AGE AS Int) AS AGEINT,\n    CONVERT(VarChar(10), S.CREATEDDATE, 120) AS CREATED,\n    [First Name]\nFROM\n    [My Data Extension] S\nWHERE\n    S.SUBSCRIBERKEY = @key\n",
        lower: "SELECT\n    COUNT(*) AS total,\n    ISNULL(s.firstname, 'n/a') AS name,\n    CAST(s.age AS Int) AS ageint,\n    CONVERT(VarChar(10), s.createddate, 120) AS created,\n    [First Name]\nFROM\n    [My Data Extension] s\nWHERE\n    s.subscriberkey = @key\n",
        preserve:
            "SELECT\n    COUNT(*) AS Total,\n    ISNULL(s.FirstName, 'n/a') AS Name,\n    CAST(s.Age AS Int) AS AgeInt,\n    CONVERT(VarChar(10), s.CreatedDate, 120) AS Created,\n    [First Name]\nFROM\n    [My Data Extension] s\nWHERE\n    s.SubscriberKey = @key\n",
    },
    dataTypeCase: {
        upper: "SELECT\n    COUNT(*) AS Total,\n    ISNULL(s.FirstName, 'n/a') AS Name,\n    CAST(s.Age AS INT) AS AgeInt,\n    CONVERT(VARCHAR(10), s.CreatedDate, 120) AS Created,\n    [First Name]\nFROM\n    [My Data Extension] s\nWHERE\n    s.SubscriberKey = @key\n",
        lower: "SELECT\n    COUNT(*) AS Total,\n    ISNULL(s.FirstName, 'n/a') AS Name,\n    CAST(s.Age AS int) AS AgeInt,\n    CONVERT(varchar(10), s.CreatedDate, 120) AS Created,\n    [First Name]\nFROM\n    [My Data Extension] s\nWHERE\n    s.SubscriberKey = @key\n",
        preserve:
            "SELECT\n    COUNT(*) AS Total,\n    ISNULL(s.FirstName, 'n/a') AS Name,\n    CAST(s.Age AS Int) AS AgeInt,\n    CONVERT(VarChar(10), s.CreatedDate, 120) AS Created,\n    [First Name]\nFROM\n    [My Data Extension] s\nWHERE\n    s.SubscriberKey = @key\n",
    },
};

const INDENT_STYLE_EXPECTED = {
    standard: BASE_EXPECTED,
    tabularLeft:
        'SELECT    s.SubscriberKey,\n          s.EmailAddress,\n          [First Name],\n          [Last Name],\n          [Sub Status]\nFROM      [My Data Extension] s\nINNER     JOIN _Sent snt ON snt.SubscriberKey = s.SubscriberKey\nWHERE     [Sub Status] = @status\nAND       s.EmailAddress IS NOT NULL\n',
    tabularRight:
        '   SELECT s.SubscriberKey,\n          s.EmailAddress,\n          [First Name],\n          [Last Name],\n          [Sub Status]\n     FROM [My Data Extension] s\n    INNER JOIN _Sent snt ON snt.SubscriberKey = s.SubscriberKey\n    WHERE [Sub Status] = @status\n      AND s.EmailAddress IS NOT NULL\n',
};

const LOGICAL_OPERATOR_NEWLINE_EXPECTED = {
    before: WHERE_AND_OR_EXPECTED,
    after: "SELECT\n    SubscriberKey\nFROM\n    Subscribers\nWHERE\n    Status = 'Active' AND\n    (\n        Country = 'DE' OR\n        Country = 'AT'\n    ) AND\n    EmailAddress IS NOT NULL\n",
};

const EXPRESSION_WIDTH_EXPECTED = {
    20: LONG_IN_EXPECTED,
    200: "SELECT\n    SubscriberKey\nFROM\n    Subscribers\nWHERE\n    Country IN ('DE', 'AT', 'CH', 'FR', 'IT', 'ES', 'NL', 'BE', 'PL', 'CZ')\n",
};

const DENSE_OPERATORS_EXPECTED =
    'SELECT\n    s.SubscriberKey,\n    s.EmailAddress,\n    [First Name],\n    [Last Name],\n    [Sub Status]\nFROM\n    [My Data Extension] s\n    INNER JOIN _Sent snt ON snt.SubscriberKey=s.SubscriberKey\nWHERE\n    [Sub Status]=@status\n    AND s.EmailAddress IS NOT NULL\n';

// ── Environment ──────────────────────────────────────────────────────────────

describe('SQL environment', () => {
    test('resolves sql-formatter 15.7.3 (the version the baseline was captured with)', () => {
        expect(require('sql-formatter/package.json').version).toBe('15.7.3');
    });
});

// ── Default-options corpus ───────────────────────────────────────────────────

describe('SQL formatting (SFMC defaults)', () => {
    test('preserves bracketed identifiers with spaces and @params', async () => {
        const out = await formatSql(
            'select [First Name], [Last Name] from [My Data Extension] where [Sub Status] = @status',
        );
        expect(out).toBe(
            'SELECT\n    [First Name],\n    [Last Name]\nFROM\n    [My Data Extension]\nWHERE\n    [Sub Status] = @status\n',
        );
    });

    test('puts each selected column on its own line', async () => {
        const out = await formatSql(
            'select SubscriberKey, EmailAddress, FirstName, LastName, City, Country, PostalCode, Status, CreatedDate, ModifiedDate from Subscribers',
        );
        expect(out).toBe(
            'SELECT\n    SubscriberKey,\n    EmailAddress,\n    FirstName,\n    LastName,\n    City,\n    Country,\n    PostalCode,\n    Status,\n    CreatedDate,\n    ModifiedDate\nFROM\n    Subscribers\n',
        );
    });

    test('formats INNER JOIN / LEFT JOIN with multi-condition ON', async () => {
        const out = await formatSql(
            'select s.SubscriberKey, o.EventDate from _Sent s inner join _Open o on o.JobID = s.JobID and o.SubscriberKey = s.SubscriberKey left join _Click c on c.JobID = s.JobID',
        );
        expect(out).toBe(
            'SELECT\n    s.SubscriberKey,\n    o.EventDate\nFROM\n    _Sent s\n    INNER JOIN _Open o ON o.JobID = s.JobID\n    AND o.SubscriberKey = s.SubscriberKey\n    LEFT JOIN _Click c ON c.JobID = s.JobID\n',
        );
    });

    test('breaks WHERE conditions before AND/OR and expands parenthesised groups', async () => {
        const out = await formatSql(WHERE_AND_OR);
        expect(out).toBe(WHERE_AND_OR_EXPECTED);
    });

    test('formats GROUP BY / HAVING / ORDER BY', async () => {
        const out = await formatSql(
            'select Country, count(*) as Total from Subscribers group by Country having count(*) > 10 order by Total desc',
        );
        expect(out).toBe(
            'SELECT\n    Country,\n    COUNT(*) AS Total\nFROM\n    Subscribers\nGROUP BY\n    Country\nHAVING\n    COUNT(*) > 10\nORDER BY\n    Total DESC\n',
        );
    });

    test('uppercases functions (COUNT/ISNULL/CONVERT/CAST) and preserves data types', async () => {
        const out = await formatSql(
            "select count(*) as Total, isnull(FirstName, 'Unknown') as Name, convert(varchar(10), CreatedDate, 120) as Created, cast(Age as int) as AgeInt from Subscribers",
        );
        expect(out).toBe(
            "SELECT\n    COUNT(*) AS Total,\n    ISNULL(FirstName, 'Unknown') AS Name,\n    CONVERT(varchar(10), CreatedDate, 120) AS Created,\n    CAST(Age AS int) AS AgeInt\nFROM\n    Subscribers\n",
        );
    });

    test('preserves parameterised data types in CAST/CONVERT', async () => {
        const out = await formatSql(
            'select cast(Amount as decimal(10, 2)) as Amount, convert(datetime, EventDate) as EventDate from Orders',
        );
        expect(out).toBe(
            'SELECT\n    CAST(Amount AS decimal(10, 2)) AS Amount,\n    CONVERT(datetime, EventDate) AS EventDate\nFROM\n    Orders\n',
        );
    });

    test('indents a subquery inside IN (...)', async () => {
        const out = await formatSql(
            'select SubscriberKey from Subscribers where SubscriberKey in (select SubscriberKey from _Sent where EventDate > dateadd(day, -30, getdate()))',
        );
        expect(out).toBe(
            'SELECT\n    SubscriberKey\nFROM\n    Subscribers\nWHERE\n    SubscriberKey IN (\n        SELECT\n            SubscriberKey\n        FROM\n            _Sent\n        WHERE\n            EventDate > DATEADD(day, -30, GETDATE())\n    )\n',
        );
    });

    test('formats CASE / WHEN / ELSE / END', async () => {
        const out = await formatSql(
            "select SubscriberKey, case when Age < 18 then 'minor' when Age >= 65 then 'senior' else 'adult' end as AgeGroup from Subscribers",
        );
        expect(out).toBe(
            "SELECT\n    SubscriberKey,\n    CASE\n        WHEN Age < 18 THEN 'minor'\n        WHEN Age >= 65 THEN 'senior'\n        ELSE 'adult'\n    END AS AgeGroup\nFROM\n    Subscribers\n",
        );
    });

    test('leaves string literals (embedded keywords, escaped quotes, double quotes) untouched', async () => {
        const out = await formatSql(
            "select 'select from where' as Kw, 'it''s ok' as Quoted, \"double\" as Dbl from Subscribers",
        );
        expect(out).toBe(
            "SELECT\n    'select from where' AS Kw,\n    'it''s ok' AS Quoted,\n    \"double\" AS Dbl\nFROM\n    Subscribers\n",
        );
    });

    test('keeps -- line comments', async () => {
        const out = await formatSql(
            "-- pick active subscribers\nselect SubscriberKey from Subscribers where Status = 'Active'",
        );
        expect(out).toBe(
            "-- pick active subscribers\nSELECT\n    SubscriberKey\nFROM\n    Subscribers\nWHERE\n    Status = 'Active'\n",
        );
    });

    test('keeps /* */ block comments', async () => {
        const out = await formatSql(
            '/* header comment */\nselect SubscriberKey /* inline */ from Subscribers',
        );
        expect(out).toBe(
            '/* header comment */\nSELECT\n    SubscriberKey /* inline */\nFROM\n    Subscribers\n',
        );
    });

    test('formats TOP', async () => {
        const out = await formatSql(
            'select top 10 SubscriberKey from Subscribers order by CreatedDate desc',
        );
        expect(out).toBe(
            'SELECT\n    TOP 10 SubscriberKey\nFROM\n    Subscribers\nORDER BY\n    CreatedDate DESC\n',
        );
    });

    test('formats _Sent / _Open data-view joins', async () => {
        const out = await formatSql(
            'select s.SubscriberKey, s.EventDate as SentDate, o.EventDate as OpenDate from _Sent s left join _Open o on o.JobID = s.JobID and o.SubscriberKey = s.SubscriberKey where s.EventDate >= dateadd(day, -7, getdate())',
        );
        expect(out).toBe(
            'SELECT\n    s.SubscriberKey,\n    s.EventDate AS SentDate,\n    o.EventDate AS OpenDate\nFROM\n    _Sent s\n    LEFT JOIN _Open o ON o.JobID = s.JobID\n    AND o.SubscriberKey = s.SubscriberKey\nWHERE\n    s.EventDate >= DATEADD(day, -7, GETDATE())\n',
        );
    });

    test('formats two ;-separated statements with one blank line between them', async () => {
        const out = await formatSql('select 1 as A; select 2 as B;');
        expect(out).toBe('SELECT\n    1 AS A;\n\nSELECT\n    2 AS B;\n');
    });

    test('default-options run on the representative SFMC query', async () => {
        const out = await formatSql(BASE);
        expect(out).toBe(BASE_EXPECTED);
    });
});

// ── Prettier core options / edge cases ───────────────────────────────────────

describe('SQL formatting (Prettier core options and edge cases)', () => {
    test('tabWidth: 4 indents with four spaces', async () => {
        const out = await formatSql(BASE, { tabWidth: 4 });
        expect(out).toBe(BASE_EXPECTED);
    });

    test('tabWidth: 2 indents with two spaces', async () => {
        const out = await formatSql(BASE, { tabWidth: 2 });
        expect(out).toBe(
            'SELECT\n  s.SubscriberKey,\n  s.EmailAddress,\n  [First Name],\n  [Last Name],\n  [Sub Status]\nFROM\n  [My Data Extension] s\n  INNER JOIN _Sent snt ON snt.SubscriberKey = s.SubscriberKey\nWHERE\n  [Sub Status] = @status\n  AND s.EmailAddress IS NOT NULL\n',
        );
    });

    test('useTabs: true indents with tab characters', async () => {
        const out = await formatSql(BASE, { useTabs: true });
        expect(out).toBe(
            'SELECT\n\ts.SubscriberKey,\n\ts.EmailAddress,\n\t[First Name],\n\t[Last Name],\n\t[Sub Status]\nFROM\n\t[My Data Extension] s\n\tINNER JOIN _Sent snt ON snt.SubscriberKey = s.SubscriberKey\nWHERE\n\t[Sub Status] = @status\n\tAND s.EmailAddress IS NOT NULL\n',
        );
    });

    test('is idempotent (formatting the output again yields the same text)', async () => {
        const once = await formatSql(BASE);
        const twice = await formatSql(once);
        expect(twice).toBe(BASE_EXPECTED);
    });

    test('CRLF input is normalised to LF output', async () => {
        const crlf = BASE.replaceAll(' from ', '\r\nfrom ').replaceAll(' where ', '\r\nwhere ');
        const out = await formatSql(crlf);
        expect(out).toBe(BASE_EXPECTED);
    });

    test("endOfLine: 'crlf' emits CRLF line endings", async () => {
        const out = await formatSql(BASE, { endOfLine: 'crlf' });
        expect(out).toBe(
            'SELECT\r\n    s.SubscriberKey,\r\n    s.EmailAddress,\r\n    [First Name],\r\n    [Last Name],\r\n    [Sub Status]\r\nFROM\r\n    [My Data Extension] s\r\n    INNER JOIN _Sent snt ON snt.SubscriberKey = s.SubscriberKey\r\nWHERE\r\n    [Sub Status] = @status\r\n    AND s.EmailAddress IS NOT NULL\r\n',
        );
    });

    test('empty input yields empty output', async () => {
        const out = await formatSql('');
        expect(out).toBe('');
    });

    test('whitespace-only input yields empty output', async () => {
        const out = await formatSql('   \n\n  ');
        expect(out).toBe('');
    });

    test('input without trailing newline gets exactly one appended', async () => {
        const out = await formatSql('select 1');
        expect(out).toBe('SELECT\n    1\n');
    });

    test('input with trailing newline still ends with exactly one', async () => {
        const out = await formatSql('select 1\n');
        expect(out).toBe('SELECT\n    1\n');
    });

    test('filepath inference (no parser option) routes *.sql to the SQL formatter', async () => {
        const out = await prettier.format(BASE, { filepath: 'x.sql', plugins: [plugin] });
        expect(out).toBe(BASE_EXPECTED);
    });

    test('unknown words are passed through as text (lenient formatter)', async () => {
        const out = await formatSql('selec foo frm bar wher baz');
        expect(out).toBe('selec foo frm bar wher baz\n');
    });

    test('unbalanced parentheses throw a parse error', async () => {
        await expect(formatSql('select 1 )')).rejects.toThrow(
            'Parse error at token: ) at line 1 column 10',
        );
    });

    test('getFileInfo: *.sql infers the sql parser', async () => {
        const info = await prettier.getFileInfo('x.sql', { plugins: [plugin] });
        expect(info.inferredParser).toBe('sql');
    });

    test('getFileInfo: *.pgsql no longer infers a parser (deliberate change)', async () => {
        // Before the prettier-plugin-sql -> sql-formatter swap this returned
        // inferredParser 'sql' (upstream registered .pgsql/.hql/.ddl/... dialect
        // extensions). The single-language rewrite intentionally claims only
        // .sql, so .pgsql now resolves to null. Documented in the README.
        const info = await prettier.getFileInfo('x.pgsql', { plugins: [plugin] });
        // eslint-disable-next-line unicorn/no-null -- Prettier's getFileInfo returns literal null for an un-inferred parser
        expect(info.inferredParser).toBe(null);
    });

    test('rangeStart/rangeEnd are ignored — SQL range formatting is a no-op', async () => {
        // parsers.sql uses locStart/locEnd:()=>-1, so Prettier cannot map a byte
        // range onto the (opaque) SQL text and returns the input unformatted.
        // Range formatting is intentionally unsupported for .sql (matches upstream).
        const out = await formatSql(BASE, { rangeStart: 10, rangeEnd: 40 });
        expect(out).toBe(BASE);
    });
});

// ── Option sweep — legacy (pre-rename) option names ──────────────────────────

describe('SQL options (legacy option names)', () => {
    for (const [option, byValue] of Object.entries(CASING_EXPECTED)) {
        for (const [value, expected] of Object.entries(byValue)) {
            test(`${option}: '${value}'`, async () => {
                const out = await formatSql(CASING_SOURCE, { [option]: value });
                expect(out).toBe(expected);
            });
        }
    }

    for (const [value, expected] of Object.entries(INDENT_STYLE_EXPECTED)) {
        test(`indentStyle: '${value}'`, async () => {
            const out = await formatSql(BASE, { indentStyle: value });
            expect(out).toBe(expected);
        });
    }

    for (const [value, expected] of Object.entries(LOGICAL_OPERATOR_NEWLINE_EXPECTED)) {
        test(`logicalOperatorNewline: '${value}'`, async () => {
            const out = await formatSql(WHERE_AND_OR, { logicalOperatorNewline: value });
            expect(out).toBe(expected);
        });
    }

    for (const [value, expected] of Object.entries(EXPRESSION_WIDTH_EXPECTED)) {
        test(`expressionWidth: ${value}`, async () => {
            const out = await formatSql(LONG_IN, { expressionWidth: Number(value) });
            expect(out).toBe(expected);
        });
    }

    test('expressionWidth default (50) breaks the long IN list', async () => {
        const out = await formatSql(LONG_IN);
        expect(out).toBe(LONG_IN_EXPECTED);
    });

    test('denseOperators: true removes spaces around comparison operators', async () => {
        const out = await formatSql(BASE, { denseOperators: true });
        expect(out).toBe(DENSE_OPERATORS_EXPECTED);
    });

    test('denseOperators: false (default) keeps spaces around operators', async () => {
        const out = await formatSql(BASE, { denseOperators: false });
        expect(out).toBe(BASE_EXPECTED);
    });
});

// ── Option sweep — canonical (sql*) option names ─────────────────────────────

/**
 * Mapping of legacy sql-formatter option name → canonical `sql*` plugin option.
 * The canonical sweep re-runs the legacy corpus under the new names and asserts
 * byte-identical output, proving the rename is behavior-preserving.
 */
const CANONICAL_NAME = {
    keywordCase: 'sqlKeywordCase',
    functionCase: 'sqlFunctionCase',
    identifierCase: 'sqlIdentifierCase',
    dataTypeCase: 'sqlDataTypeCase',
    indentStyle: 'sqlIndentStyle',
    logicalOperatorNewline: 'sqlLogicalOperatorNewline',
    expressionWidth: 'sqlExpressionWidth',
    denseOperators: 'sqlDenseOperators',
};

describe('SQL options (canonical sql* option names)', () => {
    for (const [option, byValue] of Object.entries(CASING_EXPECTED)) {
        const canonical = CANONICAL_NAME[option];
        for (const [value, expected] of Object.entries(byValue)) {
            test(`${canonical}: '${value}'`, async () => {
                const out = await formatSql(CASING_SOURCE, { [canonical]: value });
                expect(out).toBe(expected);
            });
        }
    }

    for (const [value, expected] of Object.entries(INDENT_STYLE_EXPECTED)) {
        test(`sqlIndentStyle: '${value}'`, async () => {
            const out = await formatSql(BASE, { sqlIndentStyle: value });
            expect(out).toBe(expected);
        });
    }

    for (const [value, expected] of Object.entries(LOGICAL_OPERATOR_NEWLINE_EXPECTED)) {
        test(`sqlLogicalOperatorNewline: '${value}'`, async () => {
            const out = await formatSql(WHERE_AND_OR, { sqlLogicalOperatorNewline: value });
            expect(out).toBe(expected);
        });
    }

    for (const [value, expected] of Object.entries(EXPRESSION_WIDTH_EXPECTED)) {
        test(`sqlExpressionWidth: ${value}`, async () => {
            const out = await formatSql(LONG_IN, { sqlExpressionWidth: Number(value) });
            expect(out).toBe(expected);
        });
    }

    test('sqlDenseOperators: true removes spaces around comparison operators', async () => {
        const out = await formatSql(BASE, { sqlDenseOperators: true });
        expect(out).toBe(DENSE_OPERATORS_EXPECTED);
    });
});

// ── Legacy alias precedence and deprecation ──────────────────────────────────

describe('SQL option aliases', () => {
    test('a legacy key wins over its canonical sql* counterpart when both are set', async () => {
        // keywordCase (legacy) has no default, so it is only present when set
        // explicitly; in that case it takes precedence over sqlKeywordCase.
        const out = await formatSql(CASING_SOURCE, {
            keywordCase: 'lower',
            sqlKeywordCase: 'upper',
        });
        expect(out).toBe(CASING_EXPECTED.keywordCase.lower);
    });

    test('the canonical value is used when only sqlKeywordCase is set', async () => {
        const out = await formatSql(CASING_SOURCE, { sqlKeywordCase: 'lower' });
        expect(out).toBe(CASING_EXPECTED.keywordCase.lower);
    });

    test('every legacy option descriptor is flagged deprecated with no default', () => {
        // Prettier only prints the yellow "<key> is deprecated" warning through
        // its CLI; the programmatic format() API does not surface it. The
        // deprecation contract is therefore asserted on the exported descriptor.
        for (const legacy of Object.keys(CANONICAL_NAME)) {
            expect(plugin.options[legacy].deprecated).toBe(true);
            expect(plugin.options[legacy].default).toBeUndefined();
        }
    });

    test('every canonical descriptor carries category SQL and a default', () => {
        for (const canonical of Object.values(CANONICAL_NAME)) {
            expect(plugin.options[canonical].category).toBe('SQL');
            expect(plugin.options[canonical].deprecated).toBeUndefined();
            expect(plugin.options[canonical].default).toBeDefined();
        }
    });
});
