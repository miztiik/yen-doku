# Yen-Doku

A daily Sudoku puzzle game with four difficulty levels, keyboard navigation, and offline support.

[![Daily Puzzle Generation](https://github.com/miztiik/yen-doku/actions/workflows/daily-generate.yml/badge.svg)](https://github.com/miztiik/yen-doku/actions/workflows/daily-generate.yml)
[![CI](https://github.com/miztiik/yen-doku/actions/workflows/ci.yml/badge.svg)](https://github.com/miztiik/yen-doku/actions/workflows/ci.yml)

## Play

**[miztiik.github.io/yen-doku](https://miztiik.github.io/yen-doku/)**

## Features

- 🎯 **Daily Puzzles** — Fresh puzzles at midnight UTC
- 🧩 **Four Difficulty Levels** — Easy, Medium, Hard, Extreme
- ✏️ **Notes Mode** — Pencil in candidates
- 💡 **Smart Hints** — Get unstuck with a tap
- ✅ **Check Solution** — Validate your progress
- 👁️ **Reveal Solution** — See the answer when needed
- ⏱️ **Timer & Best Times** — Track your solving speed
- 📱 **Responsive Design** — Works on any device
- 🔌 **Offline Support** — Play previously loaded puzzles offline

## How It Works

Fresh puzzles are generated daily at midnight UTC with four difficulty levels. Each puzzle has exactly one solution, verified using backtracking.

| Level | Clues |
|-------|-------|
| Easy | 40-45 |
| Medium | 32-39 |
| Hard | 26-31 |
| Extreme | 17-25 |

See [docs/puzzles/README.md](docs/puzzles/README.md) for details on puzzle generation and verification.

## Local Development

```bash
git clone https://github.com/miztiik/yen-doku.git
cd yen-doku

python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Generate puzzles for today
python scripts/generate.py

# Run tests
python -m pytest tests/ -v

# Local server
python -m http.server 8080 -d docs
# Open http://localhost:8080
```

## Project Structure

```
yen-doku/
├── docs/                   # Frontend (GitHub Pages)
│   ├── index.html          # Main HTML
│   ├── app.js              # Game logic
│   ├── style.css           # Styles
│   ├── sw.js               # Service worker
│   └── puzzles/            # Generated puzzle JSONs
│       └── {year}/{difficulty}/YYYY-MM-DD.json
├── scripts/                # Puzzle generation (Python)
│   ├── generate.py         # Main generator
│   ├── solver.py           # Backtracking solver
│   ├── validator.py        # Unique solution check
│   └── difficulty.py       # Difficulty classification
├── tests/                  # Python and JS tests
└── .github/workflows/      # CI/CD automation
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1-9` | Enter number |
| `0` / `Backspace` / `Delete` | Clear cell |
| `Arrow keys` | Navigate grid |
| `N` | Toggle Notes Mode |
| `H` | Get hint |
| `C` | Check solution |
| `R` | Reveal solution |
| `D` | Change difficulty |
| `Z` / `Ctrl+Z` | Undo |
| `Escape` | Close modal |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Actions                          │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ daily-generate  │  │      ci.yml     │                   │
│  │     .yml        │  │  pytest + lint  │                   │
│  └────────┬────────┘  └─────────────────┘                   │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               scripts/generate.py                    │   │
│  │  py-sudoku → solver → validator → difficulty.py     │   │
│  └────────────────────────┬────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              docs/puzzles/{year}/                    │   │
│  │         {difficulty}/YYYY-MM-DD.json                │   │
│  └────────────────────────┬────────────────────────────┘   │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Pages                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    docs/                             │   │
│  │  index.html → app.js → localStorage (state)         │   │
│  │       ↓                                              │   │
│  │    sw.js (offline cache)                            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`python -m pytest tests/ -v`)
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- **Python**: Follow PEP 8, use type hints
- **JavaScript**: ES6+ modules, no external dependencies
- **CSS**: Use CSS custom properties for theming

---

<p align="center">
  <a href="https://miztiik.github.io/yen-doku/">Play Now</a>
</p>
