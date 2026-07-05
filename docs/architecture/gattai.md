# Gattai (Samurai) Modes

**Last Updated**: 2026-07-05

Gattai is Yen-Doku's multi-grid variant: two-to-five 9x9 grids that share 3x3 corner boxes, so a number placed in an overlap must satisfy every grid it belongs to at once. It has its own page ([gattai.html](../gattai.html) + [gattai.js](../gattai.js)) and its own generator ([scripts/gattai/](../../scripts/gattai/)).

## Modes

| Internal id | Name | Grids | Overlap |
| ----------- | ---- | :---: | ------- |
| `twin-nw` | Horizon | 2 | top-left + center |
| `twin-ne` | Sunrise | 2 | top-right + center |
| `twin-sw` | Sunset | 2 | bottom-left + center |
| `twin-se` | Eclipse | 2 | bottom-right + center |
| `samurai` | Samurai | 5 | classic cross (Gattai-5) |

The geometry of every mode - logical grid size, each grid's top-left position, and which boxes overlap - is defined once in [scripts/gattai/modes.py](../../scripts/gattai/modes.py) (`GATTAI_MODES`). Treat that table as the source of truth; do not re-derive positions in the client.

## Overlap mechanics

- Each overlap is a **shared 3x3 box** that belongs to two grids at once; the box must be identical in both, so a value in a shared cell appears in - and is constrained by - both grids.
- A twin (2-grid) puzzle has 162 total cells, 9 shared, 153 unique. A Samurai (5-grid) puzzle has 405 total cells, 36 shared (four corners x 9), 369 unique.
- Conflicts in a shared cell are highlighted in both parent grids.

## Generation

Gattai generation ([scripts/gattai/generator.py](../../scripts/gattai/generator.py)) treats the overlaps as shared constraints and must verify a **single unique solution across the whole composite**, not just per grid ([scripts/gattai/solver.py](../../scripts/gattai/solver.py), [scripts/gattai/validator.py](../../scripts/gattai/validator.py)). Because a 5-grid backtracking solve is expensive, puzzles are pre-generated and committed in CI (`generate-gattai.yml`), exactly like classic puzzles - the browser never generates.

Storage path:

```text
docs/puzzles/<year>/gattai/<mode>/<difficulty>/YYYY-MM-DD-001.json
```

## Rendering

The composite is drawn with **CSS Grid composition** - multiple 9x9 grids positioned by mode geometry with the shared boxes overlaid - rather than a canvas, so it reuses the classic cell-rendering logic. The active grid is elevated on selection, shared boxes get distinct styling, and the layout scales down (scroll/zoom on small screens) with `touch-action` allowing pinch-zoom.

## See also

- [architecture/overview.md](overview.md) - the shared generate-validate-serve pipeline.
- [architecture/frontend.md](frontend.md) - state, persistence, and timer shared with Classic.
- [reference/data-contracts.md](../reference/data-contracts.md) - the Gattai puzzle JSON shape.
- [../../specs/002-samurai-sudoku-modes/](../../specs/002-samurai-sudoku-modes/) - the original feature spec and canonical JSON schemas.
