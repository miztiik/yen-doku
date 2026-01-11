Yen-Dokuasdf

A daily Sudoku puzzle generator and interactive web player.

![Yen-Doku](https://img.shields.io/badge/Sudoku-Daily-blue)
![Python](https://img.shields.io/badge/Python-3.11+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Features

- 🎲 **Daily Puzzles**: New puzzles generated automatically every day at midnight UTC
- 🎯 **4 Difficulty Levels**: Easy, Medium, Hard, Extreme
- ✅ **Guaranteed Unique Solutions**: Every puzzle has exactly one solution
- 📱 **Mobile Friendly**: Touch-friendly interface with responsive design
- ⌨️ **Keyboard Support**: Navigate with arrows, enter numbers 1-9
- ✏️ **Notes Mode**: Pencil marks for advanced solving techniques
- 🔍 **Conflict Highlighting**: See duplicates in rows, columns, and boxes
- ✨ **Modern UI**: Clean, intuitive design

## Live Demo

Visit: **[miztiik.github.io/yen-doku](https://miztiik.github.io/yen-doku/site/)**

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
# Open http://localhost:8080/site/
```

## Project Structure

```
yen-doku/
├── .github/workflows/
│   ├── daily-generate.yml  # Daily puzzle generation
│   └── ci.yml              # Test on push/PR
├── puzzles/
│   └── 2026/
│       ├── easy/
│       ├── medium/
│       ├── hard/
│       └── extreme/
├── scripts/
│   ├── solver.py           # Backtracking solver
│   ├── validator.py        # Grid validation
│   ├── difficulty.py       # Difficulty scoring
│   └── generate.py         # Puzzle generator CLI
├── site/
│   ├── index.html          # Main page
│   ├── style.css           # Styling
│   └── app.js              # Client-side logic
├── tests/
│   ├── test_solver.py
│   ├── test_validator.py
│   ├── test_difficulty.py
│   └── test_generate.py
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

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

Built with ❤️ using:
- [py-sudoku](https://github.com/jeffsieu/py-sudoku) for initial grid generation
- Custom backtracking solver for unique solution guarantee
