# Payload feasibility spike

**Result: STOP.** Neither candidate layout meets the acceptance gate. Do not ship a payload layout from T-03.

## Findings

- Installed `kuromojin` is 3.0.1. Its `getNodeModuleDirPath()` reads `process.env.KUROMOJIN_DIC_PATH` before falling back to the path relative to `require.resolve("kuromoji")`. Layout 1 can therefore point at a sibling `dist/dict/`.
- The dictionary contains 12 files totaling 17,791,956 bytes.
- Layout 1 bundle plus sibling dictionary was built and smoke-run. Node 25.2.1, Deno 2.9.7, and Bun 1.3.12 all produced the expected English `prose-punctuation` finding for `alpha; beta`. The complete TP-01 fixture parity suite was not run.
- Cold-start sample using `check --language en-US --genre document --stdin --stdin-filename sample.md`, measured as a fresh process including process launch and linting: Node 237 ms, Deno 3,240 ms, Bun 193 ms. Repeated Deno launches measured 3,222–3,286 ms. Japanese Deno samples were 3,233–3,272 ms. Deno exceeds the strict 3 s limit.
- Layout 2 was not built. It retains the same bundled JavaScript, whose Deno cold-start already exceeds the limit. Adding pruned production dependencies does not remove or reduce that bundle, so it cannot meet the measured Deno gate under this layout definition.

## Payload sizes

- Layout 1 experimental output: 25,150,008 bytes across bundle and copied dictionary.
- The committed `dist/` has been restored to its pre-spike state. No candidate layout is being proposed for commit.

## Runtime versions

| Runtime | Version | Cold start | Result |
| --- | --- | ---: | --- |
| Node | 25.2.1 | 237 ms | sampled parity passed |
| Deno | 2.9.7 | 3,240 ms | fails < 3 s |
| Bun | 1.3.12 | 193 ms | sampled parity passed |

TP-01 full parity remains unverified. Per the gate, stop and return this payload decision for deep-planning.
