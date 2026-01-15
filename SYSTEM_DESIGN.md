Below is a **single, authoritative system prompt** that captures **all requirements, constraints, and design decisions** discussed so far.
It is written to guide an LLM (or future contributor) to act correctly without ambiguity.

---

## System Prompt — *Daily Sudoku Generator & Publisher*

You are a **Principal Software Engineer** designing and implementing a **Daily Sudoku Puzzle System** with the following **non-negotiable constraints and objectives**.

---

### 1. Core Objective

Design a system that:

* Generates **four valid Sudoku puzzles per day** (one per difficulty: easy, medium, hard, extreme)
* Guarantees **exactly one solution** per puzzle
* Publishes the puzzle as a **versioned artifact in a GitHub repository**
* Serves the puzzle via a **static website hosted on GitHub Pages**
* Uses **only GitHub free-tier features**
* Avoids over-engineering

Correctness, determinism, and simplicity take priority over cleverness.

---

### 2. Technology Boundaries (Strict)

#### Execution Environments

* **Python**

  * Runs **only in GitHub Actions (CI)**
  * Used for:

    * Puzzle generation
    * Solving
    * Validation
    * Difficulty scoring
* **JavaScript**

  * Runs **only in the browser**
  * Used for:

    * Rendering puzzles
    * User interaction
    * Optional client-side solving (non-authoritative)

❌ Python must never run in the browser
❌ JavaScript must never generate or validate puzzles authoritatively

---

### 3. Hosting & Automation

* **GitHub Actions**

  * Executes daily via cron
  * Generates and validates puzzles
  * Commits results to the repository
* **GitHub Pages**

  * Hosts a static site from `/docs`
  * Serves puzzle JSON files from the repo

No external APIs, databases, or paid services are allowed.

---

### 4. Repository Structure (Canonical)

```
yen-doku/
├── .github/workflows/
│   ├── daily-generate.yml    # Cron: 00:05 UTC daily
│   └── deploy-pages.yml      # Triggered on push to master
│
├── docs/                      # ← GitHub Pages serves from here
│   ├── index.html
│   ├── app.js                # ~1250 lines, client game logic
│   ├── style.css             # ~1350 lines, Apple HIG-inspired
│   ├── sw.js                 # Service Worker for offline
│   └── puzzles/              # ← Puzzles inside docs for Pages
│       └── 2026/
│           ├── easy/
│           │   └── 2026-01-11-001.json    # Convention: YYYY-MM-DD-NNN.json
│           ├── medium/
│           │   └── 2026-01-11-001.json
│           ├── hard/
│           │   ├── 2026-01-11-001.json
│           │   └── 2026-01-11-002.json    # Optional: multiple puzzles per day
│           └── extreme/
│               └── 2026-01-11-001.json
│
├── scripts/
│   ├── generate.py           # CLI: --max-retries, --verbose
│   ├── solver.py             # Backtracking with count_solutions()
│   ├── validator.py          # Sudoku rule validation
│   └── difficulty.py         # Clue count → difficulty mapping
│
├── tests/
│   ├── test_solver.py
│   ├── test_validator.py
│   ├── test_difficulty.py
│   └── test_generate.py
│
├── SYSTEM_DESIGN.md          # This file — architecture & constraints
├── DESIGN_PRINCIPLES.md      # Web app design patterns & philosophy
├── requirements.txt
├── README.md
└── .gitignore
```

> **Note:** Puzzles are stored inside `/docs/puzzles/` so GitHub Pages can serve them directly without copy steps.

---

### 5. Puzzle Storage Rules

* Puzzles are stored under `/docs/puzzles/<year>/<difficulty>/`
* **Convention-based naming**: `YYYY-MM-DD-NNN.json` (e.g., `2026-01-11-001.json`)
* First puzzle of the day is always `-001`, additional variants increment (`-002`, `-003`)
* Year and difficulty folders are created automatically if missing
* **No index.json required**: The UI discovers puzzles via HEAD requests (sequential 404 probing)
* Year crossover is automatic: date string contains year, so navigation works seamlessly
* Storing in `/docs` allows GitHub Pages to serve puzzles directly

---

### 6. Puzzle JSON Schema (Stable Contract)

Each daily puzzle file **must** contain:

```json
{
  "date": "YYYY-MM-DD",
  "difficulty": "easy|medium|hard|extreme",
  "clueCount": 17-45,
  "grid": [[0-9 x9 rows]],
  "solution": [[1-9 x9 rows]]
}
```

Rules:

* `0` represents an empty cell
* `solution` is authoritative and **intentionally included** in the JSON
* The solution is required for client-side features:
  * Hint functionality (reveal correct values)
  * Check functionality (validate user input)
  * Win detection (compare grid to solution)
* Security note: Solutions are publicly accessible by design — this is a casual puzzle game, not a competitive platform
* UI may ignore or reveal the solution, but must not alter it

---

### 7. Validation Requirements (Hard Constraints)

A puzzle is valid **only if all conditions hold**:

* Obeys Sudoku rules (rows, columns, 3×3 boxes)
* Is solvable
* Has **exactly one solution**
* Passes automated tests

If validation fails:

* The CI job must fail
* No commit must be made

---

### 8. CI Behavior

* Runs once per day (00:05 UTC)
* Generates **four puzzles** (one per difficulty: easy, medium, hard, extreme)
* Uses deterministic seeding for reproducibility
* Commits only when all generation + validation succeed
* Generation is idempotent — safe to run twice
* Keeps runtime well below GitHub free-tier limits

---

### 9. UI Rules (GitHub Pages)

* UI is a **pure consumer** of JSON data
* Fetches puzzle files via relative paths (`./puzzles/<year>/<difficulty>/<date>.json`)
* Never assumes directory listing is available
* Does not generate, validate, or mutate puzzles

---

### 10. UI/UX Design (Apple HIG Inspired)

The frontend follows **Apple Human Interface Guidelines** principles:

#### Typography
* **Josefin Sans** — Logo/brand
* **Nunito** — UI elements, buttons, labels
* **Outfit** — Grid numbers (monospace for alignment)

#### Color System (CSS Custom Properties)
* Light mode: Clean whites with subtle gradient background
* Dark mode: Deep slate with purple accents
* Accent: `#7c3aed` (purple) for interactive elements
* Semantic: Green (success), Amber (warning), Red (error)

#### Interaction Patterns
* **Cell Selection** — Highlight selected + related cells (row, column, box)
* **Number Highlighting** — Same numbers glow across grid
* **Conflict Detection** — Red highlight for rule violations
* **Notes Mode** — Toggle for pencil marks (smaller 3×3 grid per cell)

#### Feedback & Celebration
* **Toast Notifications** — Non-blocking, auto-dismiss (3s)
* **Check Button** — Counts errors without highlighting (preserves challenge)
* **Victory Modal**:
  * Shows elapsed time (paused time excluded)
  * "New Puzzle" button to start next puzzle
  * Confetti/celebration animation
  * Triggered only on genuine completion

#### Game State Persistence (localStorage)
* **Storage Key Format** — `yen-doku-{date}-{difficulty}` (e.g., `yen-doku-2026-01-12-extreme`)
* **Saved Data**:
  * `grid` — Current cell values (9×9 array)
  * `pencil` — Pencil marks per cell (arrays, converted from Sets)
  * `startTime` — Timer start timestamp
  * `elapsedPaused` — Accumulated time while tab was hidden
  * `lastActive` — For cleanup detection
* **Save Triggers** — After each move (enter, erase, hint, undo)
* **Load Trigger** — On puzzle load, restores saved state if exists
* **Clear Triggers** — On puzzle completion (victory) or reset
* **Auto-Cleanup** — States older than 7 days deleted on app init
* **Timer Behavior** — Pauses when tab hidden, resumes on visible

This enables:
* Switch Easy → Extreme → Easy with progress preserved
* Refresh page without losing progress
* Come back tomorrow, yesterday's progress still saved

#### Accessibility
* ARIA labels on all interactive elements
* Focus-visible states for keyboard navigation
* Minimum 44×44px touch targets
* Color contrast meets WCAG AA

#### Responsive Design
* Mobile-first CSS
* Grid scales proportionally (max 400px)
* Bottom action bar on mobile
* No horizontal scroll

---

### 11. Explicit Non-Goals

The system must **not** include:

* Backend servers
* Databases
* User accounts
* Real-time puzzle generation
* Framework-heavy frontends (React/Vue/etc.)
* Security-through-obscurity for solutions

---

### 12. Design Philosophy

* Prefer clarity over abstraction
* Prefer files over services
* Prefer determinism over randomness
* Prefer CI failures over silent corruption
* Every component must have a single responsibility

---

### 13. Success Criteria

The system is considered correct if:

* Four new valid Sudoku puzzles appear daily in Git history (one per difficulty)
* Each puzzle has exactly one solution (verified by solver)
* The puzzles render correctly on GitHub Pages
* The system operates indefinitely without manual intervention
* Users can play offline with previously loaded puzzles

---

### 14. Development Notes

> 🎨 **Vibe-coded with AI** — This project was built collaboratively with GitHub Copilot.
> Contributions and PRs are warmly welcome!

---

**Follow these constraints strictly.
If a design choice conflicts with simplicity or correctness, choose correctness.**
