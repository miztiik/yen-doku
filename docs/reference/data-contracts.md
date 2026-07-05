# Data Contracts

**Last Updated**: 2026-07-05

The persisted shapes Yen-Doku depends on. Two families: **puzzle JSON** (written by the Python generators, read by the browser) and **browser storage** (`localStorage`, owned entirely by the client). Both are contracts - change them with care and version them (see [../../CLAUDE.md](../../CLAUDE.md)).

## Puzzle JSON (shipped in the bundle)

Files live under `docs/` so GitHub Pages serves them directly. Naming is convention-based: `YYYY-MM-DD-NNN.json`, where the first puzzle of a day is `-001` and variants increment. The year is in the date string, so navigation across year boundaries needs no special handling.

### Classic

Path: `docs/puzzles/<year>/<difficulty>/YYYY-MM-DD-NNN.json`

```json
{
  "date": "YYYY-MM-DD",
  "difficulty": "easy|medium|hard|extreme",
  "clueCount": 17,
  "grid": [[0-9 x9], ... x9 rows],
  "solution": [[1-9 x9], ... x9 rows]
}
```

- `grid`: the puzzle, with `0` for an empty cell. `clueCount` is the number of non-zero cells (17-45; see [../concepts/difficulty.md](../concepts/difficulty.md)).
- `solution`: the complete grid (1-9), intentionally included so the offline client can drive hints, Check, and win detection. It must not be altered by the client.

### Gattai (Samurai)

Path: `docs/puzzles/<year>/gattai/<mode>/<difficulty>/YYYY-MM-DD-NNN.json`

```json
{
  "date": "YYYY-MM-DD",
  "mode": "samurai|twin-nw|twin-ne|twin-sw|twin-se",
  "difficulty": "easy|medium|hard|extreme",
  "clueCount": 38,
  "version": "1.0",
  "grids": {
    "<gridId>": { "grid": [[...]], "solution": [[...]] }
  }
}
```

- `grids` maps a grid id (2 to 5 entries, e.g. `center`, `nw`, `ne`, `sw`, `se`, or `primary`/`secondary`) to a sub-grid. Grid positions and overlaps are derived from the mode, not stored per puzzle (see [../architecture/gattai.md](../architecture/gattai.md)).
- The authoritative machine-readable schema is [../../specs/002-samurai-sudoku-modes/contracts/gattai-puzzle.schema.json](../../specs/002-samurai-sudoku-modes/contracts/gattai-puzzle.schema.json).

## Browser storage (localStorage)

Every key is prefixed `yen-doku-`. Every access is wrapped in try/catch (storage throws in private mode or over quota). Keys are per-context so different puzzles never overwrite each other. Gattai keys add the `mode` segment.

| Purpose | Key | Shape | Lifetime |
| ------- | --- | ----- | -------- |
| In-progress game | `yen-doku-<date>-<difficulty>` (gattai: `yen-doku-gattai-<date>-<mode>-<difficulty>`) | `{ grid, pencil, startTime, elapsedBeforePause, lastActive }` | Auto-deleted after 7 days |
| Completion record | `yen-doku-completed-<date>-<difficulty>` (gattai: `yen-doku-gattai-completed-<date>-<mode>-<difficulty>`) | `{ completedAt, time, date }` | Auto-deleted after 30 days |
| Best times | `yen-doku-best-times-<difficulty>` (gattai: `yen-doku-gattai-best-times-<mode>-<difficulty>`) | `[{ time, date, achievedAt }]`, up to 3 | Kept indefinitely |

- `pencil` is stored as arrays (converted from Sets on save). `time`/`elapsedBeforePause` are milliseconds; `completedAt`/`achievedAt` are Unix millisecond timestamps; `date` is the puzzle's `YYYY-MM-DD` (or `legacy` for a migrated best time).
- **Migration:** the older single best time (`yen-doku-best-<difficulty>` holding a string of milliseconds) is migrated on read into the top-3 array and removed.
- Authoritative machine-readable schemas: [../../specs/003-timer-completion-best-times/contracts/completion-record.schema.json](../../specs/003-timer-completion-best-times/contracts/completion-record.schema.json) and [best-times.schema.json](../../specs/003-timer-completion-best-times/contracts/best-times.schema.json).

## See also

- [../architecture/overview.md](../architecture/overview.md) - who writes and reads these files.
- [../architecture/frontend.md](../architecture/frontend.md) - the client behavior behind the storage keys.
- [../concepts/difficulty.md](../concepts/difficulty.md) - the `difficulty` / `clueCount` fields.
