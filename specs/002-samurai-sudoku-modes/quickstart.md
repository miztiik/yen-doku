# Quickstart: Samurai Sudoku Multi-Grid Modes

**Feature**: 002-samurai-sudoku-modes  
**Date**: 2026-01-15

---

## Prerequisites

- Python 3.11+ with existing yen-doku dependencies
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+)
- Existing yen-doku repository setup

---

## 1. Generate a Gattai Puzzle (Python)

### Install Dependencies

```bash
# No new dependencies required - uses existing py-sudoku
pip install -r requirements.txt
```

### Generate Twin Puzzle

```bash
# Generate a "Horizon" (twin-nw) puzzle for today
python scripts/generate_gattai.py --mode twin-nw --difficulty medium

# Output: docs/puzzles/2026/gattai/twin-nw/medium/2026-01-15-001.json
```

### Generate Samurai Puzzle

```bash
# Generate classic 5-grid Samurai puzzle
python scripts/generate_gattai.py --mode samurai --difficulty hard --verbose

# Output: docs/puzzles/2026/gattai/samurai/hard/2026-01-15-001.json
```

---

## 2. Validate a Gattai Puzzle

```bash
# Validate puzzle has exactly one solution
python scripts/validate_gattai.py docs/puzzles/2026/gattai/samurai/hard/2026-01-15-001.json

# Expected output:
# ✓ All grids valid
# ✓ Overlaps consistent
# ✓ Unique solution verified
# ✓ Clue count: 127 (hard range: 114-132)
```

---

## 3. View in Browser

### Local Development

```bash
# Serve docs folder locally
cd docs
python -m http.server 8000

# Open in browser
# http://localhost:8000/gattai.html
```

### URL Parameters

```
# Load specific mode and difficulty
gattai.html?mode=samurai&difficulty=hard

# Load specific date
gattai.html?mode=twin-nw&date=2026-01-15

# Debug mode (show solution overlay)
gattai.html?mode=samurai&debug=true
```

---

## 4. Run Tests

### Python Tests

```bash
# Test Gattai generator
pytest tests/test_gattai_generator.py -v

# Test composite solver
pytest tests/test_gattai_solver.py -v

# Test all Gattai functionality
pytest tests/test_gattai*.py -v
```

### Browser Tests

```bash
# Run JavaScript tests (requires Node.js)
npm test -- --grep "gattai"
```

---

## 5. Puzzle File Structure

```
docs/puzzles/2026/gattai/
├── samurai/
│   ├── easy/
│   │   └── 2026-01-15-001.json
│   ├── medium/
│   ├── hard/
│   └── extreme/
├── twin-nw/     # Horizon
├── twin-ne/     # Sunrise
├── twin-sw/     # Sunset
└── twin-se/     # Eclipse
```

---

## 6. Example Puzzle JSON

### Twin (2-grid) Example

```json
{
  "date": "2026-01-15",
  "mode": "twin-nw",
  "difficulty": "medium",
  "clueCount": 62,
  "version": "1.0",
  "grids": {
    "primary": {
      "grid": [[5,3,0,0,7,0,0,0,0], ...],
      "solution": [[5,3,4,6,7,8,9,1,2], ...]
    },
    "secondary": {
      "grid": [[0,0,0,0,0,0,0,6,8], ...],
      "solution": [[4,1,2,9,5,3,7,6,8], ...]
    }
  }
}
```

### Samurai (5-grid) Example

```json
{
  "date": "2026-01-15",
  "mode": "samurai",
  "difficulty": "hard",
  "clueCount": 127,
  "version": "1.0",
  "grids": {
    "center": { "grid": [...], "solution": [...] },
    "nw": { "grid": [...], "solution": [...] },
    "ne": { "grid": [...], "solution": [...] },
    "sw": { "grid": [...], "solution": [...] },
    "se": { "grid": [...], "solution": [...] }
  }
}
```

---

## 7. Mode Reference

| Mode ID | Display Name | Description |
|---------|--------------|-------------|
| `samurai` | Samurai | Classic 5-grid cross pattern |
| `twin-nw` | Horizon | 2 grids, NW overlap |
| `twin-ne` | Sunrise | 2 grids, NE overlap |
| `twin-sw` | Sunset | 2 grids, SW overlap |
| `twin-se` | Eclipse | 2 grids, SE overlap |

---

## 8. Keyboard Shortcuts (Browser)

| Key | Action |
|-----|--------|
| `1-9` | Enter digit |
| `0` or `Delete` | Clear cell |
| `P` | Toggle pencil mode |
| `Arrow keys` | Navigate cells |
| `Tab` | Switch between grids |
| `Ctrl+Z` | Undo |
| `H` | Get hint |

---

## 9. Troubleshooting

### Generation Takes Too Long

```bash
# Use verbose mode to see progress
python scripts/generate_gattai.py --mode samurai --verbose

# Increase timeout for CI
python scripts/generate_gattai.py --mode samurai --max-retries 20
```

### Puzzle Has Multiple Solutions

This indicates a bug in the generator. Check:
1. Overlapping boxes are correctly constrained
2. Clue removal maintains uniqueness
3. Run `validate_gattai.py` to diagnose

### Browser Shows Blank Grid

1. Check browser console for errors
2. Verify puzzle JSON exists at expected path
3. Ensure mode parameter matches available modes

---

## 10. Next Steps

1. **Implement `scripts/gattai/` module** - Core generation logic
2. **Create `docs/gattai.html`** - New page layout
3. **Add CI workflow** - Daily Gattai generation
4. **Navigation** - Link from home page (separate spec)
