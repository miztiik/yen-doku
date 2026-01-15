"""
Samurai Sudoku Generator

Generates valid Samurai/Gattai puzzles with guaranteed unique solutions.

Strategy:
1. Generate a complete solution for the center grid (or primary for twins)
2. Propagate overlapping boxes to corner grids
3. Complete each corner grid while respecting constraints
4. Remove clues while maintaining unique solution
5. Validate the final puzzle
"""

import copy
import random
import hashlib
from typing import Dict, List, Optional, Tuple

from .modes import MODES, GattaiMode, get_box_cells
from .solver import SamuraiSolver, DIGITS, ROWS, COLS


# Difficulty ranges (total clues across all grids)
DIFFICULTY_RANGES = {
    "samurai": {
        "easy": (164, 182),
        "medium": (137, 159),
        "hard": (114, 132),
        "extreme": (91, 109),
    },
    "twin": {  # All twin modes use same ranges
        "easy": (68, 75),
        "medium": (57, 66),
        "hard": (47, 55),
        "extreme": (38, 45),
    },
}


def _get_clue_range(mode_id: str, difficulty: str) -> Tuple[int, int]:
    """Get the clue count range for a mode and difficulty."""
    if mode_id.startswith("twin"):
        return DIFFICULTY_RANGES["twin"].get(difficulty, (47, 55))
    return DIFFICULTY_RANGES.get(mode_id, DIFFICULTY_RANGES["samurai"]).get(difficulty, (137, 159))


def _date_mode_seed(date_str: str, mode_id: str, difficulty: str) -> int:
    """Generate a deterministic seed from date, mode, and difficulty."""
    seed_input = f"{date_str}-{mode_id}-{difficulty}"
    hash_hex = hashlib.sha256(seed_input.encode()).hexdigest()[:8]
    return int(hash_hex, 16)


def _generate_complete_grid(rng: random.Random) -> List[List[int]]:
    """
    Generate a complete, valid 9x9 Sudoku grid using backtracking.
    
    Uses randomized digit ordering for variety.
    """
    grid = [[0] * 9 for _ in range(9)]
    
    def is_valid(r: int, c: int, num: int) -> bool:
        # Check row
        if num in grid[r]:
            return False
        # Check column
        if num in (grid[row][c] for row in range(9)):
            return False
        # Check box
        box_r, box_c = 3 * (r // 3), 3 * (c // 3)
        for br in range(box_r, box_r + 3):
            for bc in range(box_c, box_c + 3):
                if grid[br][bc] == num:
                    return False
        return True
    
    def fill(pos: int) -> bool:
        if pos == 81:
            return True
        r, c = pos // 9, pos % 9
        
        digits = list(range(1, 10))
        rng.shuffle(digits)
        
        for num in digits:
            if is_valid(r, c, num):
                grid[r][c] = num
                if fill(pos + 1):
                    return True
                grid[r][c] = 0
        return False
    
    fill(0)
    return grid


def _copy_box(source: List[List[int]], target: List[List[int]], 
              source_box: int, target_box: int):
    """Copy a 3x3 box from source grid to target grid."""
    source_cells = get_box_cells(source_box)
    target_cells = get_box_cells(target_box)
    
    for (sr, sc), (tr, tc) in zip(source_cells, target_cells):
        target[tr][tc] = source[sr][sc]


def _complete_grid_with_constraints(grid: List[List[int]], rng: random.Random) -> Optional[List[List[int]]]:
    """
    Complete a partially filled grid while respecting existing constraints.
    
    Returns completed grid or None if impossible.
    """
    grid = copy.deepcopy(grid)
    
    def is_valid(r: int, c: int, num: int) -> bool:
        # Check row
        for col in range(9):
            if col != c and grid[r][col] == num:
                return False
        # Check column
        for row in range(9):
            if row != r and grid[row][c] == num:
                return False
        # Check box
        box_r, box_c = 3 * (r // 3), 3 * (c // 3)
        for br in range(box_r, box_r + 3):
            for bc in range(box_c, box_c + 3):
                if (br != r or bc != c) and grid[br][bc] == num:
                    return False
        return True
    
    def find_empty() -> Optional[Tuple[int, int]]:
        for r in range(9):
            for c in range(9):
                if grid[r][c] == 0:
                    return (r, c)
        return None
    
    def solve() -> bool:
        empty = find_empty()
        if empty is None:
            return True
        r, c = empty
        
        digits = list(range(1, 10))
        rng.shuffle(digits)
        
        for num in digits:
            if is_valid(r, c, num):
                grid[r][c] = num
                if solve():
                    return True
                grid[r][c] = 0
        return False
    
    if solve():
        return grid
    return None


def _generate_samurai_solution(mode: GattaiMode, rng: random.Random) -> Optional[Dict[str, List[List[int]]]]:
    """
    Generate a complete solution for a Samurai puzzle.
    
    Strategy for 5-grid samurai:
    1. Generate center grid
    2. Copy overlapping boxes to corner grids
    3. Complete each corner grid
    
    Strategy for 2-grid twins:
    1. Generate primary grid
    2. Copy overlapping box to secondary
    3. Complete secondary grid
    """
    grids: Dict[str, List[List[int]]] = {}
    
    if mode.id == "samurai":
        # Generate center grid first
        center = _generate_complete_grid(rng)
        grids["center"] = center
        
        # Generate corner grids
        corner_overlaps = {
            "nw": (0, 8),  # Center box 0 -> NW box 8
            "ne": (2, 6),  # Center box 2 -> NE box 6
            "sw": (6, 2),  # Center box 6 -> SW box 2
            "se": (8, 0),  # Center box 8 -> SE box 0
        }
        
        for corner_id, (center_box, corner_box) in corner_overlaps.items():
            corner_grid = [[0] * 9 for _ in range(9)]
            _copy_box(center, corner_grid, center_box, corner_box)
            
            completed = _complete_grid_with_constraints(corner_grid, rng)
            if completed is None:
                return None  # Failed to complete corner
            grids[corner_id] = completed
    
    else:  # Twin modes
        # Generate primary grid
        primary = _generate_complete_grid(rng)
        grids["primary"] = primary
        
        # Get overlap info
        overlap = mode.overlaps[0]
        primary_box = overlap.box1
        secondary_box = overlap.box2
        
        # Copy overlap to secondary
        secondary = [[0] * 9 for _ in range(9)]
        _copy_box(primary, secondary, primary_box, secondary_box)
        
        completed = _complete_grid_with_constraints(secondary, rng)
        if completed is None:
            return None
        grids["secondary"] = completed
    
    return grids


def _count_clues(grids: Dict[str, List[List[int]]], mode: GattaiMode) -> int:
    """
    Count total clues, accounting for shared cells.
    
    Shared cells are only counted once.
    """
    counted: set = set()
    total = 0
    
    for grid_id, grid in grids.items():
        for r in range(9):
            for c in range(9):
                if grid[r][c] != 0:
                    # Create unique key for this cell position
                    # For overlapping cells, we need to track the canonical position
                    pos = mode.grid_positions[grid_id]
                    global_pos = (pos[0] + r, pos[1] + c)
                    
                    if global_pos not in counted:
                        counted.add(global_pos)
                        total += 1
    
    return total


def _remove_clues(
    solution: Dict[str, List[List[int]]],
    mode: GattaiMode,
    target_clues: int,
    rng: random.Random,
) -> Optional[Dict[str, List[List[int]]]]:
    """
    Remove clues from solution while maintaining unique solution.
    
    Returns puzzle grid or None if target cannot be reached.
    """
    solver = SamuraiSolver(mode)
    puzzle = copy.deepcopy(solution)
    
    # Build list of all removable positions
    # For overlapping cells, we need to handle them together
    positions = []
    seen_global: set = set()
    
    for grid_id in mode.grid_ids:
        pos = mode.grid_positions[grid_id]
        for r in range(9):
            for c in range(9):
                global_pos = (pos[0] + r, pos[1] + c)
                if global_pos not in seen_global:
                    seen_global.add(global_pos)
                    positions.append((grid_id, r, c))
    
    rng.shuffle(positions)
    
    current_clues = _count_clues(puzzle, mode)
    
    for grid_id, r, c in positions:
        if current_clues <= target_clues:
            break
        
        if puzzle[grid_id][r][c] == 0:
            continue
        
        # Check if this is an overlapping cell
        pos = mode.grid_positions[grid_id]
        global_pos = (pos[0] + r, pos[1] + c)
        
        # Find all grids that contain this position
        cells_to_clear = [(grid_id, r, c)]
        for other_id in mode.grid_ids:
            if other_id == grid_id:
                continue
            other_pos = mode.grid_positions[other_id]
            local_r = global_pos[0] - other_pos[0]
            local_c = global_pos[1] - other_pos[1]
            if 0 <= local_r < 9 and 0 <= local_c < 9:
                cells_to_clear.append((other_id, local_r, local_c))
        
        # Save original values
        originals = [(gid, row, col, puzzle[gid][row][col]) for gid, row, col in cells_to_clear]
        
        # Clear all instances of this cell
        for gid, row, col, _ in originals:
            puzzle[gid][row][col] = 0
        
        # Check if still unique solution
        if solver.count_solutions(puzzle, max_count=2) == 1:
            current_clues -= 1
        else:
            # Restore
            for gid, row, col, val in originals:
                puzzle[gid][row][col] = val
    
    # Verify we hit target range
    final_clues = _count_clues(puzzle, mode)
    return puzzle


def generate_gattai_puzzle(
    date_str: str,
    mode_id: str,
    difficulty: str,
    max_attempts: int = 10,
    verbose: bool = False,
) -> Optional[Dict]:
    """
    Generate a Gattai puzzle for the given date, mode, and difficulty.
    
    Args:
        date_str: Date in YYYY-MM-DD format
        mode_id: One of 'samurai', 'twin-nw', 'twin-ne', 'twin-sw', 'twin-se'
        difficulty: One of 'easy', 'medium', 'hard', 'extreme'
        max_attempts: Maximum generation attempts
        verbose: Print progress info
        
    Returns:
        Puzzle dict with date, mode, difficulty, clueCount, version, grids
        or None if generation fails.
    """
    mode = MODES.get(mode_id)
    if mode is None:
        raise ValueError(f"Unknown mode: {mode_id}")
    
    min_clues, max_clues = _get_clue_range(mode_id, difficulty)
    target_clues = (min_clues + max_clues) // 2
    
    base_seed = _date_mode_seed(date_str, mode_id, difficulty)
    
    for attempt in range(max_attempts):
        attempt_seed = base_seed + attempt
        rng = random.Random(attempt_seed)
        
        if verbose and attempt > 0:
            print(f"  ⟳ Retry {attempt}/{max_attempts - 1}...", end=" ")
        
        # Generate complete solution
        solution = _generate_samurai_solution(mode, rng)
        if solution is None:
            if verbose and attempt > 0:
                print("solution generation failed")
            continue
        
        # Verify solution is valid
        solver = SamuraiSolver(mode)
        if not solver.is_solved(solution):
            if verbose and attempt > 0:
                print("invalid solution")
            continue
        
        # Remove clues to create puzzle
        puzzle_grids = _remove_clues(solution, mode, target_clues, rng)
        if puzzle_grids is None:
            if verbose and attempt > 0:
                print("clue removal failed")
            continue
        
        # Final verification: exactly one solution
        if solver.count_solutions(puzzle_grids, max_count=2) != 1:
            if verbose and attempt > 0:
                print("uniqueness check failed")
            continue
        
        clue_count = _count_clues(puzzle_grids, mode)
        
        # Check clue count is in range
        if not (min_clues <= clue_count <= max_clues):
            if verbose and attempt > 0:
                print(f"clue count {clue_count} not in range [{min_clues}, {max_clues}]")
            continue
        
        # Build result
        result = {
            "date": date_str,
            "mode": mode_id,
            "difficulty": difficulty,
            "clueCount": clue_count,
            "version": "1.0",
            "grids": {},
        }
        
        for grid_id in mode.grid_ids:
            result["grids"][grid_id] = {
                "grid": puzzle_grids[grid_id],
                "solution": solution[grid_id],
            }
        
        if verbose:
            print(f"✓ Generated {mode.display_name} puzzle with {clue_count} clues")
        
        return result
    
    return None
