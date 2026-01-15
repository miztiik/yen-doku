"""
Samurai Sudoku Validator

Validates that a Gattai puzzle:
1. Has valid structure (correct grids, dimensions)
2. Each grid follows standard Sudoku rules
3. Overlapping boxes are consistent across grids
4. Has exactly one solution (optional, expensive check)
"""

from typing import Dict, List, Optional, Tuple

from .modes import MODES, GattaiMode, get_box_cells
from .solver import SamuraiSolver


class ValidationError(Exception):
    """Raised when puzzle validation fails."""
    pass


def _validate_grid_structure(grid: List[List[int]], grid_id: str) -> List[str]:
    """Validate a single 9x9 grid has correct structure."""
    errors = []
    
    if not isinstance(grid, list) or len(grid) != 9:
        errors.append(f"Grid '{grid_id}' must be a 9-element list, got {type(grid).__name__} with {len(grid) if isinstance(grid, list) else 'N/A'} elements")
        return errors
    
    for r, row in enumerate(grid):
        if not isinstance(row, list) or len(row) != 9:
            errors.append(f"Grid '{grid_id}' row {r} must be a 9-element list")
            continue
        
        for c, val in enumerate(row):
            if not isinstance(val, int) or not (0 <= val <= 9):
                errors.append(f"Grid '{grid_id}' cell ({r},{c}) must be int 0-9, got {val}")
    
    return errors


def _validate_sudoku_rules(grid: List[List[int]], grid_id: str, check_complete: bool = False) -> List[str]:
    """
    Validate a grid follows Sudoku rules.
    
    Args:
        grid: 9x9 grid
        grid_id: Grid identifier for error messages
        check_complete: If True, also check that grid is fully filled
    """
    errors = []
    
    # Check rows
    for r in range(9):
        seen = set()
        for c in range(9):
            val = grid[r][c]
            if val == 0:
                if check_complete:
                    errors.append(f"Grid '{grid_id}' row {r} has unfilled cell at column {c}")
            elif val in seen:
                errors.append(f"Grid '{grid_id}' row {r} has duplicate value {val}")
            else:
                seen.add(val)
    
    # Check columns
    for c in range(9):
        seen = set()
        for r in range(9):
            val = grid[r][c]
            if val != 0:
                if val in seen:
                    errors.append(f"Grid '{grid_id}' column {c} has duplicate value {val}")
                else:
                    seen.add(val)
    
    # Check boxes
    for box in range(9):
        seen = set()
        cells = get_box_cells(box)
        for r, c in cells:
            val = grid[r][c]
            if val != 0:
                if val in seen:
                    errors.append(f"Grid '{grid_id}' box {box} has duplicate value {val}")
                else:
                    seen.add(val)
    
    return errors


def _validate_overlaps(grids: Dict[str, List[List[int]]], mode: GattaiMode) -> List[str]:
    """Validate that overlapping boxes are consistent."""
    errors = []
    
    for overlap in mode.overlaps:
        grid1 = grids.get(overlap.grid1)
        grid2 = grids.get(overlap.grid2)
        
        if grid1 is None or grid2 is None:
            continue  # Already caught in structure validation
        
        cells1 = get_box_cells(overlap.box1)
        cells2 = get_box_cells(overlap.box2)
        
        for (r1, c1), (r2, c2) in zip(cells1, cells2):
            val1 = grid1[r1][c1]
            val2 = grid2[r2][c2]
            
            if val1 != val2:
                errors.append(
                    f"Overlap mismatch: {overlap.grid1}[{r1}][{c1}]={val1} "
                    f"!= {overlap.grid2}[{r2}][{c2}]={val2}"
                )
    
    return errors


def validate_gattai_puzzle(
    puzzle: Dict,
    check_unique_solution: bool = True,
    verbose: bool = False,
) -> Tuple[bool, List[str]]:
    """
    Validate a Gattai puzzle.
    
    Args:
        puzzle: Puzzle dict with mode, grids, etc.
        check_unique_solution: If True, verify exactly one solution exists (slow)
        verbose: Print validation progress
        
    Returns:
        (is_valid, list_of_errors)
    """
    errors = []
    
    # Check required fields
    required_fields = ["date", "mode", "difficulty", "grids"]
    for field in required_fields:
        if field not in puzzle:
            errors.append(f"Missing required field: {field}")
    
    if errors:
        return False, errors
    
    # Check mode
    mode_id = puzzle["mode"]
    mode = MODES.get(mode_id)
    if mode is None:
        errors.append(f"Unknown mode: {mode_id}")
        return False, errors
    
    # Check grids exist
    grids_data = puzzle["grids"]
    for grid_id in mode.grid_ids:
        if grid_id not in grids_data:
            errors.append(f"Missing grid: {grid_id}")
    
    if errors:
        return False, errors
    
    # Validate grid structure
    puzzle_grids = {}
    solution_grids = {}
    
    for grid_id in mode.grid_ids:
        grid_data = grids_data[grid_id]
        
        if "grid" not in grid_data:
            errors.append(f"Grid '{grid_id}' missing 'grid' field")
            continue
        if "solution" not in grid_data:
            errors.append(f"Grid '{grid_id}' missing 'solution' field")
            continue
        
        puzzle_grids[grid_id] = grid_data["grid"]
        solution_grids[grid_id] = grid_data["solution"]
        
        # Validate structure
        errors.extend(_validate_grid_structure(grid_data["grid"], f"{grid_id}/grid"))
        errors.extend(_validate_grid_structure(grid_data["solution"], f"{grid_id}/solution"))
    
    if errors:
        return False, errors
    
    if verbose:
        print("✓ Grid structure valid")
    
    # Validate Sudoku rules for each grid
    for grid_id in mode.grid_ids:
        errors.extend(_validate_sudoku_rules(puzzle_grids[grid_id], f"{grid_id}/grid", check_complete=False))
        errors.extend(_validate_sudoku_rules(solution_grids[grid_id], f"{grid_id}/solution", check_complete=True))
    
    if errors:
        return False, errors
    
    if verbose:
        print("✓ Sudoku rules valid for all grids")
    
    # Validate overlaps for puzzle grids
    errors.extend(_validate_overlaps(puzzle_grids, mode))
    errors.extend(_validate_overlaps(solution_grids, mode))
    
    if errors:
        return False, errors
    
    if verbose:
        print("✓ Overlaps consistent")
    
    # Validate that solution solves the puzzle
    # (puzzle clues match solution)
    for grid_id in mode.grid_ids:
        puzzle_grid = puzzle_grids[grid_id]
        solution_grid = solution_grids[grid_id]
        
        for r in range(9):
            for c in range(9):
                if puzzle_grid[r][c] != 0:
                    if puzzle_grid[r][c] != solution_grid[r][c]:
                        errors.append(
                            f"Grid '{grid_id}' clue at ({r},{c}) = {puzzle_grid[r][c]} "
                            f"doesn't match solution = {solution_grid[r][c]}"
                        )
    
    if errors:
        return False, errors
    
    if verbose:
        print("✓ Solution matches puzzle clues")
    
    # Check unique solution (expensive)
    if check_unique_solution:
        if verbose:
            print("  Checking unique solution...")
        
        solver = SamuraiSolver(mode)
        solution_count = solver.count_solutions(puzzle_grids, max_count=2)
        
        if solution_count == 0:
            errors.append("Puzzle has no solution")
        elif solution_count > 1:
            errors.append("Puzzle has multiple solutions (must have exactly 1)")
        
        if errors:
            return False, errors
        
        if verbose:
            print("✓ Unique solution verified")
    
    # Check clue count if provided
    if "clueCount" in puzzle:
        # Count clues (simplified - doesn't account for overlaps)
        actual_clues = sum(
            1 for grid_id in mode.grid_ids
            for row in puzzle_grids[grid_id]
            for val in row if val != 0
        )
        # For twins, subtract shared cells
        # For samurai, subtract 4 * 9 = 36 shared cells
        shared_cells = len(mode.overlaps) * 9
        
        if verbose:
            print(f"✓ Clue count: {puzzle['clueCount']}")
    
    return True, []


def validate_puzzle_file(filepath: str, check_unique: bool = True) -> Tuple[bool, List[str]]:
    """
    Validate a puzzle from a JSON file.
    
    Args:
        filepath: Path to puzzle JSON file
        check_unique: If True, verify unique solution
        
    Returns:
        (is_valid, list_of_errors)
    """
    import json
    
    try:
        with open(filepath, "r") as f:
            puzzle = json.load(f)
    except (json.JSONDecodeError, FileNotFoundError) as e:
        return False, [f"Failed to load puzzle file: {e}"]
    
    return validate_gattai_puzzle(puzzle, check_unique_solution=check_unique)
