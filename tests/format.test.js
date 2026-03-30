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
const fixturesDir = join(__dirname, 'fixtures');

function readFixture(name) {
    return readFileSync(join(fixturesDir, name), 'utf8');
}

async function format(code, options = {}) {
    return prettier.format(code, {
        parser: 'ampscript-parse',
        plugins: [plugin],
        ...options,
    });
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
        expect(result).toContain('V(@name)');
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
});

// ── Spacing option ───────────────────────────────────────────────────────────

describe('ampscriptSpacing', () => {
    test('enforces spacing in inline expressions when enabled (default)', async () => {
        const input = '%%=v(@name)=%%';
        const result = await format(input, { ampscriptSpacing: true });
        expect(result).toContain('%%= V(@name) =%%');
    });

    test('does not add spacing in inline expressions when disabled', async () => {
        const input = '%%=v(@name)=%%';
        const result = await format(input, { ampscriptSpacing: false });
        expect(result).toContain('%%=V(@name)=%%');
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

//── Variable casing option ───────────────────────────────────────────────────

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
    test('indents with 2 spaces by default', async () => {
        const input = '%%[\nset @x = "a"\n]%%';
        const result = await format(input, { tabWidth: 2 });
        // Statements inside a block should be indented
        const lines = result.split('\n');
        const setLine = lines.find((l) => l.includes('set @x'));
        expect(setLine).toBeDefined();
        if (setLine) {
            expect(setLine.startsWith('  ')).toBe(true);
        }
    });

    test('indents with 4 spaces when configured', async () => {
        const input = '%%[\nset @x = "a"\n]%%';
        const result = await format(input, { tabWidth: 4 });
        const lines = result.split('\n');
        const setLine = lines.find((l) => l.includes('set @x'));
        expect(setLine).toBeDefined();
        if (setLine) {
            expect(setLine.startsWith('    ')).toBe(true);
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
    test('adds line breaks around blocks by default', async () => {
        const input = '<p>Hello</p>%%[\n  set @x = 1\n]%%<p>World</p>';
        const result = await format(input);
        // Block should be separated from surrounding content by line breaks
        const lines = result.split('\n');
        // There should be a line with just %%[ and a line with just ]%%
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

    test('never affects inline expressions', async () => {
        const input = '<p>Hello %%= v(@name) =%%!</p>';
        const resultOn = await format(input, { ampscriptBlockLineBreaks: true });
        const resultOff = await format(input, { ampscriptBlockLineBreaks: false });
        // Inline expressions must stay inline regardless of setting
        expect(resultOn).toContain('Hello %%= V(@name) =%%!');
        expect(resultOff).toContain('Hello %%= V(@name) =%%!');
    });
});

// ── HTML embedding ───────────────────────────────────────────────────────────

describe('HTML embedding', () => {
    test('formats HTML structure while preserving AMPscript blocks', async () => {
        const input = '<html><body><p>Hello</p>%%[ set @x = 1 ]%%<p>World</p></body></html>';
        const result = await format(input);
        // HTML should be indented
        expect(result).toContain('<html>');
        expect(result).toContain('  <body>');
        expect(result).toContain('    <p>Hello</p>');
        expect(result).toContain('    <p>World</p>');
        // AMPscript block should be preserved and formatted
        expect(result).toContain('%%[');
        expect(result).toContain(']%%');
        expect(result).toContain('set @x = 1');
    });

    test('formats inline expressions inside HTML text', async () => {
        const input = '<p>Hello %%= v(@name) =%%!</p>';
        const result = await format(input);
        expect(result).toContain('%%= V(@name) =%%');
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
        expect(result).toContain('V(@url)');
        expect(result).toContain('<a');
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

describe('ampscriptRemoveUnnecessaryBrackets precedence cases', () => {
    test('removes parens around function calls and double parens', async () => {
        const input = readFixture('brackets.ampscript');
        const result = await format(input, { ampscriptRemoveUnnecessaryBrackets: true });
        expect(result).toContain("set @x = Lookup('DE', 'Field', 'Key', @val)");
        expect(result).toContain('set @y = @var');
        expect(result).toContain('set @z = V(@name)');
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
