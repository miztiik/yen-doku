# System Overview

**Last Updated**: 2026-07-05

Yen-Doku is a daily Sudoku game split across two runtimes that never overlap:

- **Python, in GitHub Actions only** - generates, solves, validates, and difficulty-scores puzzles, then commits them as JSON.
- **JavaScript, in the browser only** - renders puzzles, handles interaction, and persists progress. It is a pure consumer of the committed JSON and is never authoritative.

The deployed game is a static bundle on GitHub Pages. There is no runtime backend, database, or external API - everything the game needs at play time ships in the repository.

## Data flow

```text
GitHub Actions (scheduled + manual)
  scripts/generate.py / scripts/generate_gattai.py
    py-sudoku -> solver -> validator (unique solution) -> difficulty score
      -> docs/puzzles/<year>/<difficulty>/YYYY-MM-DD-NNN.json      (classic)
      -> docs/puzzles/<year>/gattai/<mode>/<difficulty>/...json    (gattai)
        commit to repo
          |
          v
GitHub Pages serves docs/
  index.html + app.js  (classic)   -> fetch puzzle JSON -> play -> localStorage
  gattai.html + gattai.js (gattai) -> fetch puzzle JSON -> play -> localStorage
  sw.js caches shell + opened puzzles for offline play
```

## Runtime boundaries (strict)

- Python MUST NOT run in the browser.
- JavaScript MUST NOT generate or validate puzzles authoritatively - the committed JSON is the source of truth, and any client-side solving is a convenience only.
- The browser reads puzzle files by relative path and never assumes a directory listing. Puzzles are discovered by probing `YYYY-MM-DD-NNN.json` and treating a 404 as "no more puzzles". No `index.json` is required.

## Generation pipeline

Each run (see [scripts/generate.py](../../scripts/generate.py)) produces one puzzle per difficulty for a target date:

1. **Generate** a full solution, then remove clues toward the target [difficulty](../concepts/difficulty.md) band.
2. **Solve** with a backtracking solver that can count solutions ([scripts/solver.py](../../scripts/solver.py)).
3. **Validate** Sudoku rules and, critically, that the puzzle has **exactly one solution** ([scripts/validator.py](../../scripts/validator.py)).
4. **Score** difficulty from the final clue count ([scripts/difficulty.py](../../scripts/difficulty.py)).
5. **Commit** the JSON only if all four difficulties generate and validate.

Generation is **deterministic** (date-seeded), **idempotent** (`--skip-existing` skips files that already exist), and **fails the CI job** rather than committing an invalid puzzle.

## Validation contract

A puzzle is publishable only if it obeys Sudoku rules (rows, columns, 3x3 boxes), is solvable, has exactly one solution, and passes the automated tests. A validation failure fails the workflow and blocks the commit - a silent corrupt puzzle is never shipped.

## Hosting and automation

- **Puzzles live inside `docs/`** (`docs/puzzles/`) so GitHub Pages serves them directly with no copy or sync step.
- **`.github/workflows/daily-generate.yml`** runs at `05 00 * * *` (00:05 UTC daily) and on manual dispatch with an optional date. Gattai puzzles have their own workflow (`generate-gattai.yml`).
- **`.github/workflows/deploy-pages.yml`** publishes `docs/` to GitHub Pages.
- **`.github/workflows/ci.yml`** runs the test suite on push.

## Design rationale: the solution ships in the puzzle JSON

Each puzzle file includes its full `solution` grid. This is intentional: the client needs it for hints, the Check action, and win detection, and there is no server to ask. Yen-Doku is a casual game, not a competitive platform, so a publicly readable solution is an accepted trade for a zero-backend architecture. See [reference/data-contracts.md](../reference/data-contracts.md).

## See also

- [architecture/frontend.md](frontend.md) - the browser game client.
- [architecture/gattai.md](gattai.md) - the overlapping-grid (Samurai) variants.
- [concepts/difficulty.md](../concepts/difficulty.md) - how clue count maps to difficulty.
- [reference/data-contracts.md](../reference/data-contracts.md) - puzzle JSON and localStorage shapes.
- [../../CLAUDE.md](../../CLAUDE.md) - the engineering contract and non-goals.
