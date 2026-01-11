# Feature Specification: Daily Sudoku Generator & Publisher

**Feature Branch**: `core-sudoku-system`  
**Created**: 2026-01-11  
**Status**: ✅ Implemented  
**Input**: User description from `objective.md`  
**Design System**: [design-system.md](design-system.md) — Typography, colors, animations  
**Checklist**: [checklist.md](checklist.md) — Implementation progress

---

## User Scenarios & Testing

### User Story 1 - View Today's Puzzle (Priority: P1)

As a visitor to the website, I can view today's Sudoku puzzle rendered as an interactive 9×9 grid so that I can start solving immediately. The puzzle defaults to **extreme difficulty** for maximum challenge.

**Why this priority**: This is the core value proposition — without a viewable puzzle, nothing else matters. It validates the entire pipeline: generation → storage → serving → rendering.

**Independent Test**: Navigate to the GitHub Pages URL and verify a valid 9×9 extreme-difficulty grid appears with empty cells (0s rendered as blanks) and pre-filled numbers.

**Acceptance Scenarios**:

1. **Given** today is 2026-01-11, **When** I visit the site, **Then** I see the extreme difficulty puzzle loaded by default
2. **Given** the puzzle JSON exists, **When** the page loads, **Then** pre-filled cells are read-only and empty cells are editable
3. **Given** the puzzle JSON is missing, **When** the page loads, **Then** a user-friendly error message appears (not a blank page)
4. **Given** I visit the site, **When** the page loads, **Then** the difficulty selector shows "Extreme" as selected

---

### User Story 2 - Switch Difficulty Level (Priority: P1)

As a solver, I can switch between difficulty levels (easy/medium/hard/extreme) using an intuitive selector so that I can choose a challenge appropriate to my skill level.

**Why this priority**: Core navigation feature. Users need to access all difficulty levels easily.

**Independent Test**: Click difficulty selector; choose "Easy"; verify puzzle reloads with easy difficulty.

**Acceptance Scenarios**:

1. **Given** I am viewing an extreme puzzle, **When** I click the difficulty selector, **Then** I see options: Easy, Medium, Hard, Extreme
2. **Given** the selector is visible, **When** I click "Easy", **Then** the easy puzzle for today loads
3. **Given** I switch difficulty, **When** the new puzzle loads, **Then** the difficulty badge updates to match
4. **Given** I switch difficulty, **When** I have unsaved progress, **Then** I see a confirmation prompt before switching
5. **Given** today's puzzle for selected difficulty doesn't exist, **When** I select it, **Then** I see "Puzzle not available" message

---

### User Story 3 - Solve Puzzle Interactively (Priority: P2)

As a solver, I can enter numbers into empty cells and receive immediate visual feedback on rule violations so that I can solve the puzzle without external tools.

**Why this priority**: Interactivity differentiates this from a static image. Without input, users would need pen and paper.

**Independent Test**: Enter a number in an empty cell; enter a duplicate in the same row/column/box and observe a visual warning.

**Acceptance Scenarios**:

1. **Given** an empty cell, **When** I click it, **Then** it becomes focused and accepts keyboard input (1-9)
2. **Given** I enter "5" in a cell, **When** another "5" exists in the same row, **Then** both cells are highlighted as conflicting
3. **Given** I complete all cells correctly, **When** the grid matches the solution, **Then** a success message appears
4. **Given** I enter an invalid character (letter, 0), **When** I press the key, **Then** the input is ignored

---

### User Story 4 - Validate Progress (Priority: P2)

As a solver, I can click a "Check" button to validate my current entries against the solution so that I can catch mistakes before completing the puzzle.

**Why this priority**: Reduces frustration by providing feedback before completion. Users don't have to redo entire puzzles due to early mistakes.

**Independent Test**: Fill some cells correctly and some incorrectly; click "Check"; verify incorrect cells are highlighted.

**⚠️ CRITICAL UX DECISION**: Check button does **NOT** reveal correct answers (no green highlighting). This preserves the solving experience — check is for catching mistakes only.

**Acceptance Scenarios**:

1. **Given** I have filled some cells incorrectly, **When** I click "Check", **Then** incorrect cells are highlighted red temporarily (1.5s)
2. **Given** all my entries are correct but puzzle is incomplete, **When** I click "Check", **Then** I see "Looking good! X left" message
3. **Given** I have made no entries, **When** I click "Check", **Then** I see "X cells to go" message
4. **Given** I click "Check", **When** validation runs, **Then** correct cells are **NOT** highlighted green (preserves solving experience)
5. **Given** all cells are filled correctly, **When** I click "Check", **Then** victory celebration triggers

---

### User Story 4 - Pencil Marks / Notes Mode (Priority: P2)

As a solver, I can toggle into "Notes Mode" to enter small candidate numbers in empty cells so that I can track possibilities and use advanced solving techniques.

**Why this priority**: Essential for medium/hard puzzles where multiple candidates exist. Power users expect this feature.

**Independent Test**: Toggle notes mode; click a cell; enter multiple numbers; verify they appear as small digits.

**Acceptance Scenarios**:

1. **Given** I am in normal mode, **When** I click "Notes" toggle, **Then** mode switches to notes mode (visually indicated)
2. **Given** I am in notes mode and select an empty cell, **When** I press "1", **Then** a small "1" appears in the cell's corner
3. **Given** a cell has note "1" and I press "1" again, **When** in notes mode, **Then** the note "1" is removed (toggle behavior)
4. **Given** a cell has notes "1, 3, 7", **When** I switch to normal mode and enter "3", **Then** the notes are cleared and "3" becomes the cell value
5. **Given** a cell has notes, **When** I click "Reset Puzzle", **Then** all notes are cleared

---

### User Story 5 - Reveal Solution (Priority: P3)

As a stuck solver, I can reveal the solution to see the correct answer so that I can learn from the puzzle.

**Why this priority**: Nice-to-have feature. Core solving experience works without this.

**Independent Test**: Click "Reveal Solution" button and verify the grid fills with the solution from JSON.

**Acceptance Scenarios**:

1. **Given** I am stuck, **When** I click "Reveal Solution", **Then** all cells show the correct numbers from `solution` field
2. **Given** the solution is revealed, **When** I view the grid, **Then** revealed cells are visually distinct from my inputs
3. **Given** I revealed the solution, **When** I click "Reset", **Then** the puzzle returns to its initial state

---

### User Story 6 - Daily Puzzle Generation (Priority: P1)

As the system (automated), I generate exactly one valid Sudoku puzzle per day with a guaranteed unique solution so that users always have fresh content.

**Why this priority**: Without generation, there is no puzzle. This is the backend foundation.

**Independent Test**: Run `generate.py` and verify output JSON passes all validation rules.

**Acceptance Scenarios**:

1. **Given** today is 2026-01-11, **When** CI runs, **Then** `puzzles/2026/2026-01-11.json` is created
2. **Given** the puzzle file already exists, **When** CI runs, **Then** generation is skipped (idempotent)
3. **Given** the generated puzzle, **When** the solver runs, **Then** it finds exactly one solution
4. **Given** generation fails validation, **When** CI evaluates, **Then** the workflow fails and no commit is made

---

### User Story 7 - Puzzle Validation (Priority: P1)

As the CI system, I validate every puzzle before commit to ensure it obeys Sudoku rules and has exactly one solution so that no invalid puzzle ever reaches users.

**Why this priority**: Correctness is non-negotiable per the constitution. Invalid puzzles destroy trust.

**Independent Test**: Run `validator.py` on a puzzle with two solutions; verify it returns a non-zero exit code.

**Acceptance Scenarios**:

1. **Given** a puzzle grid, **When** validated, **Then** all rows contain no duplicate non-zero values
2. **Given** a puzzle grid, **When** validated, **Then** all columns contain no duplicate non-zero values
3. **Given** a puzzle grid, **When** validated, **Then** all 3×3 boxes contain no duplicate non-zero values
4. **Given** a valid puzzle, **When** solver runs, **Then** exactly one solution exists
5. **Given** an invalid puzzle (multiple solutions), **When** validated, **Then** CI fails with explicit error message

---

### User Story 8 - Difficulty Scoring (Priority: P2)

As the generator, I assign a difficulty rating (easy/medium/hard/extreme) to each puzzle so that users know what to expect.

**Why this priority**: Enhances user experience but not blocking. A puzzle without difficulty is still solvable.

**Independent Test**: Generate puzzles with varying clue counts; verify difficulty labels change appropriately.

**Acceptance Scenarios**:

1. **Given** a puzzle with 40+ clues, **When** scored, **Then** difficulty is "easy"
2. **Given** a puzzle with 32-39 clues, **When** scored, **Then** difficulty is "medium"
3. **Given** a puzzle with 26-31 clues, **When** scored, **Then** difficulty is "hard"
4. **Given** a puzzle with 17-25 clues, **When** scored, **Then** difficulty is "extreme"
5. **Given** a puzzle, **When** scored, **Then** the `difficulty` field is written to the JSON

---

### User Story 9 - Browse Past Puzzles (Priority: P3)

As a returning user, I can browse puzzles from previous days so that I can solve ones I missed.

**Why this priority**: Archive feature is nice-to-have. Daily puzzle works without history.

**Independent Test**: Navigate to a date picker; select a past date; verify that puzzle loads.

**Acceptance Scenarios**:

1. **Given** puzzles exist for 2026-01-01 through 2026-01-10, **When** I view the archive, **Then** I see a list of available dates
2. **Given** I select 2026-01-05, **When** the page loads, **Then** I see the puzzle from `puzzles/2026/2026-01-05.json`
3. **Given** I select a date with no puzzle, **When** the page loads, **Then** a "No puzzle available" message appears

---

## Edge Cases

### Generation Edge Cases
- **What if the random generator produces an unsolvable configuration?** → Retry with different seed (max 10 attempts), then fail CI
- **What if generation takes >60 seconds?** → Timeout and fail CI; investigate algorithm performance
- **What if two CI runs trigger simultaneously?** → GitHub Actions concurrency control: cancel in-progress runs
- **What if extreme difficulty puzzle has multiple solutions?** → Retry with adjusted parameters; extreme is harder to generate uniquely
- **What if generated clue count doesn't match target difficulty?** → Regenerate with adjusted py-sudoku difficulty parameter

### Validation Edge Cases
- **What if the puzzle has 0 solutions?** → Validator returns "unsolvable" error
- **What if the puzzle has >1 solution?** → Validator returns "multiple solutions" error with count
- **What if the JSON is malformed?** → Validator returns schema validation error before logic checks

### UI Edge Cases
- **What if the user is offline?** → Show cached puzzle if available; otherwise, show offline message
- **What if JavaScript is disabled?** → Display static grid with "Enable JS to play" message
- **What if the puzzle JSON fails to load?** → Show error with "Try again" button; log to console

---

## Requirements

### Functional Requirements

#### Generation & Validation (Python/CI)
- **FR-001**: System MUST generate exactly one puzzle per calendar day (UTC)
- **FR-002**: System MUST guarantee every puzzle has exactly one solution
- **FR-003**: System MUST validate all Sudoku rules (rows, columns, 3×3 boxes)
- **FR-004**: System MUST assign a difficulty rating (easy|medium|hard|extreme) to each puzzle
- **FR-004a**: System MUST support generating puzzles for a specific target difficulty level
- **FR-004b**: System MUST validate that generated puzzle's clue count matches target difficulty range
- **FR-004c**: System MUST retry generation (max 10 attempts) if puzzle doesn't meet difficulty criteria
- **FR-005**: System MUST store puzzles as JSON files in `puzzles/<year>/<difficulty>/YYYY-MM-DD.json`
- **FR-005a**: Each difficulty level has its own subfolder (easy/, medium/, hard/, extreme/)
- **FR-006**: System MUST create year folders automatically if missing
- **FR-007**: System MUST fail CI and block commit if validation fails
- **FR-008**: System MUST be idempotent — re-running on same date produces no changes if puzzle exists

#### Puzzle JSON Contract
- **FR-009**: Puzzle JSON MUST contain `date` (string, YYYY-MM-DD format)
- **FR-010**: Puzzle JSON MUST contain `difficulty` (enum: easy|medium|hard|extreme)
- **FR-010a**: Puzzle JSON MUST contain `clueCount` (int, 17-45 range)
- **FR-010b**: `clueCount` MUST match actual non-zero cells in `grid`
- **FR-011**: Puzzle JSON MUST contain `grid` (9×9 array, values 0-9 where 0=empty)
- **FR-012**: Puzzle JSON MUST contain `solution` (9×9 array, values 1-9)
- **FR-012a**: Difficulty and clueCount MUST be consistent:
  - easy: clueCount 40-45
  - medium: clueCount 32-39
  - hard: clueCount 26-31
  - extreme: clueCount 17-25

#### User Interface (JavaScript/Browser)
- **FR-013**: UI MUST fetch puzzle JSON via relative path (no hardcoded URLs)
- **FR-014**: UI MUST render 9×9 grid with visual distinction for 3×3 boxes
- **FR-015**: UI MUST allow input only in cells where `grid[i][j] === 0`
- **FR-016**: UI MUST highlight conflicting cells in real-time
- **FR-017**: UI MUST detect and announce puzzle completion (client-side comparison against `solution` field)
- **FR-018**: UI MUST provide "Reveal Solution" functionality (reads from `solution` field, no server call)
- **FR-019**: UI MUST provide "Reset Puzzle" functionality
- **FR-020**: UI MUST provide "Check" button to validate current entries client-side using the `solution` field from puzzle JSON (no server round-trip)
- **FR-021**: UI MUST visually distinguish correct vs incorrect cells after validation (client-side only)
- **FR-022**: UI MUST provide toggle for "Notes Mode" (pencil marks, stored in browser memory only)
- **FR-023**: UI MUST allow multiple small candidate numbers (1-9) per cell in notes mode
- **FR-024**: UI MUST clear notes when a final value is entered in the cell
- **FR-025**: UI MUST persist notes during session (until reset or page reload)

#### Grid Visual Design (Modern Color Scheme)
- **FR-026**: Grid MUST use a modern, clean visual design with subtle shadows and rounded corners
- **FR-027**: Pre-filled clue cells MUST be visually distinct from user-editable cells:
  - Clue cells: Bold font weight (700), dark text (#1a1a2e), subtle background tint (#f0f0f5)
  - User cells: Normal font weight (400), accent color text (#3a86ff), white background (#ffffff)
- **FR-028**: 3×3 box boundaries MUST use thicker borders (2-3px) vs inner cell borders (1px)
- **FR-029**: Grid background MUST use alternating subtle tints for 3×3 boxes to aid visual grouping
- **FR-030**: Selected/focused cell MUST have a prominent highlight (e.g., blue glow, #3a86ff with 30% opacity)
- **FR-031**: Cells in same row/column/box as selected cell MAY have subtle highlight (#f5f5ff)
- **FR-032**: Conflicting cells MUST show clear error state (red background #ffebee, red border #f44336)
- **FR-033**: Completed puzzle MUST show success state (green glow animation on grid)
- **FR-034**: Notes (pencil marks) MUST display in smaller font (40% of cell size) in a 3×3 sub-grid layout within cell
- **FR-035**: Color palette MUST maintain WCAG AA contrast ratios for accessibility

#### Difficulty Display & UX (JavaScript/Browser)
- **FR-025a**: UI MUST display current puzzle difficulty prominently (badge/label)
- **FR-025b**: UI MUST use distinct color coding for each difficulty level:
  - Easy: Green (#4CAF50)
  - Medium: Orange (#FF9800)
  - Hard: Red (#F44336)
  - Extreme: Purple (#9C27B0)
- **FR-025c**: UI MUST show clue count alongside difficulty (e.g., "Hard (28 clues)")
- **FR-025d**: UI MAY adjust visual hints based on difficulty (e.g., fewer hints for extreme)
- **FR-025e**: UI MUST allow users to filter/browse archive by difficulty level (P3)

#### Difficulty Navigation (JavaScript/Browser)
- **FR-025f**: UI MUST default to extreme difficulty on initial page load
- **FR-025g**: UI MUST display a difficulty selector (dropdown, tabs, or buttons)
- **FR-025h**: Difficulty selector MUST show all 4 levels: Easy, Medium, Hard, Extreme
- **FR-025i**: UI MUST load the selected difficulty's puzzle for today's date
- **FR-025j**: UI MUST show confirmation if user has unsaved progress before switching
- **FR-025k**: UI MUST persist last selected difficulty in localStorage
- **FR-025l**: UI MUST gracefully handle missing puzzles for a difficulty level

#### CI/Automation
- **FR-026**: CI MUST run daily via GitHub Actions cron schedule
- **FR-027**: CI MUST commit and push only after successful validation
- **FR-028**: CI MUST use only GitHub free-tier resources
- **FR-029**: CI MUST complete within 10 minutes (Actions timeout buffer)

### Non-Functional Requirements

- **NFR-001**: Puzzle generation MUST complete in <30 seconds
- **NFR-002**: Solution validation MUST complete in <5 seconds
- **NFR-003**: Page load MUST complete in <2 seconds on 3G connection
- **NFR-004**: UI MUST be responsive (mobile-friendly)
- **NFR-005**: System MUST operate indefinitely without manual intervention

---

## Key Entities

### Puzzle
| Attribute | Type | Description |
|-----------|------|-------------|
| date | string | ISO date (YYYY-MM-DD) |
| difficulty | enum | easy \| medium \| hard \| extreme |
| clueCount | int | Number of pre-filled cells (17-45) |
| grid | int[9][9] | Puzzle state (0=empty, 1-9=clue) |
| solution | int[9][9] | Complete valid solution |

### Cell (UI concept)
| Attribute | Type | Description |
|-----------|------|-------------|
| row | int | 0-8 |
| col | int | 0-8 |
| value | int | Current value (0-9) |
| notes | int[] | Candidate numbers when in notes mode (e.g., [1,3,7]) |
| isClue | bool | True if pre-filled |
| isConflicting | bool | True if violates rules |
| isValidated | bool | True after "Check" button pressed |
| isCorrect | bool | True if value matches solution (after validation) |

---

## Open Questions

1. **Difficulty Algorithm**: Should difficulty be based purely on clue count, or should it consider solving techniques required? → *Recommend: Start with clue count (simple), iterate later*

2. **Deterministic Generation**: Should the same date always produce the same puzzle (seeded RNG), or is any valid puzzle acceptable? → *Recommend: Seeded by date for reproducibility*

3. **Index File**: Should `puzzles/<year>/index.json` list all puzzles for that year? → *Recommend: Yes, regenerated on each commit for easy archive browsing*

4. **Hint System**: Should UI provide hints (e.g., "this cell can only be 7")? → *Recommend: P4 feature, defer to future iteration*

---

## Dependencies

| Component | Depends On | Notes |
|-----------|------------|-------|
| UI (app.js) | Puzzle JSON files | Fetch at runtime |
| Generator | Solver | Must verify uniqueness |
| Validator | Solver | Uses solver to count solutions |
| CI Workflow | All Python scripts | Orchestrates pipeline |

---

## Out of Scope (Explicit Non-Goals)

- Backend servers or APIs
- User accounts or authentication  
- Real-time multiplayer
- React/Vue/Angular frameworks
- Mobile native apps
- Timer or leaderboards (first version)
