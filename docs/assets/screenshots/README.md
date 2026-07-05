# Screenshots & Media Assets

Centralized home for every image used by the site and the project docs. Keeping
them in one place means a picture can be refreshed later without hunting through
Markdown or HTML for hard-coded paths.

## Convention

- Reference each image by a **stable, purpose-based name** (`sudoku-classic.png`,
  `sudoku-gattai.png`) — never by date or difficulty. To update a shot, just overwrite
  the file; every reference picks up the new image automatically.
- Keep new exports at roughly the **same aspect ratio** as the originals
  (portrait, ~768 × 1030) so README layouts don't shift.
- Prefer `.png` for UI screenshots and `.svg` for logos/icons.

## Current assets

| File          | Referenced by  | Shows                                        |
| ------------- | -------------- | -------------------------------------------- |
| `sudoku-classic.png` | root `README`  | Classic single 9×9 board (Extreme difficulty)|
| `sudoku-gattai.png`  | root `README`  | Gattai / Samurai board (Horizon mode)        |

## Swapping an image

1. Export a fresh PNG at a similar size.
2. Overwrite the existing file, keeping the **same filename**.
3. Commit — no other edits required.
