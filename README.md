# Yen-Doku

A daily Sudoku puzzle game.

[![Daily Puzzle Generation](https://github.com/miztiik/yen-doku/actions/workflows/daily-generate.yml/badge.svg)](https://github.com/miztiik/yen-doku/actions/workflows/daily-generate.yml)

## Play

**[miztiik.github.io/yen-doku](https://miztiik.github.io/yen-doku/)**

## How It Works

Fresh puzzles are generated daily at midnight UTC with four difficulty levels. Each puzzle has exactly one solution.

| Level | Clues |
|-------|-------|
| Easy | 40-45 |
| Medium | 32-39 |
| Hard | 26-31 |
| Extreme | 17-25 |

## Local Development

```bash
git clone https://github.com/miztiik/yen-doku.git
cd yen-doku

python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Generate puzzles
python scripts/generate.py

# Run tests
python -m pytest tests/ -v

# Local server
python -m http.server 8080
# Open http://localhost:8080/site/
```

## Project Structure

```
yen-doku/
├── site/               # Frontend (HTML/CSS/JS)
├── scripts/            # Puzzle generation (Python)
├── puzzles/            # Generated puzzle JSON files
└── tests/              # Python and JS tests
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1-9` | Enter number |
| `0` / `Backspace` | Clear cell |
| `Arrow keys` | Navigate |
| `P` | Toggle pencil mode |
| `H` | Hint |
| `Ctrl+Z` | Undo |

---

<p align="center">
  <a href="https://miztiik.github.io/yen-doku/">Play Now</a>
</p>
