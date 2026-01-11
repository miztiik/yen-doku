# Feature Checklist: Yen-Doku Daily Sudoku System

**Purpose**: Track implementation progress of all features  
**Created**: 2026-01-11  
**Spec**: [spec.md](spec.md)

---

## How to Use

- Check items as completed: `- [x]`
- Items are numbered for easy reference
- Grouped by priority and component
- Update status in the Notes column as needed

---

## P1 Features (Must Have)

### Backend / CI (Python)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 001 | Set up Python project structure | ⬜ | `scripts/`, `tests/`, `requirements.txt` |
| 002 | Install py-sudoku library | ⬜ | `pip install py-sudoku` |
| 003 | Create `generate.py` — puzzle generation | ⬜ | Uses py-sudoku with date seed |
| 004 | Create `solver.py` — solution finder | ⬜ | Wrapper around py-sudoku |
| 005 | Create `validator.py` — rule checker | ⬜ | Rows, columns, boxes, uniqueness |
| 006 | Create `difficulty.py` — scoring | ⬜ | Clue count → easy/medium/hard |
| 007 | Write unit tests for solver | ⬜ | `tests/test_solver.py` |
| 008 | Write unit tests for validator | ⬜ | `tests/test_validator.py` |
| 009 | Create GitHub Actions workflow | ⬜ | `.github/workflows/daily-generate.yml` |
| 010 | CI: Generate puzzle on schedule | ⬜ | Cron trigger daily |
| 011 | CI: Validate before commit | ⬜ | Fail if validation fails |
| 012 | CI: Commit and push puzzle JSON | ⬜ | Auto-commit to repo |

### Frontend / UI (JavaScript)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 013 | Create `site/index.html` | ⬜ | Basic HTML structure |
| 014 | Create `site/style.css` | ⬜ | 9×9 grid styling, 3×3 box borders |
| 015 | Create `site/app.js` | ⬜ | Main application logic |
| 016 | Fetch today's puzzle JSON | ⬜ | Relative path fetch |
| 017 | Render 9×9 grid | ⬜ | Clues read-only, empty editable |
| 018 | Handle missing puzzle gracefully | ⬜ | Show error message |

### Grid Visual Design (P1)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 019 | Modern grid design | ⬜ | Subtle shadows, rounded corners |
| 020 | Clue vs user cell distinction | ⬜ | Bold #1a1a2e vs normal #3a86ff |
| 021 | 3×3 box thick borders | ⬜ | 2-3px vs 1px inner borders |
| 022 | Alternating box tints | ⬜ | Subtle background variation |
| 023 | Selected cell highlight | ⬜ | Blue glow (#3a86ff, 30% opacity) |
| 024 | Row/col/box highlight | ⬜ | Subtle #f5f5ff on related cells |
| 025 | Conflict error state | ⬜ | Red background #ffebee |
| 026 | Completion success animation | ⬜ | Green glow on grid |
| 027 | Notes 3×3 layout in cell | ⬜ | 40% font size sub-grid |
| 028 | WCAG AA contrast compliance | ⬜ | Accessibility check |

---

## P2 Features (Should Have)

### Interactive Solving

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 029 | Cell input handling (1-9 only) | ⬜ | Keyboard input |
| 030 | Real-time conflict detection | ⬜ | Highlight duplicates in row/col/box |
| 031 | "Check" button — validate progress | ⬜ | Client-side against solution |
| 032 | Visual feedback for correct/incorrect | ⬜ | Green/red highlights |
| 033 | Detect puzzle completion | ⬜ | Success message when done |

### Notes Mode (Pencil Marks)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 034 | Notes mode toggle button | ⬜ | UI indicator for mode |
| 035 | Enter multiple candidates per cell | ⬜ | Small digits display |
| 036 | Toggle candidates on/off | ⬜ | Press same number to remove |
| 037 | Clear notes when value entered | ⬜ | Auto-clear on final answer |
| 038 | Persist notes during session | ⬜ | Browser memory only |

### Difficulty Scoring

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 039 | Calculate clue count | ⬜ | Count non-zero cells |
| 040 | Map to easy/medium/hard/extreme | ⬜ | 40+/32-39/26-31/17-25 thresholds |
| 041 | Include difficulty in JSON | ⬜ | `"difficulty": "medium"` |
| 042 | Include clueCount in JSON | ⬜ | `"clueCount": 35` |
| 043 | Validate difficulty matches clueCount | ⬜ | CI fails if mismatch |
| 044 | Target difficulty generation | ⬜ | Generate specific difficulty level |
| 045 | Retry logic for difficulty | ⬜ | Max 10 attempts if clue count wrong |

### Difficulty UI/UX

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 046 | Display difficulty badge | ⬜ | Prominent label on page |
| 047 | Color-code by difficulty | ⬜ | Green/Orange/Red/Purple |
| 048 | Show clue count | ⬜ | e.g., "Hard (28 clues)" |
| 049 | Filter archive by difficulty | ⬜ | P3 feature |

### Difficulty Navigation (P1)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 050 | Default to extreme on load | ⬜ | First visit shows extreme |
| 051 | Difficulty selector UI | ⬜ | Dropdown, tabs, or buttons |
| 052 | Show all 4 difficulty options | ⬜ | Easy/Medium/Hard/Extreme |
| 053 | Load puzzle on difficulty change | ⬜ | Fetch new JSON dynamically |
| 054 | Confirm before switching (unsaved) | ⬜ | Prevent accidental loss |
| 055 | Persist difficulty in localStorage | ⬜ | Remember user preference |
| 056 | Handle missing difficulty puzzle | ⬜ | Graceful error message |

---

## P3 Features (Nice to Have)

### Solution & Reset

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 057 | "Reveal Solution" button | ⬜ | Fill grid from solution field |
| 058 | Visual distinction for revealed | ⬜ | Different color/style |
| 059 | "Reset Puzzle" button | ⬜ | Restore to initial state |
| 060 | Clear all notes on reset | ⬜ | Full state reset |

### Archive / History

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 061 | Generate yearly index.json | ⬜ | List of available puzzles |
| 062 | Date picker UI | ⬜ | Select past dates |
| 063 | Load puzzle by date | ⬜ | Fetch from archive |
| 064 | "No puzzle available" handling | ⬜ | Graceful error for missing dates |
| 065 | Filter by difficulty in archive | ⬜ | Show only easy/medium/etc. |

---

## Infrastructure

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 066 | Create `puzzles/` directory structure | ⬜ | `puzzles/2026/<difficulty>/` |
| 067 | Create `puzzles/README.md` | ⬜ | Explain structure |
| 068 | Configure GitHub Pages | ⬜ | Serve from `/site` |
| 069 | Add `.gitignore` | ⬜ | Python, node, IDE files |

---

## Summary

| Priority | Total | Completed | Remaining |
|----------|-------|-----------|-----------|
| P1 | 28 | 0 | 28 |
| P2 | 28 | 0 | 28 |
| P3 | 9 | 0 | 9 |
| Infra | 4 | 0 | 4 |
| **Total** | **69** | **0** | **69** |

---

## Change Log

| Date | Change |
|------|--------|
| 2026-01-11 | Initial checklist created from spec.md |
| 2026-01-11 | Added Grid Visual Design section (10 items) |
