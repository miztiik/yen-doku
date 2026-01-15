# yen-doku Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-01-15

## Active Technologies
- Static JSON files in `/docs/puzzles/<year>/gattai/` (002-samurai-sudoku-modes)
- Python 3.11 (generation/CI), JavaScript ES6 (browser) + pytest (testing), no new runtime deps (002-samurai-sudoku-modes)
- JSON files in `/docs/puzzles/<year>/gattai/<mode>/<difficulty>/` (002-samurai-sudoku-modes)
- Python 3.14.2 (GitHub Actions), JavaScript ES6 (Browser) + None (custom implementation, no external solver libraries) (002-samurai-sudoku-modes)
- Static JSON files in `/docs/puzzles/<year>/gattai/<mode>/<difficulty>/` (002-samurai-sudoku-modes)

- Python 3.11 (generation), JavaScript ES6 (browser) + py-sudoku (existing), no new deps planned (002-samurai-sudoku-modes)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

cd src [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] pytest [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] ruff check .

## Code Style

Python 3.11 (generation), JavaScript ES6 (browser): Follow standard conventions

## Recent Changes
- 002-samurai-sudoku-modes: Added Python 3.14.2 (GitHub Actions), JavaScript ES6 (Browser) + None (custom implementation, no external solver libraries)
- 002-samurai-sudoku-modes: Added Python 3.11 (generation/CI), JavaScript ES6 (browser) + pytest (testing), no new runtime deps
- 002-samurai-sudoku-modes: Added Python 3.11 (generation), JavaScript ES6 (browser) + py-sudoku (existing), no new deps planned


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
