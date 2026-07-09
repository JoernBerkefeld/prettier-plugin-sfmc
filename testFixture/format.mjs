/**
 * Manual test runner for prettier-plugin-sfmc.
 *
 * Formats a file (or a whole directory of fixtures) using the LOCAL plugin
 * source (../src/index.js) — no build or publish step required. Prints the
 * formatted output to stdout and also runs an idempotency check (format twice,
 * compare).
 *
 * Usage (from prettier-plugin-sfmc/testFixture/):
 *   node format.mjs sample.html            # format and print
 *   node format.mjs sample.html --write    # overwrite the file in place
 *   node format.mjs sample.hbs             # standalone Handlebars file
 *   node format.mjs path/to/other.html     # any .html / .hbs / .amp / .ampscript / .ssjs / .sql
 *   node format.mjs ../tests/fixtures      # format every supported file in a folder
 *   node format.mjs --fixtures             # shortcut for ../tests/fixtures (print-only)
 *
 * Pass any plugin option with --opt key=value (repeatable), e.g.:
 *   node format.mjs sample.hbs --opt handlebarsSpacing=true
 *   node format.mjs sample.hbs --opt handlebarsHelperCase=upper-camel
 *
 * The parser is auto-selected from the file extension, so it mirrors real
 * `prettier` CLI behaviour.
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as prettier from 'prettier';
import * as plugin from '../src/index.js';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const fixturesDirectory = resolve(scriptDirectory, '..', 'tests', 'fixtures');

const arguments_ = process.argv.slice(2);
const write = arguments_.includes('--write');
const useFixtures = arguments_.includes('--fixtures');
const target = arguments_.find((a) => !a.startsWith('--'));

/**
 * Collect repeated `--opt key=value` pairs into a plugin options object.
 * Values `true` / `false` are coerced to booleans; everything else stays a string.
 */
const extraOptions = {};
for (let index = 0; index < arguments_.length; index++) {
    if (arguments_[index] === '--opt' && arguments_[index + 1]) {
        const [key, ...rest] = arguments_[index + 1].split('=');
        const raw = rest.join('=');
        let value = raw;
        if (raw === 'true') {
            value = true;
        } else if (raw === 'false') {
            value = false;
        }
        extraOptions[key] = value;
        index++;
    }
}

if (!target && !useFixtures) {
    console.error('Usage: node format.mjs <file|dir> [--write] [--opt key=value]');
    console.error('   or: node format.mjs --fixtures        # format ../tests/fixtures');
    process.exit(1);
}

/** Map file extension → the plugin parser that handles it. */
const parserByExtension = {
    '.html': 'ampscript-parse',
    '.hbs': 'ampscript-parse',
    '.amp': 'ampscript-parse',
    '.ampscript': 'ampscript-parse',
    '.ssjs': 'babel',
    '.sql': 'sql'
};

/**
 * Format a single file, print its output (unless writing), and report a
 * per-file summary line. Returns the idempotency result for aggregation.
 *
 * @param {string} filepath Absolute path to the file to format.
 * @param {boolean} printOutput When true, write formatted output to stdout.
 * @returns {Promise.<{ ok: boolean, idempotent: boolean, changed: boolean }>} Result.
 */
async function formatFile(filepath, printOutput) {
    const extension = extname(filepath).toLowerCase();
    const parser = parserByExtension[extension];
    if (!parser) {
        console.error(`skip (no parser for "${extension}"): ${filepath}`);
        return { ok: false, idempotent: true, changed: false };
    }

    const source = readFileSync(filepath, 'utf8');
    const formatOptions = { parser, plugins: [plugin], ...extraOptions };
    const formatted = await prettier.format(source, formatOptions);
    const formattedTwice = await prettier.format(formatted, formatOptions);
    const idempotent = formatted === formattedTwice;
    const changed = source !== formatted;

    if (write) {
        writeFileSync(filepath, formatted, 'utf8');
        console.error(`✔ wrote ${filepath}`);
    } else if (printOutput) {
        process.stdout.write(formatted);
    }

    return { ok: true, idempotent, changed, parser };
}

/** Absolute path of the requested target (file or directory). */
const targetPath = useFixtures ? fixturesDirectory : resolve(process.cwd(), target);
const isDirectory = statSync(targetPath).isDirectory();

if (isDirectory) {
    // Batch mode: format every supported file in the directory (print-only unless --write).
    const entries = readdirSync(targetPath)
        .filter((name) => parserByExtension[extname(name).toLowerCase()])
        .toSorted();

    console.error(`Formatting ${entries.length} file(s) in ${targetPath}`);
    if (Object.keys(extraOptions).length > 0) {
        console.error(`options: ${JSON.stringify(extraOptions)}`);
    }
    console.error('─'.repeat(60));

    let allIdempotent = true;
    for (const name of entries) {
        const filepath = join(targetPath, name);
        // In batch mode do not dump every file to stdout — keep the summary readable.
        const { idempotent, changed, parser } = await formatFile(filepath, false);
        allIdempotent &&= idempotent;
        const flags = [
            changed ? 'changed' : 'unchanged',
            idempotent ? 'idempotent' : 'NOT IDEMPOTENT'
        ].join(', ');
        console.error(`${idempotent ? '✔' : 'x'} ${name.padEnd(28)} [${parser}] ${flags}`);
    }

    console.error('─'.repeat(60));
    console.error(allIdempotent ? 'All files idempotent.' : 'SOME FILES ARE NOT IDEMPOTENT.');
    if (!allIdempotent) {
        process.exitCode = 2;
    }
} else {
    // Single-file mode: print the formatted output and a summary.
    const { idempotent, changed, parser } = await formatFile(targetPath, true);
    console.error('');
    console.error('─'.repeat(60));
    console.error(`parser:      ${parser}`);
    if (Object.keys(extraOptions).length > 0) {
        console.error(`options:     ${JSON.stringify(extraOptions)}`);
    }
    console.error(`changed:     ${changed ? 'yes' : 'no'}`);
    console.error(`idempotent:  ${idempotent ? 'yes' : 'NO — second pass differs!'}`);
    if (!idempotent) {
        process.exitCode = 2;
    }
}
