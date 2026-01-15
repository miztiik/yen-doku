# Feature Checklist: Yen-Doku Daily Sudoku System

**Purpose**: Track implementation progress of all features  
**Created**: 2026-01-11  
**Last Updated**: 2026-01-15  
**Spec**: [spec.md](spec.md)  
**Design System**: [design-system.md](design-system.md)

---

## How to Use

- Check items as completed: `- [x]}` or ✅
- Items are numbered for easy reference
- Grouped by priority and component
- Update status in the Notes column as needed

---

## P1 Features (Must Have)

### Backend / CI (Python)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 001 | Set up Python project structure | ✅ | `scripts/`, `tests/`, `requirements.txt` |
| 002 | Install py-sudoku library | ✅ | `pip install py-sudoku` |
| 003 | Create `generate.py` — puzzle generation | ✅ | Uses py-sudoku with date seed, --max-retries, --verbose |
| 004 | Create `solver.py` — solution finder | ✅ | count_solutions() for uniqueness |
| 005 | Create `validator.py` — rule checker | ✅ | Rows, columns, boxes, uniqueness |
| 006 | Create `difficulty.py` — scoring | ✅ | Clue count → easy/medium/hard/extreme |
| 007 | Write unit tests for solver | ✅ | `tests/test_solver.py` |
| 008 | Write unit tests for validator | ✅ | `tests/test_validator.py` |
| 009 | Create GitHub Actions workflow | ✅ | `.github/workflows/daily-generate.yml` |
| 010 | CI: Generate puzzle on schedule | ✅ | Cron trigger 00:05 UTC daily |
| 011 | CI: Validate before commit | ✅ | Fail if validation fails |
| 012 | CI: Commit and push puzzle JSON | ✅ | Auto-commit to repo, outputs to docs/puzzles |

### Frontend / UI (JavaScript)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 013 | Create `docs/index.html` | ✅ | Basic HTML structure |
| 014 | Create `docs/style.css` | ✅ | 1100+ lines, Apple HIG inspired |
| 015 | Create `docs/app.js` | ✅ | 750+ lines, main application logic |
| 016 | Fetch today's puzzle JSON | ✅ | Relative path fetch from ./puzzles/ |
| 017 | Render 9×9 grid | ✅ | Clues read-only, empty editable |
| 018 | Handle missing puzzle gracefully | ✅ | Show error message with toast |

### Grid Visual Design (P1)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 019 | Modern grid design | ✅ | Subtle shadows, rounded corners |
| 020 | Clue vs user cell distinction | ✅ | Bold given, purple user-entered |
| 021 | 3×3 box thick borders | ✅ | 2px vs 1px inner borders |
| 022 | Alternating box tints | ⬜ | Skipped — kept cleaner look |
| 023 | Selected cell highlight | ✅ | Purple glow + scale(1.02) |
| 024 | Row/col/box highlight | ✅ | Subtle purple tint on related cells |
| 025 | Conflict error state | ✅ | Red background on conflicts |
| 026 | Completion success animation | ✅ | Victory celebration with confetti |
| 027 | Notes 3×3 layout in cell | ✅ | Small digits in corner positions |
| 028 | WCAG AA contrast compliance | ✅ | Checked with dev tools |

---

## P2 Features (Should Have)

### Interactive Solving

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 029 | Cell input handling (1-9 only) | ✅ | Keyboard + on-screen number pad |
| 030 | Real-time conflict detection | ✅ | Highlight duplicates in row/col/box |
| 031 | "Check" button — validate progress | ✅ | **Does NOT reveal greens** — errors only |
| 032 | Visual feedback for correct/incorrect | ✅ | Red temp highlight (1.5s) for errors |
| 033 | Detect puzzle completion | ✅ | Victory celebration triggers |

### Notes Mode (Pencil Marks)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 034 | Notes mode toggle button | ✅ | UI indicator for mode (pencil icon) |
| 035 | Enter multiple candidates per cell | ✅ | Small digits display in 3×3 grid |
| 036 | Toggle candidates on/off | ✅ | Press same number to remove |
| 037 | Clear notes when value entered | ✅ | Auto-clear on final answer |
| 038 | Persist notes during session | ✅ | Browser memory only |

### Difficulty Scoring

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 039 | Calculate clue count | ✅ | Count non-zero cells |
| 040 | Map to easy/medium/hard/extreme | ✅ | 40+/32-39/26-31/17-25 thresholds |
| 041 | Include difficulty in JSON | ✅ | `"difficulty": "medium"` |
| 042 | Include clueCount in JSON | ✅ | `"clueCount": 35` |
| 043 | Validate difficulty matches clueCount | ✅ | CI fails if mismatch |
| 044 | Target difficulty generation | ✅ | Generate specific difficulty level |
| 045 | Retry logic for difficulty | ✅ | --max-retries flag (default 10) |

### Difficulty UI/UX

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 046 | Display difficulty badge | ✅ | Color-coded badge below grid |
| 047 | Color-code by difficulty | ✅ | Green/Orange/Red/Purple |
| 048 | Show clue count | ✅ | Badge shows "(28 clues)" |
| 049 | Filter archive by difficulty | 🅿️ | **Parked** — duplicate of #065 |

### Difficulty Navigation (P1)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 050 | Default to extreme on load | ✅ | First visit shows extreme |
| 051 | Difficulty selector UI | ✅ | **Horizontal buttons with pip indicators** |
| 052 | Show all 4 difficulty options | ✅ | Easy/Medium/Hard/Extreme |
| 053 | Load puzzle on difficulty change | ✅ | Fetch new JSON dynamically |
| 054 | Confirm before switching (unsaved) | ⬜ | Skipped — quick switch preferred |
| 055 | Persist difficulty in localStorage | ✅ | Remember user preference |
| 056 | Handle missing difficulty puzzle | ✅ | Graceful error message via toast |

---

## P3 Features (Nice to Have)

### Solution & Reset

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 057 | "Reveal Solution" button | ✅ | Eye icon, positive modal, staggered animation |
| 058 | Visual distinction for revealed | ✅ | Teal color for revealed, red tint for was-incorrect |
| 059 | "Reset Puzzle" button | ✅ | Restore to initial state |
| 060 | Clear all notes on reset | ✅ | Full state reset |

### Archive / History

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 061 | Generate yearly index.json | ✅ | List of available puzzles |
| 062 | Date picker UI | ✅ | Native date input in header |
| 063 | Load puzzle by date | ✅ | Fetch from archive via calendar |
| 064 | "No puzzle available" handling | ✅ | Graceful error for missing dates |
| 065 | Filter by difficulty in archive | 🅿️ | **Parked** — not necessary |

---

## Infrastructure

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 066 | Create `docs/puzzles/` directory | ✅ | `docs/puzzles/2026/<difficulty>/` |
| 067 | Create puzzles README | ✅ | Monte Carlo docs, difficulty thresholds |
| 068 | Configure GitHub Pages | ✅ | Serve from `/docs` folder |
| 069 | Add `.gitignore` | ✅ | Python, node, IDE files |
| 070 | Add Service Worker | ✅ | `docs/sw.js` for offline support |

---

## UI/UX Enhancements (Added Post-Spec)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 071 | Animated gradient logo | ✅ | Purple shimmer effect |
| 072 | Smaller date subtitle | ✅ | 11px, tertiary color |
| 073 | Difficulty pip indicators | ✅ | Visual dots (•, ••, •••, ••••) |
| 074 | Center-aligned layout | ✅ | Mobile-first, focused design |
| 075 | Dark/Light theme toggle | ✅ | System-aware + manual override |
| 076 | Victory confetti animation | ✅ | 50 particles, 3s duration |
| 077 | Staggered cell reveal | ✅ | Spiral from center pattern |
| 078 | Victory modal | ✅ | Time, date, difficulty, share button |
| 079 | Smart check messaging | ✅ | Context-aware toast messages |
| 080 | "Today's Puzzle" button | ✅ | Quick return to current day |
| 081 | Same-number highlighting | ✅ | All matching values glow |
| 082 | Hint button | ✅ | Reveals one correct cell |
| 083 | Keyboard navigation | ✅ | Arrow keys, 1-9, N for notes |
| 084 | LocalStorage persistence | ✅ | Save/resume game on return |
| 085 | Undo button | ✅ | Full undo history with pencil marks |
| 086 | Date fallback via index.json | ✅ | Smart fallback to latest available |
| 087 | Date navigation chevrons | ✅ | ‹ › arrows to navigate days |
| 088 | Footer with GitHub link | ✅ | Subtle branding |
| 089 | JavaScript test suite | ✅ | Node.js built-in test runner |

---

## Bugfix Sprint (2026-01-15)

| # | Bug | Status | Notes |
|---|-----|--------|-------|
| 090 | Grid alignment shifts with pencil marks | ✅ | Pencil marks now absolute positioned |
| 091 | Tooltip persists after button click (touch) | ✅ | JS blur + CSS `@media (hover: none)` |
| 092 | Hint button needs visual glow | ✅ | `@keyframes hintGlow` animation added |
| 093 | Erase button touch target off-center | ✅ | SVG translateX(1px) fix |
| 094 | Changing difficulty on old date jumps to today | ✅ | `load()` preserves `state.puzzle.date` |
| 095 | localStorage not cleaned after 7 days | ✅ | `cleanupOldSaves()` on app init |
| 096 | R shortcut conflicts with browser refresh | ✅ | Removed R keyboard binding |

---

## Summary

| Priority | Total | Completed | Parked/Skipped | Remaining |
|----------|-------|-----------|----------------|-----------|
| P1 | 28 | 28 | 0 | 0 |
| P2 | 28 | 26 | 2 | 0 |
| P3 | 9 | 7 | 2 | 0 |
| Infra | 5 | 5 | 0 | 0 |
| UI/UX Enhancements | 19 | 19 | 0 | 0 |
| Bugfixes | 7 | 7 | 0 | 0 |
| **Total** | **96** | **92** | **4** | **0** |

**Parked/Skipped Items** (4):  
- #022 — Parked  
- #049 — Parked (P3 Archive)  
- #054 — Skipped (quick switch UX preferred)  
- #065 — Parked (P3 Archive)

---

## Change Log

| Date | Change |
|------|--------|
| 2026-01-11 | Initial checklist created from spec.md |
| 2026-01-11 | Added Grid Visual Design section (10 items) |
| 2026-01-11 | **Major update**: Marked 78 items complete, added 13 UI/UX enhancements |
| 2026-01-11 | Fixed paths: site/ → docs/, puzzles/ → docs/puzzles/ |
| 2026-01-11 | Added design-system.md reference |
| 2026-01-12 | Added localStorage persistence, undo, date fallback, chevron navigation |
| 2026-01-12 | Fixed GitHub Actions workflow (commit path bug) |
| 2026-01-12 | Added JavaScript test suite |
| 2026-01-13 | Corrected #057/#058 status (not implemented); parked #049, #065; completed #067 |
| 2026-01-13 | **Implemented #057 & #058**: Reveal Solution button with positive modal, staggered animation, was-incorrect highlighting |
| 2026-01-13 | **Phase 7 Complete**: README updated, 34 Python tests passing, all puzzle schemas validated |
| 2026-01-15 | **Bugfix sprint**: Fixed 6 UI/navigation bugs (grid alignment, tooltip persistence, hint glow, erase centering, date navigation, 7-day cache cleanup) |
| 2026-01-15 | Removed R keyboard shortcut for Reveal Solution (conflicts with browser hard refresh) |
| 2026-01-15 | Updated constitution to v1.2.0 (added principles VI-VIII, UX/Storage contracts) |
| 2026-01-15 | Updated SYSTEM_DESIGN.md to match implementation (4 puzzles/day, 7-day retention, extreme difficulty) |
