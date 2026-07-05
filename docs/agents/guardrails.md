# Agent Guardrails

**Last Updated**: 2026-07-05

The rules-only digest every agent honours while working in this repo. It restates the constraints in [CLAUDE.md](../../CLAUDE.md) in one scannable place so other docs and reviews can link to a specific rule. CLAUDE.md is authoritative; if this digest and CLAUDE.md disagree, CLAUDE.md wins and this file gets updated. Loaded by [bootstrap.md](bootstrap.md) as part of every startup.

Write agent and customization Markdown in ASCII only: use `-`, `->`, `>=`, and "section".

**User approval supersedes every rule and every advisor.** Specialized advisor personas may be defined under [.github/agents/](../../.github/agents/); they are advisory only and never a substitute for the contract or the user's decision.

## Holy Laws (cite by number)

Digest of CLAUDE.md section 2:

1. **Static-first.** The deployed game is a static bundle; everything it needs at runtime ships in the repo. No production backend.
2. **Two runtimes, strict boundary.** Build-time code (Python, in CI) generates and validates content; runtime code (JavaScript, in the browser) renders and plays it and is never authoritative - the committed data is the source of truth.
3. **Exactly one solution.** Every generated puzzle is validated to have a unique solution; a validation failure fails CI and blocks the commit.
4. **Contracts before logic.** Every persisted shape gets a documented schema before logic is written.
5. **Determinism.** Generation is seeded and idempotent - same input, same output.
6. **Structural fixes only.** No band-aids or "temporary" hacks; escalate the correction level instead.
7. **Tunables are not duplicated.** A tuning value lives in one owning module and is read from there, never re-hardcoded downstream.
8. **Open source first.** Prefer mature OSS over custom builds; name the beneficiary feature and cost of any dependency.
9. **Tests ship with the feature.** A behaviour-changing commit lands with tests; the full suite is green at merge.
10. **ASCII only** in repo text (the public README may use richer typography).

## Project-level non-goals (do NOT propose these)

Digest of CLAUDE.md section 11:

- Production backend, database, user accounts, or server-backed sync. State is `localStorage` only.
- Real-time content generation in the browser (it is pre-generated in CI).
- Framework-heavy frontends; the client is vanilla JS with zero runtime dependencies.
- Runtime telemetry, analytics, error-tracking SDKs, or any third-party script that fetches at runtime.
- Monetisation (ads, IAP, timers, pay-to-skip).
- Security-through-obscurity for solutions (they ship in the data by design).

## Git hygiene for autonomous work

A user's finish/ship/merge instruction authorises the reversible workflow: inspect state, use a named branch, stage explicit paths, commit, push, run gates, and merge when green.

Stop when the next action would discard or overwrite unrelated work, rewrite published history, broadly mutate the working tree, or when ownership is ambiguous after inspection. Avoid stash, hard reset, clean, broad checkout/restore, add-all, force push, and amending pushed commits.

Commit messages describe the change. No AI co-author or attribution tags.

## Path discipline (persisted artifacts)

For anything that leaves the process (JSON, logs, save data, doc cross-links): relative paths only, POSIX separators (`/`) only, minimal reconstructable form. In-memory paths for local I/O may stay platform-native; the rule applies at the moment a path leaves the process.

## Identifier discipline

Stable IDs (difficulty, mode, puzzle slug) are schema-validated enums or slugs - never invent or reformat an ID in code. A derived key is rebuilt from its value fields, never trusted from the incoming payload (for example a `localStorage` key recomputed from date and difficulty). Display labels are fields, never identifiers.

## Layer and dependency rules

Digest of CLAUDE.md section 5:

- Runtime (browser) code MUST NOT depend on a backend service - there is none in production.
- Build-time code (Python in `scripts/`) is the only writer of the generated content the game reads; the game reads only that output.
- Runtime code MUST NOT import build tooling, and MUST NOT generate or validate authoritative content.
- The client is a pure consumer: it never mutates authoritative data and never assumes a directory listing (probe, and treat a 404 as "not present").

## Schema versioning (rules only - see CLAUDE.md section 7)

Persisted surfaces: bundle-shipped puzzle data (rewrite-in-place) and client-owned save data in `localStorage` (the migrating surface). Each gets a documented schema before logic (Law #4).

- Additive, backwards-compatible change: keep old payloads loading.
- Breaking change (removed field, type change, semantic shift): write the read-side migration the new client runs on older payloads, in the same commit.
- A player whose save from yesterday no longer loads today is a release blocker.

## Verification (browser changes)

Build-clean is necessary but not sufficient. For a runtime change, serve the site locally, load the affected view plus one cross-view smoke, and confirm the console shows zero new errors and zero new 404s. Screenshot when the change is layout-sensitive. See CLAUDE.md section 9.

## Correction levels (escalation)

When in doubt, choose the higher level (CLAUDE.md section 6). Level 2 and above get an explicit plan before code changes; execute once scope is clear. Level 5 (core design, a persisted contract, or a generation or solver algorithm) is a design consultation only - pause and surface it.

## Anti-patterns (do NOT)

Digest of CLAUDE.md section 12:

- Reinterpret, downgrade, or scope-narrow a source or instruction the user named explicitly without surfacing it (STOP-AND-SURFACE).
- Assume a backend exists, or make runtime code authoritative over correctness.
- Generate or validate authoritative content in the browser.
- Hardcode tuning values downstream; read the owning module, or the field already written into the data.
- Store absolute or backslash paths in any persisted artifact.
- Ship content that is not validated against its correctness rule (for example a puzzle without a verified unique solution).
- Swallow exceptions or silently coerce invalid input - fail fast at the boundary (validate fetched JSON and `localStorage` on read).
- Mint a new persisted field without versioning and a read-side migration.
- Build custom retry, parsing, or validation when a mature library exists; justify any custom build.
- Add a runtime dependency, framework, or SDK without naming the beneficiary feature and its cost.
- Add runtime telemetry or analytics, or a monetisation pattern.
- Let chat logs or `/memories/` become the source of truth for architecture - `docs/` wins.
- Pre-create empty modules "for later".
- Skip the docs update.

## See also

- [bootstrap.md](bootstrap.md) - what to load before answering.
- [../../CLAUDE.md](../../CLAUDE.md) - the authoritative engineering contract.
- [../reference/data-contracts.md](../reference/data-contracts.md) - the persisted-surface schemas.
- [../reference/documentation-structure.md](../reference/documentation-structure.md) - how `docs/` is organised.
