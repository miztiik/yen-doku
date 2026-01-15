"""
Gattai/Samurai Sudoku Module

Supports 5 puzzle modes:
- samurai: Classic 5-grid Samurai Sudoku (Gattai-5)
- twin-nw: 2-grid with NW overlap (Horizon)
- twin-ne: 2-grid with NE overlap (Sunrise)
- twin-sw: 2-grid with SW overlap (Sunset)
- twin-se: 2-grid with SE overlap (Eclipse)

Based on Peter Norvig's Sudoku solver with extensions for multi-grid puzzles.
Reference: http://norvig.com/sudoku.html
Adapted from: https://github.com/bryanlimy/samurai-sudoku-solver (MIT License)
"""

from .modes import MODES, GattaiMode
from .solver import (
    solve_samurai,
    count_solutions_samurai,
    is_solved_samurai,
    parse_samurai_grid,
)
from .generator import generate_gattai_puzzle
from .validator import validate_gattai_puzzle

__all__ = [
    "MODES",
    "GattaiMode",
    "solve_samurai",
    "count_solutions_samurai",
    "is_solved_samurai",
    "parse_samurai_grid",
    "generate_gattai_puzzle",
    "validate_gattai_puzzle",
]
