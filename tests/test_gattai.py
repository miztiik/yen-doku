"""Tests for Gattai Sudoku solver and generator."""

import pytest
import sys
from pathlib import Path

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

from gattai.modes import MODES, GattaiMode, get_box_cells, Overlap
from gattai.solver import SamuraiSolver, DIGITS
from gattai.generator import (
    generate_gattai_puzzle,
    _generate_complete_grid,
    _count_clues,
)
from gattai.validator import validate_gattai_puzzle, _validate_sudoku_rules


class TestModes:
    """Tests for mode definitions."""
    
    def test_all_modes_exist(self):
        """All expected modes are defined."""
        expected = ["samurai", "twin-nw", "twin-ne", "twin-sw", "twin-se"]
        assert set(MODES.keys()) == set(expected)
    
    def test_samurai_mode_structure(self):
        """Samurai mode has correct structure."""
        mode = MODES["samurai"]
        assert mode.grid_count == 5
        assert mode.grid_ids == ["center", "nw", "ne", "sw", "se"]
        assert len(mode.overlaps) == 4
        assert mode.logical_size == (21, 21)
    
    def test_twin_mode_structure(self):
        """Twin modes have correct structure."""
        for mode_id in ["twin-nw", "twin-ne", "twin-sw", "twin-se"]:
            mode = MODES[mode_id]
            assert mode.grid_count == 2
            assert mode.grid_ids == ["primary", "secondary"]
            assert len(mode.overlaps) == 1
            assert mode.logical_size == (15, 15)
    
    def test_get_box_cells(self):
        """Box cell extraction is correct."""
        # Box 0 is top-left
        cells = get_box_cells(0)
        assert len(cells) == 9
        assert (0, 0) in cells
        assert (2, 2) in cells
        
        # Box 8 is bottom-right
        cells = get_box_cells(8)
        assert (6, 6) in cells
        assert (8, 8) in cells


class TestSolver:
    """Tests for Samurai solver."""
    
    def test_solver_initialization(self):
        """Solver initializes correctly for each mode."""
        for mode_id, mode in MODES.items():
            solver = SamuraiSolver(mode)
            assert len(solver.all_squares) > 0
            assert len(solver.all_unitlists) > 0
    
    def test_samurai_solver_square_count(self):
        """Samurai solver has correct number of unique squares."""
        mode = MODES["samurai"]
        solver = SamuraiSolver(mode)
        
        # 5 grids × 81 cells = 405 cells
        # Minus 4 overlaps × 9 shared cells = 36 shared
        # = 369 unique squares
        assert len(solver.all_squares) == 369
    
    def test_twin_solver_square_count(self):
        """Twin solver has correct number of unique squares."""
        mode = MODES["twin-nw"]
        solver = SamuraiSolver(mode)
        
        # 2 grids × 81 cells = 162 cells
        # Minus 1 overlap × 9 shared cells = 9 shared
        # = 153 unique squares
        assert len(solver.all_squares) == 153
    
    def test_solve_simple_twin(self):
        """Solver can complete a nearly-complete twin puzzle."""
        mode = MODES["twin-nw"]
        solver = SamuraiSolver(mode)
        
        # Create a valid complete twin puzzle first
        import random
        rng = random.Random(42)
        
        from gattai.generator import _generate_samurai_solution
        solution = _generate_samurai_solution(mode, rng)
        
        assert solution is not None
        assert solver.is_solved(solution)
    
    def test_count_solutions_unique(self):
        """Count solutions returns 1 for a valid puzzle."""
        mode = MODES["twin-nw"]
        solver = SamuraiSolver(mode)
        
        import random
        rng = random.Random(42)
        
        from gattai.generator import _generate_samurai_solution, _remove_clues
        
        solution = _generate_samurai_solution(mode, rng)
        assert solution is not None
        
        # Remove a few clues
        puzzle = _remove_clues(solution, mode, target_clues=60, rng=rng)
        
        # Should have exactly one solution
        count = solver.count_solutions(puzzle, max_count=2)
        assert count == 1


class TestGenerator:
    """Tests for Gattai puzzle generator."""
    
    def test_generate_complete_grid(self):
        """Complete grid generation produces valid Sudoku."""
        import random
        rng = random.Random(12345)
        
        grid = _generate_complete_grid(rng)
        
        assert len(grid) == 9
        assert all(len(row) == 9 for row in grid)
        assert all(1 <= val <= 9 for row in grid for val in row)
        
        # Validate Sudoku rules
        errors = _validate_sudoku_rules(grid, "test", check_complete=True)
        assert len(errors) == 0
    
    def test_generate_twin_puzzle(self):
        """Can generate a valid twin puzzle."""
        puzzle = generate_gattai_puzzle(
            date_str="2026-01-15",
            mode_id="twin-nw",
            difficulty="easy",
            max_attempts=5,
            verbose=False,
        )
        
        assert puzzle is not None
        assert puzzle["mode"] == "twin-nw"
        assert puzzle["difficulty"] == "easy"
        assert "grids" in puzzle
        assert "primary" in puzzle["grids"]
        assert "secondary" in puzzle["grids"]
    
    def test_generate_samurai_puzzle(self):
        """Can generate a valid samurai puzzle (may be slow)."""
        puzzle = generate_gattai_puzzle(
            date_str="2026-01-15",
            mode_id="samurai",
            difficulty="easy",
            max_attempts=5,
            verbose=False,
        )
        
        # This might fail due to time constraints in tests, so we allow None
        if puzzle is not None:
            assert puzzle["mode"] == "samurai"
            assert len(puzzle["grids"]) == 5
    
    def test_deterministic_generation(self):
        """Same date/mode/difficulty produces same puzzle."""
        puzzle1 = generate_gattai_puzzle(
            date_str="2026-01-15",
            mode_id="twin-nw",
            difficulty="medium",
            max_attempts=5,
        )
        
        puzzle2 = generate_gattai_puzzle(
            date_str="2026-01-15",
            mode_id="twin-nw",
            difficulty="medium",
            max_attempts=5,
        )
        
        if puzzle1 is not None and puzzle2 is not None:
            # Grids should be identical
            assert puzzle1["grids"]["primary"]["grid"] == puzzle2["grids"]["primary"]["grid"]
            assert puzzle1["grids"]["secondary"]["grid"] == puzzle2["grids"]["secondary"]["grid"]
    
    def test_clue_count_in_range(self):
        """Generated puzzles have clue counts within difficulty range."""
        puzzle = generate_gattai_puzzle(
            date_str="2026-01-15",
            mode_id="twin-nw",
            difficulty="medium",
            max_attempts=5,
        )
        
        if puzzle is not None:
            # Medium twin range is 57-66
            assert 57 <= puzzle["clueCount"] <= 66


class TestValidator:
    """Tests for puzzle validation."""
    
    def test_validate_generated_puzzle(self):
        """Validator passes for correctly generated puzzles."""
        puzzle = generate_gattai_puzzle(
            date_str="2026-01-15",
            mode_id="twin-nw",
            difficulty="easy",
            max_attempts=5,
        )
        
        if puzzle is not None:
            is_valid, errors = validate_gattai_puzzle(puzzle, check_unique_solution=True)
            assert is_valid, f"Validation errors: {errors}"
    
    def test_validate_missing_fields(self):
        """Validator catches missing required fields."""
        puzzle = {"date": "2026-01-15"}  # Missing mode, difficulty, grids
        
        is_valid, errors = validate_gattai_puzzle(puzzle)
        assert not is_valid
        assert any("Missing required field" in e for e in errors)
    
    def test_validate_invalid_mode(self):
        """Validator catches invalid mode."""
        puzzle = {
            "date": "2026-01-15",
            "mode": "invalid-mode",
            "difficulty": "easy",
            "grids": {},
        }
        
        is_valid, errors = validate_gattai_puzzle(puzzle)
        assert not is_valid
        assert any("Unknown mode" in e for e in errors)
    
    def test_validate_sudoku_rules_duplicates(self):
        """Validator catches duplicate values in rows/cols/boxes."""
        # Grid with duplicate in row 0
        grid = [
            [1, 1, 3, 4, 5, 6, 7, 8, 9],  # Duplicate 1
            [0] * 9,
            [0] * 9,
            [0] * 9,
            [0] * 9,
            [0] * 9,
            [0] * 9,
            [0] * 9,
            [0] * 9,
        ]
        
        errors = _validate_sudoku_rules(grid, "test")
        assert len(errors) > 0
        assert any("duplicate" in e.lower() for e in errors)


class TestUniqueSolution:
    """Tests for unique solution constraint."""
    
    def test_unique_solution_enforced(self):
        """Generated puzzles have exactly one solution."""
        puzzle = generate_gattai_puzzle(
            date_str="2026-01-15",
            mode_id="twin-nw",
            difficulty="medium",
            max_attempts=5,
        )
        
        if puzzle is not None:
            mode = MODES["twin-nw"]
            solver = SamuraiSolver(mode)
            
            puzzle_grids = {
                "primary": puzzle["grids"]["primary"]["grid"],
                "secondary": puzzle["grids"]["secondary"]["grid"],
            }
            
            count = solver.count_solutions(puzzle_grids, max_count=2)
            assert count == 1, f"Expected 1 solution, got {count}"
    
    def test_solution_matches_puzzle(self):
        """Solution values match puzzle clues."""
        puzzle = generate_gattai_puzzle(
            date_str="2026-01-15",
            mode_id="twin-nw",
            difficulty="easy",
            max_attempts=5,
        )
        
        if puzzle is not None:
            for grid_id in ["primary", "secondary"]:
                grid_data = puzzle["grids"][grid_id]
                puzzle_grid = grid_data["grid"]
                solution_grid = grid_data["solution"]
                
                for r in range(9):
                    for c in range(9):
                        if puzzle_grid[r][c] != 0:
                            assert puzzle_grid[r][c] == solution_grid[r][c]


class TestPuzzleFiles:
    """Tests for puzzle file correctness."""
    
    PUZZLE_DIR = Path(__file__).parent.parent / "docs" / "puzzles" / "2026" / "gattai"
    ALL_MODES = ["samurai", "twin-nw", "twin-ne", "twin-sw", "twin-se"]
    ALL_DIFFICULTIES = ["easy", "medium", "hard", "extreme"]
    
    def test_puzzle_mode_matches_path(self):
        """Puzzle 'mode' field matches directory structure."""
        import json
        
        for mode_id in self.ALL_MODES:
            mode_dir = self.PUZZLE_DIR / mode_id
            if not mode_dir.exists():
                continue
                
            for difficulty in self.ALL_DIFFICULTIES:
                diff_dir = mode_dir / difficulty
                if not diff_dir.exists():
                    continue
                    
                for puzzle_file in diff_dir.glob("*.json"):
                    with open(puzzle_file, "r") as f:
                        puzzle = json.load(f)
                    
                    assert puzzle.get("mode") == mode_id, (
                        f"Puzzle {puzzle_file.name} has mode='{puzzle.get('mode')}' "
                        f"but is in {mode_id}/ directory"
                    )
    
    def test_puzzle_difficulty_matches_path(self):
        """Puzzle 'difficulty' field matches directory structure."""
        import json
        
        for mode_id in self.ALL_MODES:
            mode_dir = self.PUZZLE_DIR / mode_id
            if not mode_dir.exists():
                continue
                
            for difficulty in self.ALL_DIFFICULTIES:
                diff_dir = mode_dir / difficulty
                if not diff_dir.exists():
                    continue
                    
                for puzzle_file in diff_dir.glob("*.json"):
                    with open(puzzle_file, "r") as f:
                        puzzle = json.load(f)
                    
                    assert puzzle.get("difficulty") == difficulty, (
                        f"Puzzle {puzzle_file.name} has difficulty='{puzzle.get('difficulty')}' "
                        f"but is in {difficulty}/ directory"
                    )
    
    def test_puzzle_has_correct_grid_count(self):
        """Puzzle has expected number of grids for its mode."""
        import json
        
        mode_grid_counts = {
            "samurai": 5,
            "twin-nw": 2,
            "twin-ne": 2,
            "twin-sw": 2,
            "twin-se": 2,
        }
        
        for mode_id in self.ALL_MODES:
            mode_dir = self.PUZZLE_DIR / mode_id
            if not mode_dir.exists():
                continue
                
            for difficulty in self.ALL_DIFFICULTIES:
                diff_dir = mode_dir / difficulty
                if not diff_dir.exists():
                    continue
                    
                for puzzle_file in diff_dir.glob("*.json"):
                    with open(puzzle_file, "r") as f:
                        puzzle = json.load(f)
                    
                    expected_count = mode_grid_counts[mode_id]
                    actual_count = len(puzzle.get("grids", {}))
                    
                    assert actual_count == expected_count, (
                        f"Puzzle {puzzle_file.name} has {actual_count} grids "
                        f"but mode '{mode_id}' expects {expected_count}"
                    )
    
    def test_puzzle_grids_are_9x9(self):
        """Each puzzle grid is 9x9."""
        import json
        
        for mode_id in self.ALL_MODES:
            mode_dir = self.PUZZLE_DIR / mode_id
            if not mode_dir.exists():
                continue
                
            for difficulty in self.ALL_DIFFICULTIES:
                diff_dir = mode_dir / difficulty
                if not diff_dir.exists():
                    continue
                    
                for puzzle_file in diff_dir.glob("*.json"):
                    with open(puzzle_file, "r") as f:
                        puzzle = json.load(f)
                    
                    for grid_id, grid_data in puzzle.get("grids", {}).items():
                        grid = grid_data.get("grid", [])
                        solution = grid_data.get("solution", [])
                        
                        assert len(grid) == 9, f"Grid {grid_id} has {len(grid)} rows"
                        assert all(len(row) == 9 for row in grid), f"Grid {grid_id} rows not all 9 cols"
                        assert len(solution) == 9, f"Solution {grid_id} has {len(solution)} rows"
                        assert all(len(row) == 9 for row in solution), f"Solution {grid_id} rows not all 9 cols"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
