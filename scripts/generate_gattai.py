#!/usr/bin/env python3
"""
Gattai Puzzle Generator CLI

Generate Samurai/Gattai Sudoku puzzles with guaranteed unique solutions.

Usage:
    python generate_gattai.py --mode samurai --difficulty medium
    python generate_gattai.py --mode twin-nw --difficulty hard --date 2026-01-15
    python generate_gattai.py --mode samurai --difficulty extreme --verbose
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

# Add scripts directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from gattai import generate_gattai_puzzle, validate_gattai_puzzle, MODES


def main():
    parser = argparse.ArgumentParser(
        description="Generate Samurai/Gattai Sudoku puzzles",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Modes:
  samurai   Classic 5-grid Samurai Sudoku (Gattai-5)
  twin-nw   2-grid "Horizon" (NW overlap)
  twin-ne   2-grid "Sunrise" (NE overlap)
  twin-sw   2-grid "Sunset" (SW overlap)
  twin-se   2-grid "Eclipse" (SE overlap)

Examples:
  python generate_gattai.py --mode samurai --difficulty medium
  python generate_gattai.py --mode twin-nw --difficulty hard --output puzzle.json
  python generate_gattai.py --mode samurai --date 2026-01-15 --verbose
        """
    )
    
    parser.add_argument(
        "--mode", "-m",
        choices=list(MODES.keys()),
        default="samurai",
        help="Puzzle mode (default: samurai)"
    )
    
    parser.add_argument(
        "--difficulty", "-d",
        choices=["easy", "medium", "hard", "extreme"],
        default="medium",
        help="Difficulty level (default: medium)"
    )
    
    parser.add_argument(
        "--date",
        type=str,
        default=None,
        help="Date for puzzle (YYYY-MM-DD format, default: today)"
    )
    
    parser.add_argument(
        "--output", "-o",
        type=str,
        default=None,
        help="Output file path (default: auto-generated in docs/puzzles/)"
    )
    
    parser.add_argument(
        "--max-retries",
        type=int,
        default=10,
        help="Maximum generation attempts (default: 10)"
    )
    
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Print progress information"
    )
    
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Generate but don't save to file"
    )
    
    parser.add_argument(
        "--validate-only",
        type=str,
        metavar="FILE",
        help="Validate an existing puzzle file instead of generating"
    )
    
    args = parser.parse_args()
    
    # Validate-only mode
    if args.validate_only:
        from gattai.validator import validate_puzzle_file
        
        print(f"Validating: {args.validate_only}")
        is_valid, errors = validate_puzzle_file(args.validate_only, check_unique=True)
        
        if is_valid:
            print("✓ Puzzle is valid")
            return 0
        else:
            print("✗ Puzzle validation failed:")
            for error in errors:
                print(f"  - {error}")
            return 1
    
    # Parse date
    if args.date:
        try:
            date_str = datetime.strptime(args.date, "%Y-%m-%d").strftime("%Y-%m-%d")
        except ValueError:
            print(f"Error: Invalid date format '{args.date}'. Use YYYY-MM-DD.")
            return 1
    else:
        date_str = datetime.now().strftime("%Y-%m-%d")
    
    mode = MODES[args.mode]
    
    if args.verbose:
        print(f"Generating {mode.display_name} puzzle...")
        print(f"  Mode: {args.mode}")
        print(f"  Difficulty: {args.difficulty}")
        print(f"  Date: {date_str}")
    
    # Generate puzzle
    puzzle = generate_gattai_puzzle(
        date_str=date_str,
        mode_id=args.mode,
        difficulty=args.difficulty,
        max_attempts=args.max_retries,
        verbose=args.verbose,
    )
    
    if puzzle is None:
        print(f"✗ Failed to generate puzzle after {args.max_retries} attempts")
        return 1
    
    # Validate the generated puzzle
    is_valid, errors = validate_gattai_puzzle(puzzle, check_unique_solution=True, verbose=args.verbose)
    
    if not is_valid:
        print("✗ Generated puzzle failed validation:")
        for error in errors:
            print(f"  - {error}")
        return 1
    
    if args.dry_run:
        print("\n--- Generated Puzzle (dry run) ---")
        print(json.dumps(puzzle, indent=2))
        return 0
    
    # Determine output path
    if args.output:
        output_path = Path(args.output)
    else:
        # Auto-generate path: docs/puzzles/<year>/gattai/<mode>/<difficulty>/YYYY-MM-DD-001.json
        year = date_str[:4]
        base_dir = Path(__file__).parent.parent / "docs" / "puzzles" / year / "gattai" / args.mode / args.difficulty
        base_dir.mkdir(parents=True, exist_ok=True)
        
        # Find next variant number
        variant = 1
        while True:
            filename = f"{date_str}-{variant:03d}.json"
            output_path = base_dir / filename
            if not output_path.exists():
                break
            variant += 1
    
    # Write puzzle
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(puzzle, f, indent=2)
    
    print(f"✓ Puzzle saved to: {output_path}")
    print(f"  Mode: {mode.display_name}")
    print(f"  Difficulty: {args.difficulty}")
    print(f"  Clues: {puzzle['clueCount']}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
