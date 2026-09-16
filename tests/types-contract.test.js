import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from '@jest/globals';
import * as plugin from '../src/index.js';
import { options } from '../src/index.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const declarationPath = path.join(repoRoot, 'src', 'index.d.ts');
const expectedOptionKeys = [
    'ampscriptBlockLineBreaks',
    'ampscriptEnforceVariableCasing',
    'ampscriptFunctionCase',
    'ampscriptKeywordCase',
    'ampscriptQuoteStyle',
    'ampscriptRemoveUnnecessaryBrackets',
    'ampscriptSpacing',
    'ampscriptVarDeclarationStyle',
    'dataTypeCase',
    'denseOperators',
    'expressionWidth',
    'functionCase',
    'handlebarsHelperCase',
    'handlebarsSpacing',
    'identifierCase',
    'indentStyle',
    'keywordCase',
    'logicalOperatorNewline',
    'sqlDataTypeCase',
    'sqlDenseOperators',
    'sqlExpressionWidth',
    'sqlFunctionCase',
    'sqlIdentifierCase',
    'sqlIndentStyle',
    'sqlKeywordCase',
    'sqlLogicalOperatorNewline',
];
describe('TypeScript declaration contract', () => {
    test('runtime surface contains exactly the five named exports', () => {
        expect(Object.keys(plugin).toSorted((left, right) => left.localeCompare(right))).toEqual([
            'defaultOptions',
            'languages',
            'options',
            'parsers',
            'printers',
        ]);
    });

    test('runtime and declared option keys match exhaustively', () => {
        const declaration = readFileSync(declarationPath, 'utf8');
        const interfaceBody = declaration.match(/interface SfmcOptions \{([\s\S]*?)\n\}/)?.[1];
        expect(interfaceBody).toBeDefined();

        const declaredOptionKeys = Array.from(
            interfaceBody.matchAll(/^\s{4}(\w+)\?:/gm),
            (match) => match[1],
        ).toSorted((left, right) => left.localeCompare(right));

        expect(Object.keys(options).toSorted((left, right) => left.localeCompare(right))).toEqual(
            expectedOptionKeys,
        );
        expect(declaredOptionKeys).toEqual(expectedOptionKeys);
    });

    test('package metadata exposes runtime and declaration entrypoints', () => {
        const packageJson = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

        expect(packageJson.files).toContain('src');
        expect(packageJson.types).toBe('./src/index.d.ts');
        expect(packageJson.exports['.']).toEqual({
            types: './src/index.d.ts',
            default: './src/index.js',
        });
    });
});
