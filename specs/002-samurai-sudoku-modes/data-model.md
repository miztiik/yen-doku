# Data Model: Samurai Sudoku Multi-Grid Modes

**Feature**: 002-samurai-sudoku-modes  
**Date**: 2026-01-15  
**Status**: Draft

---

## 1. Domain Entities

### 1.1 GattaiMode

Defines the geometry of a multi-grid puzzle variant.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Mode identifier: `samurai`, `twin-nw`, `twin-ne`, `twin-sw`, `twin-se` |
| `displayName` | `string` | User-facing name: "Samurai", "Horizon", "Sunrise", "Sunset", "Eclipse" |
| `gridCount` | `int` | Number of 9×9 grids (2 or 5) |
| `logicalSize` | `{rows: int, cols: int}` | Composite grid dimensions |
| `gridPositions` | `Map<gridId, {row, col}>` | Top-left corner of each grid in logical coords |
| `overlaps` | `Overlap[]` | List of shared box definitions |

### 1.2 Overlap

Defines a shared 3×3 box between two grids.

| Field | Type | Description |
|-------|------|-------------|
| `grid1` | `string` | First grid ID (e.g., "center") |
| `grid2` | `string` | Second grid ID (e.g., "nw") |
| `box1` | `int` | Box index in grid1 (0-8, row-major) |
| `box2` | `int` | Box index in grid2 (0-8, row-major) |

### 1.3 GattaiPuzzle

A complete multi-grid puzzle instance.

| Field | Type | Description |
|-------|------|-------------|
| `date` | `string` | ISO date (YYYY-MM-DD) |
| `mode` | `string` | Mode ID |
| `difficulty` | `string` | `easy`, `medium`, `hard`, `extreme` |
| `clueCount` | `int` | Total clues across all grids |
| `version` | `string` | Schema version (e.g., "1.0") |
| `grids` | `Map<gridId, SubGrid>` | Individual grid data |

### 1.4 SubGrid

An individual 9×9 grid within a Gattai puzzle.

| Field | Type | Description |
|-------|------|-------------|
| `grid` | `int[9][9]` | Puzzle state (0 = empty) |
| `solution` | `int[9][9]` | Complete solution |

### 1.5 GattaiGameState (Browser)

Runtime state for an in-progress Gattai game.

| Field | Type | Description |
|-------|------|-------------|
| `puzzle` | `GattaiPuzzle` | Loaded puzzle data |
| `currentGrids` | `Map<gridId, int[9][9]>` | User's current cell values |
| `pencilMarks` | `Map<gridId, Set[9][9]>` | Pencil marks per cell |
| `selectedCell` | `{gridId, row, col} | null` | Currently selected cell |
| `selectedGrid` | `string | null` | Active grid for highlighting |
| `history` | `Move[]` | Undo stack (max 50 entries) |
| `startTime` | `number` | Timer start timestamp |
| `revealed` | `boolean` | Whether solution was revealed |

### 1.6 Move (Browser)

A single user action for undo/redo.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `string` | `enter`, `erase`, `pencil` |
| `gridId` | `string` | Affected grid |
| `row` | `int` | Cell row (0-8) |
| `col` | `int` | Cell column (0-8) |
| `prevValue` | `int` | Previous cell value |
| `prevPencil` | `int[]` | Previous pencil marks |
| `newValue` | `int` | New cell value |
| `newPencil` | `int[]` | New pencil marks |

---

## 2. Mode Definitions (Static)

```javascript
const GATTAI_MODES = {
  'samurai': {
    id: 'samurai',
    displayName: 'Samurai',
    gridCount: 5,
    logicalSize: { rows: 21, cols: 21 },
    gridPositions: {
      center: { row: 6, col: 6 },
      nw: { row: 0, col: 0 },
      ne: { row: 0, col: 12 },
      sw: { row: 12, col: 0 },
      se: { row: 12, col: 12 }
    },
    overlaps: [
      { grid1: 'center', grid2: 'nw', box1: 0, box2: 8 },
      { grid1: 'center', grid2: 'ne', box1: 2, box2: 6 },
      { grid1: 'center', grid2: 'sw', box1: 6, box2: 2 },
      { grid1: 'center', grid2: 'se', box1: 8, box2: 0 }
    ]
  },
  'twin-nw': {
    id: 'twin-nw',
    displayName: 'Horizon',
    gridCount: 2,
    logicalSize: { rows: 15, cols: 15 },
    gridPositions: {
      primary: { row: 0, col: 0 },
      secondary: { row: 6, col: 6 }
    },
    overlaps: [
      { grid1: 'primary', grid2: 'secondary', box1: 8, box2: 0 }
    ]
  },
  'twin-ne': {
    id: 'twin-ne',
    displayName: 'Sunrise',
    gridCount: 2,
    logicalSize: { rows: 15, cols: 15 },
    gridPositions: {
      primary: { row: 0, col: 6 },
      secondary: { row: 6, col: 0 }
    },
    overlaps: [
      { grid1: 'primary', grid2: 'secondary', box1: 6, box2: 2 }
    ]
  },
  'twin-sw': {
    id: 'twin-sw',
    displayName: 'Sunset',
    gridCount: 2,
    logicalSize: { rows: 15, cols: 15 },
    gridPositions: {
      primary: { row: 6, col: 0 },
      secondary: { row: 0, col: 6 }
    },
    overlaps: [
      { grid1: 'primary', grid2: 'secondary', box1: 2, box2: 6 }
    ]
  },
  'twin-se': {
    id: 'twin-se',
    displayName: 'Eclipse',
    gridCount: 2,
    logicalSize: { rows: 15, cols: 15 },
    gridPositions: {
      primary: { row: 6, col: 6 },
      secondary: { row: 0, col: 0 }
    },
    overlaps: [
      { grid1: 'primary', grid2: 'secondary', box1: 0, box2: 8 }
    ]
  }
};
```

---

## 3. Validation Rules

### 3.1 Standard Sudoku Rules (per grid)

- Each row contains digits 1-9 exactly once
- Each column contains digits 1-9 exactly once
- Each 3×3 box contains digits 1-9 exactly once

### 3.2 Overlap Constraint Rules

- Shared boxes must be identical in both parent grids
- A value placed in a shared cell appears in both grids
- Conflicts in shared cells are highlighted in both grids

### 3.3 Uniqueness Validation

- Composite puzzle must have exactly one solution
- Validated by composite solver during generation

---

## 4. State Transitions

### 4.1 Puzzle Lifecycle

```
[Generated] → [Stored as JSON] → [Loaded in Browser] → [In Progress] → [Completed/Revealed]
```

### 4.2 Cell States

| State | Description | Visual |
|-------|-------------|--------|
| `given` | Pre-filled clue | Bold, non-editable |
| `empty` | No value entered | Light background |
| `user` | User-entered value | Regular font |
| `conflict` | Violates constraints | Red highlight |
| `pencil` | Has pencil marks | Smaller digits |
| `shared` | In overlapping box | Accent border |

---

## 5. Storage Keys (Browser)

Extends existing localStorage pattern:

| Key Pattern | Description |
|-------------|-------------|
| `yen-doku-gattai-{date}-{mode}-{difficulty}` | Saved game state |
| `yen-doku-gattai-best-{mode}-{difficulty}` | Best completion time |

---

## 6. Relationship Diagram

```
GattaiMode (static definition)
    │
    ├── defines → gridPositions[]
    │               └── position of each SubGrid
    │
    └── defines → overlaps[]
                    └── shared boxes between grids

GattaiPuzzle (JSON file)
    │
    ├── references → GattaiMode.id
    │
    └── contains → grids: Map<gridId, SubGrid>
                         └── grid[9][9] + solution[9][9]

GattaiGameState (browser runtime)
    │
    ├── loads → GattaiPuzzle
    │
    ├── tracks → currentGrids (user progress)
    │
    ├── tracks → pencilMarks
    │
    └── manages → history (undo stack)
```
