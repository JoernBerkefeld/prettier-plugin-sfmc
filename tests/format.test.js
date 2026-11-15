/**
 * Tests for prettier-plugin-sfmc
 *
 * Uses Prettier's format() API with the plugin to verify formatting output.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as prettier from 'prettier';
import * as plugin from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDirectory = join(__dirname, 'fixtures');

function readFixture(name) {
    return readFileSync(join(fixturesDirectory, name), 'utf8');
}

async function format(code, options = {}) {
    return prettier.format(code, {
        parser: 'ampscript-parse',
        plugins: [plugin],
        ...options,
    });
}

async function formatSsjs(code, options = {}) {
    return prettier.format(code, {
        parser: 'babel',
        plugins: [plugin],
        ...options,
    });
}

async function formatSql(code, options = {}) {
    return prettier.format(code, {
        parser: 'sql',
        plugins: [plugin],
        ...options,
    });
}

/**
 * The HTML embed path prints no final newline (existing behaviour for every
 * document that contains HTML), so "unchanged" means: identical to the input
 * apart from that last line break.
 *
 * @param {string} input Source text ending in a line break.
 * @returns {string} The input without its final line break.
 */
function unchanged(input) {
    return input.replace(/\n$/, '');
}

// ── Parser: basic document structure ─────────────────────────────────────────

describe('parser', () => {
    test('parses a simple block with var and set', async () => {
        const input = readFixture('simple-block.ampscript');
        const result = await format(input);
        expect(result).toContain('%%[');
        expect(result).toContain(']%%');
        expect(result).toContain('var @name');
        expect(result).toContain("set @name = 'World'");
    });

    test('parses inline expressions', async () => {
        const input = readFixture('simple-block.ampscript');
        const result = await format(input);
        expect(result).toContain('v(@name)');
        expect(result).toContain('=%%');
    });

    test('parses control flow (if/elseif/else/endif)', async () => {
        const input = readFixture('control-flow.ampscript');
        const result = await format(input);
        expect(result).toContain('if @age >= 18 then');
        expect(result).toContain('elseif @age < 3 then');
        expect(result).toContain('else');
        expect(result).toContain('endif');
    });

    test('parses for loops', async () => {
        const input = readFixture('control-flow.ampscript');
        const result = await format(input);
        expect(result).toContain('for @i = 1 to 10 do');
        expect(result).toContain('next @i');
    });

    test('cross-block FOR/IF: does not inject ENDIF/NEXT into the opening block', async () => {
        const input = `%%[
    FOR @i = 1 TO @rowCount DO
        IF NOT EMPTY(@val) THEN
]%%
<li>%%=V(@val)=%%</li>
%%[
        ENDIF
    NEXT @i
]%%`;
        const result = await format(input);
        const matches = (kw) =>
            (result.match(new RegExp(String.raw`\b${kw}\b`, 'gi')) || []).length;
        expect(matches('endif')).toBe(1);
        expect(matches('next')).toBe(1);
    });

    test('cross-block FOR/IF: ENDIF aligns deeper than NEXT (matches opening IF vs FOR)', async () => {
        const input = `%%[
    FOR @i = 1 TO @rowCount DO
        IF NOT EMPTY(@val) THEN
]%%
<li>%%=V(@val)=%%</li>
%%[
        ENDIF
    NEXT @i
]%%`;
        const result = await format(input, { tabWidth: 4 });
        const lines = result.split('\n').map((line) => line.replace(/\r$/, ''));
        const endifLine = lines.find((line) => /^\s*endif\s*$/i.test(line.trim()));
        const nextLine = lines.find((line) => /^\s*next\b/i.test(line.trim()));
        expect(endifLine).toBeDefined();
        expect(nextLine).toBeDefined();
        const endifIndent = endifLine.length - endifLine.trimStart().length;
        const nextIndent = nextLine.length - nextLine.trimStart().length;
        expect(endifIndent).toBeGreaterThan(nextIndent);
    });
});

// ── Spacing option ───────────────────────────────────────────────────────────

describe('ampscriptSpacing', () => {
    test('enforces spacing in inline expressions when enabled (default)', async () => {
        const input = '%%=v(@name)=%%';
        const result = await format(input, { ampscriptSpacing: true });
        expect(result).toContain('%%= v(@name) =%%');
    });

    test('does not add spacing in inline expressions when disabled', async () => {
        const input = '%%=v(@name)=%%';
        const result = await format(input, { ampscriptSpacing: false });
        expect(result).toContain('%%=v(@name)=%%');
    });

    test('normalizes inconsistent spacing in set statements', async () => {
        const input = readFixture('spacing.ampscript');
        const result = await format(input);
        // Should normalize to consistent "set @var = value" form
        expect(result).toContain('set @firstName = ');
        expect(result).toContain('set @lastName = ');
    });
});

// ── Quote style option ───────────────────────────────────────────────────────

describe('ampscriptQuoteStyle', () => {
    test('uses double quotes by default', async () => {
        const input = '%%[\n  set @x = "hello"\n]%%';
        const result = await format(input, { ampscriptQuoteStyle: 'double' });
        expect(result).toContain('"hello"');
    });

    test('converts to single quotes when configured', async () => {
        const input = '%%[\n  set @x = "hello"\n]%%';
        const result = await format(input, { ampscriptQuoteStyle: 'single' });
        expect(result).toContain("'hello'");
    });
});

// ── Variable casing option ───────────────────────────────────────────────────

describe('ampscriptEnforceVariableCasing', () => {
    test('normalizes variable casing to first occurrence when enabled', async () => {
        const input = readFixture('variable-casing.ampscript');
        const result = await format(input, {
            ampscriptEnforceVariableCasing: true,
        });
        // First occurrence is @Name, all others should match
        const matches = result.match(/@Name/g);
        // Should find at least the original @Name occurrences rewritten
        expect(matches).not.toBeNull();
        expect(matches.length).toBeGreaterThan(0);
        // Should NOT contain @name or @NAME (which are later occurrences)
        // Note: the inline %%=v(@nAmE)=%% should also become @Name
        expect(result).not.toContain('@nAmE');
    });

    test('preserves original casing when disabled', async () => {
        const input = '%%[\n  set @MyVar = "a"\n  set @myvar = "b"\n]%%';
        const result = await format(input, {
            ampscriptEnforceVariableCasing: false,
        });
        expect(result).toContain('@MyVar');
        expect(result).toContain('@myvar');
    });
});

// ── Bracket removal option ───────────────────────────────────────────────────

describe('ampscriptRemoveUnnecessaryBrackets', () => {
    test('removes needless parentheses when enabled', async () => {
        const input = readFixture('brackets.ampscript');
        const result = await format(input, {
            ampscriptRemoveUnnecessaryBrackets: true,
        });
        // (@status) should become @status
        expect(result).toContain('@status ==');
        expect(result).not.toContain('(@status)');
    });

    test('preserves parentheses when disabled', async () => {
        const input = readFixture('brackets.ampscript');
        const result = await format(input, {
            ampscriptRemoveUnnecessaryBrackets: false,
        });
        expect(result).toContain('(@status)');
    });
});

// ── Indentation ──────────────────────────────────────────────────────────────

describe('indentation', () => {
    test('indents block statements with plugin default tab width (4 spaces)', async () => {
        const input = '%%[\nset @x = "a"\n]%%';
        const result = await format(input);
        const lines = result.split('\n');
        const setLine = lines.find((l) => l.includes('set @x'));
        expect(setLine).toBeDefined();
        if (setLine) {
            expect(setLine.startsWith(' '.repeat(4))).toBe(true);
        }
    });

    test('indents with 2 spaces when tabWidth is 2', async () => {
        const input = '%%[\nset @x = "a"\n]%%';
        const result = await format(input, { tabWidth: 2 });
        const lines = result.split('\n');
        const setLine = lines.find((l) => l.includes('set @x'));
        expect(setLine).toBeDefined();
        if (setLine) {
            expect(setLine.startsWith('  ')).toBe(true);
        }
    });
});

// ── Full formatting (integration) ────────────────────────────────────────────

describe('full formatting', () => {
    test('formats the example file without errors', async () => {
        const input = readFileSync(join(__dirname, '..', 'example.ampscript'), 'utf8');
        const result = await format(input);
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
        // Should contain properly formatted blocks
        expect(result).toContain('%%[');
        expect(result).toContain(']%%');
    });
});

// ── Keyword casing option ────────────────────────────────────────────────────

describe('ampscriptKeywordCase', () => {
    test('lowercases keywords by default', async () => {
        const input = readFixture('control-flow.ampscript');
        const result = await format(input);
        expect(result).toContain('if @age >= 18 then');
        expect(result).toContain('elseif @age < 3 then');
        expect(result).toContain('else');
        expect(result).toContain('endif');
        expect(result).toContain('for @i = 1 to 10 do');
        expect(result).toContain('next @i');
    });

    test('uppercases keywords when configured', async () => {
        const input = readFixture('control-flow.ampscript');
        const result = await format(input, { ampscriptKeywordCase: 'upper' });
        expect(result).toContain('IF @age >= 18 THEN');
        expect(result).toContain('ELSEIF @age < 3 THEN');
        expect(result).toContain('ELSE');
        expect(result).toContain('ENDIF');
        expect(result).toContain('FOR @i = 1 TO 10 DO');
        expect(result).toContain('NEXT @i');
    });

    test('preserves original keyword casing when set to preserve', async () => {
        const input = '%%[\n  If @x == 1 Then\n    Set @y = 2\n  EndIf\n]%%';
        const result = await format(input, { ampscriptKeywordCase: 'preserve' });
        expect(result).toBeDefined();
        expect(result).toContain('If');
        expect(result).toContain('Then');
        expect(result).toContain('Set');
        expect(result).toContain('EndIf');
    });
});

// ── Function casing option ───────────────────────────────────────────────────

describe('ampscriptVarDeclarationStyle', () => {
    test('uses multi-line var layout by default', async () => {
        const input = '%%[\n  var @a, @b, @c\n]%%';
        const result = await format(input);
        expect(result).toContain('var @a,');
        expect(result).toContain('@b,');
        expect(result).toContain('@c');
        expect(result).not.toMatch(/var @a, @b, @c/);
    });

    test('keeps multi-var on one line when set to auto with wide printWidth', async () => {
        const input = '%%[\n  var @firstName, @lastName, @email\n]%%';
        const result = await format(input, {
            ampscriptVarDeclarationStyle: 'auto',
            printWidth: 100,
        });
        expect(result).toContain('var @firstName, @lastName, @email');
    });
});

describe('ampscriptFunctionCase', () => {
    test('applies PascalCase (upper-camel) by default', async () => {
        const input = '%%[\n  set @x = lookup("DE","Field","Key",@val)\n]%%';
        const result = await format(input);
        expect(result).toContain('Lookup(');
    });

    test('uppercases function names when configured', async () => {
        const input = '%%[\n  set @x = Lookup("DE","Field","Key",@val)\n]%%';
        const result = await format(input, { ampscriptFunctionCase: 'upper' });
        expect(result).toContain('LOOKUP(');
    });

    test('lowercases function names when configured', async () => {
        const input = '%%[\n  set @x = Lookup("DE","Field","Key",@val)\n]%%';
        const result = await format(input, { ampscriptFunctionCase: 'lower' });
        expect(result).toContain('lookup(');
    });

    test('preserves original function casing', async () => {
        const input = '%%[\n  set @x = lOoKuP("DE","Field","Key",@val)\n]%%';
        const result = await format(input, { ampscriptFunctionCase: 'preserve' });
        expect(result).toContain('lOoKuP(');
    });

    test('applies lowerCamelCase when configured', async () => {
        const input =
            '%%[\n  set @x = CONTENTBLOCKBYKEY("key")\n  set @y = lookup("DE","F","K",@v)\n]%%';
        const result = await format(input, { ampscriptFunctionCase: 'lower-camel' });
        expect(result).toContain('contentBlockByKey(');
        expect(result).toContain('lookup(');
    });
});

// ── Block line breaks option ─────────────────────────────────────────────────

describe('ampscriptBlockLineBreaks', () => {
    test('does not add outer line breaks around blocks by default', async () => {
        const input = '<p>Hello</p>%%[\n  set @x = 1\n]%%<p>World</p>';
        const resultDefault = await format(input);
        const resultExplicitOff = await format(input, { ampscriptBlockLineBreaks: false });
        // Default must match explicit false (HTML formatter may still insert a single newline).
        expect(resultDefault).toBe(resultExplicitOff);
    });

    test('adds line breaks around blocks when explicitly enabled', async () => {
        const input = '<p>Hello</p>%%[\n  set @x = 1\n]%%<p>World</p>';
        const result = await format(input, { ampscriptBlockLineBreaks: true });
        const lines = result.split('\n');
        expect(lines.some((l) => l.trim() === '%%[')).toBe(true);
        expect(lines.some((l) => l.trim() === ']%%')).toBe(true);
    });

    test('does not add line breaks when disabled', async () => {
        // Use plain text (no HTML tags) so embed path is not triggered
        const input = 'Hello%%[\n  set @x = 1\n]%%World';
        const result = await format(input, { ampscriptBlockLineBreaks: false });
        // Block should be glued to surrounding text without extra line breaks
        expect(result).toMatch(/Hello%%\[/);
        expect(result).toMatch(/]%%World/);
    });

    test('when enabled, does not add leading break if block opens at BOF', async () => {
        const input = '%%[\n  set @x = 1\n]%%';
        const result = await format(input, { ampscriptBlockLineBreaks: true });
        expect(result.startsWith('%%[')).toBe(true);
        const second = await format(result, { ampscriptBlockLineBreaks: true });
        expect(second).toBe(result);
    });

    test('when enabled, does not add leading break after UTF-8 BOM only', async () => {
        const input = '\u{FEFF}%%[\n  set @x = 1\n]%%';
        const result = await format(input, { ampscriptBlockLineBreaks: true });
        expect(result.startsWith('\u{FEFF}%%[')).toBe(true);
        const second = await format(result, { ampscriptBlockLineBreaks: true });
        expect(second).toBe(result);
    });

    test('when enabled, does not add breaks when block is already line-isolated (LF)', async () => {
        const input = '\n%%[\n  set @x = 1\n]%%\n';
        const result = await format(input, { ampscriptBlockLineBreaks: true });
        const second = await format(result, { ampscriptBlockLineBreaks: true });
        expect(second).toBe(result);
    });

    test('when enabled, does not add breaks when block uses CRLF boundaries', async () => {
        const input = '\r\n%%[\r\n  set @x = 1\r\n]%%\r\n';
        const result = await format(input, { ampscriptBlockLineBreaks: true });
        const second = await format(result, { ampscriptBlockLineBreaks: true });
        expect(second).toBe(result);
    });

    test('when enabled, does not add breaks when closing at EOF with optional newline', async () => {
        const noNl = '%%[\n  set @x = 1\n]%%';
        const withNl = '%%[\n  set @x = 1\n]%%\n';
        for (const input of [noNl, withNl]) {
            const result = await format(input, { ampscriptBlockLineBreaks: true });
            const second = await format(result, { ampscriptBlockLineBreaks: true });
            expect(second).toBe(result);
        }
    });

    test('when enabled, script-tag block on own lines stays idempotent', async () => {
        const input =
            '<html>\r\n<body>\r\n<script runat="server" language="ampscript">\r\n  set @x = 1\r\n</script>\r\n</body>\r\n</html>';
        const result = await format(input, { ampscriptBlockLineBreaks: true });
        const second = await format(result, { ampscriptBlockLineBreaks: true });
        expect(second).toBe(result);
    });

    test('never affects inline expressions', async () => {
        const input = '<p>Hello %%= v(@name) =%%!</p>';
        const resultOn = await format(input, { ampscriptBlockLineBreaks: true });
        const resultOff = await format(input, { ampscriptBlockLineBreaks: false });
        // Inline expressions must stay inline regardless of setting
        expect(resultOn).toContain('Hello %%= v(@name) =%%!');
        expect(resultOff).toContain('Hello %%= v(@name) =%%!');
    });
});

// ── HTML embedding ───────────────────────────────────────────────────────────

describe('HTML embedding', () => {
    test('formats HTML structure while preserving AMPscript blocks', async () => {
        const input = '<html><body><p>Hello</p>%%[ set @x = 1 ]%%<p>World</p></body></html>';
        const result = await format(input);
        // HTML should be indented (tabWidth 4 from plugin defaultOptions)
        expect(result).toContain('<html>');
        expect(result).toContain('    <body>');
        expect(result).toContain('        <p>Hello</p>');
        expect(result).toContain('        <p>World</p>');
        // AMPscript block should be preserved and formatted
        expect(result).toContain('%%[');
        expect(result).toContain(']%%');
        expect(result).toContain('set @x = 1');
    });

    test('formats inline expressions inside HTML text', async () => {
        const input = '<p>Hello %%= v(@name) =%%!</p>';
        const result = await format(input);
        expect(result).toContain('%%= v(@name) =%%');
        expect(result).toContain('<p>');
    });

    test('applies AMPscript options inside HTML documents', async () => {
        const input = '<div>%%[ SET @x = CONTENTBLOCKBYKEY("myKey") ]%%</div>';
        const result = await format(input, {
            ampscriptKeywordCase: 'upper',
            ampscriptFunctionCase: 'lower-camel',
            ampscriptQuoteStyle: 'double',
        });
        expect(result).toContain('SET @x = contentBlockByKey(');
        expect(result).toContain('"myKey"');
    });

    test('does not activate embed when there are no HTML tags', async () => {
        const input = '%%[\n  set @x = 1\n]%%';
        const result = await format(input);
        // Pure AMPscript — no HTML wrapper added
        expect(result).not.toContain('<html>');
        expect(result).toContain('%%[');
        expect(result).toContain('set @x = 1');
    });

    test('handles inline expressions in HTML attributes', async () => {
        const input = '<a href="%%=RedirectTo(v(@url))=%%">Click</a>';
        const result = await format(input);
        expect(result).toContain('RedirectTo(');
        expect(result).toContain('v(@url)');
        expect(result).toContain('<a');
    });
});

// ── AMPscript inside <script> / <style> bodies ───────────────────────────────

describe('AMPscript inside script and style elements', () => {
    test('leaves an inline expression inside a client-side JS string untouched', async () => {
        const input = "<script>\n    var x = '%%=v(@a)=%%';\n</script>\n";
        expect(await format(input)).toBe(unchanged(input));
    });

    test('leaves a block inside a client-side JS string untouched (no line break)', async () => {
        const input = "<script>\n    var t = '%%[ set @x = 1 ]%%%%=v(@x)=%%';\n</script>\n";
        const result = await format(input);
        expect(result).toBe(unchanged(input));
        expect(result).toContain("var t = '%%[ set @x = 1 ]%%%%=v(@x)=%%';");
    });

    test('leaves AMPscript outside a JS string untouched', async () => {
        const input = '<script>\n    var n = %%=v(@count)=%%;\n</script>\n';
        expect(await format(input)).toBe(unchanged(input));
    });

    test('still formats the JavaScript around verbatim AMPscript', async () => {
        const input = "<script>\nvar   x='%%=v(@a)=%%'\n</script>\n";
        expect(await format(input)).toBe("<script>\n    var x = '%%=v(@a)=%%';\n</script>");
    });

    test('keeps a multi-line block inside a script body as written', async () => {
        const input =
            '<script>\n    var a = 1;\n    %%[\nSET @X=1\n  ]%%\n    var b = 2;\n</script>\n';
        const result = await format(input);
        expect(result).toContain('%%[\nSET @X=1\n  ]%%');
    });

    test('leaves AMPscript inside a style element untouched', async () => {
        const input = '<style>\n    .a { width: %%=v(@w)=%%px; }\n</style>\n';
        expect(await format(input)).toBe(
            '<style>\n    .a {\n        width: %%=v(@w)=%%px;\n    }\n</style>',
        );
    });

    test('does not apply variable casing to verbatim AMPscript', async () => {
        const input = "<p>%%=v(@Name)=%%</p>\n<script>\n    var x = '%%=v(@NAME)=%%';\n</script>\n";
        expect(await format(input)).toBe(
            "<p>%%= v(@Name) =%%</p>\n<script>\n    var x = '%%=v(@NAME)=%%';\n</script>",
        );
    });

    test('resumes formatting after the closing tag', async () => {
        const input =
            "<script>\n    var x = '%%=v(@a)=%%';\n</script>\n<p>%%=v(@a)=%%</p>\n<!-- <script> -->\n<p>%%=v(@b)=%%</p>\n";
        expect(await format(input)).toBe(
            "<script>\n    var x = '%%=v(@a)=%%';\n</script>\n<p>%%= v(@a) =%%</p>\n<!-- <script> -->\n<p>%%= v(@b) =%%</p>",
        );
    });

    // The placeholder hides the quotes inside the AMPscript, so without help
    // Prettier would re-choose the JavaScript delimiter and break the string.
    test.each([
        ['double-quoted source', `"%%=Lookup('DE','f','k',@v)=%%"`],
        ['single-quoted source', `'%%=Lookup("DE","f","k",@v)=%%'`],
        ['double-quoted source without inner quotes', '"%%=v(@a)=%%"'],
        ['other quotes next to the AMPscript', `"it's %%=v(@a)=%% and %%=Lookup('a')=%%"`],
        ['more double quotes than single', `'say "hi" to "x" %%=Lookup("a")=%%'`],
    ])('keeps the JS string delimiter: %s', async (_name, literal) => {
        const input = `<script>\n    var s = ${literal};\n</script>\n`;
        expect(await format(input)).toBe(unchanged(input));
        expect(await format(input, { singleQuote: false })).toBe(unchanged(input));
    });

    test('keeps the CSS string delimiter', async () => {
        const input =
            "<style>\n    .a::before {\n        content: \"%%=Lookup('DE','f','k',@v)=%%\";\n    }\n</style>\n";
        expect(await format(input)).toBe(unchanged(input));
    });

    // Stray closing tags are normal in content-block fragments and make the
    // HTML parse fail; the verbatim rule must hold on that fallback path too.
    test('stays verbatim when the HTML cannot be parsed (stray closing tag)', async () => {
        const script = "<script>\nvar t = '%%[ set @x = 1 set @y = 2 ]%%%%=v(@x)=%%';\n</script>\n";
        const result = await format(`</td></tr></table>\n${script}`);
        expect(result).toContain(script);
    });

    test('treats an unclosed script element as running to the end', async () => {
        const result = await format(
            "<p>%%=v(@p)=%%</p>\n<script>\nvar t = '%%[ set @x = 1 set @y = 2 ]%%';\n",
        );
        expect(result).toContain("var t = '%%[ set @x = 1 set @y = 2 ]%%';");
        expect(result).toContain('<p>%%= v(@p) =%%</p>');
    });

    test('is not ended early by a closing tag inside a JS string', async () => {
        const result = await format(
            "<script>\nvar a = '</script>';\nvar t = '%%=v(@x)=%%';\n</script>\n<p>%%=v(@p)=%%</p>\n",
        );
        expect(result).toContain("var t = '%%=v(@x)=%%';");
        expect(result).toContain('<p>%%= v(@p) =%%</p>');
    });

    test('ignores tag-like text inside an attribute value', async () => {
        const input =
            '<a title="<script>" href="%%=v(@a)=%%">%%=v(@b)=%%</a>\n<p>%%=v(@c)=%%</p>\n<script>var q=1;</script>\n';
        expect(await format(input)).toBe(
            '<a title="<script>" href="%%= v(@a) =%%">%%= v(@b) =%%</a>\n<p>%%= v(@c) =%%</p>\n<script>\n    var q = 1;\n</script>',
        );
    });

    test('ignores custom elements whose name starts with script or style', async () => {
        const input =
            "<script-loader>%%=v(@a)=%%</script-loader><style-guide>%%=v(@b)=%%</style-guide>\n<script>var q='%%=v(@c)=%%';</script>\n";
        expect(await format(input)).toBe(
            "<script-loader>%%= v(@a) =%%</script-loader><style-guide>%%= v(@b) =%%</style-guide>\n<script>\n    var q = '%%=v(@c)=%%';\n</script>",
        );
    });

    test('control: AMPscript in attribute values and HTML text is still formatted', async () => {
        const input = '<a href="%%=RedirectTo(@url)=%%">%%=v(@name)=%%</a>\n';
        expect(await format(input)).toBe('<a href="%%= RedirectTo(@url) =%%">%%= v(@name) =%%</a>');
    });

    test('control: AMPscript script tag bodies are still formatted', async () => {
        const input =
            '<script runat="server" language="ampscript">\nset @x=1\n</script>\n<p>%%=v(@x)=%%</p>\n';
        expect(await format(input)).toBe(
            '<script runat="server" language="ampscript">\n    set @x = 1\n</script>\n<p>%%= v(@x) =%%</p>',
        );
    });

    // Relies on the ampscript-parser version that no longer produces AMPscript
    // nodes inside server-side JavaScript (unreleased at the time of writing;
    // resolved from the local workspace).
    test('leaves AMPscript in server-side JavaScript strings untouched', async () => {
        const input =
            '<script runat="server">\n' +
            "    var s = Platform.Function.TreatAsContent('%%=v(@a)=%%');\n" +
            "    var t = Platform.Function.TreatAsContent('%%[ set @x = 1 ]%%%%=v(@x)=%%');\n" +
            '</script>\n';
        expect(await format(input)).toBe(unchanged(input));
    });

    // Also relies on the unreleased ampscript-parser (see above).
    test('does not corrupt personalization strings next to = and [', async () => {
        const input =
            '<pre>\nA=[x?e=%%memberid%%=1]\nB=[plain]\nC=[%%memberid%%[x] tail]\nD=[%%= v(@a) =%%]\n</pre>\n';
        expect(await format(input)).toBe(unchanged(input));
    });
});

// ── Handlebars (MCN) ─────────────────────────────────────────────────────────

describe('Handlebars (MCN)', () => {
    test('collapses inner whitespace and trims padding in a mustache', async () => {
        const input = '<p>{{ foo   bar }}</p>';
        const result = await format(input);
        expect(result).toContain('{{foo bar}}');
        expect(result).not.toContain('{{ foo');
        expect(result).not.toContain('foo   bar');
    });

    test('normalizes a helper call with arguments', async () => {
        const input = '<p>{{formatDate   pubDate   "yyyy-MM-dd"}}</p>';
        const result = await format(input);
        expect(result).toContain('{{formatDate pubDate "yyyy-MM-dd"}}');
    });

    test('preserves whitespace inside double-quoted string literals', async () => {
        const input = '<p>{{concat   "a   b"   c}}</p>';
        const result = await format(input);
        expect(result).toContain('{{concat "a   b" c}}');
    });

    test('preserves whitespace and quote style inside single-quoted string literals', async () => {
        const input = "<p>{{concat   'x   y'}}</p>";
        const result = await format(input);
        expect(result).toContain("{{concat 'x   y'}}");
    });

    test('leaves {!$…} merge-field bindings byte-for-byte intact', async () => {
        const input = '<p>{!$Contact.Email}</p>';
        const result = await format(input);
        expect(result).toContain('{!$Contact.Email}');
    });

    test('formats mustaches alongside an untouched {!$…} binding', async () => {
        const input = '<p>{{ foo   bar }} and {!$Contact.Email}</p>';
        const result = await format(input);
        expect(result).toContain('{{foo bar}}');
        expect(result).toContain('{!$Contact.Email}');
    });

    test('does not disturb AMPscript blocks next to a mustache', async () => {
        const input = '<div>%%[ set @x = 1 ]%%{{ formatDate   x }}</div>';
        const result = await format(input);
        expect(result).toContain('set @x = 1');
        expect(result).toContain('{{formatDate x}}');
    });

    test('preserves Handlebars block comments verbatim', async () => {
        const input = '<p>{{!--  keep   me  --}}</p>';
        const result = await format(input);
        expect(result).toContain('{{!--  keep   me  --}}');
    });

    test('preserves triple-stache delimiters (no rewrite of raw output)', async () => {
        const input = '<p>{{{  raw   x  }}}</p>';
        const result = await format(input);
        expect(result).toContain('{{{raw x}}}');
    });

    test('malformed {{#if}} with no close does not throw and is left unchanged', async () => {
        const input = '<p>{{#if a}}x</p>';
        const result = await format(input);
        expect(result).toContain('{{#if a}}x');
    });

    test('is idempotent (format twice equals format once)', async () => {
        const input = readFixture('handlebars-mixed.html');
        const once = await format(input);
        const twice = await format(once);
        expect(twice).toBe(once);
    });

    test('mixed fixture: AMPscript, mustaches, and binding coexist correctly', async () => {
        const input = readFixture('handlebars-mixed.html');
        const result = await format(input);
        // AMPscript preserved
        expect(result).toContain('%%[');
        expect(result).toContain(']%%');
        // Block + inline helpers normalized
        expect(result).toContain('{{#each items as |item index|}}');
        expect(result).toContain('{{/each}}');
        expect(result).toContain('{{item.title}}');
        expect(result).toContain('{{formatDate item.date "yyyy-MM-dd"}}');
        expect(result).toContain('{{firstName}}');
        // Binding untouched
        expect(result).toContain('{!$Contact.Email}');
    });

    // ── Spacing option ────────────────────────────────────────────────────────

    test('default (handlebarsSpacing false): simple and triple mustaches are tight', async () => {
        const input = '<p>{{ foo bar }} {{{ raw }}}</p>';
        const result = await format(input);
        expect(result).toContain('{{foo bar}}');
        expect(result).toContain('{{{raw}}}');
    });

    test('handlebarsSpacing true: pads simple mustaches and triple-stache', async () => {
        const input = '<p>{{foo bar}} {{{raw}}}</p>';
        const result = await format(input, { handlebarsSpacing: true });
        expect(result).toContain('{{ foo bar }}');
        expect(result).toContain('{{{ raw }}}');
    });

    test('handlebarsSpacing true: sigil mustaches stay tight (block/partial/unescaped)', async () => {
        const input = '<div>{{#each items}}{{> part}}{{& unesc}}{{/each}}</div>';
        const result = await format(input, { handlebarsSpacing: true });
        expect(result).toContain('{{#each items}}');
        expect(result).toContain('{{> part}}');
        expect(result).toContain('{{& unesc}}');
        expect(result).toContain('{{/each}}');
    });

    // ── Helper casing option ──────────────────────────────────────────────────

    test('default helper casing is lower-camel for known helpers', async () => {
        const input = '<p>{{GetContentBlock key="b"}}</p>';
        const result = await format(input);
        expect(result).toContain('{{getContentBlock key="b"}}');
    });

    test('handlebarsHelperCase upper-camel capitalizes known helpers', async () => {
        const input = '<p>{{getContentBlock key="b"}}</p>';
        const result = await format(input, { handlebarsHelperCase: 'upper-camel' });
        expect(result).toContain('{{GetContentBlock key="b"}}');
    });

    test('handlebarsHelperCase upper uppercases known helpers', async () => {
        const input = '<p>{{getContentBlock key="b"}}</p>';
        const result = await format(input, { handlebarsHelperCase: 'upper' });
        expect(result).toContain('{{GETCONTENTBLOCK key="b"}}');
    });

    test('handlebarsHelperCase lower lowercases known helpers', async () => {
        const input = '<p>{{GetContentBlock key="b"}}</p>';
        const result = await format(input, { handlebarsHelperCase: 'lower' });
        expect(result).toContain('{{getcontentblock key="b"}}');
    });

    test('handlebarsHelperCase preserve leaves known helper casing untouched', async () => {
        const input = '<p>{{GeTcOnTeNtBlOcK key="b"}}</p>';
        const result = await format(input, { handlebarsHelperCase: 'preserve' });
        expect(result).toContain('{{GeTcOnTeNtBlOcK key="b"}}');
    });

    test('unknown paths are preserved in every casing mode', async () => {
        const input = '<p>{{firstName}} {{item.Title}}</p>';
        for (const mode of ['upper-camel', 'lower-camel', 'upper', 'lower', 'preserve']) {
            const result = await format(input, { handlebarsHelperCase: mode });
            expect(result).toContain('{{firstName}}');
            expect(result).toContain('{{item.Title}}');
        }
    });

    test('recases block open and block close of a known helper', async () => {
        const input = '<div>{{#EACH items}}x{{/EACH}}</div>';
        const result = await format(input, { handlebarsHelperCase: 'lower-camel' });
        expect(result).toContain('{{#each items}}');
        expect(result).toContain('{{/each}}');
    });

    test('recases a subexpression head while preserving the outer unknown head', async () => {
        const input = '<p>{{myField (ISEMPTY x) a b}}</p>';
        const result = await format(input, { handlebarsHelperCase: 'lower-camel' });
        // outer head is unknown -> preserved; subexpression head is known -> recased
        expect(result).toContain('{{myField (isEmpty x) a b}}');
    });

    test('string literals and casing coexist without literal corruption', async () => {
        const input = '<p>{{GetContentBlock "My  Key"}}</p>';
        const result = await format(input, { handlebarsHelperCase: 'lower-camel' });
        expect(result).toContain('{{getContentBlock "My  Key"}}');
    });

    // ── .hbs fixture ──────────────────────────────────────────────────────────

    test('formats a standalone .hbs document (helpers recased, paths preserved)', async () => {
        const input = readFixture('handlebars-page.hbs');
        const result = await format(input);
        expect(result).toContain('{{firstName}}');
        expect(result).toContain('{{#each items as |item index|}}');
        expect(result).toContain('{{/each}}');
        expect(result).toContain('{{item.Title}}');
        expect(result).toContain('{{formatCurrency item.price}}');
        expect(result).toContain("{{iif (isEmpty discount) 'no offer' discount}}");
        expect(result).toContain('{{{rawBlock}}}');
    });

    test('.hbs formatting is idempotent', async () => {
        const input = readFixture('handlebars-page.hbs');
        const once = await format(input);
        const twice = await format(once);
        expect(twice).toBe(once);
    });

    test('helper casing formatting is idempotent', async () => {
        const input = '<div>{{#EACH items}}{{GetContentBlock "k"}}{{/EACH}}</div>';
        const once = await format(input, { handlebarsHelperCase: 'upper-camel' });
        const twice = await format(once, { handlebarsHelperCase: 'upper-camel' });
        expect(twice).toBe(once);
    });
});

// ── Script tag syntax ────────────────────────────────────────────────────────

describe('script tag syntax', () => {
    test('parses and formats script tag blocks', async () => {
        const input = '<script runat="server" language="ampscript">\n  set @x = 1\n</script>';
        const result = await format(input);
        expect(result).toContain('<script runat="server" language="ampscript">');
        expect(result).toContain('</script>');
        expect(result).toContain('set @x = 1');
    });

    test('applies formatting options to script tag blocks', async () => {
        const input =
            '<script runat="server" language="ampscript">\n  SET @x = lookup("DE","Field","Key",@val)\n</script>';
        const result = await format(input, {
            ampscriptKeywordCase: 'lower',
            ampscriptFunctionCase: 'upper-camel',
            ampscriptQuoteStyle: 'single',
        });
        expect(result).toContain('set @x = Lookup(');
        expect(result).toContain("'DE'");
    });

    test('handles reversed attribute order', async () => {
        const input = '<script language="ampscript" runat="server">\n  set @x = 1\n</script>';
        const result = await format(input);
        expect(result).toContain('<script runat="server" language="ampscript">');
        expect(result).toContain('set @x = 1');
    });

    test('handles single-quoted attributes', async () => {
        const input = "<script runat='server' language='ampscript'>\n  set @x = 1\n</script>";
        const result = await format(input);
        expect(result).toContain('set @x = 1');
        expect(result).toContain('</script>');
    });

    test('does not confuse regular script tags with AMPscript', async () => {
        const input = '<script type="text/javascript">\n  var x = 1;\n</script>';
        const result = await format(input);
        // Should be treated as plain content, not parsed as AMPscript
        expect(result).not.toContain('%%[');
        expect(result).toContain('var x = 1;');
    });
});

describe('prettier-ignore', () => {
    test('single-line /* prettier-ignore */ preserves next statement as-is', async () => {
        const input = readFixture('prettier-ignore.ampscript');
        const result = await format(input);
        // SET  @b    =    2 should be preserved exactly
        expect(result).toContain('SET  @b    =    2');
        // Other set statements should be normalized
        expect(result).toContain('set @a = 1');
        expect(result).toContain('set @c = 3');
    });

    test('range /* prettier-ignore-start */ ... /* prettier-ignore-end */ preserves all in range as-is', async () => {
        const input = readFixture('prettier-ignore.ampscript');
        const result = await format(input);
        // SET  @d    =    4 and SET  @e    =    5 should be preserved exactly
        expect(result).toContain('SET  @d    =    4');
        expect(result).toContain('SET  @e    =    5');
        // set @f = 6 should be normalized
        expect(result).toContain('set @f = 6');
    });

    test('ignore comments themselves are printed in output', async () => {
        const input = readFixture('prettier-ignore.ampscript');
        const result = await format(input);
        expect(result).toContain('/* prettier-ignore */');
        expect(result).toContain('/* prettier-ignore-start */');
        expect(result).toContain('/* prettier-ignore-end */');
    });
});

// ── Quote handling (fixture) ─────────────────────────────────────────────────

describe('quotes fixture', () => {
    test('preserves alternate quotes when preferred style contains the content', async () => {
        const input = readFixture('quotes.ampscript');
        const result = await format(input, { ampscriptQuoteStyle: 'single' });
        expect(result).toContain('\'Hello "World"\'');
        expect(result).toContain('"It\'s me"');
    });

    test('uses double quotes when configured', async () => {
        const input = readFixture('quotes.ampscript');
        const result = await format(input, { ampscriptQuoteStyle: 'double' });
        expect(result).toContain('"It\'s me"');
    });
});

// ── Many-params (fixture) ────────────────────────────────────────────────────

describe('many-params fixture', () => {
    test('formats long function calls with wrapping', async () => {
        const input = readFixture('many-params.ampscript');
        const result = await format(input);
        expect(result).toBeDefined();
        expect(result).toContain('Lookup(');
    });

    test('keeps short function calls on one line', async () => {
        const input = readFixture('many-params.ampscript');
        const result = await format(input);
        const lines = result.split('\n');
        const concatLine = lines.find((l) => l.includes('Concat('));
        expect(concatLine).toBeDefined();
        expect(concatLine).toContain('Concat(@a, @b, @c)');
    });
});

describe('bracketed personalization strings', () => {
    test('keeps [_subscriberkey] intact in a SET assignment', async () => {
        const result = await format('%%[ SET @x = [_subscriberkey] ]%%');
        expect(result).toContain('set @x = [_subscriberkey]');
        expect(result).not.toContain('[ _subscriberkey ]');
        expect(result).not.toContain('[_subscriberkey ]');
        expect(result).not.toContain('[ _subscriberkey]');
    });

    test('keeps [First Name] intact including the internal space', async () => {
        const result = await format('%%[ SET @x = [First Name] ]%%');
        expect(result).toContain('set @x = [First Name]');
        expect(result).not.toContain('[First Name ]');
        expect(result).not.toContain('[ First Name]');
    });

    test('keeps a bracketed personalization string in a function argument', async () => {
        const result = await format('%%[ SET @x = Uppercase([First Name]) ]%%');
        expect(result).toContain('Uppercase([First Name])');
    });

    test('keeps a bracketed personalization string in an IF condition', async () => {
        const result = await format('%%[ IF [_subscriberkey] == "abc" THEN SET @x = 1 ENDIF ]%%');
        expect(result).toContain("if [_subscriberkey] == 'abc' then");
    });

    test('keeps a bracketed personalization string in an inline expression', async () => {
        const result = await format('%%=[First Name]=%%');
        expect(result).toContain('[First Name]');
        expect(result).not.toContain('[ First Name ]');
        expect(result).not.toContain('[First Name ]');
        expect(result).not.toContain('[ First Name]');
    });

    test('is idempotent across a second pass', async () => {
        const input = '%%[ SET @x = [First Name]\nSET @y = [_subscriberkey] ]%%';
        const first = await format(input);
        const second = await format(first);
        expect(second).toBe(first);
        expect(first).toContain('[First Name]');
        expect(first).toContain('[_subscriberkey]');
    });
});

describe('SSJS (babel) with plugin loaded', () => {
    test('applies plugin defaultOptions (single quotes, no trailing comma) without extra config', async () => {
        const input = 'const o = { foo: "bar", baz: "qux" };';
        const result = await formatSsjs(input);
        expect(result).toContain("'bar'");
        expect(result).toContain("'qux'");
        expect(result.trim()).not.toMatch(/,\s*}/);
    });

    test('does not emit trailing comma when object breaks across lines (default trailingComma)', async () => {
        const input = 'const x = { a: 1, b: 2, c: 3 };';
        const result = await formatSsjs(input, { printWidth: 10 });
        expect(result).not.toMatch(/,\s*}/);
    });

    test('explicit singleQuote / trailingComma still override defaults', async () => {
        const input = 'const o = { foo: "bar", baz: "qux", x: 1 };';
        const result = await formatSsjs(input, {
            singleQuote: false,
            trailingComma: 'all',
            printWidth: 20,
        });
        expect(result).toContain('"bar"');
        expect(result).toMatch(/,\s*}/);
    });
});

describe('SQL (composed prettier-plugin-sql)', () => {
    test('formats with uppercase keywords using plugin sql defaults', async () => {
        const input = 'select id from myTable where x = 1';
        const result = await formatSql(input);
        expect(result.toUpperCase()).toContain('SELECT');
        expect(result.toUpperCase()).toContain('FROM');
        expect(result.toUpperCase()).toContain('WHERE');
        expect(result.trimEnd().length).toBeGreaterThan(0);
    });
});

describe('ampscriptRemoveUnnecessaryBrackets precedence cases', () => {
    test('removes parens around function calls and double parens', async () => {
        const input = readFixture('brackets.ampscript');
        const result = await format(input, { ampscriptRemoveUnnecessaryBrackets: true });
        expect(result).toContain("set @x = Lookup('DE', 'Field', 'Key', @val)");
        expect(result).toContain('set @y = @var');
        expect(result).toContain('set @z = v(@name)');
    });

    test('removes parens when inner precedence > parent precedence', async () => {
        const input = readFixture('brackets.ampscript');
        const result = await format(input, { ampscriptRemoveUnnecessaryBrackets: true });
        // IF (@a and @b) or @c THEN → parens removable
        expect(result).toContain('if @a and @b or @c then');
        // IF (@a == \"b\") and @c THEN → parens removable
        expect(result).toContain("if @a == 'b' and @c then");
        // IF (not @flag) THEN → parens removable
        expect(result).toContain('if not @flag then');
        expect(result).toContain('set @q = not @flag');
    });

    test('keeps parens when inner precedence < parent precedence', async () => {
        const input = readFixture('brackets.ampscript');
        const result = await format(input, { ampscriptRemoveUnnecessaryBrackets: true });
        // IF (@a or @b) and @c THEN → parens required
        expect(result).toContain('if (@a or @b) and @c then');
    });
});
