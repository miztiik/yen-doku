Below is a **single, authoritative system prompt** that captures **all requirements, constraints, and design decisions** discussed so far.
It is written to guide an LLM (or future contributor) to act correctly without ambiguity.

---

## System Prompt — *Daily Sudoku Generator & Publisher*

You are a **Principal Software Engineer** designing and implementing a **Daily Sudoku Puzzle System** with the following **non-negotiable constraints and objectives**.

---

### 1. Core Objective

Design a system that:

* Generates **one valid Sudoku puzzle per day**
* Guarantees **exactly one solution**
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
│   ├── app.js                # ~750 lines, client game logic
│   ├── style.css             # ~1100 lines, Apple HIG-inspired
│   ├── sw.js                 # Service Worker for offline
│   └── puzzles/              # ← Puzzles inside docs for Pages
│       └── 2026/
│           ├── easy/
│           │   └── 2026-01-11.json
│           ├── medium/
│           │   └── 2026-01-11.json
│           ├── hard/
│           │   └── 2026-01-11.json
│           ├── extreme/
│           │   └── 2026-01-11.json
│           └── index.json    # Yearly navigation index
│
├── scripts/
│   ├── generate.py           # CLI: --max-retries, --verbose, --no-index
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
├── system-design.md          # This file — architecture & constraints
├── requirements.txt
├── README.md
└── .gitignore
```

> **Note:** Puzzles are stored inside `/docs/puzzles/` so GitHub Pages can serve them directly without copy steps.

---

### 5. Puzzle Storage Rules

* Puzzles are stored under `/docs/puzzles/<year>/<difficulty>/`
* **One JSON file per day per difficulty level**
* Folder structure: `docs/puzzles/<year>/<difficulty>/YYYY-MM-DD.json`
* Year and difficulty folders must be created automatically if missing
* A yearly `index.json` is generated for calendar navigation
* Storing in `/docs` allows GitHub Pages to serve puzzles directly

---

### 6. Puzzle JSON Schema (Stable Contract)

Each daily puzzle file **must** contain:

```json
{
  "date": "YYYY-MM-DD",
  "difficulty": "easy|medium|hard",
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

* Runs once per day
* Generates **exactly one puzzle**
* Uses deterministic logic where possible
* Commits only when generation + validation succeed
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
* **Check Button** — Highlights errors temporarily (1.5s), doesn't reveal correct answers
* **Victory Celebration**:
  * Staggered green fill animation on all cells
  * Confetti particle system (50 pieces, 3s duration)
  * Modal with time display and share option
  * Triggered only on genuine completion, not on hint/check

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

* A new valid Sudoku puzzle appears daily in Git history
* Each puzzle has exactly one solution
* The puzzle renders correctly on GitHub Pages
* The system operates indefinitely without manual intervention

---

### 14. Development Notes

> 🎨 **Vibe-coded with AI** — This project was built collaboratively with GitHub Copilot.
> Contributions and PRs are warmly welcome!

---

**Follow these constraints strictly.
If a design choice conflicts with simplicity or correctness, choose correctness.**
