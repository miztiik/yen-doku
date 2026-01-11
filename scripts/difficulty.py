"""Difficulty scoring based on clue count."""

from enum import Enum


class Difficulty(Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXTREME = "extreme"


def count_clues(grid: list[list[int]]) -> int:
    """Count non-zero cells in grid."""
    return sum(1 for row in grid for cell in row if cell != 0)


def score_difficulty(grid: list[list[int]]) -> Difficulty:
    """
    Determine difficulty based on clue count.

    - easy: 40+ clues
    - medium: 32-39 clues
    - hard: 26-31 clues
    - extreme: 17-25 clues
    """
    clues = count_clues(grid)
    if clues >= 40:
        return Difficulty.EASY
    elif clues >= 32:
        return Difficulty.MEDIUM
    elif clues >= 26:
        return Difficulty.HARD
    else:
        return Difficulty.EXTREME


def get_clue_range(difficulty: Difficulty) -> tuple[int, int]:
    """Get the (min, max) clue count for a difficulty level."""
    ranges = {
        Difficulty.EASY: (40, 45),
        Difficulty.MEDIUM: (32, 39),
        Difficulty.HARD: (26, 31),
        Difficulty.EXTREME: (17, 25),
    }
    return ranges[difficulty]
