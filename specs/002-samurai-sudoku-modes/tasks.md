# Tasks: Samurai Sudoku Multi-Grid Modes

**Feature**: 002-samurai-sudoku-modes  
**Input**: Design documents from `/specs/002-samurai-sudoku-modes/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Backend Status**: ✅ COMPLETE (solver, generator, validator, CLI, 20/20 tests passing)  
**Frontend Status**: ✅ COMPLETE (gattai.html, gattai.js, gattai.css, generate-gattai.yml)  
**All 57 Tasks**: ✅ COMPLETE

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## User Stories (from spec.md)

| Story | Priority | Description | Status |
|-------|----------|-------------|--------|
| US1 | P1 | **Rendering** - Display composite grid with clear visual separation | ✅ Complete |
| US2 | P2 | **Gameplay** - Cell selection, input, conflict detection, pencil marks | ✅ Complete |
| US3 | P3 | **Game State** - Timer, persistence, undo/redo | ✅ Complete |
| US4 | P4 | **CI Integration** - Daily Gattai puzzle generation | ✅ Complete |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create file structure and shared constants

- [X] T001 Create docs/gattai.html with basic HTML structure (mode selector, grid container, controls)
- [X] T002 [P] Create docs/gattai.css with CSS custom properties matching existing style.css
- [X] T003 [P] Create docs/gattai.js with module structure and GATTAI_MODES constant from data-model.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Implement puzzle loader `loadGattaiPuzzle(date, mode, difficulty)` in docs/gattai.js
- [X] T005 [P] Implement URL parameter parsing for `?mode=`, `?difficulty=`, `?date=` in docs/gattai.js
- [X] T006 [P] Add GATTAI_MODES geometry definitions (gridPositions, overlaps) in docs/gattai.js
- [X] T007 Implement `getOverlappingCells(mode)` utility to identify shared cells in docs/gattai.js

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Rendering (Priority: P1) 🎯 MVP

**Goal**: Display Gattai puzzles with correct multi-grid layout and overlap visualization

**Independent Test**: Load any twin puzzle, verify both 9×9 grids display with shared 3×3 box highlighted

### Implementation for User Story 1

- [X] T008 [US1] Implement `createGridElement(gridId, gridData, position)` in docs/gattai.js
- [X] T009 [US1] Implement `renderGattaiPuzzle(puzzle)` compositing grids via CSS positioning in docs/gattai.js
- [X] T010 [P] [US1] Add CSS Grid layout for 21×21 logical grid (samurai) in docs/gattai.css
- [X] T011 [P] [US1] Add CSS Grid layout for 15×15 logical grid (twin modes) in docs/gattai.css
- [X] T012 [US1] Style shared cells with `.cell.shared` class (accent border, distinct background) in docs/gattai.css
- [X] T013 [US1] Implement grid positioning based on mode geometry (absolute positioning) in docs/gattai.css
- [X] T014 [P] [US1] Add `.gattai-grid.active` elevation styling (shadow/glow) in docs/gattai.css
- [X] T015 [US1] Implement responsive scaling (viewport-based cell size) in docs/gattai.css
- [X] T016 [US1] Add mode selector UI component rendering in docs/gattai.js
- [X] T017 [US1] Add difficulty selector UI component rendering in docs/gattai.js
- [X] T018 [US1] Wire mode/difficulty selectors to trigger puzzle reload in docs/gattai.js

**Checkpoint**: Gattai puzzles render correctly for all 5 modes with visual overlap distinction

---

## Phase 4: User Story 2 - Gameplay Mechanics (Priority: P2)

**Goal**: Enable interactive puzzle solving with conflict detection across grids

**Independent Test**: Select cell in shared box, enter value, verify conflict appears in BOTH grids if invalid

### Implementation for User Story 2

- [X] T019 [US2] Implement cell selection with `selectCell(gridId, row, col)` in docs/gattai.js
- [X] T020 [US2] Highlight row, column, and 3×3 box within active grid on selection in docs/gattai.js
- [X] T021 [US2] Implement number input handler `handleNumberInput(value)` in docs/gattai.js
- [X] T022 [US2] Implement `checkConflicts(gridId, row, col, value)` for single-grid rules in docs/gattai.js
- [X] T023 [US2] Extend conflict detection to check overlapping cells across grids in docs/gattai.js
- [X] T024 [P] [US2] Add conflict styling `.cell.conflict` (red highlight) in docs/gattai.css
- [X] T025 [US2] Implement pencil mark mode toggle and rendering in docs/gattai.js
- [X] T026 [US2] Sync pencil marks for shared cells (value in one grid appears in both) in docs/gattai.js
- [X] T027 [US2] Implement keyboard navigation (arrow keys across grids) in docs/gattai.js
- [X] T028 [US2] Add number pad UI for touch input in docs/gattai.html and docs/gattai.js

**Checkpoint**: Users can solve puzzles with full conflict detection and pencil marks across all grids

---

## Phase 5: User Story 3 - Game State & Persistence (Priority: P3)

**Goal**: Timer, save/load game state, undo/redo functionality

**Independent Test**: Partially solve puzzle, refresh page, verify progress restored from localStorage

### Implementation for User Story 3

- [X] T029 [US3] Implement `saveGameState()` to localStorage key `yen-doku-gattai-{date}-{mode}-{difficulty}` in docs/gattai.js
- [X] T030 [US3] Implement `loadGameState()` to restore progress on page load in docs/gattai.js
- [X] T031 [US3] Implement move history (push on each move, max 50 entries per constitution) in docs/gattai.js
- [X] T032 [US3] Implement `undo()` function using move history in docs/gattai.js
- [X] T033 [P] [US3] Add undo button to controls UI in docs/gattai.html
- [X] T034 [US3] Implement timer display with start/pause/resume in docs/gattai.js
- [X] T035 [US3] Store elapsed time in game state (persist across page refresh) in docs/gattai.js
- [X] T036 [US3] Implement victory detection (all grids complete, no conflicts) in docs/gattai.js
- [X] T037 [US3] Add victory celebration and best time tracking per mode/difficulty in docs/gattai.js
- [X] T038 [US3] Implement "Reveal Solution" with confirmation dialog in docs/gattai.js
- [X] T039 [US3] Implement "New Game" / reset functionality in docs/gattai.js
- [X] T040 [P] [US3] Add cleanup of saves older than 7 days on app init in docs/gattai.js

**Checkpoint**: Full game experience with persistence, undo, timer, and victory tracking

---

## Phase 6: User Story 4 - CI Integration (Priority: P4)

**Goal**: Automated daily Gattai puzzle generation via GitHub Actions

**Independent Test**: Manually trigger workflow, verify puzzles generated in correct directory structure

### Implementation for User Story 4

- [X] T041 [US4] Create `.github/workflows/generate-gattai.yml` workflow file
- [X] T042 [US4] Add cron schedule (daily after standard puzzle generation) in generate-gattai.yml
- [X] T043 [US4] Add generation step calling `python scripts/generate_gattai.py` for all modes in generate-gattai.yml
- [X] T044 [US4] Implement alternating difficulty schedule (Day 1: easy+medium, Day 2: hard+extreme) in generate_gattai.py
- [X] T045 [P] [US4] Add puzzle directory creation (docs/puzzles/YYYY/gattai/<mode>/<difficulty>/) in generate_gattai.py
- [X] T046 [US4] Add git commit and push step for generated puzzles in generate-gattai.yml
- [X] T047 [US4] Add workflow dispatch for manual triggering in generate-gattai.yml
- [X] T048 [US4] Add validation step (run validator on generated puzzles before commit) in generate-gattai.yml

**Checkpoint**: Daily Gattai puzzles auto-generated and committed to repository

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T049 [P] Add Service Worker registration for offline Gattai puzzle caching in docs/gattai.js
- [X] T050 [P] Update docs/sw.js to cache gattai.html, gattai.js, gattai.css
- [X] T051 [P] Add ARIA labels for accessibility on all Gattai grid cells and controls in docs/gattai.html
- [X] T052 Add dark mode support using existing CSS custom properties in docs/gattai.css
- [X] T053 [P] Add mobile touch gesture support (pinch-zoom) in docs/gattai.js
- [X] T054 Add loading state UI while puzzle fetches in docs/gattai.js
- [X] T055 Add error handling for missing/invalid puzzle files in docs/gattai.js
- [X] T056 Run quickstart.md validation (generate puzzle, view in browser, test gameplay)
- [X] T057 [P] Update docs/puzzles/README.md with Gattai puzzle documentation

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup ──────────────────────────────────────────────────────┐
                                                                      │
Phase 2: Foundational ◄──────────────────────────────────────────────┤
         (BLOCKS ALL USER STORIES)                                    │
                                                                      ▼
Phase 3: US1 Rendering ──────► Phase 4: US2 Gameplay ──────► Phase 5: US3 State
         (MVP - can deploy)              (builds on US1)            (builds on US1+US2)
                                                                      │
Phase 6: US4 CI ◄───────────────────────────────(can run in parallel)┘
                                                                      
Phase 7: Polish ◄──────────────────────────────────────────── All Stories Complete
```

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|------------|-------------------|
| US1 (Rendering) | Foundational | - |
| US2 (Gameplay) | US1 (needs rendered grid) | - |
| US3 (State) | US2 (needs gameplay events) | - |
| US4 (CI) | Foundational only | US1, US2, US3 |

### Within Each User Story

- CSS tasks marked [P] can run in parallel with each other
- JS rendering before JS event handlers
- Core implementation before integration
- Story complete = checkpoint validation passed

### Parallel Opportunities

```bash
# Phase 1 - All in parallel:
T001, T002, T003 can run simultaneously

# Phase 2 - Partial parallel:
T005, T006 can run in parallel
T004 then T007 (T007 depends on mode definitions)

# US1 - CSS tasks in parallel:
T010, T011, T014 can run simultaneously

# US4 - Fully parallel with US1-US3:
All T041-T048 can proceed while frontend work continues
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T007)
3. Complete Phase 3: User Story 1 (T008-T018)
4. **STOP and VALIDATE**: Generate a twin puzzle, load in browser, verify rendering
5. Deploy MVP - users can VIEW puzzles (not solve yet)

### Incremental Delivery

1. **MVP (Phase 1-3)**: View puzzles → Deploy
2. **+US2 (Phase 4)**: Solve puzzles → Deploy  
3. **+US3 (Phase 5)**: Save progress, undo, timer → Deploy
4. **+US4 (Phase 6)**: Daily auto-generation → Deploy
5. **Polish (Phase 7)**: Accessibility, offline, error handling

### Parallel Team Strategy

With 2 developers:
- **Dev A**: US1 → US2 → US3 (frontend flow)
- **Dev B**: US4 (CI workflow, can start immediately after Foundational)

---

## Summary

| Phase | Tasks | Parallel Opportunities | Estimated Effort |
|-------|-------|------------------------|------------------|
| Phase 1: Setup | T001-T003 (3) | All parallel | Small |
| Phase 2: Foundational | T004-T007 (4) | Partial | Small |
| Phase 3: US1 Rendering | T008-T018 (11) | CSS parallel | Medium |
| Phase 4: US2 Gameplay | T019-T028 (10) | Limited | Medium |
| Phase 5: US3 State | T029-T040 (12) | Some parallel | Medium |
| Phase 6: US4 CI | T041-T048 (8) | With US1-US3 | Small |
| Phase 7: Polish | T049-T057 (9) | Most parallel | Small |
| **Total** | **57 tasks** | | |

### Task Breakdown by User Story

- **Setup/Foundational**: 7 tasks (no story label)
- **US1 Rendering**: 11 tasks
- **US2 Gameplay**: 10 tasks  
- **US3 State**: 12 tasks
- **US4 CI**: 8 tasks
- **Polish**: 9 tasks (no story label)

### Independent Test Criteria

| Story | How to Verify Independently |
|-------|----------------------------|
| US1 | Load twin puzzle, see 2 grids with highlighted overlap |
| US2 | Click cell, enter number, see conflict in shared cell |
| US3 | Partially solve, refresh, verify progress restored |
| US4 | Run workflow manually, check puzzle files committed |

### Format Validation ✅

All 57 tasks follow the required format:
- `- [ ]` checkbox prefix
- `[TXXX]` sequential ID
- `[P]` marker for parallelizable tasks
- `[US#]` story label for user story tasks
- File path included in description
