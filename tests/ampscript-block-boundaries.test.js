/**
 * Unit tests for ampscript block line-boundary detection.
 */

import { describe, expect, test } from '@jest/globals';
import {
    needsLeadingBlockBreak,
    needsTrailingBlockBreak,
} from '../src/ampscript-block-boundaries.js';

describe('needsLeadingBlockBreak', () => {
    test('false when missing original text', () => {
        expect(needsLeadingBlockBreak(undefined, 0)).toBe(false);
    });

    test('false at BOF', () => {
        expect(needsLeadingBlockBreak('%%[', 0)).toBe(false);
    });

    test('false after BOM only', () => {
        expect(needsLeadingBlockBreak('\uFEFF%%[', 1)).toBe(false);
    });

    test('false after newline', () => {
        expect(needsLeadingBlockBreak('x\n%%[', 2)).toBe(false);
    });

    test('false after CRLF', () => {
        expect(needsLeadingBlockBreak('x\r\n%%[', 3)).toBe(false);
    });

    test('true when same line as prior text', () => {
        expect(needsLeadingBlockBreak('x%%[', 1)).toBe(true);
    });
});

describe('needsTrailingBlockBreak', () => {
    test('false when missing original text', () => {
        expect(needsTrailingBlockBreak(undefined, 5)).toBe(false);
    });

    test('false at EOF', () => {
        expect(needsTrailingBlockBreak(']%%', 3)).toBe(false);
    });

    test('false before newline tail', () => {
        expect(needsTrailingBlockBreak(']%%\n', 3)).toBe(false);
    });

    test('false before CRLF tail', () => {
        expect(needsTrailingBlockBreak(']%%\r\n', 3)).toBe(false);
    });

    test('false when only spaces then newline', () => {
        expect(needsTrailingBlockBreak(']%%  \n', 3)).toBe(false);
    });

    test('true when same-line content follows', () => {
        expect(needsTrailingBlockBreak(']%%<p>', 3)).toBe(true);
    });
});
