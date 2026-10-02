import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { copyFile, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

export type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };
export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export type Eol = "\r\n" | "\n";
export type TextFile = { text: string; eol: Eol; bom: boolean; trailingNewline: boolean };

export function detectEol(text: string): Eol {
  const index = text.indexOf("\n");
  return index > 0 && text[index - 1] === "\r" ? "\r\n" : "\n";
}

function isMissing(error: unknown) {
  return (error as NodeJS.ErrnoException)?.code === "ENOENT";
}

/** Reads a UTF-8 file. Returns the text without its BOM, plus the style facts a writer must keep. A missing file gives undefined. */
export async function readText(path: string): Promise<TextFile | undefined> {
  let bytes: Buffer;
  try {
    bytes = await readFile(path);
  } catch (error) {
    if (isMissing(error)) return undefined;
    throw error;
  }
  const bom = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
  const text = bytes.toString("utf8", bom ? 3 : 0);
  return { text, eol: detectEol(text), bom, trailingNewline: text.endsWith("\n") };
}

export function sha256(data: string | Uint8Array) {
  return createHash("sha256").update(data).digest("hex");
}

/** SHA-256 of a file's bytes, or undefined when the file is missing. */
export async function sha256File(path: string) {
  try {
    return sha256(await readFile(path));
  } catch (error) {
    if (isMissing(error)) return undefined;
    throw error;
  }
}

export async function listFiles(root: string, relative = ""): Promise<string[]> {
  const entries = await readdir(join(root, relative), { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const child = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await listFiles(root, child));
    else if (entry.isFile()) files.push(child);
  }
  return files;
}

/** Digest over the relative path and content hash of every file under a directory. Undefined when the directory is missing. */
export async function digestTree(root: string) {
  let files: string[];
  try {
    files = await listFiles(root);
  } catch (error) {
    if (isMissing(error)) return undefined;
    throw error;
  }
  files.sort();
  const hash = createHash("sha256");
  for (const file of files) hash.update(`${file}\0${await sha256File(join(root, file))}\n`);
  return hash.digest("hex");
}

const RENAME_RETRIES = 5;
const RENAME_DELAY_MS = 100;
const LOCK_CODES = new Set(["EPERM", "EBUSY", "EACCES"]);

/** Renames over the target. A locked target is retried 5 times, 100 ms apart, and then fails with an error that names the path. */
export async function renameWithRetry(from: string, to: string) {
  for (let attempt = 0; ; attempt++) {
    try {
      await rename(from, to);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException)?.code;
      if (!code || !LOCK_CODES.has(code)) throw error;
      if (attempt >= RENAME_RETRIES) throw new Error(`Cannot replace ${to}: it stayed locked after ${RENAME_RETRIES} retries.`);
      await new Promise(resolve => setTimeout(resolve, RENAME_DELAY_MS));
    }
  }
}

/** Writes a sibling temporary file and renames it over the target. The text keeps the line endings it has. The target stays unchanged when the write or the rename fails. */
export async function writeTextAtomic(path: string, text: string, format: { bom: boolean }) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.${Date.now()}.tmp`;
  try {
    await writeFile(temporary, Buffer.concat([format.bom ? Buffer.from([0xef, 0xbb, 0xbf]) : Buffer.alloc(0), Buffer.from(text, "utf8")]));
    await renameWithRetry(temporary, path);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

/** Copies a file into the backup directory under a unique name. Returns the backup path, or undefined when the file is missing. */
export async function backup(path: string, backupDir: string) {
  await mkdir(backupDir, { recursive: true });
  for (let counter = 0; ; counter++) {
    const target = join(backupDir, `${basename(path)}.${counter}.bak`);
    try {
      await copyFile(path, target, constants.COPYFILE_EXCL);
      return target;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException)?.code;
      if (isMissing(error)) return undefined;
      if (code !== "EEXIST") throw error;
    }
  }
}
