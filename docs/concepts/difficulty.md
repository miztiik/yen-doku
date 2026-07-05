# Difficulty

**Last Updated**: 2026-07-05

A puzzle's difficulty is determined by its **clue count** - the number of pre-filled cells. Fewer clues means more of the grid to deduce, which means a harder solve.

| Difficulty | Clue count |
| ---------- | :--------: |
| Easy | 40-45 |
| Medium | 32-39 |
| Hard | 26-31 |
| Extreme | 17-25 |

Classification is a single function, `score_difficulty`, in [scripts/difficulty.py](../../scripts/difficulty.py): `>= 40` is Easy, `>= 32` Medium, `>= 26` Hard, otherwise Extreme. The generator uses the matching `get_clue_range` to target a band. Treat `difficulty.py` as the authoritative source - these numbers are not duplicated in the browser client, which only reads the `difficulty` field already written into each puzzle.

The classic clue range overall is 17-45. Gattai puzzles have their own, larger clue totals because they span multiple grids (see [architecture/gattai.md](../architecture/gattai.md)).

## See also

- [architecture/overview.md](../architecture/overview.md) - where difficulty is scored in the pipeline.
- [reference/data-contracts.md](../reference/data-contracts.md) - the `difficulty` and `clueCount` fields in puzzle JSON.
