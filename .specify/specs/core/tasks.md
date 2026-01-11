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

## Progress Tracker

| Phase | Tasks | Completed | Status |
|-------|-------|-----------|--------|
| 0 | 6 | 6 | ✅ Complete |
| 1 | 8 | 8 | ✅ Complete |
| 2 | 6 | 6 | ✅ Complete |
| 3 | 6 | 6 | ✅ Complete |
| 4 | 13 | 13 | ✅ Complete |

---

## Change Log

| Date | Change |
|------|--------|
| 2026-01-11 | Initial tasks.md created for Phase 0-1 |
| 2026-01-11 | Phase 0-1 complete: 17 tests passing |
| 2026-01-11 | Phase 2 complete: Generator with unique solution guarantee, 25 tests passing |
| 2026-01-11 | Phase 3 complete: CI/CD workflows (daily-generate.yml, ci.yml) |
| 2026-01-11 | Phase 4 complete: Static site with difficulty selector, modern UI, keyboard support |
