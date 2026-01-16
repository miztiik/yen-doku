# Feature Specification: Samurai Sudoku Modes

**Feature ID**: 002-samurai-sudoku-modes  
**Status**: ✅ Complete  
**Created**: 2026-01-15  
**Branch**: `002-samurai-sudoku-modes`

---

## 1. Overview

Add a new "Gattai" (multi-grid Sudoku) page to Yen-Doku that supports **five puzzle modes** featuring overlapping Sudoku grids. These are commonly known as **Samurai Sudoku** variants, where corner boxes are shared between adjacent grids.

### Industry Terminology

These puzzle types are known by several names:
- **Samurai Sudoku** (most common for 5-grid cross pattern)
- **Gattai Sudoku** (Japanese for "combined/merged")
- **Butterfly Sudoku** (2-grid diagonal overlap)
- **Windmill Sudoku** (4-grid arrangements)
- **Sumo Sudoku** / **Monster Sudoku** (variant names)

---

## 2. Puzzle Modes

### Mode Naming Convention

Using directional quadrant terminology with creative names:

| Internal ID | Position | Creative Name | Grid Count | Description |
|-------------|----------|---------------|------------|-------------|
| `twin-nw` | Top-Left + Center | **Horizon** | 2 | Two grids, NW corner overlap |
| `twin-ne` | Top-Right + Center | **Sunrise** | 2 | Two grids, NE corner overlap |
| `twin-sw` | Bottom-Left + Center | **Sunset** | 2 | Two grids, SW corner overlap |
| `twin-se` | Bottom-Right + Center | **Eclipse** | 2 | Two grids, SE corner overlap |
| `samurai` | All 5 (Cross) | **Samurai** | 5 | Classic Samurai Sudoku (Gattai-5) |

### Grid Overlap Mechanics

Each overlap shares a **3×3 box**:
- The overlapping box must satisfy constraints from **both** grids simultaneously
- Reduces total cells from `n × 81` to account for shared cells

| Mode | Total Cells | Shared Cells | Unique Cells |
|------|-------------|--------------|--------------|
| Twin (2-grid) | 162 | 9 | 153 |
| Samurai (5-grid) | 405 | 36 (4 corners × 9) | 369 |

---

## 3. Functional Requirements

### FR-1: Generation (Python/GitHub Actions)
- [x] Generate valid Gattai puzzles with guaranteed unique solutions
- [x] Support all 5 mode variants
- [x] Deterministic seeding (date + mode + difficulty)
- [x] Maintain clue count ranges appropriate for puzzle complexity
- [x] Store in extended puzzle JSON format

### FR-2: Validation (Python/GitHub Actions)
- [x] Validate overlapping constraints are satisfied
- [x] Ensure unique solution across the entire composite grid
- [x] Verify each individual sub-grid follows standard Sudoku rules

### FR-3: Rendering (JavaScript/Browser)
- [x] Display composite grid with clear visual separation
- [x] Highlight active grid when cell selected
- [x] Show shared boxes with distinct styling
- [x] Responsive layout for various screen sizes

### FR-4: Gameplay (JavaScript/Browser)
- [x] Cell selection across all grids
- [x] Conflict detection within and across grids
- [x] Pencil marks work across shared cells
- [x] Timer and game state persistence per puzzle mode

### FR-5: Navigation
- [x] New page accessible from home ("Try Gattai Puzzles →" link in footer)
- [x] Mode selector on Gattai page
- [x] Difficulty selector per mode

---

## 4. Data Model

### Extended Puzzle Schema

```json
{
  "date": "YYYY-MM-DD",
  "mode": "samurai|twin-nw|twin-ne|twin-sw|twin-se",
  "difficulty": "easy|medium|hard|extreme",
  "clueCount": 34-180,
  "version": "1.0",
  "grids": {
    "primary": {
      "grid": [[0-9 x9]],
      "solution": [[1-9 x9]]
    },
    "secondary": {
      "grid": [[0-9 x9]],
      "solution": [[1-9 x9]]
    }
  }
}
```

**Note**: Grid positions and overlaps are derived from the mode definition (see data-model.md), not stored per-puzzle.

### Storage Path
```
/docs/puzzles/<year>/gattai/<mode>/<difficulty>/YYYY-MM-DD-001.json
```

---

## 5. UI/UX Design

### Layout Options

**Option A: Canvas-based rendering**
- Single HTML5 canvas
- Custom grid drawing logic
- Good for complex overlap visualization

**Option B: CSS Grid composition**
- Multiple 9×9 grids positioned with CSS
- Overlay shared cells
- Consistent with existing Sudoku rendering

**Recommendation**: Option B (CSS Grid) maintains technology separation and reuses existing cell rendering logic.

### Visual Hierarchy

1. **Individual grids**: Distinct border styling
2. **Shared boxes**: Highlighted background color
3. **Active grid**: Elevated shadow/glow effect
4. **Grid positions**: Offset based on mode geometry

### Responsive Breakpoints

| Breakpoint | Layout Strategy |
|------------|-----------------|
| Desktop (>1024px) | Full composite view |
| Tablet (768-1024px) | Scaled composite |
| Mobile (<768px) | Scrollable/zoomable view |

---

## 6. Technical Constraints

### Generation Complexity

The current solver uses standard 9×9 backtracking. Gattai puzzles require:

1. **Composite grid solver**: Treat overlapping cells as shared constraints
2. **Solution counting**: Must verify uniqueness across all grids
3. **Performance**: 5-grid Samurai with backtracking may be slow

### Estimated Generation Time

| Mode | Cells | Est. Generation Time |
|------|-------|---------------------|
| Twin | 153 | 2-5 seconds |
| Samurai | 369 | 10-60 seconds |

**Mitigation**: Pre-generate and commit like existing puzzles. CI timeout is acceptable.

---

## 7. Non-Functional Requirements

- **NFR-1**: Generation must complete within GitHub Actions 6-hour limit
- **NFR-2**: Browser rendering must achieve 60fps during interaction
- **NFR-3**: Offline support via Service Worker (same as existing)
- **NFR-4**: Accessibility requirements same as standard Sudoku

---

## 8. Out of Scope

- Real-time Gattai generation in browser
- Other Sudoku variants (Killer, Diagonal, etc.)
- Competitive leaderboards
- Custom puzzle creation by users

---

## 9. Open Questions (RESOLVED)

1. **Daily frequency**: ✅ Alternating schedule - even days: easy+medium, odd days: hard+extreme for all 5 modes
2. **Difficulty scaling**: ✅ Defined in data-model.md - twin modes: 34-90 clues, samurai: 68-180 clues
3. **Mobile UX**: ✅ Pinch-zoom via CSS `touch-action: pan-x pan-y pinch-zoom`
4. **Navigation**: ✅ Separate page (`gattai.html`) with mode selector tabs

---

## 10. Success Criteria

1. All 5 puzzle modes generate valid, unique-solution puzzles
2. Puzzles render correctly with clear overlap visualization
3. Game mechanics (select, input, pencil, undo) work across grids
4. Performance meets NFR targets
5. Existing standard Sudoku functionality unaffected
