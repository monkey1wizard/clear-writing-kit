import { backup, readText, writeTextAtomic } from "./fsutil.js";

const isSpace = (character: string) => character === " " || character === "\t" || character === "\r" || character === "\n";

function skipSpace(text: string, from: number) {
  let index = from;
  while (index < text.length && isSpace(text[index])) index++;
  return index;
}

/** Index just after the string that starts at `from`. */
function endOfString(text: string, from: number) {
  let index = from + 1;
  while (text[index] !== '"') index += text[index] === "\\" ? 2 : 1;
  return index + 1;
}

/** Index just after the value that starts at `from`, up to the next top-level comma or closing brace. */
function endOfValue(text: string, from: number) {
  let depth = 0;
  let index = from;
  while (index < text.length) {
    const character = text[index];
    if (character === '"') { index = endOfString(text, index); continue; }
    if (character === "{" || character === "[") depth++;
    else if (character === "}" || character === "]") {
      if (depth === 0) break;
      depth--;
    } else if (character === "," && depth === 0) break;
    index++;
  }
  while (index > from && isSpace(text[index - 1])) index--;
  return index;
}

type Member = { key: string; valueStart: number; valueEnd: number; keyStart: number };

/** Locates the members of the top-level object in valid JSON text. */
function topLevelMembers(text: string): { members: Member[]; open: number; close: number } {
  const open = skipSpace(text, 0);
  const members: Member[] = [];
  let index = skipSpace(text, open + 1);
  while (text[index] !== "}") {
    const keyStart = index;
    const keyEnd = endOfString(text, index);
    const key = JSON.parse(text.slice(keyStart, keyEnd)) as string;
    const valueStart = skipSpace(text, skipSpace(text, keyEnd) + 1);
    const valueEnd = endOfValue(text, valueStart);
    members.push({ key, keyStart, valueStart, valueEnd });
    index = skipSpace(text, valueEnd);
    if (text[index] === ",") index = skipSpace(text, index + 1);
  }
  return { members, open, close: index };
}

/**
 * Sets `outputStyle` in a settings file and returns the old value, or undefined when it was not set.
 * Only the value or one new member changes. Key order, indentation, line endings, and the BOM stay.
 * Invalid JSON throws before anything is written. A missing file is created with only `outputStyle`.
 */
export async function setOutputStyle(path: string, value: string, backupDir: string): Promise<unknown> {
  const encoded = JSON.stringify(value);
  const file = await readText(path);
  if (!file) {
    await writeTextAtomic(path, `{\n  "outputStyle": ${encoded}\n}\n`, { bom: false });
    return undefined;
  }
  let data: unknown;
  try {
    data = JSON.parse(file.text);
  } catch {
    throw new Error(`${path} is not valid JSON.`);
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) throw new Error(`${path} does not hold a JSON object.`);
  const oldValue = (data as Record<string, unknown>).outputStyle;
  const { members, open, close } = topLevelMembers(file.text);
  const existing = members.filter(member => member.key === "outputStyle").pop();
  let next: string;
  if (existing) {
    next = file.text.slice(0, existing.valueStart) + encoded + file.text.slice(existing.valueEnd);
  } else if (members.length === 0) {
    next = `${file.text.slice(0, open + 1)}${file.eol}  "outputStyle": ${encoded}${file.eol}${file.text.slice(close)}`;
  } else {
    const last = members[members.length - 1];
    const lineStart = file.text.lastIndexOf("\n", last.keyStart) + 1;
    const indent = /^[ \t]*$/.test(file.text.slice(lineStart, last.keyStart)) ? file.text.slice(lineStart, last.keyStart) : " ";
    const separator = indent === " " ? " " : file.eol + indent;
    next = `${file.text.slice(0, last.valueEnd)},${separator}"outputStyle": ${encoded}${file.text.slice(last.valueEnd)}`;
  }
  if (next === file.text) return oldValue;
  await backup(path, backupDir);
  await writeTextAtomic(path, next, { bom: file.bom });
  return oldValue;
}
