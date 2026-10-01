# Standalone payload evaluation

**Candidate:** Layout 1, bundled `dist/cwk.mjs` with the kuromoji dictionary in sibling `dist/dict/`.

**Status:** Layout 1 passed independent full TP-01 fixture parity from an isolated payload directory: 198/198 checks, 66 per runtime. TP-05 build reproducibility also passed. The independent audit reported no findings and AUDIT_REVIEW: CLEAR. The implementation commit is 88e0fc9. Earlier smoke-only observations are retained below as history.

## Layout evaluation

| Order | Layout | Result |
| --- | --- | --- |
| 1 | Bundle plus sibling `dist/dict/` | Built. Full isolated parity passed on all three runtimes. All measured cold starts were below 3 s. Selected payload. |
| 2 | Bundle plus pruned production `dist/node_modules` | Not built. Layout 1 passed, so the ordered fallback contract requires no second layout. |

The installed `kuromojin` version is 3.0.1. Its `getNodeModuleDirPath()` checks `process.env.KUROMOJIN_DIC_PATH` before resolving the dictionary relative to `kuromoji`. The bundle sets this variable to the sibling `dict/` directory using its own `import.meta.url`. This removes dependence on the repository's `node_modules` path.

The dictionary has 12 files and 17,791,956 bytes. The bundle has 7,358,009 bytes. The payload totals 25,149,965 bytes.

## Runtime measurements

Cold start measured a fresh runtime process from a Node orchestrator. The timed interval covered child-process launch and one stdin check that produced an English punctuation finding. It did not include orchestrator startup or shell startup.

| Runtime | Version | Cold start | Smoke parity |
| --- | --- | ---: | --- |
| Node | 25.2.1 | 225 ms | Passed for English and Japanese samples |
| Deno | 2.9.7 | 216 ms | Passed for English and Japanese samples |
| Bun | 1.3.12 | 250 ms | Passed for English and Japanese samples |

For each sample, the payload and `writing/check.cjs` returned the same exit code and rule IDs. The Japanese sample loaded the dictionary successfully from the isolated `dist/` directory on all three runtimes.

## Earlier failed-attempt observations

The prior spike reported an English Deno cold start of 3,240 ms, with repeated values from 3,222 to 3,286 ms. That measurement included process launch and linting, but its process boundary was not documented well enough to compare with the corrected measurement above. The prior spike also omitted full TP-01 parity and did not build layout 2. Its 25,150,008-byte payload used a different bundle build.

The earlier Japanese isolated-payload crash was corrected by setting `KUROMOJIN_DIC_PATH` inside the bundle. The corrected Japanese smoke check passes on all three runtimes.

## Verification limits

- Cross-runtime comparison covered representative English and Japanese finding cases. It did not run every case from `writing/test/checkers.test.cjs` through each runtime.
- `npm --prefix writing test` ran the writing tests. Checker and Japanese tests passed. The command failed in two `okf` tests because `usage/gemini.md` is stale.
- A fresh `npm --prefix writing run build` completed successfully. The resulting bundle was byte-identical to the preceding build.

The limits above describe implementer smoke checks. Independent testing subsequently completed full parity on all three runtimes and verified the committed build. Evidence: `.dev/pipeline/feat-cross-agent-plugin-installer/T-03/T-03-test.receipt.md`, test session `8b2e6306-5725-45dc-b0f8-21b71296413c`. Audit evidence: `T-03-audit.receipt.md`, session `770ccbdb-e8f7-4be7-be2d-e25626ddc290`.

Independent cold-start measurements used five fresh process launches per runtime. English sample averages: Node 228 ms, Deno 225 ms, Bun 257 ms. Japanese dictionary-load averages: Node 424 ms, Deno 494 ms, Bun 486 ms. Observed Japanese ranges: Node 414–448 ms, Deno 487–502 ms, Bun 476–495 ms. All runs met the strict 3 s gate.
