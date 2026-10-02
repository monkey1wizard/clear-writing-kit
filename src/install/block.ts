import { detectEol } from "./fsutil.js";

const BEGIN_PATTERN = /<!-- clear-writing-kit:begin\b[^>]*-->/g;
const END_MARKER = "<!-- clear-writing-kit:end -->";

export type BlockLocation = { start: number; end: number; text: string };

function allIndexes(text: string, pattern: RegExp | string) {
  const indexes: { index: number; length: number }[] = [];
  if (typeof pattern === "string") {
    for (let from = text.indexOf(pattern); from >= 0; from = text.indexOf(pattern, from + pattern.length)) indexes.push({ index: from, length: pattern.length });
  } else {
    for (const match of text.matchAll(pattern)) indexes.push({ index: match.index ?? 0, length: match[0].length });
  }
  return indexes;
}

/** Locates the one kit block. Returns undefined when there is none, and throws when the markers are not exactly one pair. */
export function findBlock(text: string): BlockLocation | undefined {
  const begins = allIndexes(text, BEGIN_PATTERN);
  const ends = allIndexes(text, END_MARKER);
  if (begins.length > 1 || ends.length > 1) throw new Error("The file contains more than one clear-writing-kit block. Remove the extra block by hand.");
  if (begins.length === 0 && ends.length === 0) return undefined;
  if (begins.length !== 1 || ends.length !== 1 || ends[0].index < begins[0].index) {
    throw new Error("The clear-writing-kit block markers are unpaired. Fix the markers by hand.");
  }
  const start = begins[0].index;
  const end = ends[0].index + ends[0].length;
  return { start, end, text: text.slice(start, end) };
}

/**
 * Replaces the one kit block with `block`, or appends it after a single blank line.
 * Bytes outside the markers stay unchanged. The block takes the file's line-ending style.
 */
export function upsertBlock(text: string, block: string): { text: string; changed: boolean } {
  const normalized = block.replace(/\r\n/g, "\n").replace(/^\n+|\n+$/g, "");
  const markers = findBlock(normalized);
  if (!markers || markers.start !== 0 || markers.end !== normalized.length) {
    throw new Error("The block must start with the begin marker and end with the end marker, with no other kit markers.");
  }
  const eol = detectEol(text);
  const styled = normalized.replace(/\n/g, eol);
  const existing = findBlock(text);
  if (existing) {
    const next = text.slice(0, existing.start) + styled + text.slice(existing.end);
    return { text: next, changed: next !== text };
  }
  if (text === "") return { text: styled + eol, changed: true };
  const trailing = (/(?:\r?\n)*$/.exec(text)?.[0] ?? "").split("\n").length - 1;
  return { text: text + eol.repeat(Math.max(0, 2 - trailing)) + styled + eol, changed: true };
}
