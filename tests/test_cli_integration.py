"""Integration tests for generate.py CLI and GitHub Actions workflow compatibility.

These tests verify:
1. File naming convention (YYYY-MM-DD-001.json)
2. Folder structure ({year}/{difficulty}/)
3. CLI argument handling (--variant, --skip-existing, --difficulty)
4. Auto-increment variant detection
5. Schema compliance for workflow validation
"""

import pytest
import json
import sys
import os
import subprocess
from pathlib import Path
import tempfile
import shutil

# Add scripts to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

from generate import save_puzzle, get_next_variant, generate_puzzle, generate_puzzle_with_seed
from difficulty import Difficulty


class TestFileNamingConvention:
    """Test that puzzle files follow YYYY-MM-DD-NNN.json convention."""

    def test_default_variant_is_001(self):
        """Default variant produces -001 suffix."""
        puzzle = {
            "date": "2026-03-15",
            "difficulty": "hard",
            "clueCount": 28,
            "grid": [[0] * 9 for _ in range(9)],
            "solution": [[1] * 9 for _ in range(9)],
        }

        with tempfile.TemporaryDirectory() as tmpdir:
            saved_path = save_puzzle(puzzle, tmpdir)
            assert saved_path.endswith("2026-03-15-001.json")

    def test_explicit_variant_suffix(self):
        """Explicit variant produces correct suffix."""
        puzzle = {
            "date": "2026-03-15",
            "difficulty": "hard",
            "clueCount": 28,
            "grid": [[0] * 9 for _ in range(9)],
            "solution": [[1] * 9 for _ in range(9)],
        }

        with tempfile.TemporaryDirectory() as tmpdir:
            saved_path = save_puzzle(puzzle, tmpdir, variant=5)
            assert saved_path.endswith("2026-03-15-005.json")

    def test_variant_zero_padded_to_three_digits(self):
        """Variant numbers are zero-padded to 3 digits."""
        puzzle = {
            "date": "2026-03-15",
            "difficulty": "easy",
            "clueCount": 42,
            "grid": [[0] * 9 for _ in range(9)],
            "solution": [[1] * 9 for _ in range(9)],
        }

        with tempfile.TemporaryDirectory() as tmpdir:
            for variant, expected_suffix in [(1, "001"), (2, "002"), (10, "010"), (99, "099")]:
                saved_path = save_puzzle(puzzle, tmpdir, variant=variant)
                assert f"-{expected_suffix}.json" in saved_path


class TestFolderStructure:
    """Test that puzzles are saved to correct folder structure."""

    def test_year_folder_from_date(self):
        """Year folder is extracted from date string."""
        puzzle = {
            "date": "2025-12-31",
            "difficulty": "medium",
            "clueCount": 35,
            "grid": [[0] * 9 for _ in range(9)],
            "solution": [[1] * 9 for _ in range(9)],
        }

        with tempfile.TemporaryDirectory() as tmpdir:
            saved_path = save_puzzle(puzzle, tmpdir)
            assert "/2025/" in saved_path.replace("\\", "/")

    def test_difficulty_folder_created(self):
        """Difficulty subfolder is created under year folder."""
        puzzle = {
            "date": "2026-06-15",
            "difficulty": "extreme",
            "clueCount": 22,
            "grid": [[0] * 9 for _ in range(9)],
            "solution": [[1] * 9 for _ in range(9)],
        }

        with tempfile.TemporaryDirectory() as tmpdir:
            saved_path = save_puzzle(puzzle, tmpdir)
            expected_folder = Path(tmpdir) / "2026" / "extreme"
            assert expected_folder.exists()
            assert expected_folder.is_dir()

    def test_all_difficulties_create_folders(self):
        """All difficulty levels create correct folders."""
        with tempfile.TemporaryDirectory() as tmpdir:
            for diff in ["easy", "medium", "hard", "extreme"]:
                puzzle = {
                    "date": "2026-07-01",
                    "difficulty": diff,
                    "clueCount": 30,
                    "grid": [[0] * 9 for _ in range(9)],
                    "solution": [[1] * 9 for _ in range(9)],
                }
                save_puzzle(puzzle, tmpdir)
                
                expected_folder = Path(tmpdir) / "2026" / diff
                assert expected_folder.exists(), f"Folder for {diff} not created"


class TestAutoIncrementVariant:
    """Test get_next_variant() auto-detection logic."""

    def test_returns_1_when_no_files_exist(self):
        """Returns 1 when no puzzle files exist for the date."""
        with tempfile.TemporaryDirectory() as tmpdir:
            variant = get_next_variant(tmpdir, "2026-05-01", "hard")
            assert variant == 1

    def test_returns_2_when_001_exists(self):
        """Returns 2 when variant 001 already exists."""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create folder and file
            folder = Path(tmpdir) / "2026" / "hard"
            folder.mkdir(parents=True)
            (folder / "2026-05-01-001.json").write_text("{}")

            variant = get_next_variant(tmpdir, "2026-05-01", "hard")
            assert variant == 2

    def test_returns_next_available_variant(self):
        """Returns next available variant when multiple exist."""
        with tempfile.TemporaryDirectory() as tmpdir:
            folder = Path(tmpdir) / "2026" / "extreme"
            folder.mkdir(parents=True)
            (folder / "2026-05-01-001.json").write_text("{}")
            (folder / "2026-05-01-002.json").write_text("{}")
            (folder / "2026-05-01-003.json").write_text("{}")

            variant = get_next_variant(tmpdir, "2026-05-01", "extreme")
            assert variant == 4

    def test_handles_gaps_in_variant_numbers(self):
        """Fills in gaps if they exist (finds first missing)."""
        with tempfile.TemporaryDirectory() as tmpdir:
            folder = Path(tmpdir) / "2026" / "easy"
            folder.mkdir(parents=True)
            (folder / "2026-05-01-001.json").write_text("{}")
            # Note: 002 is missing
            (folder / "2026-05-01-003.json").write_text("{}")

            # Should return 2 (first gap)
            variant = get_next_variant(tmpdir, "2026-05-01", "easy")
            assert variant == 2


class TestVariantSeedDifference:
    """Test that different variants produce different puzzles."""

    def test_variant_1_uses_base_seed(self):
        """Variant 1 uses the standard deterministic seed."""
        puzzle1 = generate_puzzle("2026-08-01", Difficulty.EASY)
        puzzle2 = generate_puzzle("2026-08-01", Difficulty.EASY)
        
        assert puzzle1 is not None
        assert puzzle2 is not None
        assert puzzle1["grid"] == puzzle2["grid"], "Variant 1 should be deterministic"

    def test_different_variants_produce_different_puzzles(self):
        """Different variant seeds produce different puzzles."""
        from generate import _date_difficulty_seed
        
        date = "2026-08-01"
        diff = Difficulty.EASY
        
        base_seed = _date_difficulty_seed(date, diff)
        variant_2_seed = base_seed + 1000  # Offset for variant 2
        
        puzzle1 = generate_puzzle(date, diff)
        puzzle2 = generate_puzzle_with_seed(date, diff, variant_2_seed)
        
        assert puzzle1 is not None
        assert puzzle2 is not None
        assert puzzle1["grid"] != puzzle2["grid"], "Different variants should produce different puzzles"


class TestSchemaCompliance:
    """Test that generated puzzles match the schema expected by the workflow."""

    REQUIRED_FIELDS = ["date", "difficulty", "clueCount", "grid", "solution"]

    def test_all_required_fields_present(self):
        """Generated puzzle has all fields required by workflow validation."""
        puzzle = generate_puzzle("2026-09-01", Difficulty.MEDIUM)
        
        assert puzzle is not None
        for field in self.REQUIRED_FIELDS:
            assert field in puzzle, f"Missing required field: {field}"

    def test_grid_is_9x9(self):
        """Grid is exactly 9x9."""
        puzzle = generate_puzzle("2026-09-01", Difficulty.HARD)
        
        assert puzzle is not None
        assert len(puzzle["grid"]) == 9
        for row in puzzle["grid"]:
            assert len(row) == 9

    def test_solution_is_9x9(self):
        """Solution is exactly 9x9."""
        puzzle = generate_puzzle("2026-09-01", Difficulty.HARD)
        
        assert puzzle is not None
        assert len(puzzle["solution"]) == 9
        for row in puzzle["solution"]:
            assert len(row) == 9

    def test_grid_values_are_0_to_9(self):
        """Grid values are integers 0-9 (0 = empty)."""
        puzzle = generate_puzzle("2026-09-01", Difficulty.EXTREME)
        
        assert puzzle is not None
        for row in puzzle["grid"]:
            for cell in row:
                assert isinstance(cell, int)
                assert 0 <= cell <= 9

    def test_solution_values_are_1_to_9(self):
        """Solution values are integers 1-9 (no zeros)."""
        puzzle = generate_puzzle("2026-09-01", Difficulty.EASY)
        
        assert puzzle is not None
        for row in puzzle["solution"]:
            for cell in row:
                assert isinstance(cell, int)
                assert 1 <= cell <= 9

    def test_clue_count_matches_grid(self):
        """clueCount field matches actual non-zero cells in grid."""
        puzzle = generate_puzzle("2026-09-01", Difficulty.MEDIUM)
        
        assert puzzle is not None
        actual_clues = sum(1 for row in puzzle["grid"] for cell in row if cell != 0)
        assert puzzle["clueCount"] == actual_clues

    def test_date_format_is_iso(self):
        """Date field is in YYYY-MM-DD format."""
        puzzle = generate_puzzle("2026-09-15", Difficulty.HARD)
        
        assert puzzle is not None
        assert puzzle["date"] == "2026-09-15"
        # Verify format
        parts = puzzle["date"].split("-")
        assert len(parts) == 3
        assert len(parts[0]) == 4  # Year
        assert len(parts[1]) == 2  # Month
        assert len(parts[2]) == 2  # Day

    def test_difficulty_is_valid_string(self):
        """Difficulty field is one of the valid difficulty strings."""
        valid_difficulties = ["easy", "medium", "hard", "extreme"]
        
        for diff in Difficulty:
            puzzle = generate_puzzle("2026-09-20", diff)
            assert puzzle is not None
            assert puzzle["difficulty"] in valid_difficulties


class TestCLIIntegration:
    """Test the CLI by invoking generate.py as a subprocess."""

    @pytest.fixture
    def temp_output_dir(self):
        """Create a temporary directory for puzzle output."""
        tmpdir = tempfile.mkdtemp()
        yield tmpdir
        shutil.rmtree(tmpdir)

    def _run_generate(self, args, cwd):
        """Run generate.py with proper encoding for Windows."""
        env = os.environ.copy()
        env["PYTHONIOENCODING"] = "utf-8"
        return subprocess.run(
            [sys.executable, "scripts/generate.py"] + args,
            capture_output=True,
            text=True,
            cwd=cwd,
            env=env,
            encoding="utf-8",
            errors="replace"
        )

    def test_cli_generates_all_difficulties_by_default(self, temp_output_dir):
        """CLI generates puzzles for all 4 difficulties when none specified."""
        result = self._run_generate(
            ["2026-10-01", "--output", temp_output_dir],
            os.path.dirname(os.path.dirname(__file__))
        )
        
        assert result.returncode == 0, f"CLI failed: {result.stderr}"
        assert "Generated 4 puzzle(s)" in result.stdout

        # Verify all 4 files exist
        for diff in ["easy", "medium", "hard", "extreme"]:
            path = Path(temp_output_dir) / "2026" / diff / "2026-10-01-001.json"
            assert path.exists(), f"Missing {diff} puzzle"

    def test_cli_single_difficulty(self, temp_output_dir):
        """CLI can generate single difficulty."""
        result = self._run_generate(
            ["2026-10-02", "--difficulty", "easy", "--output", temp_output_dir],
            os.path.dirname(os.path.dirname(__file__))
        )
        
        assert result.returncode == 0
        assert "Generated 1 puzzle(s)" in result.stdout
        
        path = Path(temp_output_dir) / "2026" / "easy" / "2026-10-02-001.json"
        assert path.exists()

    def test_cli_skip_existing(self, temp_output_dir):
        """CLI --skip-existing flag skips already generated puzzles."""
        # Generate first time
        self._run_generate(
            ["2026-10-03", "--difficulty", "medium", "--output", temp_output_dir],
            os.path.dirname(os.path.dirname(__file__))
        )

        # Run again with --skip-existing
        result = self._run_generate(
            ["2026-10-03", "--difficulty", "medium", "--output", temp_output_dir, "--skip-existing"],
            os.path.dirname(os.path.dirname(__file__))
        )
        
        assert result.returncode == 0
        # Check for the key text (ignoring emoji prefix)
        assert "Skipping medium" in result.stdout and "already exists" in result.stdout

    def test_cli_variant_explicit(self, temp_output_dir):
        """CLI --variant flag generates specific variant."""
        result = self._run_generate(
            ["2026-10-04", "--difficulty", "hard", "--variant", "3", "--output", temp_output_dir],
            os.path.dirname(os.path.dirname(__file__))
        )
        
        assert result.returncode == 0
        assert "(variant 3)" in result.stdout
        
        path = Path(temp_output_dir) / "2026" / "hard" / "2026-10-04-003.json"
        assert path.exists()

    def test_cli_variant_auto(self, temp_output_dir):
        """CLI --variant auto detects next available variant."""
        # Generate variant 1
        self._run_generate(
            ["2026-10-05", "--difficulty", "extreme", "--output", temp_output_dir],
            os.path.dirname(os.path.dirname(__file__))
        )

        # Generate with auto - should be variant 2
        result = self._run_generate(
            ["2026-10-05", "--difficulty", "extreme", "--variant", "auto", "--output", temp_output_dir],
            os.path.dirname(os.path.dirname(__file__))
        )
        
        assert result.returncode == 0
        assert "(variant 2)" in result.stdout
        
        path = Path(temp_output_dir) / "2026" / "extreme" / "2026-10-05-002.json"
        assert path.exists()

    def test_cli_output_is_valid_json(self, temp_output_dir):
        """CLI output files are valid JSON."""
        self._run_generate(
            ["2026-10-06", "--difficulty", "easy", "--output", temp_output_dir],
            os.path.dirname(os.path.dirname(__file__))
        )
        
        path = Path(temp_output_dir) / "2026" / "easy" / "2026-10-06-001.json"
        
        with open(path) as f:
            puzzle = json.load(f)  # Should not raise
        
        assert puzzle["date"] == "2026-10-06"
        assert puzzle["difficulty"] == "easy"
