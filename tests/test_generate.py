"""Tests for generate module."""

import pytest
import json
import sys
import os
from pathlib import Path
import tempfile
import shutil

# Add scripts to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

from generate import generate_puzzle, save_puzzle, _date_difficulty_seed
from difficulty import Difficulty
from validator import is_valid_grid, is_complete, validate_solution
from solver import count_solutions


class TestDateDifficultySeed:
    def test_same_input_same_seed(self):
        """Same date+difficulty produces same seed."""
        seed1 = _date_difficulty_seed("2026-01-11", Difficulty.EXTREME)
        seed2 = _date_difficulty_seed("2026-01-11", Difficulty.EXTREME)
        assert seed1 == seed2

    def test_different_date_different_seed(self):
        """Different dates produce different seeds."""
        seed1 = _date_difficulty_seed("2026-01-11", Difficulty.EXTREME)
        seed2 = _date_difficulty_seed("2026-01-12", Difficulty.EXTREME)
        assert seed1 != seed2

    def test_different_difficulty_different_seed(self):
        """Different difficulties produce different seeds."""
        seed1 = _date_difficulty_seed("2026-01-11", Difficulty.EASY)
        seed2 = _date_difficulty_seed("2026-01-11", Difficulty.EXTREME)
        assert seed1 != seed2


class TestGeneratePuzzle:
    def test_generates_valid_puzzle(self):
        """Generated puzzle is valid and has unique solution."""
        puzzle = generate_puzzle("2026-01-11", Difficulty.MEDIUM)

        assert puzzle is not None
        assert puzzle["date"] == "2026-01-11"
        assert puzzle["difficulty"] == "medium"
        assert is_valid_grid(puzzle["grid"])
        assert is_complete(puzzle["solution"])
        assert validate_solution(puzzle["grid"], puzzle["solution"])

    def test_deterministic_generation(self):
        """Same date+difficulty produces same puzzle."""
        puzzle1 = generate_puzzle("2026-01-11", Difficulty.HARD)
        puzzle2 = generate_puzzle("2026-01-11", Difficulty.HARD)

        assert puzzle1 is not None
        assert puzzle2 is not None
        assert puzzle1["grid"] == puzzle2["grid"]
        assert puzzle1["solution"] == puzzle2["solution"]

    def test_unique_solution(self):
        """Generated puzzle has exactly one solution."""
        puzzle = generate_puzzle("2026-01-11", Difficulty.EASY)

        assert puzzle is not None
        assert count_solutions(puzzle["grid"]) == 1

    def test_clue_count_in_schema(self):
        """Puzzle includes clueCount field."""
        puzzle = generate_puzzle("2026-01-11", Difficulty.EXTREME)

        assert puzzle is not None
        assert "clueCount" in puzzle
        assert isinstance(puzzle["clueCount"], int)
        assert 17 <= puzzle["clueCount"] <= 25  # extreme range

    def test_all_difficulties_have_unique_solution(self):
        """CRITICAL: Every difficulty level MUST produce puzzles with exactly one solution.
        
        Note: This is a smoke test. The generator already guarantees uniqueness
        during generation via count_solutions() check after each clue removal.
        This test verifies the algorithm is working correctly.
        """
        date = "2026-01-15"  # Use different date to avoid cache
        
        for difficulty in Difficulty:
            puzzle = generate_puzzle(date, difficulty)
            
            assert puzzle is not None, f"{difficulty.value} puzzle generation failed"
            
            # THE CRITICAL CHECK: Must have exactly 1 solution
            solutions = count_solutions(puzzle["grid"], max_count=2)
            assert solutions == 1, (
                f"{difficulty.value} puzzle has {solutions} solutions - "
                f"MUST be exactly 1 for valid Sudoku"
            )
            
            # Verify solution matches what solver finds
            from solver import solve
            solved = solve(puzzle["grid"])
            assert solved == puzzle["solution"], (
                f"{difficulty.value} puzzle stored solution doesn't match solver output"
            )


class TestSavePuzzle:
    def test_saves_to_correct_path(self):
        """Puzzle is saved to puzzles/<year>/<difficulty>/YYYY-MM-DD.json."""
        puzzle = {
            "date": "2026-01-11",
            "difficulty": "extreme",
            "clueCount": 22,
            "grid": [[0] * 9 for _ in range(9)],
            "solution": [[1] * 9 for _ in range(9)],
        }

        with tempfile.TemporaryDirectory() as tmpdir:
            saved_path = save_puzzle(puzzle, tmpdir)

            expected_path = Path(tmpdir) / "2026" / "extreme" / "2026-01-11.json"
            assert Path(saved_path) == expected_path
            assert expected_path.exists()

            # Verify content
            with open(expected_path) as f:
                loaded = json.load(f)
            assert loaded["date"] == "2026-01-11"
            assert loaded["difficulty"] == "extreme"
            assert loaded["clueCount"] == 22
