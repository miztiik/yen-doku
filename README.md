# Yen-Doku 🧩

A delightful daily Sudoku puzzle game with a premium, Apple-inspired UI.

![Yen-Doku](https://img.shields.io/badge/Sudoku-Daily-7c3aed)
![Python](https://img.shields.io/badge/Python-3.11+-22c55e)
![Vibe Coded](https://img.shields.io/badge/Vibe-Coded%20✨-ff6b6b)
![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen)
![License](https://img.shields.io/badge/License-MIT-yellow)

> 🎨 **Vibe-coded with AI** — This project was built collaboratively with GitHub Copilot, embracing the joy of coding through conversation. PRs and contributions welcome!

## ✨ Features

### Core Gameplay
- 🎲 **Daily Puzzles** — Fresh puzzles generated every day at midnight UTC
- 🎯 **4 Difficulty Levels** — Easy, Medium, Hard, Extreme
- ✅ **Guaranteed Unique Solutions** — Every puzzle has exactly one solution
- 📅 **Calendar Picker** — Play any past puzzle

### Premium UX
- 🎉 **Victory Celebration** — Confetti, staggered cell animations & modal on completion
- ✏️ **Notes Mode** — Pencil marks for advanced solving
- 🔍 **Smart Highlighting** — Related cells, conflicts, and same-number highlighting
- 💡 **Hints** — Reveal a correct cell when stuck
- ✓ **Check Progress** — Validate entries without revealing answers

### Design
- 🌓 **Dark/Light Themes** — System-aware with manual toggle
- 📱 **Fully Responsive** — Mobile-first, touch-friendly
- ⌨️ **Keyboard Navigation** — Arrow keys, number input, shortcuts
- ♿ **Accessible** — ARIA labels, focus states, semantic HTML
- 🎨 **Apple HIG Inspired** — Clean typography, subtle gradients, smooth animations

## Live Demo

Visit: **[miztiik.github.io/yen-doku](https://miztiik.github.io/yen-doku/)**

## How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  GitHub Actions │────▶│  puzzles/*.json │────▶│  GitHub Pages   │
│  (Daily @ UTC)  │     │  (4 per day)    │     │  (Static Site)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

1. **Generation**: Python scripts create puzzles with guaranteed unique solutions
2. **Storage**: Puzzles saved as JSON in `puzzles/<year>/<difficulty>/YYYY-MM-DD.json`
3. **Serving**: Static site fetches and renders puzzles client-side

## Difficulty Levels

| Level | Clues | Description |
|-------|-------|-------------|
| Easy | 40-45 | Great for beginners |
| Medium | 32-39 | Moderate challenge |
| Hard | 26-31 | Requires advanced techniques |
| Extreme | 17-25 | For Sudoku masters |

## Local Development

### Prerequisites

- Python 3.11+
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/miztiik/yen-doku.git
cd yen-doku

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run tests
python -m pytest tests/ -v
```

### Generate Puzzles

```bash
# Generate all 4 difficulties for today
python scripts/generate.py

# Generate for a specific date
python scripts/generate.py 2026-01-15

# Generate only extreme difficulty
python scripts/generate.py 2026-01-15 --difficulty extreme

# Skip existing puzzles
python scripts/generate.py --skip-existing
```

### Run Local Server

```bash
python -m http.server 8080
# Open http://localhost:8080/docs/
```

## Project Structure

```
yen-doku/
├── .github/workflows/
│   ├── daily-generate.yml  # Daily puzzle generation (00:05 UTC)
│   └── deploy-pages.yml    # GitHub Pages deployment
│
├── docs/                    # ← GitHub Pages root
│   ├── index.html          # Main page
│   ├── style.css           # Styling (1100+ lines)
│   ├── app.js              # Client logic (750+ lines)
│   ├── sw.js               # Service Worker (offline support)
│   └── puzzles/            # Puzzle JSON files
│       └── 2026/
│           ├── easy/
│           ├── medium/
│           ├── hard/
│           ├── extreme/
│           └── index.json  # Yearly puzzle index
│
├── scripts/
│   ├── generate.py         # Puzzle generator CLI
│   ├── solver.py           # Backtracking solver
│   ├── validator.py        # Grid validation
│   └── difficulty.py       # Difficulty scoring
│
├── tests/
│   ├── test_solver.py
│   ├── test_validator.py
│   ├── test_difficulty.py
│   └── test_generate.py
│
├── objective.md            # System design spec
├── requirements.txt
└── README.md
```

## Puzzle JSON Schema

```json
{
  "date": "2026-01-11",
  "difficulty": "extreme",
  "clueCount": 24,
  "grid": [[7, 0, 0, ...], ...],
  "solution": [[7, 3, 8, ...], ...]
}
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1-9` | Enter number |
| `0` / `Backspace` | Clear cell |
| `↑↓←→` | Navigate cells |
| `N` | Toggle notes mode |

## Contributing

Contributions are **warmly welcome**! This project was vibe-coded and thrives on community input.

```bash
# Fork → Clone → Branch → Code → PR
git checkout -b feature/your-idea
```

**Ideas welcome:**
- 🎨 UI/UX improvements
- 🧩 New puzzle variants
- ⚡ Performance optimizations
- 📱 PWA enhancements
- 🌍 Internationalization

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla HTML/CSS/JS (no frameworks!) |
| Backend | Python 3.11 (GitHub Actions only) |
| Hosting | GitHub Pages (free tier) |
| CI/CD | GitHub Actions |
| Fonts | Nunito, Outfit, Josefin Sans |

## License

MIT License — see [LICENSE](LICENSE) for details.

## Credits

Built with ❤️ and AI:
- 🤖 [GitHub Copilot](https://github.com/features/copilot) — Vibe coding partner
- 🧩 [py-sudoku](https://github.com/jeffsieu/py-sudoku) — Initial grid generation
- 🎨 [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/) — Design inspiration

---

<p align="center">
  <strong>Made with 🎯 focus and ✨ vibes</strong><br>
  <a href="https://miztiik.github.io/yen-doku/">Play Now →</a>
</p>
