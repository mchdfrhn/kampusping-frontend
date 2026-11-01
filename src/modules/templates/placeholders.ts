/**
 * The server only recognises `{{name}}` (optionally with spaces around the name, see
 * `templates/rendering.py`). Anything else that looks like a placeholder is sent to the student as
 * literal text, which the server cannot flag, so the form warns about it.
 */

// `\w` in the server's Python regex is Unicode-aware, so the name class mirrors that.
const VALID_PLACEHOLDER = /\{\{\s*[\p{L}\p{N}_]+\s*\}\}/gu;
// An opener with whatever follows on the same line (up to a few characters, plus any closing
// braces), or a closing pair on its own.
const SUSPECT = /\{\{[^{}\n]{0,40}\}{0,2}|\}\}/g;

/** Marker that stands in for a valid placeholder while scanning for the broken ones. */
const VALID_MARK = '\u0000';

/** Broken placeholders in `body`: unique, in order of first appearance. */
export const findMalformedPlaceholders = (body: string): string[] => {
  const withoutValid = body.replace(VALID_PLACEHOLDER, VALID_MARK);
  const found: string[] = [];
  for (const match of withoutValid.matchAll(SUSPECT)) {
    const text = match[0];
    if (!found.includes(text)) found.push(text);
  }
  return found;
};
