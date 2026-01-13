"""Puzzle generator using py-sudoku with deterministic seeding."""

import json
import hashlib
import argparse
import random
import copy
from datetime import datetime
from pathlib import Path

from sudoku import Sudoku

from solver import solve, count_solutions
from difficulty import Difficulty, count_clues, get_clue_range
from validator import is_valid_grid


def _date_difficulty_seed(date_str: str, difficulty: Difficulty) -> int:
    """Generate a deterministic seed from date and difficulty."""
    seed_input = f"{date_str}-{difficulty.value}"
    hash_hex = hashlib.sha256(seed_input.encode()).hexdigest()[:8]
    return int(hash_hex, 16)


def _sudoku_to_grid(puzzle: Sudoku) -> list[list[int]]:
    """Convert py-sudoku puzzle to our grid format (None -> 0)."""
    return [
        [cell if cell is not None else 0 for cell in row]
        for row in puzzle.board
    ]


def _generate_complete_grid(seed: int) -> list[list[int]]:
    """Generate a complete, valid Sudoku grid using py-sudoku."""
    # Generate with minimal difficulty to get a near-complete puzzle
    # then solve it to get the full solution
    puzzle = Sudoku(3, seed=seed).difficulty(0.01)
    solved = puzzle.solve()
    return _sudoku_to_grid(solved)


def _remove_clues_for_difficulty(
    complete_grid: list[list[int]],
    difficulty: Difficulty,
    rng: random.Random,
) -> list[list[int]] | None:
    """
    Remove clues from a complete grid to achieve target difficulty.
    Ensures the resulting puzzle has exactly one solution.
    """
    min_clues, max_clues = get_clue_range(difficulty)
    target_clues = (min_clues + max_clues) // 2  # Aim for middle of range

    grid = copy.deepcopy(complete_grid)

    # Get all cell positions and shuffle them
    positions = [(r, c) for r in range(9) for c in range(9)]
    rng.shuffle(positions)

    removed = 0
    current_clues = 81

    for row, col in positions:
        if current_clues <= target_clues:
            break

        if grid[row][col] == 0:
            continue

        # Try removing this clue
        original = grid[row][col]
        grid[row][col] = 0

        # Check if still unique solution
        if count_solutions(grid, max_count=2) == 1:
            removed += 1
            current_clues -= 1
        else:
            # Restore the clue
            grid[row][col] = original

    # Verify we hit the target range
    final_clues = count_clues(grid)
    if min_clues <= final_clues <= max_clues:
        return grid

    return None


def generate_puzzle(
    date_str: str,
    difficulty: Difficulty,
    max_attempts: int = 10,
    verbose: bool = False
) -> dict | None:
    """
    Generate a puzzle for the given date and difficulty.

    Args:
        date_str: Date in YYYY-MM-DD format
        difficulty: Target difficulty level
        max_attempts: Maximum generation attempts (default: 10)
        verbose: Print progress information

    Returns:
        Puzzle dict with date, difficulty, clueCount, grid, solution
        or None if generation fails after all attempts
    """
    base_seed = _date_difficulty_seed(date_str, difficulty)
    min_clues, max_clues = get_clue_range(difficulty)

    for attempt in range(max_attempts):
        attempt_seed = base_seed + attempt
        rng = random.Random(attempt_seed)

        if verbose and attempt > 0:
            print(f"  ⟳ Retry {attempt}/{max_attempts-1}...", end=" ")

        # Generate complete grid
        complete_grid = _generate_complete_grid(attempt_seed)

        # Remove clues to target difficulty while maintaining uniqueness
        puzzle_grid = _remove_clues_for_difficulty(complete_grid, difficulty, rng)

        if puzzle_grid is None:
            if verbose and attempt > 0:
                print("clue removal failed")
            continue

        clues = count_clues(puzzle_grid)

        # Verify it's valid and unique
        if not is_valid_grid(puzzle_grid):
            if verbose and attempt > 0:
                print("validation failed")
            continue

        if count_solutions(puzzle_grid, max_count=2) != 1:
            if verbose and attempt > 0:
                print("uniqueness check failed")
            continue

        return {
            "date": date_str,
            "difficulty": difficulty.value,
            "clueCount": clues,
            "grid": puzzle_grid,
            "solution": complete_grid,
        }

    return None


def generate_puzzle_with_seed(
    date_str: str,
    difficulty: Difficulty,
    base_seed: int,
    max_attempts: int = 10,
    verbose: bool = False
) -> dict | None:
    """
    Generate a puzzle with a specific base seed (for variants).
    
    Args:
        date_str: Date in YYYY-MM-DD format
        difficulty: Target difficulty level
        base_seed: Base seed for generation
        max_attempts: Maximum generation attempts (default: 10)
        verbose: Print progress information
    
    Returns:
        Puzzle dict or None if generation fails
    """
    min_clues, max_clues = get_clue_range(difficulty)

    for attempt in range(max_attempts):
        attempt_seed = base_seed + attempt
        rng = random.Random(attempt_seed)

        if verbose and attempt > 0:
            print(f"  ⟳ Retry {attempt}/{max_attempts-1}...", end=" ")

        complete_grid = _generate_complete_grid(attempt_seed)
        puzzle_grid = _remove_clues_for_difficulty(complete_grid, difficulty, rng)

        if puzzle_grid is None:
            continue

        clues = count_clues(puzzle_grid)

        if not is_valid_grid(puzzle_grid):
            continue

        if count_solutions(puzzle_grid, max_count=2) != 1:
            continue

        return {
            "date": date_str,
            "difficulty": difficulty.value,
            "clueCount": clues,
            "grid": puzzle_grid,
            "solution": complete_grid,
        }

    return None


def save_puzzle(puzzle: dict, base_path: str = "puzzles", variant: int = 1) -> str:
    """
    Save puzzle to the correct folder structure.

    Args:
        puzzle: Puzzle dict
        base_path: Base path for puzzles folder
        variant: Puzzle variant number (default: 1)

    Returns:
        Path to saved file
    """
    date_str = puzzle["date"]
    difficulty = puzzle["difficulty"]
    year = date_str[:4]

    # Create folder structure: puzzles/<year>/<difficulty>/
    folder = Path(base_path) / year / difficulty
    folder.mkdir(parents=True, exist_ok=True)

    # Save as YYYY-MM-DD-001.json (convention-based, no index required)
    suffix = str(variant).zfill(3)
    file_path = folder / f"{date_str}-{suffix}.json"
    with open(file_path, "w") as f:
        json.dump(puzzle, f, indent=2)

    return str(file_path)


def get_next_variant(base_path: str, date_str: str, difficulty: str) -> int:
    """
    Find the next available variant number for a given date and difficulty.
    
    Args:
        base_path: Base path for puzzles folder
        date_str: Date in YYYY-MM-DD format
        difficulty: Difficulty level string
    
    Returns:
        Next available variant number (1 if none exist)
    """
    year = date_str[:4]
    folder = Path(base_path) / year / difficulty
    variant = 1
    while (folder / f"{date_str}-{str(variant).zfill(3)}.json").exists():
        variant += 1
    return variant


def main():
    parser = argparse.ArgumentParser(description="Generate Sudoku puzzles")
    parser.add_argument(
        "date",
        type=str,
        nargs="?",
        default=datetime.now().strftime("%Y-%m-%d"),
        help="Date in YYYY-MM-DD format (default: today)",
    )
    parser.add_argument(
        "--difficulty",
        type=str,
        choices=["easy", "medium", "hard", "extreme"],
        default=None,
        help="Difficulty level (default: generate all)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="puzzles",
        help="Base output folder (default: puzzles)",
    )
    parser.add_argument(
        "--skip-existing",
        action="store_true",
        help="Skip if puzzle file already exists",
    )
    parser.add_argument(
        "--variant",
        type=str,
        default="1",
        help="Variant number (1, 2, 3...) or 'auto' to auto-increment (default: 1)",
    )
    parser.add_argument(
        "--max-retries",
        type=int,
        default=10,
        help="Maximum retry attempts per puzzle (default: 10)",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Print detailed progress information",
    )

    args = parser.parse_args()

    # Determine which difficulties to generate
    if args.difficulty:
        difficulties = [Difficulty(args.difficulty)]
    else:
        difficulties = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD, Difficulty.EXTREME]

    results = []
    for diff in difficulties:
        year = args.date[:4]
        
        # Determine variant number
        if args.variant.lower() == "auto":
            variant = get_next_variant(args.output, args.date, diff.value)
        else:
            variant = int(args.variant)
        
        file_path = Path(args.output) / year / diff.value / f"{args.date}-{str(variant).zfill(3)}.json"

        # Skip if exists and flag set (only for non-auto mode)
        if args.skip_existing and file_path.exists():
            print(f"⏭️  Skipping {diff.value} - already exists")
            continue

        print(f"🎲 Generating {diff.value} puzzle for {args.date} (variant {variant})...", end=" ")
        
        # Use variant-specific seed for different puzzles
        if variant > 1:
            variant_seed_offset = (variant - 1) * 1000
            base_seed = _date_difficulty_seed(args.date, diff) + variant_seed_offset
            puzzle = generate_puzzle_with_seed(args.date, diff, base_seed, max_attempts=args.max_retries, verbose=args.verbose)
        else:
            puzzle = generate_puzzle(args.date, diff, max_attempts=args.max_retries, verbose=args.verbose)

        if puzzle:
            saved_path = save_puzzle(puzzle, args.output, variant=variant)
            print(f"✅ Saved to {saved_path} ({puzzle['clueCount']} clues)")
            results.append(puzzle)
        else:
            print(f"❌ Failed to generate")
            return 1

    print(f"\n✨ Generated {len(results)} puzzle(s)")
    return 0


if __name__ == "__main__":
    exit(main())
