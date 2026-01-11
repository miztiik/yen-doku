"""Tests for difficulty module."""

import pytest
import sys
import os

# Add scripts to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

from difficulty import Difficulty, count_clues, score_difficulty, get_clue_range


class TestCountClues:
    def test_empty_grid(self):
        """Empty grid has 0 clues."""
        grid = [[0] * 9 for _ in range(9)]
        assert count_clues(grid) == 0

    def test_full_grid(self):
        """Fully filled grid has 81 clues."""
        grid = [[1] * 9 for _ in range(9)]
        assert count_clues(grid) == 81

    def test_partial_grid(self):
        """Partial grid counts correctly."""
        grid = [[0] * 9 for _ in range(9)]
        grid[0][0] = 1
        grid[4][4] = 5
        grid[8][8] = 9
        assert count_clues(grid) == 3


class TestScoreDifficulty:
    def test_easy_40_clues(self):
        """40+ clues is easy."""
        grid = [[0] * 9 for _ in range(9)]
        # Set 40 clues
        for i in range(40):
            grid[i // 9][i % 9] = 1
        assert score_difficulty(grid) == Difficulty.EASY

    def test_medium_35_clues(self):
        """32-39 clues is medium."""
        grid = [[0] * 9 for _ in range(9)]
        for i in range(35):
            grid[i // 9][i % 9] = 1
        assert score_difficulty(grid) == Difficulty.MEDIUM

    def test_hard_28_clues(self):
        """26-31 clues is hard."""
        grid = [[0] * 9 for _ in range(9)]
        for i in range(28):
            grid[i // 9][i % 9] = 1
        assert score_difficulty(grid) == Difficulty.HARD

    def test_extreme_20_clues(self):
        """17-25 clues is extreme."""
        grid = [[0] * 9 for _ in range(9)]
        for i in range(20):
            grid[i // 9][i % 9] = 1
        assert score_difficulty(grid) == Difficulty.EXTREME


class TestGetClueRange:
    def test_easy_range(self):
        assert get_clue_range(Difficulty.EASY) == (40, 45)

    def test_medium_range(self):
        assert get_clue_range(Difficulty.MEDIUM) == (32, 39)

    def test_hard_range(self):
        assert get_clue_range(Difficulty.HARD) == (26, 31)

    def test_extreme_range(self):
        assert get_clue_range(Difficulty.EXTREME) == (17, 25)

    def test_all_ranges_contiguous(self):
        """Ranges should be contiguous without gaps."""
        ranges = [
            get_clue_range(Difficulty.EXTREME),  # 17-25
            get_clue_range(Difficulty.HARD),     # 26-31
            get_clue_range(Difficulty.MEDIUM),   # 32-39
            get_clue_range(Difficulty.EASY),     # 40-45
        ]
        
        # Each range's max + 1 should equal next range's min
        for i in range(len(ranges) - 1):
            assert ranges[i][1] + 1 == ranges[i + 1][0], \
                f"Gap between {ranges[i]} and {ranges[i + 1]}"

    def test_minimum_is_17(self):
        """Minimum possible clues for valid Sudoku is 17."""
        min_extreme, _ = get_clue_range(Difficulty.EXTREME)
        assert min_extreme == 17, "EXTREME min must be 17 (proven minimum for unique solution)"


class TestBoundaryConditions:
    """Test boundary conditions between difficulty levels."""

    def test_39_clues_is_medium(self):
        """39 clues (boundary) should be MEDIUM."""
        grid = [[0] * 9 for _ in range(9)]
        for i in range(39):
            grid[i // 9][i % 9] = 1
        assert score_difficulty(grid) == Difficulty.MEDIUM

    def test_40_clues_is_easy(self):
        """40 clues (boundary) should be EASY."""
        grid = [[0] * 9 for _ in range(9)]
        for i in range(40):
            grid[i // 9][i % 9] = 1
        assert score_difficulty(grid) == Difficulty.EASY

    def test_31_clues_is_hard(self):
        """31 clues (boundary) should be HARD."""
        grid = [[0] * 9 for _ in range(9)]
        for i in range(31):
            grid[i // 9][i % 9] = 1
        assert score_difficulty(grid) == Difficulty.HARD

    def test_32_clues_is_medium(self):
        """32 clues (boundary) should be MEDIUM."""
        grid = [[0] * 9 for _ in range(9)]
        for i in range(32):
            grid[i // 9][i % 9] = 1
        assert score_difficulty(grid) == Difficulty.MEDIUM

    def test_25_clues_is_extreme(self):
        """25 clues (boundary) should be EXTREME."""
        grid = [[0] * 9 for _ in range(9)]
        for i in range(25):
            grid[i // 9][i % 9] = 1
        assert score_difficulty(grid) == Difficulty.EXTREME

    def test_26_clues_is_hard(self):
        """26 clues (boundary) should be HARD."""
        grid = [[0] * 9 for _ in range(9)]
        for i in range(26):
            grid[i // 9][i % 9] = 1
        assert score_difficulty(grid) == Difficulty.HARD
