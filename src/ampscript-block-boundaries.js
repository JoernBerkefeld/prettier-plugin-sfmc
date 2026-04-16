/**
 * Detect whether AMPscript block delimiters already sit on their own logical
 * lines in the original source (LF, CRLF, or CR). Used to avoid Prettier
 * hardlines that would accumulate on repeated format.
 *
 * @param {string} ch
 */
function isHorizontalSpaceOrBom(ch) {
    return ch === ' ' || ch === '\t' || ch === '\uFEFF';
}

/**
 * True if `index` is the first non–BOM/horizontal-ws column of a line
 * (BOF, or only BOM/ws before index, or newline before index after skipping ws).
 *
 * @param {string} text
 * @param {number} index
 */
function isIndexAtLineStart(text, index) {
    if (index <= 0) {
        return true;
    }

    let i = index - 1;
    while (i >= 0 && isHorizontalSpaceOrBom(text[i])) {
        i--;
    }

    if (i < 0) {
        return true;
    }

    const ch = text[i];
    return ch === '\n' || ch === '\r';
}

/**
 * True if everything from `index` to EOF is horizontal ws/BOM, or the first
 * non-ws character begins a new line.
 *
 * @param {string} text
 * @param {number} index
 */
function isIndexAtLineEnd(text, index) {
    const len = text.length;
    let j = index;

    while (j < len && isHorizontalSpaceOrBom(text[j])) {
        j++;
    }

    if (j >= len) {
        return true;
    }

    const ch = text[j];
    return ch === '\n' || ch === '\r';
}

/**
 * When ampscriptBlockLineBreaks is enabled, add a leading hardline only if
 * the block opening is not already at the start of a line in the source.
 *
 * @param {string | undefined} originalText
 * @param {number | undefined} blockStart
 */
export function needsLeadingBlockBreak(originalText, blockStart) {
    if (typeof originalText !== 'string' || blockStart == null || blockStart < 0) {
        return false;
    }

    return !isIndexAtLineStart(originalText, blockStart);
}

/**
 * When ampscriptBlockLineBreaks is enabled, add a trailing hardline only if
 * the block closing is not already at the end of a line in the source.
 *
 * @param {string | undefined} originalText
 * @param {number | undefined} blockEnd
 */
export function needsTrailingBlockBreak(originalText, blockEnd) {
    if (typeof originalText !== 'string' || blockEnd == null || blockEnd < 0) {
        return false;
    }

    return !isIndexAtLineEnd(originalText, blockEnd);
}
