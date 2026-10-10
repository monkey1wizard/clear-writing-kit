# GAL State

<!-- Per-task state (workflow step, deviations, test and review results) lives in the plan file's ## Status section, not here. This file tracks repo-level concerns only. -->

## Active Plans

| Plan | File | Plan Phase | Last Activity |
| --- | --- | --- | --- |

<!-- When more than one plan is active, table order is priority order. `/gal whats-next` and `/gal wrap-up` use the first non-terminal row; if all rows are terminal, they fall back to the first row. -->

## Recent Close-outs

<!-- Bounded to at most 2 rows, newest first. Authority + Landing-column semantic: conventions/token-budget.md § Bounded Session State (.dev/state.md). Do not restate that policy here. -->

| Date | Plan | Landing | Result |
| --- | --- | --- | --- |
| 2026-10-10 | feat-ccync-local-checks | `5c6cad8` | FINALIZED; goal-verified; finalize review CLEAR (full independence); OA-01 to OA-03 waived, not run |
| 2026-10-08 | feat-ja-ai-tone-rules | `db9992c` | FINALIZED; independent test PASS; audit fix re-audited CLEAR; Japanese naturalness unreviewed |

## Follow-ups

<!-- Bounded to at most 5 rows. A row only leaves this table by promotion into a plan's own task list, never by deletion or expiry. Authority + Route-column semantic: conventions/token-budget.md § Bounded Session State (.dev/state.md). Do not restate that policy here. -->

| Date | Origin | Finding | Route |
| --- | --- | --- | --- |
| 2026-10-10 | feat-ccync-local-checks T-01 and T-04 audits | `writing/integration/ccync-projection.test.cjs` checks host vectors by substring only. The exact ccync 0.1.5 vectors in `docs/verification.md`, including the Claude PowerShell launcher, come from an audit probe. | Assert exact per-host vectors in the projection test. |
| 2026-10-10 | feat-ccync-local-checks T-05 | `gal render-adapters` removed the GAL-owned `CLAUDE.md`. Claude Code sessions in this repo may no longer load `AGENTS.md` automatically. | Owner decides whether to add a user-owned `CLAUDE.md` that imports `AGENTS.md`. |
| 2026-10-10 | feat-ccync-local-checks T-03 audit | Low installer notes: the apply reread failure message says the manifest was not written again, `lock.ts` release does not retry a transient read error, and `apply.ts` re-exports lock names. | Fold into the next installer change. |
| 2026-10-10 | feat-ccync-local-checks finalize | OA-01 to OA-03 were waived and never ran in a real home against a published ccync pin. | Run them after the commits are pushed and pinned. |

## Global Decisions

| Date | Decision | Rationale | Scope |
| --- | --- | --- | --- |

## Blockers

## Session Continuity

<!-- Keep one row per active plan. Match rows by the paired source plan path. -->

| Plan | Source Plan | Last Session | Stopped At | Next Step | Context |
| --- | --- | --- | --- | --- | --- |

## Session Execution Context

Dispatched node:
Execution mode:
Notes:
