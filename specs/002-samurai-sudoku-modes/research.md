# Research: Samurai Sudoku Multi-Grid Modes

**Feature**: 002-samurai-sudoku-modes  
**Date**: 2026-01-15  
**Status**: Complete

---

## 1. Samurai Sudoku Algorithm Research

### 1.1 Can the Current Generator Create Gattai Puzzles?

**Decision**: NO - Current generator cannot create Gattai puzzles directly.

**Rationale**: 
- Current `generate.py` uses `py-sudoku` library which only supports standard 9×9 grids
- Current `solver.py` uses 9×9 backtracking without overlap awareness
- Gattai puzzles require solving multiple grids simultaneously with shared constraints

**Open Source Library Survey** (conducted 2026-01-15):

| Library | Type | Samurai Support | Generator | Verdict |
|---------|------|-----------------|-----------|---------|
| `bryanlimy/samurai-sudoku-solver` | Python | ✅ Solver | ❌ No | CSP approach, MIT licensed, 8 stars |
| `ricrogz/sudoku_pulp` | Python | ✅ Solver | ❌ No | Uses PuLP linear programming |
| `py-sudoku` | Python | ❌ No | ✅ Yes | Standard 9×9 only (current dependency) |
| `sudoku-core` | TypeScript | ❌ No | ✅ Yes | 9×9 only, good step-by-step API |
| `@algorithm.ts/sudoku` | TypeScript | ❌ No | ✅ Yes | 9×9/16×16, no multi-grid |

**Finding**: No production-ready Samurai/Gattai **generators** exist. Only solvers.

**Alternatives Considered**:
1. **Fork py-sudoku**: Too complex, library internals not designed for composition
2. **Post-hoc merging**: Generate independent grids and merge overlaps - REJECTED (no uniqueness guarantee)
3. **Adapt bryanlimy/samurai-sudoku-solver**: Could use for verification - PARTIAL
4. **Custom composite solver**: Build from scratch with overlap-aware backtracking - SELECTED

**Recommendation**: Build custom `CompositeGrid` solver, optionally reference bryanlimy's CSP approach for validation logic.

### 1.2 Composite Grid Solving Approach

**Decision**: Build a `CompositeGrid` class that treats the entire multi-grid puzzle as one constraint system.

**Rationale**:
- Shared boxes must satisfy both parent grids simultaneously
- Standard backtracking works, but needs modified constraint checking
- Cell positions mapped to global coordinates

**Key Implementation Details**:

```python
class CompositeGrid:
    """
    Represents a multi-grid Samurai puzzle as a single constraint system.
    
    For 5-grid Samurai (21x21 logical grid with gaps):
    - Center grid: rows 6-14, cols 6-14
    - NW grid: rows 0-8, cols 0-8
    - NE grid: rows 0-8, cols 12-20
    - SW grid: rows 12-20, cols 0-8
    - SE grid: rows 12-20, cols 12-20
    
    Overlapping 3x3 boxes:
    - NW↔Center: NW box 8 = Center box 0 (rows 6-8, cols 6-8)
    - NE↔Center: NE box 6 = Center box 2 (rows 6-8, cols 12-14)
    - SW↔Center: SW box 2 = Center box 6 (rows 12-14, cols 6-8)
    - SE↔Center: SE box 0 = Center box 8 (rows 12-14, cols 12-14)
    """
```

### 1.3 Generation Strategy

**Decision**: Generate center grid first, then propagate constraints to corner grids.

**Rationale**:
- Center grid has 4 overlapping boxes (most constraints)
- Generate center → lock overlapping boxes → generate corners
- Each corner only shares 1 box with center

**Algorithm**:
1. Generate complete solution for center grid
2. For each corner position:
   a. Copy shared 3×3 box from center
   b. Generate remaining 8 boxes using constraint propagation
   c. Verify solution exists
3. Remove clues from composite while maintaining uniqueness
4. Verify exactly one solution via composite solver

---

## 2. Mode Geometry Definitions

### 2.1 Coordinate System

**Decision**: Use absolute coordinates for the composite logical grid.

| Mode | Logical Grid Size | Grid Positions |
|------|-------------------|----------------|
| `twin-nw` | 15×15 | A: (0,0), B: (6,6) |
| `twin-ne` | 15×15 | A: (0,6), B: (6,0) |
| `twin-sw` | 15×15 | A: (6,0), B: (0,6) |
| `twin-se` | 15×15 | A: (6,6), B: (0,0) |
| `samurai` | 21×21 | Center: (6,6), NW: (0,0), NE: (0,12), SW: (12,0), SE: (12,12) |

### 2.2 Overlap Definitions

```python
TWIN_OVERLAPS = {
    'twin-nw': {'grids': (0, 1), 'box_a': 8, 'box_b': 0},  # A's box 8 = B's box 0
    'twin-ne': {'grids': (0, 1), 'box_a': 6, 'box_b': 2},
    'twin-sw': {'grids': (0, 1), 'box_a': 2, 'box_b': 6},
    'twin-se': {'grids': (0, 1), 'box_a': 0, 'box_b': 8},
}

SAMURAI_OVERLAPS = [
    {'grids': ('center', 'nw'), 'box_center': 0, 'box_corner': 8},
    {'grids': ('center', 'ne'), 'box_center': 2, 'box_corner': 6},
    {'grids': ('center', 'sw'), 'box_center': 6, 'box_corner': 2},
    {'grids': ('center', 'se'), 'box_center': 8, 'box_corner': 0},
]
```

---

## 3. Difficulty Scaling for Gattai

### 3.1 Clue Count Ranges

**Decision**: Scale clue counts proportionally to grid complexity.

**Rationale**:
- Standard Sudoku: 17-35 clues (17 is theoretical minimum)
- Twin (2 grids, 153 unique cells): Scale by 1.88x
- Samurai (5 grids, 369 unique cells): Scale by 4.55x

| Difficulty | Standard (81) | Twin (153) | Samurai (369) |
|------------|---------------|------------|---------------|
| Easy | 36-40 | 68-75 | 164-182 |
| Medium | 30-35 | 57-66 | 137-159 |
| Hard | 25-29 | 47-55 | 114-132 |
| Extreme | 20-24 | 38-45 | 91-109 |

### 3.2 Difficulty Assessment

**Decision**: Count clues per grid and ensure balanced distribution.

**Rationale**:
- Avoid puzzles where one grid is trivial and another is impossible
- Each grid should be within ±20% of average clues per grid

---

## 4. UI/UX Rendering Strategy

### 4.1 CSS Grid Layout

**Decision**: Use CSS Grid with absolute positioning for overlap.

**Rationale**:
- Maintains existing cell rendering logic
- CSS Grid handles gap cells (areas outside grids)
- Z-index manages overlap stacking

**Implementation Approach**:

```css
.gattai-container {
    display: grid;
    grid-template-columns: repeat(21, var(--cell-size));
    grid-template-rows: repeat(21, var(--cell-size));
    gap: 0;
}

.gattai-grid {
    display: grid;
    grid-template-columns: repeat(9, 1fr);
    grid-template-rows: repeat(9, 1fr);
    position: absolute;
}

.gattai-grid.center { top: calc(6 * var(--cell-size)); left: calc(6 * var(--cell-size)); }
.gattai-grid.nw { top: 0; left: 0; }
/* ... etc */
```

### 4.2 Shared Cell Handling

**Decision**: Render shared cells once with visual indicator.

**Rationale**:
- Duplicate rendering causes input/display conflicts
- Use CSS to show shared status (border accent, subtle background)

```css
.cell.shared {
    --cell-bg: var(--shared-accent);
    border: 2px solid var(--overlap-border);
}
```

### 4.3 Mobile/Responsive Strategy

**Decision**: Pinch-zoom with full composite view.

**Rationale**:
- Grid switching adds cognitive load
- Native pinch-zoom is familiar
- Minimum cell size: 32px for touch targets

**Alternatives Considered**:
1. Tab-based grid switching - REJECTED (breaks holistic solving)
2. Horizontal scroll - REJECTED (awkward for square layouts)
3. Pinch-zoom - SELECTED (natural, works for all modes)

---

## 5. Performance Considerations

### 5.1 Generation Performance

**Decision**: Accept longer generation times; pre-generate in CI.

**Estimated Times (on GitHub Actions runner)**:
- Twin puzzles: 5-15 seconds
- Samurai puzzles: 30-120 seconds
- Full daily generation (20 puzzles): 10-40 minutes

**Mitigation**: CI cron job has ample time. Generation is idempotent.

### 5.2 Browser Rendering Performance

**Decision**: Lazy DOM creation; only render visible cells.

**Rationale**:
- Samurai: 369 cells × 9 pencil marks = 3,321 potential DOM nodes
- Optimize by creating DOM on demand
- Use CSS containment for paint optimization

```css
.gattai-grid {
    contain: layout style paint;
}
```

---

## 6. Storage Schema Decision

### 6.1 File Format

**Decision**: Single JSON file per puzzle with embedded grid array.

**Rationale**:
- Maintains atomic puzzle files
- Consistent with existing standard puzzles
- Overlaps computed from mode definition

**Schema**:

```json
{
  "date": "2026-01-15",
  "mode": "samurai",
  "difficulty": "medium",
  "clueCount": 145,
  "version": "1.0",
  "grids": {
    "center": { "grid": [[...]], "solution": [[...]] },
    "nw": { "grid": [[...]], "solution": [[...]] },
    "ne": { "grid": [[...]], "solution": [[...]] },
    "sw": { "grid": [[...]], "solution": [[...]] },
    "se": { "grid": [[...]], "solution": [[...]] }
  }
}
```

---

## 7. Naming Convention Decision

### 7.1 Mode Names (User-Facing)

**Decision**: Use evocative names based on visual pattern.

| Mode ID | Display Name | Visual Metaphor |
|---------|--------------|-----------------|
| `twin-nw` | **Horizon** | Two suns on horizon (left-leaning) |
| `twin-ne` | **Sunrise** | Rising sun (right-leaning) |
| `twin-sw` | **Sunset** | Setting sun (left, below) |
| `twin-se` | **Eclipse** | Overlapping circles (right, below) |
| `samurai` | **Samurai** | Classic cross pattern (industry standard name) |

**Rationale**:
- "Samurai" is well-known; retain industry term
- Twin modes need differentiation; celestial theme is memorable
- Avoid technical terms (NW/NE/SW/SE) in UI

---

## 8. Daily Generation Strategy

### 8.1 Puzzle Rotation

**Decision**: Generate all modes daily, but stagger difficulties.

**Schedule**:
- Day 1: All modes at easy + medium
- Day 2: All modes at hard + extreme
- Alternating provides variety without 20 puzzles/day

**Alternative Considered**: Single mode per day rotation - REJECTED (users want mode choice)

---

## 9. Summary of Key Decisions

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Generator | Custom composite solver | py-sudoku can't handle overlaps |
| Generation order | Center-first strategy | Center has most constraints |
| Coordinate system | Absolute logical grid | Simplifies overlap calculations |
| Rendering | CSS Grid + absolute positioning | Reuses existing cell logic |
| Mobile UX | Pinch-zoom | Natural, familiar interaction |
| Storage | Single JSON per puzzle | Atomic, consistent with existing |
| Naming | Celestial theme for twins | Memorable, avoids technical terms |
| Daily schedule | All modes, alternating difficulty | Variety + manageable generation |

---

## 10. Unresolved Items (Deferred)

1. **Navigation from home page**: Separate spec for app navigation
2. **Animation for grid transitions**: V2 enhancement
3. **Print stylesheet for Gattai**: Low priority
