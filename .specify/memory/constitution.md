# Yen-Doku Constitution
<!-- Daily Sudoku Generator & Publisher -->

## Core Principles

### I. Correctness First (NON-NEGOTIABLE)
Every puzzle **must** have exactly one solution. Validation failures block commits. CI failures over silent corruption. Correctness and determinism take priority over cleverness.

### II. Technology Separation
- **Python** runs **only in GitHub Actions** — generation, solving, validation, difficulty scoring
- **JavaScript** runs **only in the browser** — rendering, interaction, optional client-side hints
- ❌ Python never runs in browser; JavaScript never generates/validates authoritatively

### III. Static-First Architecture
- GitHub Pages serves static files from `/site`
- Puzzles stored as versioned JSON in `/puzzles/<year>/`
- No external APIs, databases, or paid services
- Files over services; determinism over randomness

### IV. Test-Driven Validation
- Every puzzle passes automated tests before commit
- Solver and validator have dedicated test suites
- CI job fails if any validation constraint breaks

### V. Simplicity & Single Responsibility
- Prefer clarity over abstraction
- Every component has one job
- No framework-heavy frontends
- Avoid over-engineering

## Technology Boundaries

| Component | Environment | Purpose |
|-----------|-------------|---------|
| `generate.py` | GitHub Actions | Create daily puzzle |
| `solver.py` | GitHub Actions | Solve and verify uniqueness |
| `validator.py` | GitHub Actions | Enforce Sudoku rules |
| `difficulty.py` | GitHub Actions | Score puzzle difficulty |
| `app.js` | Browser | Render and interact |

## CI & Automation

- Runs daily via GitHub Actions cron
- Generates **four puzzles per day** (one per difficulty: easy, medium, hard, extreme)
- Commits only when all generation + validation succeed
- Runtime stays within GitHub free-tier limits
- Year and difficulty folders created automatically if missing

## Puzzle Contract (Stable Schema)

```json
{
  "date": "YYYY-MM-DD",
  "difficulty": "easy|medium|hard|extreme",
  "clueCount": 17-45,
  "grid": [[0-9 x9 rows]],
  "solution": [[1-9 x9 rows]]
}
```
- `0` = empty cell; `solution` is authoritative
- One JSON file per difficulty per day: `puzzles/<year>/<difficulty>/YYYY-MM-DD.json`
- Four puzzles generated daily (one per difficulty level)

## Governance

This constitution supersedes all other practices. Any change to core constraints requires:
1. Documentation of rationale
2. Update to this constitution
3. Migration plan for affected components

All code reviews must verify compliance with these principles.

**Version**: 1.0.0 | **Ratified**: 2026-01-11 | **Last Amended**: 2026-01-11
