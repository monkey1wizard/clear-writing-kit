import { join } from "node:path";
import { err, ok, readText, type Result } from "./fsutil.js";

export type ManifestFile = { path: string; sha256: string };
export type ManifestCliEntry = { host: string; kind: string; name: string; fingerprint: string };
export type Manifest = { version: string | null; files: ManifestFile[]; cli: ManifestCliEntry[]; completedSteps: string[] };

export const emptyManifest = (): Manifest => ({ version: null, files: [], cli: [], completedSteps: [] });
export const manifestPath = (home: string) => join(home, ".clear-writing-kit", "install-manifest.json");

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === "string";

/** Parses manifest text. Error messages never echo the text. */
export function parseManifest(text: string): Result<Manifest> {
  const invalid = err("The install manifest is not valid. Fix or remove it before continuing.");
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return invalid;
  }
  if (!isObject(data) || !(data.version === null || isString(data.version))) return invalid;
  const { files, cli, completedSteps } = data;
  if (!Array.isArray(files) || !Array.isArray(cli) || !Array.isArray(completedSteps)) return invalid;
  const filesValid = files.every(entry => isObject(entry) && isString(entry.path) && isString(entry.sha256) && /^[0-9a-f]{64}$/.test(entry.sha256));
  const cliValid = cli.every(entry => isObject(entry) && isString(entry.host) && isString(entry.kind) && isString(entry.name) && isString(entry.fingerprint));
  if (!filesValid || !cliValid || !completedSteps.every(isString)) return invalid;
  return ok({
    version: data.version,
    files: (files as ManifestFile[]).map(({ path, sha256 }) => ({ path, sha256 })),
    cli: (cli as ManifestCliEntry[]).map(({ host, kind, name, fingerprint }) => ({ host, kind, name, fingerprint })),
    completedSteps: [...(completedSteps as string[])]
  });
}

/** A missing manifest is empty. An unparsable manifest is an error. */
export async function readManifest(home: string): Promise<Result<Manifest>> {
  const file = await readText(manifestPath(home));
  return file ? parseManifest(file.text) : ok(emptyManifest());
}
