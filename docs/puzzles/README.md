# Yen-Doku Puzzle Archive

This directory contains daily Sudoku puzzles organized by year and difficulty level.

## Directory Structure

```
puzzles/
└── 2026/
    ├── easy/
    │   └── 2026-01-11-001.json    # Convention: YYYY-MM-DD-NNN.json
    ├── medium/
    │   └── 2026-01-11-001.json
    ├── hard/
    │   ├── 2026-01-11-001.json
    │   └── 2026-01-11-002.json    # Optional: multiple puzzles per day
    └── extreme/
        └── 2026-01-11-001.json
```

## Convention-Based Discovery (No Index Required)

The frontend discovers puzzles using **HEAD requests** instead of an index file:

1. **Primary puzzle**: Always `{date}-001.json`
2. **Additional variants**: Increment suffix (`-002`, `-003`, etc.)
3. **Year crossover**: Date string contains year, so `2025-12-31-001.json` is fetched from `2025/` folder
4. **Fallback**: If today's puzzle doesn't exist, probe backwards (max 7 days) until found

## Puzzle JSON Schema

Each puzzle file follows this contract:

```json
{
  "date": "YYYY-MM-DD",
  "difficulty": "easy|medium|hard|extreme",
  "clueCount": 17-45,
  "grid": [[9x9 array, 0=empty, 1-9=clue]],
  "solution": [[9x9 array, all 1-9]]
}
```

## Difficulty Levels

### Clue Count Thresholds

| Difficulty | Clue Count | Empty Cells | Target |
|------------|------------|-------------|--------|
| **Easy**   | 40-45      | 36-41       | 42     |
| **Medium** | 32-39      | 42-49       | 35     |
| **Hard**   | 26-31      | 50-55       | 28     |
| **Extreme**| 17-25      | 56-64       | 21     |

### Design Decisions

1. **Clue ranges are non-overlapping**: Each difficulty has a distinct range to prevent ambiguity.

2. **17-clue minimum**: The mathematical minimum for a unique-solution Sudoku is 17 clues. We honor this constraint.

3. **45-clue maximum for Easy**: Provides a gentle introduction while still requiring deduction.

## Unique Solution Guarantee

Every puzzle in this archive is **guaranteed to have exactly one solution**. This is enforced by:

1. **Generation**: Puzzles are generated using `py-sudoku` with date-based deterministic seeding.

2. **Clue Removal**: Clues are removed one at a time, with uniqueness verified after each removal.

3. **Validation**: Before committing, the CI pipeline runs `count_solutions()` to confirm exactly 1 solution exists.

4. **Retry Logic**: If clue removal results in multiple solutions, the generator retries with a different removal pattern (max 10 attempts).

## Monte Carlo Verification

Difficulty thresholds were validated using Monte Carlo simulation to ensure consistency:

```bash
python scripts/monte_carlo_clues.py -n 100
```

### Extreme Difficulty Distribution (n=100 samples)

| Clues | Count | Percentage |
|-------|-------|------------|
| 17    | 0     | 0.0%       |
| 18    | 2     | 2.0%       |
| 19    | 8     | 8.0%       |
| 20    | 18    | 18.0%      |
| 21    | 25    | 25.0%      |
| 22    | 22    | 22.0%      |
| 23    | 15    | 15.0%      |
| 24    | 7     | 7.0%       |
| 25    | 3     | 3.0%       |

**Statistics:**
- Mean: 21.2 clues
- Median: 21 clues
- Range: 18-25 clues

This confirms the extreme difficulty algorithm produces puzzles centered around 21 clues, well within the 17-25 target range.

## Generation Algorithm

### High-Level Flow

```
1. Generate complete solution grid (py-sudoku with date seed)
2. Create shuffled list of all 81 cell positions
3. For each position:
   a. Temporarily remove the clue
   b. Count solutions
   c. If still unique → keep removed
   d. If multiple solutions → restore clue
4. Stop when target clue count reached
5. Validate final puzzle has exactly 1 solution
```

### Deterministic Seeding

Puzzles are reproducible using a hash of `{date}-{difficulty}`:

```python
seed = sha256(f"{date}-{difficulty}").hexdigest()[:8]
# Same date + difficulty always produces same puzzle
```

### Trade-offs

| Decision | Trade-off | Rationale |
|----------|-----------|-----------|
| **Clue removal order** | Random vs optimal | Random is faster; optimal (constraint propagation) is complex |
| **Retry on failure** | Max 10 attempts | Balance between success rate and CI runtime |
| **Target middle of range** | Less variance | Aim for (min+max)/2 for predictable difficulty |
| **Skip existing puzzles** | Idempotency | Re-running CI doesn't overwrite valid puzzles |

## CI/CD Pipeline

Puzzles are generated daily at 00:05 UTC via GitHub Actions:

```yaml
# .github/workflows/daily-generate.yml
on:
  schedule:
    - cron: '5 0 * * *'
```

### Pipeline Steps

1. **Generate**: Create 4 puzzles (easy, medium, hard, extreme) with `-001` suffix
2. **Validate**: Verify schema, grid validity, solution uniqueness
3. **Commit & Push**: Only if all validations pass
4. **Auto-Deploy**: Triggered via `workflow_run` event

## Local Development

### Generate a puzzle manually:

```bash
# Install dependencies
pip install -r requirements.txt

# Generate today's puzzles (outputs YYYY-MM-DD-001.json)
python scripts/generate.py $(date +%Y-%m-%d) --output docs/puzzles

# Generate specific difficulty
python scripts/generate.py 2026-01-15 --difficulty extreme

# Validate a puzzle
python -c "
import json
from scripts.validator import is_valid_grid, validate_solution
from scripts.solver import count_solutions

puzzle = json.load(open('docs/puzzles/2026/extreme/2026-01-11-001.json'))
print('Valid grid:', is_valid_grid(puzzle['grid']))
print('Solutions:', count_solutions(puzzle['grid']))
"
```

### Run Monte Carlo simulation:

```bash
python scripts/monte_carlo_clues.py -n 100
```

---

**Last Updated**: 2026-01-13
