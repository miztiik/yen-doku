# Yen-Doku Constitution
<!-- Daily Sudoku Generator & Publisher -->

<!--
=== Sync Impact Report ===
Version change: 1.1.0 → 1.2.0
Bump rationale: MINOR - Added 3 new principles (VI-VIII), expanded guidance, added UX/Storage contracts

Modified principles:
- Principle I: "Correctness First" → Added explicit rationale
- Principle II: "Technology Separation" → Reformatted for clarity
- Principle III: "Static-First Architecture" → Added file path detail
- Principle IV: "Test-Driven Validation" → Added manual script clause
- Principle V: "Simplicity & Single Responsibility" → Added no-framework list

Added sections:
- Principle VI: "Clarity Over Cleverness" (from DESIGN_PRINCIPLES.md §2)
- Principle VII: "Offline-First & User Respect" (from DESIGN_PRINCIPLES.md §7-8)
- Principle VIII: "Fail Fast, Fail Loud" (from DESIGN_PRINCIPLES.md §9)
- UX Contract section (from system-design.md §10)
- Storage Contract section (from system-design.md §10)
- Success Criteria section (from system-design.md §13)
- Explicit Non-Goals section (from system-design.md §4)
- Amendment Procedure with semver rules

Removed sections: None

Templates requiring updates:
- .specify/specs/core/spec.md: ⚠ pending review for NFR alignment
- .specify/templates/: ✅ no updates required

Follow-up TODOs: None
-->

## Core Principles

### I. Correctness First (NON-NEGOTIABLE)
Every puzzle **MUST** have exactly one solution. Validation failures block commits. CI failures over silent corruption. Correctness and determinism take priority over cleverness.

**Rationale**: Invalid puzzles destroy user trust. A single multi-solution puzzle invalidates the entire product premise.

### II. Technology Separation
- **Python** runs **only in GitHub Actions** — generation, solving, validation, difficulty scoring
- **JavaScript** runs **only in the browser** — rendering, interaction, client-side hints
- ❌ Python MUST never run in browser
- ❌ JavaScript MUST never generate or validate puzzles authoritatively

**Rationale**: Clear boundaries prevent accidental coupling and keep each environment focused on its strengths.

### III. Static-First Architecture
- GitHub Pages serves static files from `/docs`
- Puzzles stored as versioned JSON in `/docs/puzzles/<year>/<difficulty>/`
- No external APIs, databases, or paid services
- Files over services; determinism over randomness

**Rationale**: Static files scale infinitely at zero cost. No servers means no downtime.

### IV. Test-Driven Validation
- Every puzzle passes automated tests before commit
- Solver and validator have dedicated test suites
- CI job MUST fail if any validation constraint breaks
- Manual generation scripts MUST also run validation

**Rationale**: Untested code is broken code waiting to be discovered. Tests document expected behavior.

### V. Simplicity & Single Responsibility
- Prefer clarity over abstraction
- Every component has one job
- No framework-heavy frontends (React/Vue/Angular)
- Don't add abstraction until you feel the pain of not having it

**Rationale**: Premature abstraction is worse than duplication. Simple systems are maintainable systems.

### VI. Clarity Over Cleverness
- Write code that is obvious, not impressive
- Future contributors (or LLMs) need to understand it
- Descriptive names over abbreviated ones
- Comments explain "why", code explains "what"

**Rationale**: Debugging clever code takes 10x longer than writing it. Clever code becomes legacy code.

### VII. Offline-First & User Respect
- Assume the network is unavailable; cache aggressively
- Respect user preferences: dark mode, reduced motion, safe areas
- System settings are requirements, not suggestions
- Degrade gracefully when features are unavailable

**Rationale**: Users don't control their network. Accessibility preferences are not optional enhancements.

### VIII. Fail Fast, Fail Loud
- Errors MUST surface immediately with clear messages
- Silent failures corrupt data and waste debugging time
- Validate at boundaries: external data is untrusted
- Check data the moment it enters the system

**Rationale**: A loud failure today prevents a silent corruption tomorrow.

---

## Technology Boundaries

| Component | Environment | Purpose |
|-----------|-------------|---------|
| `generate.py` | GitHub Actions | Create daily puzzle with deterministic seeding |
| `solver.py` | GitHub Actions | Solve and verify uniqueness via backtracking |
| `validator.py` | GitHub Actions | Enforce Sudoku rules (rows, cols, boxes) |
| `difficulty.py` | GitHub Actions | Score puzzle difficulty by clue count |
| `app.js` | Browser | Render grid, handle input, manage game state |
| `sw.js` | Browser | Service Worker for offline support |
| `style.css` | Browser | Apple HIG-inspired design system |

---

## CI & Automation

- Runs daily via GitHub Actions cron (00:05 UTC)
- Generates **four puzzles per day** (one per difficulty: easy, medium, hard, extreme)
- Commits only when all generation + validation succeed
- Runtime stays within GitHub free-tier limits
- Year and difficulty folders created automatically if missing
- Generation MUST be idempotent — safe to run twice

---

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
- File naming: `YYYY-MM-DD-NNN.json` (NNN = variant, starting at 001)
- Path: `/docs/puzzles/<year>/<difficulty>/<filename>`
- Solution is intentionally public — this is a casual game, not competitive

---

## UX Contract (Browser)

### Visual Design (Apple HIG Inspired)
- Typography: Josefin Sans (logo), Nunito (UI), Outfit (numbers)
- Colors via CSS custom properties; dark mode via `prefers-color-scheme`
- Accent: `#7c3aed` (purple); semantic colors for success/warning/error

### Interaction Patterns
- Cell selection highlights row, column, and 3×3 box
- Conflict detection shows red highlight for rule violations
- Notes mode for pencil marks (3×3 sub-grid per cell)
- Toast notifications for non-blocking feedback (auto-dismiss)

### Accessibility
- ARIA labels on all interactive elements
- Focus-visible states for keyboard navigation
- Minimum 44×44px touch targets
- WCAG AA contrast compliance

---

## Storage Contract (Browser)

### localStorage Keys
- **Game state**: `yen-doku-{date}-{difficulty}` (e.g., `yen-doku-2026-01-15-extreme`)
- **Best times**: `yen-doku-best-{difficulty}`
- All keys MUST be prefixed with `yen-doku-`

### Saved Game Data
- `grid` — Current 9×9 cell values
- `pencil` — Pencil marks per cell (arrays from Sets)
- `startTime` — Timer start timestamp
- `history` — Undo stack (limited to 50 entries)

### Lifecycle
- Save: After each move (enter, erase, hint, undo)
- Load: On puzzle load, restore if exists
- Clear: On victory, reveal, or explicit reset
- Cleanup: Saves older than 7 days deleted on app init

---

## Success Criteria

The system is considered correct if:
1. A new valid Sudoku puzzle appears daily in Git history for each difficulty
2. Each puzzle has exactly one solution (verified by solver)
3. The puzzle renders correctly on GitHub Pages
4. The system operates indefinitely without manual intervention
5. Users can play offline with previously loaded puzzles

---

## Explicit Non-Goals

The system MUST NOT include:
- Backend servers or databases
- User accounts or authentication
- Real-time puzzle generation in browser
- Framework-heavy frontends (React/Vue/Angular)
- Paid services or external APIs
- Security-through-obscurity for solutions

---

## Governance

This constitution supersedes all other practices. Any change to core constraints requires:
1. Documentation of rationale
2. Update to this constitution
3. Migration plan for affected components
4. Version increment following semantic versioning

All code reviews MUST verify compliance with these principles.

### Amendment Procedure
- **MAJOR**: Backward-incompatible governance changes or principle removal
- **MINOR**: New principles, sections, or materially expanded guidance
- **PATCH**: Clarifications, typos, non-semantic refinements

---

**Version**: 1.2.0 | **Ratified**: 2026-01-11 | **Last Amended**: 2026-01-15
