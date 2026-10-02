import { join } from "node:path";
import { err, ok, readText, writeTextAtomic, type Result } from "./fsutil.js";

export const CURRENT_SCHEMA_REVISION = 2;
export const LEGACY_OWNER = "legacy";

export type ManifestFile = {
  path: string;
  sha256: string;
  owners: string[];
};

export type ManifestCliEntry = {
  host: string;
  kind: string;
  name: string;
  fingerprint: string;
};

export type ManifestBlockRecord = {
  host: string;
  target: string;
  sha256: string;
};

export type ManifestSettingsRecord = {
  host: string;
  target: string;
  setting: string;
  value: string;
};

export type Manifest = {
  schemaRevision: number;
  version: string | null;
  files: ManifestFile[];
  cli: ManifestCliEntry[];
  blocks: ManifestBlockRecord[];
  settings: ManifestSettingsRecord[];
  completedSteps: Record<string, string[]>;
};

export const emptyManifest = (): Manifest => ({
  schemaRevision: CURRENT_SCHEMA_REVISION,
  version: null,
  files: [],
  cli: [],
  blocks: [],
  settings: [],
  completedSteps: {}
});

export const manifestPath = (home: string) => join(home, ".clear-writing-kit", "install-manifest.json");

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === "string";
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(isString);

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
  const { files, cli } = data;
  if (!Array.isArray(files) || !Array.isArray(cli)) return invalid;

  if (typeof data.schemaRevision === "number" && data.schemaRevision >= 2) {
    const filesValid = files.every(entry =>
      isObject(entry) &&
      isString(entry.path) &&
      isString(entry.sha256) &&
      /^[0-9a-f]{64}$/.test(entry.sha256) &&
      isStringArray(entry.owners)
    );
    const cliValid = cli.every(entry =>
      isObject(entry) &&
      isString(entry.host) &&
      isString(entry.kind) &&
      isString(entry.name) &&
      isString(entry.fingerprint)
    );
    const blocks = Array.isArray(data.blocks) ? data.blocks : [];
    const blocksValid = blocks.every(entry =>
      isObject(entry) &&
      isString(entry.host) &&
      isString(entry.target) &&
      isString(entry.sha256) &&
      /^[0-9a-f]{64}$/.test(entry.sha256)
    );
    const settings = Array.isArray(data.settings) ? data.settings : [];
    const settingsValid = settings.every(entry =>
      isObject(entry) &&
      isString(entry.host) &&
      isString(entry.target) &&
      isString(entry.setting) &&
      isString(entry.value)
    );
    const completedSteps = isObject(data.completedSteps) ? data.completedSteps : null;
    const completedValid = completedSteps !== null && Object.entries(completedSteps).every(([k, v]) => isString(k) && isStringArray(v));

    if (!filesValid || !cliValid || !blocksValid || !settingsValid || !completedValid) return invalid;

    return ok({
      schemaRevision: data.schemaRevision,
      version: data.version,
      files: (files as ManifestFile[]).map(({ path, sha256, owners }) => ({
        path,
        sha256,
        owners: [...new Set(owners)].sort()
      })),
      cli: (cli as ManifestCliEntry[]).map(({ host, kind, name, fingerprint }) => ({ host, kind, name, fingerprint })),
      blocks: (blocks as ManifestBlockRecord[]).map(({ host, target, sha256 }) => ({ host, target, sha256 })),
      settings: (settings as ManifestSettingsRecord[]).map(({ host, target, setting, value }) => ({ host, target, setting, value })),
      completedSteps: Object.fromEntries(
        Object.entries(completedSteps as Record<string, string[]>).map(([h, steps]) => [h, [...new Set(steps)]])
      )
    });
  }

  // Schema 1 (or unversioned) conservative migration:
  const filesValid = files.every(entry =>
    isObject(entry) &&
    isString(entry.path) &&
    isString(entry.sha256) &&
    /^[0-9a-f]{64}$/.test(entry.sha256)
  );
  const cliValid = cli.every(entry =>
    isObject(entry) &&
    isString(entry.host) &&
    isString(entry.kind) &&
    isString(entry.name) &&
    isString(entry.fingerprint)
  );
  const rawCompleted = data.completedSteps;
  const completedIsArray = isStringArray(rawCompleted);
  const completedIsObject = isObject(rawCompleted) && Object.entries(rawCompleted).every(([k, v]) => isString(k) && isStringArray(v));
  if (!filesValid || !cliValid || (!completedIsArray && !completedIsObject && rawCompleted !== undefined)) return invalid;

  const cliEntries = (cli as ManifestCliEntry[]).map(({ host, kind, name, fingerprint }) => ({ host, kind, name, fingerprint }));
  const recordedCliHosts = [...new Set(cliEntries.map(c => c.host))].filter(Boolean).sort();

  const migratedBlocks: ManifestBlockRecord[] = [];
  const migratedFiles: ManifestFile[] = [];

  for (const f of files as { path: string; sha256: string; owners?: unknown }[]) {
    if (f.path.endsWith("#block")) {
      const target = f.path.slice(0, -"#block".length);
      const normalized = target.replace(/\\+/g, "/");
      let blockHost = LEGACY_OWNER;
      if (normalized.includes("/.claude/") || normalized.endsWith("/CLAUDE.md") || normalized === "CLAUDE.md") {
        blockHost = "claude";
      } else if (normalized.includes("/.codex/") || normalized.endsWith("/AGENTS.md") || normalized === "AGENTS.md") {
        blockHost = "codex";
      } else if (recordedCliHosts.length === 1) {
        blockHost = recordedCliHosts[0];
      }
      migratedBlocks.push({
        host: blockHost,
        target,
        sha256: f.sha256
      });
    } else {
      let owners: string[];
      if (isStringArray(f.owners) && f.owners.length > 0) {
        owners = [...new Set(f.owners)].sort();
      } else if (recordedCliHosts.length > 0) {
        owners = [...recordedCliHosts];
      } else {
        owners = [LEGACY_OWNER];
      }
      migratedFiles.push({
        path: f.path,
        sha256: f.sha256,
        owners
      });
    }
  }

  const migratedSettings: ManifestSettingsRecord[] = [];
  if (Array.isArray(data.settings)) {
    for (const s of data.settings) {
      if (isObject(s) && isString(s.host) && isString(s.target) && isString(s.setting) && isString(s.value)) {
        migratedSettings.push({ host: s.host, target: s.target, setting: s.setting, value: s.value });
      }
    }
  }

  let migratedCompleted: Record<string, string[]> = {};
  if (completedIsObject) {
    migratedCompleted = Object.fromEntries(
      Object.entries(rawCompleted as Record<string, string[]>).map(([h, steps]) => [h, [...new Set(steps)]])
    );
  } else if (completedIsArray) {
    const stepList = rawCompleted as string[];
    if (recordedCliHosts.length > 0) {
      for (const h of recordedCliHosts) {
        migratedCompleted[h] = [...stepList];
      }
    } else {
      migratedCompleted[LEGACY_OWNER] = [...stepList];
    }
  }

  return ok({
    schemaRevision: CURRENT_SCHEMA_REVISION,
    version: data.version,
    files: migratedFiles,
    cli: cliEntries,
    blocks: migratedBlocks,
    settings: migratedSettings,
    completedSteps: migratedCompleted
  });
}

/** A missing manifest is empty. An unparsable manifest is an error. */
export async function readManifest(home: string): Promise<Result<Manifest>> {
  const file = await readText(manifestPath(home));
  return file ? parseManifest(file.text) : ok(emptyManifest());
}

/** Writes the manifest through an atomic replace. */
export async function saveManifest(home: string, manifest: Manifest) {
  const normalized: Manifest = {
    schemaRevision: manifest.schemaRevision || CURRENT_SCHEMA_REVISION,
    version: manifest.version,
    files: manifest.files.map(f => ({ path: f.path, sha256: f.sha256, owners: [...new Set(f.owners)].sort() })),
    cli: manifest.cli.map(c => ({ host: c.host, kind: c.kind, name: c.name, fingerprint: c.fingerprint })),
    blocks: (manifest.blocks || []).map(b => ({ host: b.host, target: b.target, sha256: b.sha256 })),
    settings: (manifest.settings || []).map(s => ({ host: s.host, target: s.target, setting: s.setting, value: s.value })),
    completedSteps: Object.fromEntries(
      Object.entries(manifest.completedSteps || {}).map(([h, steps]) => [h, [...new Set(steps)].sort()])
    )
  };
  await writeTextAtomic(manifestPath(home), `${JSON.stringify(normalized, null, 2)}\n`, { bom: false });
}
