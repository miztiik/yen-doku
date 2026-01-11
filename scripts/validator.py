"""Sudoku grid validator."""


def is_valid_grid(grid: list[list[int]]) -> bool:
    """
    Check if a grid is valid (no duplicates in rows/cols/boxes).

    Args:
        grid: 9x9 grid (0 = empty, 1-9 = filled)

    Returns:
        True if valid, False otherwise
    """
    # Check rows
    for row in grid:
        seen = [x for x in row if x != 0]
        if len(seen) != len(set(seen)):
            return False

    # Check columns
    for col in range(9):
        seen = [grid[row][col] for row in range(9) if grid[row][col] != 0]
        if len(seen) != len(set(seen)):
            return False

    # Check 3x3 boxes
    for box_row in range(0, 9, 3):
        for box_col in range(0, 9, 3):
            seen = []
            for r in range(box_row, box_row + 3):
                for c in range(box_col, box_col + 3):
                    if grid[r][c] != 0:
                        seen.append(grid[r][c])
            if len(seen) != len(set(seen)):
                return False

    return True


def is_complete(grid: list[list[int]]) -> bool:
    """
    Check if a grid is completely filled (no zeros).

    Args:
        grid: 9x9 grid

    Returns:
        True if no empty cells, False otherwise
    """
    return all(cell != 0 for row in grid for cell in row)


def validate_solution(puzzle: list[list[int]], solution: list[list[int]]) -> bool:
    """
    Check if a solution is valid for the given puzzle.

    Args:
        puzzle: Original puzzle grid
        solution: Proposed solution grid

    Returns:
        True if solution is valid and matches puzzle clues
    """
    # Solution must be complete
    if not is_complete(solution):
        return False

    # Solution must be valid (no duplicates)
    if not is_valid_grid(solution):
        return False

    # Solution must preserve original clues
    for r in range(9):
        for c in range(9):
            if puzzle[r][c] != 0 and puzzle[r][c] != solution[r][c]:
                return False

    return True
