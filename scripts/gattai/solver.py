"""
Samurai Sudoku Solver

Uses constraint propagation + backtracking search for multi-grid puzzles.
Based on Peter Norvig's approach with extensions for overlapping grids.

Key insight: Treat all grids as one unified constraint system where
overlapping boxes share the same variables.
"""

import copy
from typing import Dict, List, Optional, Tuple, Set

from .modes import MODES, GattaiMode, Overlap, get_box_cells


# Constants
DIGITS = "123456789"
ROWS = "ABCDEFGHI"
COLS = DIGITS


def cross(A: str, B: str, suffix: str = "") -> List[str]:
    """Cross product of elements in A and B, with optional suffix."""
    return [a + b + suffix for a in A for b in B]


class SamuraiSolver:
    """
    Solver for Samurai/Gattai Sudoku puzzles.
    
    Uses constraint propagation with backtracking search.
    Handles overlapping grids by treating shared cells as single variables.
    """
    
    def __init__(self, mode: GattaiMode):
        """Initialize solver for the given mode."""
        self.mode = mode
        self._build_constraint_graph()
    
    def _build_constraint_graph(self):
        """
        Build the squares, units, and peers for all grids.
        
        For overlapping cells, we use canonical naming from the first grid
        that contains them (usually 'center' for samurai).
        """
        self.all_squares: Set[str] = set()
        self.all_unitlists: List[List[str]] = []
        self.grid_squares: Dict[str, List[str]] = {}
        
        # Maps overlapping cells to their canonical name
        self.overlap_map: Dict[str, str] = {}
        
        # Build squares and units for each grid
        for grid_id in self.mode.grid_ids:
            suffix = f"_{grid_id}"
            squares = cross(ROWS, COLS, suffix)
            self.grid_squares[grid_id] = squares
            
            # Row units
            for c in COLS:
                self.all_unitlists.append(cross(ROWS, c, suffix))
            
            # Column units
            for r in ROWS:
                self.all_unitlists.append(cross(r, COLS, suffix))
            
            # Box units
            for rs in ("ABC", "DEF", "GHI"):
                for cs in ("123", "456", "789"):
                    self.all_unitlists.append(cross(rs, cs, suffix))
            
            self.all_squares.update(squares)
        
        # Handle overlaps - map grid2 cells to grid1 cells (canonical)
        for overlap in self.mode.overlaps:
            box1_cells = get_box_cells(overlap.box1)
            box2_cells = get_box_cells(overlap.box2)
            
            for (r1, c1), (r2, c2) in zip(box1_cells, box2_cells):
                # Cell names
                cell1 = f"{ROWS[r1]}{COLS[c1]}_{overlap.grid1}"
                cell2 = f"{ROWS[r2]}{COLS[c2]}_{overlap.grid2}"
                
                # Map cell2 to cell1 (cell1 is canonical)
                self.overlap_map[cell2] = cell1
                
                # Remove cell2 from all_squares (use cell1 instead)
                self.all_squares.discard(cell2)
        
        # Replace overlapped cells in unitlists
        new_unitlists = []
        for unit in self.all_unitlists:
            new_unit = [self.overlap_map.get(s, s) for s in unit]
            new_unitlists.append(new_unit)
        self.all_unitlists = new_unitlists
        
        # Build units dict: square -> list of units containing it
        self.units = {}
        for s in self.all_squares:
            self.units[s] = [u for u in self.all_unitlists if s in u]
        
        # Build peers dict: square -> set of all peers
        self.peers = {}
        for s in self.all_squares:
            peer_set = set()
            for u in self.units[s]:
                peer_set.update(u)
            peer_set.discard(s)
            self.peers[s] = peer_set
    
    def _get_canonical(self, square: str) -> str:
        """Get canonical name for a square (handles overlaps)."""
        return self.overlap_map.get(square, square)
    
    def parse_grids(self, grids: Dict[str, List[List[int]]]) -> Optional[Dict[str, str]]:
        """
        Parse puzzle grids into constraint propagation format.
        
        Args:
            grids: Dict mapping grid_id to 9x9 grid (0 = empty, 1-9 = digit)
            
        Returns:
            Dict mapping square to possible digits, or None if contradiction.
        """
        # Start with all digits possible for each square
        values = {s: DIGITS for s in self.all_squares}
        
        # Assign known values
        for grid_id, grid in grids.items():
            if grid_id not in self.mode.grid_ids:
                continue
                
            suffix = f"_{grid_id}"
            for r in range(9):
                for c in range(9):
                    digit = grid[r][c]
                    if digit != 0:
                        square = f"{ROWS[r]}{COLS[c]}{suffix}"
                        square = self._get_canonical(square)
                        
                        if not self._assign(values, square, str(digit)):
                            return None  # Contradiction
        
        return values
    
    def _assign(self, values: Dict[str, str], square: str, digit: str) -> Optional[Dict[str, str]]:
        """
        Assign digit to square by eliminating all other values.
        
        Returns values dict, or None if contradiction detected.
        """
        other_values = values[square].replace(digit, "")
        if all(self._eliminate(values, square, d) for d in other_values):
            return values
        return None
    
    def _eliminate(self, values: Dict[str, str], square: str, digit: str) -> Optional[Dict[str, str]]:
        """
        Eliminate digit from square's possibilities.
        
        Propagates constraints:
        1. If square reduced to one value, eliminate from all peers
        2. If a unit has only one place for a digit, assign it there
        
        Returns values dict, or None if contradiction detected.
        """
        if digit not in values[square]:
            return values  # Already eliminated
        
        values[square] = values[square].replace(digit, "")
        
        # (1) If reduced to zero values, contradiction
        if len(values[square]) == 0:
            return None
        
        # (2) If reduced to one value, eliminate from peers
        if len(values[square]) == 1:
            d2 = values[square]
            if not all(self._eliminate(values, s2, d2) for s2 in self.peers[square]):
                return None
        
        # (3) If a unit has only one place for digit, assign it
        for unit in self.units[square]:
            dplaces = [s for s in unit if digit in values[s]]
            if len(dplaces) == 0:
                return None  # No place for this digit
            elif len(dplaces) == 1:
                if not self._assign(values, dplaces[0], digit):
                    return None
        
        return values
    
    def _search(self, values: Optional[Dict[str, str]]) -> Optional[Dict[str, str]]:
        """
        Depth-first search with constraint propagation.
        
        Returns solved values dict, or None if unsolvable.
        """
        if values is None:
            return None
        
        # Check if solved
        if all(len(values[s]) == 1 for s in self.all_squares):
            return values
        
        # Choose unfilled square with fewest possibilities (MRV heuristic)
        n, square = min(
            (len(values[s]), s) for s in self.all_squares if len(values[s]) > 1
        )
        
        # Try each possible digit
        for digit in values[square]:
            result = self._search(self._assign(copy.deepcopy(values), square, digit))
            if result is not None:
                return result
        
        return None
    
    def solve(self, grids: Dict[str, List[List[int]]]) -> Optional[Dict[str, List[List[int]]]]:
        """
        Solve a Samurai puzzle.
        
        Args:
            grids: Dict mapping grid_id to 9x9 puzzle grid (0 = empty)
            
        Returns:
            Dict mapping grid_id to 9x9 solution grid, or None if unsolvable.
        """
        values = self.parse_grids(grids)
        if values is None:
            return None
        
        solution = self._search(values)
        if solution is None:
            return None
        
        return self._values_to_grids(solution)
    
    def _values_to_grids(self, values: Dict[str, str]) -> Dict[str, List[List[int]]]:
        """Convert solved values back to grid format."""
        result = {}
        
        for grid_id in self.mode.grid_ids:
            grid = [[0] * 9 for _ in range(9)]
            suffix = f"_{grid_id}"
            
            for r in range(9):
                for c in range(9):
                    square = f"{ROWS[r]}{COLS[c]}{suffix}"
                    square = self._get_canonical(square)
                    grid[r][c] = int(values[square])
            
            result[grid_id] = grid
        
        return result
    
    def count_solutions(self, grids: Dict[str, List[List[int]]], max_count: int = 2) -> int:
        """
        Count solutions up to max_count.
        
        Args:
            grids: Puzzle grids
            max_count: Stop counting after this many (default 2 for uniqueness check)
            
        Returns:
            Number of solutions found (capped at max_count)
        """
        values = self.parse_grids(grids)
        if values is None:
            return 0
        
        count = [0]  # Use list for closure
        self._count_recursive(values, count, max_count)
        return count[0]
    
    def _count_recursive(self, values: Optional[Dict[str, str]], count: List[int], max_count: int):
        """Recursively count solutions."""
        if values is None or count[0] >= max_count:
            return
        
        # Check if solved
        if all(len(values[s]) == 1 for s in self.all_squares):
            count[0] += 1
            return
        
        # Choose unfilled square with fewest possibilities
        n, square = min(
            (len(values[s]), s) for s in self.all_squares if len(values[s]) > 1
        )
        
        # Try each possible digit
        for digit in values[square]:
            if count[0] >= max_count:
                return
            self._count_recursive(
                self._assign(copy.deepcopy(values), square, digit),
                count,
                max_count
            )
    
    def is_solved(self, grids: Dict[str, List[List[int]]]) -> bool:
        """Check if grids represent a valid complete solution."""
        # Check all cells are filled
        for grid_id, grid in grids.items():
            for row in grid:
                if 0 in row:
                    return False
        
        # Check all constraints
        values = {}
        for grid_id, grid in grids.items():
            suffix = f"_{grid_id}"
            for r in range(9):
                for c in range(9):
                    square = f"{ROWS[r]}{COLS[c]}{suffix}"
                    square = self._get_canonical(square)
                    values[square] = str(grid[r][c])
        
        # Check each unit
        for unit in self.all_unitlists:
            unit_values = [values.get(s, "") for s in unit if s in values]
            if sorted(unit_values) != list(DIGITS):
                return False
        
        return True


# Convenience functions for the most common mode (samurai)

def solve_samurai(grids: Dict[str, List[List[int]]], mode_id: str = "samurai") -> Optional[Dict[str, List[List[int]]]]:
    """Solve a Samurai/Gattai puzzle."""
    mode = MODES.get(mode_id)
    if mode is None:
        raise ValueError(f"Unknown mode: {mode_id}")
    
    solver = SamuraiSolver(mode)
    return solver.solve(grids)


def count_solutions_samurai(grids: Dict[str, List[List[int]]], mode_id: str = "samurai", max_count: int = 2) -> int:
    """Count solutions for a Samurai/Gattai puzzle."""
    mode = MODES.get(mode_id)
    if mode is None:
        raise ValueError(f"Unknown mode: {mode_id}")
    
    solver = SamuraiSolver(mode)
    return solver.count_solutions(grids, max_count)


def is_solved_samurai(grids: Dict[str, List[List[int]]], mode_id: str = "samurai") -> bool:
    """Check if grids represent a valid complete Samurai/Gattai solution."""
    mode = MODES.get(mode_id)
    if mode is None:
        raise ValueError(f"Unknown mode: {mode_id}")
    
    solver = SamuraiSolver(mode)
    return solver.is_solved(grids)


def parse_samurai_grid(text_grid: List[str], mode_id: str = "samurai") -> Dict[str, List[List[int]]]:
    """
    Parse a text representation of a Samurai puzzle.
    
    For samurai mode, expects 21 lines of 21 characters each.
    '.' or '0' = empty, '1'-'9' = digit, ' ' = not part of any grid.
    """
    mode = MODES.get(mode_id)
    if mode is None:
        raise ValueError(f"Unknown mode: {mode_id}")
    
    result = {grid_id: [[0] * 9 for _ in range(9)] for grid_id in mode.grid_ids}
    
    for grid_id in mode.grid_ids:
        pos_r, pos_c = mode.grid_positions[grid_id]
        
        for r in range(9):
            for c in range(9):
                text_r = pos_r + r
                text_c = pos_c + c
                
                if text_r < len(text_grid) and text_c < len(text_grid[text_r]):
                    char = text_grid[text_r][text_c]
                    if char in DIGITS:
                        result[grid_id][r][c] = int(char)
    
    return result
