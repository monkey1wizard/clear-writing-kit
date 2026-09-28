# OKF knowledge bundle

The `knowledge/` directory is the Open Knowledge Format bundle for Clear Writing Kit. Start at [the bundle index](../knowledge/index.md). The bundle targets [OKF v0.2](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md).

## Scope and retrieval

The bundle contains shared writing rules, language guidance, local check procedures, and usage instructions for coding agents and Web assistants. Each concept has a type, title, description, tags, language, audience, and source reference. Indexes group concepts by task. Links connect usage instructions to the rules they need.

Point an OKF reader or retrieval pipeline at `knowledge/`, not the repository root. The existing skill packages and account instructions keep their own formats. The OKF copies are retrieval documents, not installable skills. The bundle does not include source code, test fixtures, or historical verification reports.

These fields and links support discovery. They do not install a search service, trigger public indexing, or prove better search results. Retrieval quality has not been benchmarked against an external AI system.

## Maintain the bundle

Edit the canonical skill references or platform templates first. Update the Web artifacts before generating the bundle. Run these commands from the repository root:

```powershell
npm --prefix writing ci
python scripts/generate-web-artifacts.py --update
npm --prefix writing run okf:generate
npm --prefix writing run okf:check
```

Generation overwrites only known generated files. It refuses unexpected Markdown files rather than deleting them. The check is read-only. It checks YAML structure, source freshness, the expected file set, and internal link targets. Source content hashes make changes detectable without invented timestamps.

The source references name repository paths as scope descriptors. The `source_path` extension gives the exact repository-relative path. These paths are provenance, not bundle-relative links. The bundle remains readable when copied without the repository. Regeneration requires the repository.

## Conformance and limits

Every concept has parseable YAML frontmatter with a non-empty string `type`. Only the root index declares `okf_version`. Child indexes have no frontmatter. The bundle uses no log files or attested computations.

The format check accepts unknown types and extension fields. Missing optional fields and broken links do not fail that check. The separate repository freshness and link checks are stricter publication checks, not OKF requirements.

Generated concepts identify the generator through `generated.by`. They do not claim `verified` status. Passing tests establishes structural and generation checks, not human review or factual verification. Optional verification dates, usage statistics, and freshness deadlines are omitted because no evidence supports them.

The bundle is generated from existing text. Its Japanese documents keep plain forms. Its Chinese references keep the zh-TW tool procedure. Writing checks cover the generated text as well as its sources.
