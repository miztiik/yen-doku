# Research: Sudoku Generation Libraries

**Created**: 2026-01-11  
**Status**: Initial Research  
**Spec**: [spec.md](spec.md)

---

## Objective

Evaluate existing Python libraries for Sudoku puzzle generation to avoid reinventing the wheel. The library must support:
- Puzzle generation with configurable difficulty
- Solving with unique solution verification
- Seeding for deterministic/reproducible output

---

## Libraries Evaluated

### 1. py-sudoku ⭐ **RECOMMENDED**

| Attribute | Value |
|-----------|-------|
| Package | `py-sudoku` |
| PyPI | https://pypi.org/project/py-sudoku/ |
| Last Updated | October 2024 |
| License | MIT |

**Features:**
- ✅ Generate puzzles with `Sudoku(3).difficulty(0.5)`
- ✅ Solve puzzles with `.solve()`
- ✅ Seed support for reproducibility: `Sudoku(3, seed=20260111)`
- ✅ Access grid as 2D array: `.board`
- ✅ Detects unsolvable puzzles
- ⚠️ Unique solution guarantee not explicitly documented

**Usage Example:**
```python
from sudoku import Sudoku

# Generate with date-based seed
seed = int("2026-01-11".replace("-", ""))  # 20260111
puzzle = Sudoku(3, seed=seed).difficulty(0.5)

# Get puzzle and solution
grid = puzzle.board           # 2D array with 0 for empty
solution = puzzle.solve().board
```

**Gap to Address:**
Need to verify or add custom uniqueness check (count solutions ≤ 2).

---

### 2. sudokutools

| Attribute | Value |
|-----------|-------|
| Package | `sudokutools` |
| PyPI | https://pypi.org/project/sudokutools/ |
| Last Updated | January 2019 |
| License | MIT |

**Features:**
- ✅ Generation via `sudokutools.generate`
- ✅ Analysis via `sudokutools.analyze`
- ✅ Solving via `sudokutools.solvers`
- ⚠️ Older package (2019)
- ❓ Seeding support unknown

**Modules:**
- `sudokutools.analyze`: Check, rate and analyze sudokus
- `sudokutools.generate`: Create new sudokus
- `sudokutools.solve`: Low-level solving
- `sudokutools.solvers`: High-level solving

**Note:** Has dedicated analyze module which may provide rating/difficulty features.

---

### 3. sudoku (deprecated)

| Attribute | Value |
|-----------|-------|
| Package | `sudoku` |
| PyPI | https://pypi.org/project/sudoku/ |
| Last Updated | April 2006 |
| Status | ❌ Abandoned |

Not recommended. Too old, no active maintenance.

---

## Decision

**Use `py-sudoku` as primary library** with the following strategy:

1. **Generation**: Use `Sudoku(3, seed=date_seed).difficulty(x)`
2. **Solving**: Use `.solve()` to get the complete solution
3. **Uniqueness**: Add custom wrapper to verify exactly one solution exists
4. **Difficulty**: Map py-sudoku difficulty parameter to clue-based levels

---

## Difficulty Mapping

py-sudoku's `difficulty(x)` parameter represents the **fraction of cells that are empty** (0.0 to 1.0).

For a 9×9 grid (81 cells):

| Level | Clues | Empty Cells | py-sudoku `difficulty(x)` |
|-------|-------|-------------|---------------------------|
| **Easy** | 40-45 | 36-41 | `0.45` - `0.50` |
| **Medium** | 32-39 | 42-49 | `0.52` - `0.60` |
| **Hard** | 26-31 | 50-55 | `0.62` - `0.68` |
| **Extreme** | 17-25 | 56-64 | `0.70` - `0.79` |

### Recommended Default Values

```python
DIFFICULTY_CONFIG = {
    "easy":    {"target": 0.48, "clues_min": 40, "clues_max": 45},
    "medium":  {"target": 0.55, "clues_min": 32, "clues_max": 39},
    "hard":    {"target": 0.65, "clues_min": 26, "clues_max": 31},
    "extreme": {"target": 0.75, "clues_min": 17, "clues_max": 25},
}
```

### Classification Function

```python
def classify_difficulty(grid: list[list[int]]) -> str:
    """Classify puzzle difficulty based on clue count."""
    clue_count = sum(1 for row in grid for cell in row if cell != 0)
    
    if clue_count >= 40:
        return "easy"
    elif clue_count >= 32:
        return "medium"
    elif clue_count >= 26:
        return "hard"
    else:
        return "extreme"
```

### Notes

- py-sudoku doesn't guarantee exact clue counts, only approximate percentages
- After generation, we verify actual clue count to assign the correct label
- Extreme puzzles (17-25 clues) are harder to generate with unique solutions
- May need retry logic for extreme difficulty to ensure uniqueness

---

## ⚠️ CRITICAL FINDING: py-sudoku Uniqueness Issue

**Discovered 2026-01-11 during Phase 2 implementation**

### Problem

py-sudoku's `.difficulty()` method does NOT guarantee unique solutions. Testing revealed:

```python
# At difficulty 0.65 (hard range):
from sudoku import Sudoku
from solver import count_solutions

puzzle = Sudoku(3, seed=2901286669).difficulty(0.65)
grid = [[c if c else 0 for c in r] for r in puzzle.board]
print(count_solutions(grid, 2))  # Output: 2 (NOT unique!)
```

**In 50 seeds tested at hard difficulty, ZERO produced unique puzzles.**

### Impact on User Experience

A puzzle with multiple valid solutions is **fundamentally broken**:

| Aspect | Impact |
|--------|--------|
| Solvability | ❌ User cannot solve uniquely using logic alone |
| Difficulty | ⬆️ Increases frustration, not legitimate difficulty |
| Fairness | ❌ User may deduce correctly but be marked "wrong" |
| Standard | ❌ Violates definition of a proper Sudoku puzzle |

**Why it's critical:**
- If cell A could logically be 5 or 7 (no way to determine)
- User picks 5, solves completely → valid "solution 1"
- But we stored "solution 2" where A=7
- User is CORRECT but our "Check" button says WRONG!

### Solution: Custom Clue Removal Strategy

Instead of using py-sudoku's `.difficulty()`, we:

1. **Generate complete grid**: Use `Sudoku(3, seed).solve()` to get a valid filled grid
2. **Remove clues carefully**: Randomly remove cells one at a time
3. **Check uniqueness after each removal**: Using our `count_solutions()` solver
4. **Stop at target clue count**: Within difficulty range

```python
def _remove_clues_for_difficulty(complete_grid, difficulty, rng):
    """Remove clues while guaranteeing unique solution."""
    min_clues, max_clues = get_clue_range(difficulty)
    target_clues = (min_clues + max_clues) // 2
    
    grid = copy.deepcopy(complete_grid)
    positions = [(r, c) for r in range(9) for c in range(9)]
    rng.shuffle(positions)
    
    for row, col in positions:
        if count_clues(grid) <= target_clues:
            break
        
        original = grid[row][col]
        grid[row][col] = 0
        
        # Key: Only keep removal if still unique
        if count_solutions(grid, max_count=2) != 1:
            grid[row][col] = original  # Restore
    
    return grid
```

This is slower but guarantees correctness per our constitution: **"Correctness First"**.

---

## Updated JSON Schema

Based on difficulty alignment, the puzzle JSON schema is:

```json
{
  "date": "2026-01-11",
  "difficulty": "hard",
  "clueCount": 28,
  "grid": [
    [0, 0, 3, 0, 2, 0, 6, 0, 0],
    [9, 0, 0, 3, 0, 5, 0, 0, 1],
    ...
  ],
  "solution": [
    [4, 8, 3, 9, 2, 1, 6, 5, 7],
    [9, 6, 7, 3, 4, 5, 8, 2, 1],
    ...
  ]
}
```

### Folder Structure

```
puzzles/
├── 2026/
│   ├── easy/
│   │   ├── 2026-01-11.json
│   │   └── 2026-01-12.json
│   ├── medium/
│   │   └── 2026-01-11.json
│   ├── hard/
│   │   └── 2026-01-11.json
│   └── extreme/
│       └── 2026-01-11.json
└── README.md
```

**File path pattern**: `puzzles/<year>/<difficulty>/YYYY-MM-DD.json`

**UI Default**: Loads `puzzles/2026/extreme/2026-01-11.json` on first visit

---

## Generation Strategy by Difficulty

```python
def generate_puzzle(date: str, target_difficulty: str) -> dict:
    """Generate puzzle with target difficulty, retry if needed."""
    config = DIFFICULTY_CONFIG[target_difficulty]
    seed = int(date.replace("-", ""))
    
    for attempt in range(10):
        puzzle = Sudoku(3, seed=seed + attempt).difficulty(config["target"])
        solution = puzzle.solve()
        
        if solution.board is None:
            continue  # Unsolvable, retry
        
        clue_count = count_clues(puzzle.board)
        
        if not (config["clues_min"] <= clue_count <= config["clues_max"]):
            continue  # Wrong difficulty range, retry
        
        if count_solutions(puzzle.board) != 1:
            continue  # Multiple solutions, retry
        
        return {
            "date": date,
            "difficulty": target_difficulty,
            "clueCount": clue_count,
            "grid": puzzle.board,
            "solution": solution.board
        }
    
    raise GenerationError(f"Failed to generate {target_difficulty} puzzle after 10 attempts")
```

---

## Validation Checklist

Before committing a puzzle, validator MUST verify:

1. ✅ `grid` is 9×9 with values 0-9
2. ✅ `solution` is 9×9 with values 1-9
3. ✅ `solution` satisfies all Sudoku rules
4. ✅ `grid` has exactly one solution (matches `solution`)
5. ✅ `clueCount` matches actual non-zero cells in `grid`
6. ✅ `difficulty` matches `clueCount` range:
   - easy: 40-45 clues
   - medium: 32-39 clues
   - hard: 26-31 clues
   - extreme: 17-25 clues

---

## Open Research (Deferred to Implementation Phase)

### Uniqueness Verification
- [ ] Test if py-sudoku inherently guarantees unique solutions
- [ ] If not, implement backtracking solver that counts solutions (stop at 2)
- [ ] Benchmark performance of uniqueness check

### Difficulty Scoring
- [ ] Determine if clue count alone is sufficient
- [ ] Research solving technique detection (naked singles, hidden pairs, etc.)
- [ ] Consider using `sudokutools.analyze` as alternative for rating

### Seeding Strategy
- [ ] Confirm date-based seed produces different puzzles each day
- [ ] Test reproducibility across Python versions
- [ ] Document seed collision handling (if same puzzle generated twice)

---

## References

- py-sudoku source: https://github.com/jeffsieu/py-sudoku
- sudokutools source: https://github.com/messersm/sudokutools
- Sudoku mathematics: https://en.wikipedia.org/wiki/Mathematics_of_Sudoku
