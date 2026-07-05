# Frontend Game Client

**Last Updated**: 2026-07-05

The browser client is a pure consumer of committed puzzle JSON (see [architecture/overview.md](overview.md)). It has two entry points that share `style.css` and `sw.js`:

- **Classic** - [index.html](../index.html) + [app.js](../app.js)
- **Gattai** - [gattai.html](../gattai.html) + [gattai.js](../gattai.js) + `gattai.css` (see [architecture/gattai.md](gattai.md))

## State management

- **One state object.** All mutable game state lives in a single object - trivial to log, serialize, and reason about.
- **Cache DOM references once** at startup; they double as documentation of the elements the code touches.
- **Delegate events to containers** rather than binding every cell/button, so dynamic content works with one listener.
- **Undo is snapshots.** Push deep copies of state to a bounded history array; pop to restore. History is capped (50 entries) to bound memory.

## Persistence (localStorage)

All keys are namespaced with the `yen-doku-` prefix and every access is wrapped in try/catch, because `localStorage` throws in private mode or when the quota is exceeded - the game degrades gracefully instead of crashing.

- **Per-context keys.** In-progress state is keyed by date and difficulty (and mode, for Gattai) so switching Easy -> Extreme -> Easy or reopening the tab preserves each puzzle independently.
- **Save triggers:** after every move (enter, erase, hint, undo).
- **Load trigger:** on puzzle load, restoring saved state if present.
- **Clear triggers:** on completion (victory) or reset.
- **Auto-cleanup:** in-progress states older than 7 days are deleted on app init.

Exact key names and value shapes are the persisted contract in [reference/data-contracts.md](../reference/data-contracts.md).

## Timer

- Starts on the first move.
- **Pauses when the tab is hidden** and resumes when visible, via the Page Visibility API, so idle time never counts. If the API is unavailable, the timer keeps running (graceful fallback).
- Elapsed time is tracked as `elapsedBeforePause + (now - startTime)` and persists across pause/resume.
- Stops permanently on completion or reveal.

## Completion and best times

- On solve, a **completion record** is stored so a reopened puzzle shows its solved grid and a "Completed in MM:SS" badge plus a nudge to the next difficulty, rather than an empty board. "Play Again" clears the record and resets the puzzle. Completion records are cleaned up after 30 days.
- Up to **three best times per difficulty** are kept. The victory modal shows a rank badge for a personal best and the top-3 mini-leaderboard. Best times persist indefinitely; an older single-value format is migrated transparently on read.

## Service worker

`sw.js` provides offline play with a **versioned cache** (bumped on deploy; old caches deleted on activation). Strategy is chosen by content type - the app shell is network-first for freshness, already-opened puzzle JSON is cache-first for speed - and the worker activates immediately (`skipWaiting` + `clients.claim`) so updates land without a manual refresh.

## UI/UX

Design tokens are the single source of truth: colors, spacing, fonts, radii, and durations are CSS custom properties in `:root`, named by purpose (`--text-primary`, `--accent`) not appearance. Dark mode is a `@media (prefers-color-scheme: dark)` override with no JavaScript.

- **Typography:** Josefin Sans (brand), Nunito (UI), Outfit (grid numbers).
- **Interaction:** selecting a cell highlights its row, column, and box; matching numbers glow across the grid; rule conflicts are flagged in real time; Notes mode pencils in candidates.
- **Feedback:** non-blocking auto-dismissing toasts for routine feedback; a victory modal on genuine completion; the Check action reports error counts without revealing which cells, preserving the challenge.
- **Responsive:** mobile-first, the grid scales fluidly (max ~400px), a bottom action bar on mobile, and safe-area insets are respected.
- **Input and a11y:** full keyboard support (digits, arrows, shortcuts), 44x44px minimum touch targets, visible focus for keyboard navigation, and labelled controls. Framework-level a11y auditing is out of scope (see [../../CLAUDE.md](../../CLAUDE.md)).

## See also

- [architecture/overview.md](overview.md) - where puzzle JSON comes from.
- [architecture/gattai.md](gattai.md) - the multi-grid client.
- [reference/data-contracts.md](../reference/data-contracts.md) - exact localStorage keys and puzzle JSON.
- [concepts/design-principles.md](../concepts/design-principles.md) - the patterns these choices follow.
