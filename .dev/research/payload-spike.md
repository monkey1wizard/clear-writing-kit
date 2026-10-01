# Standalone payload evaluation

**Candidate:** Layout 1, bundled `dist/cwk.mjs` with the kuromoji dictionary in sibling `dist/dict/`.

**Status:** The candidate passes smoke parity for one English finding and one Japanese finding on Node, Deno, and Bun. Full TP-01 fixture parity has not been established, so this report does not claim that the layout passes the acceptance gate.

## Layout evaluation

| Order | Layout | Result |
| --- | --- | --- |
| 1 | Bundle plus sibling `dist/dict/` | Built. Smoke parity passed. All measured cold starts were below 3 s. Full TP-01 parity remains unverified. |
| 2 | Bundle plus pruned production `dist/node_modules` | Not built. Layout 1 has no measured cold-start failure. |

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

Full TP-01 parity remains the outstanding acceptance check. Layout 2 was not evaluated because the measured cold-start criterion did not fail for layout 1, but the unrun parity cases prevent a final layout pass determination.
