"""Sudoku solver with backtracking algorithm."""

import copy


def _is_valid_placement(grid: list[list[int]], row: int, col: int, num: int) -> bool:
    """Check if placing num at (row, col) is valid."""
    # Check row
    if num in grid[row]:
        return False

    # Check column
    if num in (grid[r][col] for r in range(9)):
        return False

    # Check 3x3 box
    box_row, box_col = 3 * (row // 3), 3 * (col // 3)
    for r in range(box_row, box_row + 3):
        for c in range(box_col, box_col + 3):
            if grid[r][c] == num:
                return False

    return True


def _find_empty(grid: list[list[int]]) -> tuple[int, int] | None:
    """Find the first empty cell (value 0)."""
    for r in range(9):
        for c in range(9):
            if grid[r][c] == 0:
                return (r, c)
    return None


def _solve_recursive(grid: list[list[int]]) -> bool:
    """Solve the grid in-place using backtracking."""
    empty = _find_empty(grid)
    if empty is None:
        return True  # No empty cells, solved!

    row, col = empty
    for num in range(1, 10):
        if _is_valid_placement(grid, row, col, num):
            grid[row][col] = num
            if _solve_recursive(grid):
                return True
            grid[row][col] = 0  # Backtrack

    return False


def solve(grid: list[list[int]]) -> list[list[int]] | None:
    """
    Solve a Sudoku puzzle.

    Args:
        grid: 9x9 grid with 0 representing empty cells

    Returns:
        Solved grid, or None if unsolvable
    """
    # Work on a copy to avoid mutating the original
    grid_copy = copy.deepcopy(grid)
    if _solve_recursive(grid_copy):
        return grid_copy
    return None


def _count_recursive(grid: list[list[int]], count: list[int], max_count: int) -> None:
    """Count solutions recursively, stopping at max_count."""
    if count[0] >= max_count:
        return

    empty = _find_empty(grid)
    if empty is None:
        count[0] += 1
        return

    row, col = empty
    for num in range(1, 10):
        if _is_valid_placement(grid, row, col, num):
            grid[row][col] = num
            _count_recursive(grid, count, max_count)
            grid[row][col] = 0  # Backtrack
            if count[0] >= max_count:
                return


def count_solutions(grid: list[list[int]], max_count: int = 2) -> int:
    """
    Count solutions up to max_count.

    Args:
        grid: 9x9 grid with 0 representing empty cells
        max_count: Stop counting after this many solutions

    Returns:
        Number of solutions found (capped at max_count)
    """
    grid_copy = copy.deepcopy(grid)
    count = [0]  # Use list to allow mutation in nested function
    _count_recursive(grid_copy, count, max_count)
    return count[0]
