# Tasks - yen-doku

> Detailed task breakdown for implementation. Updated as work progresses.

---

## Phase 0: Foundation (Day 1)

### Task 0.1: Initialize Project Structure
**Status**: ⬜ Not Started  
**Estimate**: 15 min

**Steps**:
1. Create folder structure:
   ```
   yen-doku/
   ├── scripts/
   ├── site/
   ├── puzzles/
   └── tests/
   ```
2. Verify folders exist

**Acceptance**: All folders created.

---

### Task 0.2: Create requirements.txt
**Status**: ⬜ Not Started  
**Estimate**: 5 min

**Content**:
```
py-sudoku>=1.0.0
pytest>=7.0.0
```

**Acceptance**: File exists at `requirements.txt`.

---

### Task 0.3: Create .gitignore
**Status**: ⬜ Not Started  
**Estimate**: 5 min

**Content**:
```
# Python
__pycache__/
*.py[cod]
.pytest_cache/
venv/
.venv/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

**Acceptance**: File exists at `.gitignore`.

---

### Task 0.4: Stub solver.py with Failing Test
**Status**: ⬜ Not Started  
**Estimate**: 15 min

**Files to create**:

`scripts/solver.py`:
```python
"""Sudoku solver with backtracking algorithm."""

def solve(grid: list[list[int]]) -> list[list[int]] | None:
    """
    Solve a Sudoku puzzle.
    
    Args:
        grid: 9x9 grid with 0 representing empty cells
        
    Returns:
        Solved grid, or None if unsolvable
    """
    raise NotImplementedError("solver.solve() not yet implemented")


def count_solutions(grid: list[list[int]], max_count: int = 2) -> int:
    """
    Count solutions up to max_count.
    
    Args:
        grid: 9x9 grid with 0 representing empty cells
        max_count: Stop counting after this many solutions
        
    Returns:
        Number of solutions found (capped at max_count)
    """
    raise NotImplementedError("solver.count_solutions() not yet implemented")
```

`tests/test_solver.py`:
```python
"""Tests for solver module."""
import pytest
from scripts.solver import solve, count_solutions


class TestSolve:
    def test_solve_valid_puzzle_returns_solution(self):
        """A valid puzzle should return a complete solution."""
        puzzle = [
            [5, 3, 0, 0, 7, 0, 0, 0, 0],
            [6, 0, 0, 1, 9, 5, 0, 0, 0],
            [0, 9, 8, 0, 0, 0, 0, 6, 0],
            [8, 0, 0, 0, 6, 0, 0, 0, 3],
            [4, 0, 0, 8, 0, 3, 0, 0, 1],
            [7, 0, 0, 0, 2, 0, 0, 0, 6],
            [0, 6, 0, 0, 0, 0, 2, 8, 0],
            [0, 0, 0, 4, 1, 9, 0, 0, 5],
            [0, 0, 0, 0, 8, 0, 0, 7, 9],
        ]
        solution = solve(puzzle)
        assert solution is not None
        # Check all cells are filled
        assert all(cell != 0 for row in solution for cell in row)


class TestCountSolutions:
    def test_unique_puzzle_has_one_solution(self):
        """A valid puzzle should have exactly one solution."""
        puzzle = [
            [5, 3, 0, 0, 7, 0, 0, 0, 0],
            [6, 0, 0, 1, 9, 5, 0, 0, 0],
            [0, 9, 8, 0, 0, 0, 0, 6, 0],
            [8, 0, 0, 0, 6, 0, 0, 0, 3],
            [4, 0, 0, 8, 0, 3, 0, 0, 1],
            [7, 0, 0, 0, 2, 0, 0, 0, 6],
            [0, 6, 0, 0, 0, 0, 2, 8, 0],
            [0, 0, 0, 4, 1, 9, 0, 0, 5],
            [0, 0, 0, 0, 8, 0, 0, 7, 9],
        ]
        assert count_solutions(puzzle) == 1
```

**Acceptance**: `pytest tests/test_solver.py` runs and reports 2 failing tests.

---

### Task 0.5: Stub validator.py with Failing Test
**Status**: ⬜ Not Started  
**Estimate**: 15 min

**Files to create**:

`scripts/validator.py`:
```python
"""Sudoku grid validator."""

def is_valid_grid(grid: list[list[int]]) -> bool:
    """
    Check if a grid is valid (no duplicates in rows/cols/boxes).
    
    Args:
        grid: 9x9 grid (0 = empty, 1-9 = filled)
        
    Returns:
        True if valid, False otherwise
    """
    raise NotImplementedError("validator.is_valid_grid() not yet implemented")


def is_complete(grid: list[list[int]]) -> bool:
    """
    Check if a grid is completely filled (no zeros).
    
    Args:
        grid: 9x9 grid
        
    Returns:
        True if no empty cells, False otherwise
    """
    raise NotImplementedError("validator.is_complete() not yet implemented")


def validate_solution(puzzle: list[list[int]], solution: list[list[int]]) -> bool:
    """
    Check if a solution is valid for the given puzzle.
    
    Args:
        puzzle: Original puzzle grid
        solution: Proposed solution grid
        
    Returns:
        True if solution is valid and matches puzzle clues
    """
    raise NotImplementedError("validator.validate_solution() not yet implemented")
```

`tests/test_validator.py`:
```python
"""Tests for validator module."""
import pytest
from scripts.validator import is_valid_grid, is_complete, validate_solution


class TestIsValidGrid:
    def test_valid_partial_grid(self):
        """A partially filled valid grid should return True."""
        grid = [
            [5, 3, 0, 0, 7, 0, 0, 0, 0],
            [6, 0, 0, 1, 9, 5, 0, 0, 0],
            [0, 9, 8, 0, 0, 0, 0, 6, 0],
            [8, 0, 0, 0, 6, 0, 0, 0, 3],
            [4, 0, 0, 8, 0, 3, 0, 0, 1],
            [7, 0, 0, 0, 2, 0, 0, 0, 6],
            [0, 6, 0, 0, 0, 0, 2, 8, 0],
            [0, 0, 0, 4, 1, 9, 0, 0, 5],
            [0, 0, 0, 0, 8, 0, 0, 7, 9],
        ]
        assert is_valid_grid(grid) is True

    def test_row_duplicate_invalid(self):
        """A grid with duplicate in a row should return False."""
        grid = [
            [5, 5, 0, 0, 7, 0, 0, 0, 0],  # Two 5s in row 0
            [6, 0, 0, 1, 9, 5, 0, 0, 0],
            [0, 9, 8, 0, 0, 0, 0, 6, 0],
            [8, 0, 0, 0, 6, 0, 0, 0, 3],
            [4, 0, 0, 8, 0, 3, 0, 0, 1],
            [7, 0, 0, 0, 2, 0, 0, 0, 6],
            [0, 6, 0, 0, 0, 0, 2, 8, 0],
            [0, 0, 0, 4, 1, 9, 0, 0, 5],
            [0, 0, 0, 0, 8, 0, 0, 7, 9],
        ]
        assert is_valid_grid(grid) is False


class TestIsComplete:
    def test_incomplete_grid(self):
        """A grid with zeros should return False."""
        grid = [[0] * 9 for _ in range(9)]
        grid[0][0] = 1
        assert is_complete(grid) is False

    def test_complete_grid(self):
        """A fully filled grid should return True."""
        grid = [
            [5, 3, 4, 6, 7, 8, 9, 1, 2],
            [6, 7, 2, 1, 9, 5, 3, 4, 8],
            [1, 9, 8, 3, 4, 2, 5, 6, 7],
            [8, 5, 9, 7, 6, 1, 4, 2, 3],
            [4, 2, 6, 8, 5, 3, 7, 9, 1],
            [7, 1, 3, 9, 2, 4, 8, 5, 6],
            [9, 6, 1, 5, 3, 7, 2, 8, 4],
            [2, 8, 7, 4, 1, 9, 6, 3, 5],
            [3, 4, 5, 2, 8, 6, 1, 7, 9],
        ]
        assert is_complete(grid) is True
```

**Acceptance**: `pytest tests/test_validator.py` runs and reports failing tests.

---

### Task 0.6: Verify TDD Setup
**Status**: ⬜ Not Started  
**Estimate**: 5 min

**Steps**:
1. Run `pip install -r requirements.txt`
2. Run `pytest`
3. Confirm output shows failing tests (expected behavior)

**Acceptance**: `pytest` exits with failures, not errors.

---

## Phase 1: Core Engine (Days 2-3)

### Task 1.1: Implement solver.py - solve()
**Status**: ⬜ Not Started  
**Estimate**: 45 min

**Algorithm**: Backtracking
1. Find first empty cell (0)
2. Try values 1-9
3. Check if placement is valid (no row/col/box conflict)
4. Recurse to next empty cell
5. Backtrack if no valid values

**Acceptance**: `test_solve_valid_puzzle_returns_solution` passes.

---

### Task 1.2: Implement solver.py - count_solutions()
**Status**: ⬜ Not Started  
**Estimate**: 30 min

**Algorithm**: Modified backtracking
1. Same as solve(), but count instead of return
2. Stop counting once max_count reached (optimization)

**Acceptance**: `test_unique_puzzle_has_one_solution` passes.

---

### Task 1.3: Add Additional Solver Tests
**Status**: ⬜ Not Started  
**Estimate**: 20 min

**Test cases to add**:
- Empty grid (81 zeros) → returns a valid solution
- Already solved grid → returns same grid
- Unsolvable grid → returns None
- Grid with multiple solutions → count_solutions returns 2

---

### Task 1.4: Implement validator.py - is_valid_grid()
**Status**: ⬜ Not Started  
**Estimate**: 30 min

**Algorithm**:
1. Check each row for duplicates (ignoring 0s)
2. Check each column for duplicates
3. Check each 3x3 box for duplicates

**Acceptance**: `test_valid_partial_grid` and `test_row_duplicate_invalid` pass.

---

### Task 1.5: Implement validator.py - is_complete()
**Status**: ⬜ Not Started  
**Estimate**: 10 min

**Algorithm**: Check all 81 cells are non-zero.

**Acceptance**: `test_incomplete_grid` and `test_complete_grid` pass.

---

### Task 1.6: Implement validator.py - validate_solution()
**Status**: ⬜ Not Started  
**Estimate**: 20 min

**Algorithm**:
1. Check solution is complete
2. Check solution is valid
3. Check solution preserves all original clues

---

### Task 1.7: Implement difficulty.py
**Status**: ⬜ Not Started  
**Estimate**: 20 min

**File**: `scripts/difficulty.py`

```python
"""Difficulty scoring based on clue count."""

from enum import Enum


class Difficulty(Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXTREME = "extreme"


def count_clues(grid: list[list[int]]) -> int:
    """Count non-zero cells in grid."""
    return sum(1 for row in grid for cell in row if cell != 0)


def score_difficulty(grid: list[list[int]]) -> Difficulty:
    """
    Determine difficulty based on clue count.
    
    - easy: 40+ clues
    - medium: 32-39 clues
    - hard: 26-31 clues
    - extreme: 17-25 clues
    """
    clues = count_clues(grid)
    if clues >= 40:
        return Difficulty.EASY
    elif clues >= 32:
        return Difficulty.MEDIUM
    elif clues >= 26:
        return Difficulty.HARD
    else:
        return Difficulty.EXTREME
```

**Acceptance**: Unit tests for clue count thresholds pass.

---

### Task 1.8: All Phase 1 Tests Green
**Status**: ⬜ Not Started  
**Estimate**: 15 min (debugging)

**Steps**:
1. Run `pytest -v`
2. Fix any remaining failures
3. Ensure 100% of Phase 0-1 tests pass

**Acceptance**: `pytest` exits with 0 failures.

---

## Phase 2: Generator (Day 4)

### Task 2.1: Implement generate.py Core
**Status**: ✅ Complete  
**Estimate**: 45 min

**Steps**:
1. Use py-sudoku with date-based deterministic seed
2. Generate complete solution grid
3. Remove clues to match target difficulty

**Acceptance**: `python scripts/generate.py 2026-01-11 --difficulty easy` produces valid puzzle.

---

### Task 2.2: Integrate Uniqueness Validation
**Status**: ✅ Complete  
**Estimate**: 30 min

**Steps**:
1. After clue removal, run `count_solutions()` 
2. If >1 solution, retry with different clue removal pattern
3. Max 10 retries before failure

**Acceptance**: All generated puzzles have exactly 1 solution.

---

### Task 2.3: Output JSON Schema
**Status**: ✅ Complete  
**Estimate**: 15 min

**Contract**:
```json
{
  "date": "YYYY-MM-DD",
  "difficulty": "easy|medium|hard|extreme",
  "clueCount": 17-45,
  "grid": [[9x9]],
  "solution": [[9x9]]
}
```

**Acceptance**: JSON matches contract, `clueCount` matches actual clues in grid.

---

### Task 2.4: CLI Interface
**Status**: ✅ Complete  
**Estimate**: 15 min

**Usage**: `python scripts/generate.py <date> --difficulty <level> --output <dir> --skip-existing`

**Acceptance**: CLI supports all 4 difficulties and idempotent regeneration.

---

### Task 2.5: Generator Tests
**Status**: ✅ Complete  
**Estimate**: 20 min

**Test Cases**:
- Determinism: same date+difficulty = same puzzle
- Schema validation
- Clue count within difficulty range
- Solution is valid

**Acceptance**: All generator tests pass.

---

### Task 2.6: Multi-Difficulty Support
**Status**: ✅ Complete  
**Estimate**: 15 min

**Steps**:
1. Loop through easy, medium, hard, extreme
2. Generate each to separate subfolder

**Acceptance**: Single run creates 4 puzzles.

---

## Phase 3: CI Pipeline (Day 5)

### Task 3.1: Create daily-generate.yml
**Status**: ✅ Complete  
**Estimate**: 30 min

**Trigger**: Cron `5 0 * * *` (00:05 UTC daily)

**Acceptance**: Workflow file exists at `.github/workflows/daily-generate.yml`.

---

### Task 3.2: Install Dependencies in CI
**Status**: ✅ Complete  
**Estimate**: 10 min

**Steps**: `pip install -r requirements.txt`

**Acceptance**: CI installs py-sudoku and pytest.

---

### Task 3.3: Generate All Difficulties
**Status**: ✅ Complete  
**Estimate**: 15 min

**Command**: `python scripts/generate.py $DATE --output docs/puzzles`

**Acceptance**: CI generates 4 puzzles per run.

---

### Task 3.4: Validate Generated Puzzles
**Status**: ✅ Complete  
**Estimate**: 20 min

**Steps**:
1. Check schema
2. Check grid validity
3. Check solution uniqueness
4. Check clue count matches difficulty

**Acceptance**: CI fails if any validation fails.

---

### Task 3.5: Commit and Push
**Status**: ✅ Complete  
**Estimate**: 15 min

**Steps**:
1. Update index.json with new puzzle dates
2. `git add docs/puzzles/`
3. `git commit -m "Add puzzles for $DATE"`
4. `git push`

**Acceptance**: New puzzles appear in repo after CI run.

---

### Task 3.6: Idempotency Check
**Status**: ✅ Complete  
**Estimate**: 10 min

**Steps**: Skip generation if `$DATE.json` already exists for a difficulty.

**Acceptance**: Re-running CI on same date produces no new commits.

---

## Phase 4: Static Site - Basic (Days 6-7)

### Task 4.1: Create index.html
**Status**: ✅ Complete  
**Estimate**: 30 min

**Structure**: 9×9 grid, difficulty tabs, control buttons, modal, toast.

**Acceptance**: HTML renders empty grid structure.

---

### Task 4.2: Create style.css
**Status**: ✅ Complete  
**Estimate**: 45 min

**Styling**:
- Modern color scheme per design system
- 3×3 box borders (thicker)
- Cell states: selected, related, conflict, clue vs user
- Responsive mobile layout

**Acceptance**: Grid looks polished on desktop and mobile.

---

### Task 4.3: Create app.js - Puzzle Loading
**Status**: ✅ Complete  
**Estimate**: 30 min

**Steps**:
1. Fetch `docs/puzzles/{year}/{difficulty}/{date}.json`
2. Parse and validate schema
3. Render grid with clue vs empty cells

**Acceptance**: Today's puzzle loads on page visit.

---

### Task 4.4: Error Handling
**Status**: ✅ Complete  
**Estimate**: 15 min

**Cases**:
- Network failure → "Check your connection"
- 404 puzzle → Fallback to latest available via index.json
- Invalid JSON → "Puzzle data corrupted"

**Acceptance**: User never sees blank page on error.

---

### Task 4.5: Configure GitHub Pages
**Status**: ✅ Complete  
**Estimate**: 10 min

**Steps**: deploy-pages.yml uploads `docs/` folder.

**Acceptance**: Site accessible at GitHub Pages URL.

---

### Task 4.6: Difficulty Selector
**Status**: ✅ Complete  
**Estimate**: 20 min

**UI**: 4 tabs (Easy, Medium, Hard, Extreme) with color coding.

**Acceptance**: Clicking tab loads that difficulty's puzzle.

---

### Task 4.7: Default to Extreme
**Status**: ✅ Complete  
**Estimate**: 5 min

**Acceptance**: Initial page load shows extreme difficulty.

---

### Task 4.8: URL State
**Status**: ✅ Complete  
**Estimate**: 15 min

**Format**: `?difficulty=hard`

**Acceptance**: URL reflects current difficulty; sharing URL preserves selection.

---

### Task 4.9: Clue Cell Styling
**Status**: ✅ Complete  
**Estimate**: 10 min

**Style**: Bold (700), dark color (#1a1a2e), subtle background tint.

**Acceptance**: Clue cells visually distinct from empty cells.

---

### Task 4.10: User Cell Styling
**Status**: ✅ Complete  
**Estimate**: 10 min

**Style**: Normal weight (400), accent color (#3a86ff), white background.

**Acceptance**: User-entered numbers look different from clues.

---

### Task 4.11: Selected Cell Highlight
**Status**: ✅ Complete  
**Estimate**: 10 min

**Style**: Blue glow border, prominent focus indicator.

**Acceptance**: Clicking a cell shows clear selection.

---

### Task 4.12: Related Cells Highlight
**Status**: ✅ Complete  
**Estimate**: 15 min

**Style**: Same row/col/box cells get subtle background (#f5f5ff).

**Acceptance**: Related cells highlighted when cell selected.

---

### Task 4.13: Mobile Responsive
**Status**: ✅ Complete  
**Estimate**: 20 min

**Requirements**:
- Min 44px touch targets
- Number pad for input
- Grid scales to viewport

**Acceptance**: Playable on mobile devices.

---

## Phase 5: Interactive Solving (Days 7-8)

### Task 5.1: Cell Input Handling
**Status**: ✅ Complete  
**Estimate**: 30 min

**Steps**:
1. Click cell to select
2. Keyboard 1-9 enters value
3. Backspace/Delete clears cell
4. Ignore invalid keys (letters, 0)
5. Cannot edit clue cells

**Acceptance**: User can enter/clear numbers in empty cells.

---

### Task 5.2: Conflict Detection
**Status**: ✅ Complete  
**Estimate**: 30 min

**Algorithm**:
1. On each entry, check row/col/box for duplicates
2. Highlight all conflicting cells (red background)
3. Remove highlight when conflict resolved

**Acceptance**: Duplicate "5" in same row both turn red.

---

### Task 5.3: Completion Detection
**Status**: ✅ Complete  
**Estimate**: 20 min

**Steps**:
1. Check all 81 cells filled
2. Compare grid against solution
3. If match, trigger victory celebration

**Acceptance**: Completing puzzle shows success animation.

---

### Task 5.4: Check Button
**Status**: ✅ Complete  
**Estimate**: 25 min

**Behavior**:
1. Compare user entries to solution
2. Highlight incorrect cells red (1.5s flash)
3. Do NOT highlight correct cells green
4. Show toast: "X incorrect" or "Looking good! X left"

**Acceptance**: Check validates without revealing answers.

---

### Task 5.5: Visual Feedback States
**Status**: ✅ Complete  
**Estimate**: 15 min

**States**:
- `.incorrect`: Red background flash (1.5s)
- `.conflict`: Persistent red for rule violations
- `.victory`: Green celebration animation

**Acceptance**: Each state has distinct visual treatment.

---

### Task 5.6: Reset Button
**Status**: ✅ Complete  
**Estimate**: 15 min

**Behavior**:
1. Show confirmation modal
2. Clear all user entries
3. Clear all notes (pencil marks)
4. Restore to initial puzzle state

**Acceptance**: Reset restores puzzle to original clues only.

---

### Task 5.7: Undo Functionality
**Status**: ✅ Complete  
**Estimate**: 20 min

**Steps**:
1. Push state to history stack on each change
2. Undo button pops last state
3. Limit to 50 undo steps

**Acceptance**: User can undo recent moves.

---

### Task 5.8: Erase Button
**Status**: ✅ Complete  
**Estimate**: 10 min

**Behavior**: Clear selected cell's value and notes.

**Acceptance**: Erase button works on selected cell.

---

## Phase 6: Notes Mode (Day 9)

### Task 6.1: Notes Mode Toggle
**Status**: ✅ Complete  
**Estimate**: 15 min

**UI**: Pencil button toggles notes mode on/off.

**Visual**: Button highlighted when active, mode indicator visible.

**Acceptance**: Toggle switches between normal and notes mode.

---

### Task 6.2: Multi-Digit Entry
**Status**: ✅ Complete  
**Estimate**: 30 min

**Layout**: 3×3 sub-grid within cell (pencil marks):
- Position mapping: 1=top-left, 2=top-center, 3=top-right, 4=mid-left, 5=center, 6=mid-right, 7=bottom-left, 8=bottom-center, 9=bottom-right

**Acceptance**: Pressing "1" in notes mode shows small "1" in top-left of cell.

---

### Task 6.3: Toggle Behavior
**Status**: ✅ Complete  
**Estimate**: 10 min

**Behavior**: Press same number again to remove note.

**Acceptance**: Press "3" twice toggles note on/off.

---

### Task 6.4: Clear Notes on Value Entry
**Status**: ✅ Complete  
**Estimate**: 10 min

**Behavior**: Entering a final value in normal mode clears all notes from that cell.

**Acceptance**: Notes disappear when value entered.

---

### Task 6.5: Notes Persistence
**Status**: ✅ Complete  
**Estimate**: 15 min

**Storage**: Notes saved to localStorage with game state.

**Acceptance**: Notes persist across page reloads.

---

## Phase 7: Polish (Day 11)

### Task 7.1: Reveal Solution Button
**Status**: ✅ Complete  
**Estimate**: 20 min

**Behavior**:
1. Show confirmation modal ("See the Solution?" — positive reinforcement)
2. Fill all cells with solution values
3. Mark revealed cells with distinct teal color
4. Highlight was-incorrect cells with red tint
5. Disable further input (grid.revealed class)

**Acceptance**: Reveal shows complete solution with staggered animation.

---

### Task 7.2: Hint Button
**Status**: ✅ Complete  
**Estimate**: 25 min

**Behavior**:
1. Find random empty/incorrect cell
2. Reveal correct value for that cell only
3. Mark as hint (distinct from user entry)
4. Toast: "💡 Hint revealed"

**Acceptance**: Hint reveals one cell at a time.

---

### Task 7.3: Difficulty Badge
**Status**: ✅ Complete  
**Estimate**: 10 min

**Display**: Color-coded badge showing current difficulty.

**Acceptance**: Badge visible and matches loaded puzzle.

---

### Task 7.4: Active Tab State
**Status**: ✅ Complete  
**Estimate**: 5 min

**Style**: Current difficulty tab highlighted.

**Acceptance**: Active tab visually distinct from inactive.

---

### Task 7.5: Date Navigation
**Status**: ✅ Complete  
**Estimate**: 20 min

**UI**: Previous/Next day chevrons.

**Behavior**: Navigate to adjacent dates' puzzles.

**Acceptance**: Can browse to past puzzles via arrows.

---

### Task 7.6: Timer Display
**Status**: ✅ Complete  
**Estimate**: 15 min

**Format**: MM:SS or HH:MM:SS elapsed time.

**Acceptance**: Timer shows solving duration.

---

### Task 7.7: Best Time Tracking
**Status**: ✅ Complete  
**Estimate**: 15 min

**Storage**: Best time per difficulty in localStorage.

**Acceptance**: New best time shown on victory.

---

### Task 7.8: Service Worker (Offline Support)
**Status**: ✅ Complete  
**Estimate**: 30 min

**Caching**: Cache static assets and puzzle JSONs.

**Acceptance**: Previously loaded puzzles work offline.

---

### Task 7.9: README Documentation
**Status**: ✅ Complete  
**Estimate**: 30 min

**Sections**: Overview, features, setup, usage, project structure, keyboard shortcuts, architecture diagram, contributing guidelines.

**Acceptance**: README provides complete project documentation.

---

### Task 7.10: Final Testing
**Status**: ✅ Complete  
**Estimate**: 45 min

**Steps**:
1. ✅ Test all 4 difficulties load correctly (3 puzzles each)
2. ✅ Test puzzle schema validation (date, difficulty, clueCount, grid, solution)
3. ✅ Python tests: 34 passed
4. ✅ No JS/CSS/HTML errors
5. ✅ Puzzle files validated

**Acceptance**: All features work end-to-end.

---

## Phase 8: Archive (Future - P3)

### Task 8.1: Date Picker Component
**Status**: ⬜ Not Started  
**Estimate**: 45 min

**UI**: Calendar or date input for selecting past dates.

**Acceptance**: User can select any past date.

---

### Task 8.2: Archive Browse by Difficulty
**Status**: ⬜ Not Started  
**Estimate**: 30 min

**UI**: Filter archive by difficulty level.

**Acceptance**: User can filter past puzzles by difficulty.

---

### Task 8.3: Available Dates Indicator
**Status**: ⬜ Not Started  
**Estimate**: 20 min

**UI**: Show which dates have puzzles available.

**Acceptance**: User sees which dates are playable.

---

## Progress Tracker

| Phase | Tasks | Completed | Status |
|-------|-------|-----------|--------|
| 0 | 6 | 6 | ✅ Complete |
| 1 | 8 | 8 | ✅ Complete |
| 2 | 6 | 6 | ✅ Complete |
| 3 | 6 | 6 | ✅ Complete |
| 4 | 13 | 13 | ✅ Complete |
| 5 | 8 | 8 | ✅ Complete |
| 6 | 5 | 5 | ✅ Complete |
| 7 | 10 | 10 | ✅ Complete |
| 8 | 3 | 0 | ⬜ Not Started (P3) |

---

## Change Log

| Date | Change |
|------|--------|
| 2026-01-11 | Initial tasks.md created for Phase 0-1 |
| 2026-01-11 | Phase 0-1 complete: 17 tests passing |
| 2026-01-11 | Phase 2 complete: Generator with unique solution guarantee, 25 tests passing |
| 2026-01-11 | Phase 3 complete: CI/CD workflows (daily-generate.yml, ci.yml) |
| 2026-01-11 | Phase 4 complete: Static site with difficulty selector, modern UI, keyboard support |
| 2026-01-13 | Added detailed task breakdowns for Phase 2-8; fixed User Story numbering (D1) |
| 2026-01-13 | Updated docs path references (CON1); standardized Notes Mode terminology |
| 2026-01-13 | Task 7.1 Reveal Solution complete: positive UX, teal styling, was-incorrect highlighting |
| 2026-01-13 | Tasks 7.9 README, 7.10 Final Testing complete: Phase 7 finished, 34 tests passing | |
