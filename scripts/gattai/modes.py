"""
Gattai Mode Definitions

Defines the geometry of each multi-grid puzzle variant:
- Grid positions (where each 9x9 grid sits in logical space)
- Overlap definitions (which boxes are shared between grids)
- Display names for UI
"""

from dataclasses import dataclass
from typing import Dict, List, Tuple


@dataclass
class Overlap:
    """Defines a shared 3x3 box between two grids."""
    grid1: str      # First grid ID (e.g., "center")
    grid2: str      # Second grid ID (e.g., "nw")
    box1: int       # Box index in grid1 (0-8, row-major)
    box2: int       # Box index in grid2 (0-8, row-major)


@dataclass
class GattaiMode:
    """Defines the geometry of a multi-grid puzzle variant."""
    id: str                                    # Mode identifier
    display_name: str                          # User-facing name
    grid_count: int                            # Number of 9x9 grids
    grid_ids: List[str]                        # Grid identifiers
    grid_positions: Dict[str, Tuple[int, int]] # Top-left corner in logical coords
    overlaps: List[Overlap]                    # Shared box definitions
    logical_size: Tuple[int, int]              # Total logical grid size (rows, cols)


# Box indices in a 9x9 grid (row-major):
# 0 1 2
# 3 4 5
# 6 7 8

MODES: Dict[str, GattaiMode] = {
    "samurai": GattaiMode(
        id="samurai",
        display_name="Samurai",
        grid_count=5,
        grid_ids=["center", "nw", "ne", "sw", "se"],
        grid_positions={
            "center": (6, 6),   # Center grid
            "nw": (0, 0),       # Top-left
            "ne": (0, 12),      # Top-right
            "sw": (12, 0),      # Bottom-left
            "se": (12, 12),     # Bottom-right
        },
        overlaps=[
            Overlap("center", "nw", 0, 8),  # Center box 0 = NW box 8
            Overlap("center", "ne", 2, 6),  # Center box 2 = NE box 6
            Overlap("center", "sw", 6, 2),  # Center box 6 = SW box 2
            Overlap("center", "se", 8, 0),  # Center box 8 = SE box 0
        ],
        logical_size=(21, 21),
    ),
    "twin-nw": GattaiMode(
        id="twin-nw",
        display_name="Horizon",
        grid_count=2,
        grid_ids=["primary", "secondary"],
        grid_positions={
            "primary": (0, 0),
            "secondary": (6, 6),
        },
        overlaps=[
            Overlap("primary", "secondary", 8, 0),  # Primary box 8 = Secondary box 0
        ],
        logical_size=(15, 15),
    ),
    "twin-ne": GattaiMode(
        id="twin-ne",
        display_name="Sunrise",
        grid_count=2,
        grid_ids=["primary", "secondary"],
        grid_positions={
            "primary": (0, 6),
            "secondary": (6, 0),
        },
        overlaps=[
            Overlap("primary", "secondary", 6, 2),  # Primary box 6 = Secondary box 2
        ],
        logical_size=(15, 15),
    ),
    "twin-sw": GattaiMode(
        id="twin-sw",
        display_name="Sunset",
        grid_count=2,
        grid_ids=["primary", "secondary"],
        grid_positions={
            "primary": (6, 0),
            "secondary": (0, 6),
        },
        overlaps=[
            Overlap("primary", "secondary", 2, 6),  # Primary box 2 = Secondary box 6
        ],
        logical_size=(15, 15),
    ),
    "twin-se": GattaiMode(
        id="twin-se",
        display_name="Eclipse",
        grid_count=2,
        grid_ids=["primary", "secondary"],
        grid_positions={
            "primary": (6, 6),
            "secondary": (0, 0),
        },
        overlaps=[
            Overlap("primary", "secondary", 0, 8),  # Primary box 0 = Secondary box 8
        ],
        logical_size=(15, 15),
    ),
}


def get_box_cells(box_index: int) -> List[Tuple[int, int]]:
    """
    Get the 9 cell coordinates (row, col) for a box index.
    
    Box indices are row-major:
    0 1 2
    3 4 5
    6 7 8
    
    Returns list of (row, col) tuples within that box (0-8 local coords).
    """
    box_row = (box_index // 3) * 3
    box_col = (box_index % 3) * 3
    cells = []
    for r in range(3):
        for c in range(3):
            cells.append((box_row + r, box_col + c))
    return cells


def get_overlap_cells(overlap: Overlap) -> List[Tuple[Tuple[str, int, int], Tuple[str, int, int]]]:
    """
    Get pairs of corresponding cells for an overlap.
    
    Returns list of ((grid1_id, row, col), (grid2_id, row, col)) tuples.
    """
    box1_cells = get_box_cells(overlap.box1)
    box2_cells = get_box_cells(overlap.box2)
    
    pairs = []
    for (r1, c1), (r2, c2) in zip(box1_cells, box2_cells):
        pairs.append(((overlap.grid1, r1, c1), (overlap.grid2, r2, c2)))
    
    return pairs
