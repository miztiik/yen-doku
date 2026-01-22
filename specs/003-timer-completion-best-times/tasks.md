# Tasks: Timer, Completion State, and Best Times

**Branch**: `003-timer-completion-best-times` | **Date**: 2026-01-22  
**Input**: Design documents from `/specs/003-timer-completion-best-times/`

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[US1]**: Timer Pause/Resume feature
- **[US2]**: Top 3 Best Times feature  
- **[US3]**: Completion State Persistence feature
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add state properties and constants needed by all features

- [X] T001 Add `elapsedBeforePause: 0` to state object in docs/app.js
- [X] T002 [P] Add storage key constants (`BEST_TIMES_PREFIX`, `COMPLETION_PREFIX`) in docs/app.js
- [X] T003 [P] Add `COMPLETION_RETENTION_DAYS = 30` constant in docs/app.js

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities that multiple features depend on

**⚠️ CRITICAL**: User story implementation depends on these utilities

- [X] T004 Implement `getElapsedTime()` function in docs/app.js
- [X] T005 [P] Implement `migrateBestTimes()` to convert `yen-doku-best-{diff}` (string) → `yen-doku-best-times-{diff}` (array) in docs/app.js
- [X] T006 [P] Implement `cleanupOldCompletions()` cleanup utility in docs/app.js
- [X] T007 Call migration and cleanup in `init()` function in docs/app.js

**Checkpoint**: Foundation ready - feature implementation can begin

---

## Phase 3: User Story 1 - Timer Pause/Resume (Priority: P0) 🎯 MVP

**Goal**: Timer pauses when tab is hidden, resumes when visible

**Independent Test**: Switch tabs during puzzle - timer should not advance while hidden

### Implementation for User Story 1

- [X] T008 [US1] Implement `pauseTimer()` function in docs/app.js
- [X] T009 [US1] Implement `resumeTimer()` function in docs/app.js
- [X] T010 [US1] Add `visibilitychange` event listener with `handleVisibilityChange()` that calls `pauseTimer()` + `saveGame()` on hidden and `resumeTimer()` on visible in docs/app.js
- [X] T011 [US1] Update `saveGame()` to include `elapsedBeforePause` in docs/app.js
- [X] T012 [US1] Update `resumeGame()` to restore `elapsedBeforePause` in docs/app.js
- [X] T013 [US1] Update `loadPuzzle()` to initialize `elapsedBeforePause: 0` in docs/app.js
- [X] T014 [US1] Update `showVictoryModal()` to use `getElapsedTime()` in docs/app.js

**Checkpoint**: Timer pauses/resumes correctly on tab switch

---

## Phase 4: User Story 2 - Top 3 Best Times (Priority: P1)

**Goal**: Store top 3 best times per difficulty with rank display

**Independent Test**: Complete 4 puzzles - only top 3 times kept, rank badge shown

### Implementation for User Story 2

- [X] T015 [US2] Implement `getBestTimes(difficulty)` function in docs/app.js
- [X] T016 [US2] Implement `saveBestTime(difficulty, ms, date)` returning rank in docs/app.js
- [X] T017 [US2] Update `getBestTime()` for backward compatibility in docs/app.js
- [X] T018 [US2] Update `showVictoryModal()` to show rank badge (🥇🥈🥉) in docs/app.js
- [X] T019 [US2] Add mini leaderboard HTML to victory modal in docs/app.js

**Checkpoint**: Best times stored as array, rank displayed on victory

---

## Phase 5: User Story 3 - Completion State Persistence (Priority: P1)

**Goal**: Completed puzzles show solved state with badge and Play Again option

**Independent Test**: Complete puzzle, close browser, return - shows solved grid with badge

### Implementation for User Story 3

- [X] T020 [US3] Implement `getCompletionKey(date, difficulty)` in docs/app.js
- [X] T021 [US3] Implement `saveCompletion(date, difficulty, timeMs)` in docs/app.js
- [X] T022 [US3] Implement `getCompletion(date, difficulty)` in docs/app.js
- [X] T023 [US3] Implement `clearCompletion(date, difficulty)` in docs/app.js
- [X] T024 [US3] Implement `isCompleted(date, difficulty)` helper in docs/app.js
- [X] T025 [US3] Update `checkWin()` to call `saveCompletion()` in docs/app.js
- [X] T026 [US3] Update `loadPuzzle()` to check completion before loading in docs/app.js
- [X] T027 [US3] Implement `showCompletedPuzzle(date, difficulty, completion)` in docs/app.js
- [X] T028 [US3] Implement `showCompletionBadge(timeMs)` in docs/app.js
- [X] T029 [US3] Implement `hideCompletionBadge()` in docs/app.js
- [X] T030 [US3] Implement `showNextChallengeSuggestion(date, difficulty)` in docs/app.js
- [X] T031 [US3] Implement `hideNextChallengeSuggestion()` in docs/app.js
- [X] T032 [US3] Implement `playAgain()` function in docs/app.js
- [X] T033 [US3] Update `doReset()` to clear completion if was completed in docs/app.js

**Checkpoint**: Completed puzzles persist and display correctly

---

## Phase 6: Gattai Parity

**Purpose**: Mirror all changes in gattai.js with mode-aware keys

- [X] T034 [P] Add state properties (`elapsedBeforePause`) to docs/gattai.js
- [X] T035 [P] Add storage key constants with gattai prefixes in docs/gattai.js
- [X] T036 [P] [US1] Implement timer pause/resume functions in docs/gattai.js
- [X] T037 [P] [US1] Add `visibilitychange` handler in docs/gattai.js
- [X] T038 [P] [US2] Implement best times functions with mode parameter in docs/gattai.js
- [X] T039 [P] [US2] Update `showVictoryModal()` for rank display in docs/gattai.js
- [X] T040 [P] [US3] Implement completion functions with mode parameter in docs/gattai.js
- [X] T041 [P] [US3] Update `loadPuzzle()` for completion check in docs/gattai.js
- [X] T042 [P] [US3] Implement completed puzzle UI functions in docs/gattai.js
- [X] T043 [P] Implement migration and cleanup for gattai keys in docs/gattai.js

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Styles and regression testing

- [X] T044 [P] Add `.completion-badge` CSS (flex, padding, background: var(--success), border-radius, font-weight) in docs/style.css
- [X] T045 [P] Add `.next-challenge` CSS (flex, gap, margin-top) and button styles (`.btn-play-again`, `.btn-next-difficulty`) in docs/style.css
- [X] T046 [P] Add `.rank-badge` CSS (font-size, color: var(--accent)) and `.best-times-list` / `.best-time-row` leaderboard styles in docs/style.css
- [X] T047 [P] Add `.grid.completed .cell` CSS (opacity: 0.8, pointer-events: none) in docs/style.css
- [X] T048 [P] Copy new CSS styles to docs/gattai.css
- [X] T049 [P] Add graceful fallback if Page Visibility API unavailable (timer continues, no crash) in docs/app.js and docs/gattai.js
- [X] T050 [P] Add try-catch error handling for localStorage quota exceeded with user warning toast in docs/app.js and docs/gattai.js
- [ ] T051 Manual regression test: Timer pause/resume in app.js
- [ ] T052 Manual regression test: Best times storage and display
- [ ] T053 Manual regression test: Completion state lifecycle
- [ ] T054 Manual regression test: Play Again clears badge
- [ ] T055 Manual regression test: All features in gattai.js
- [ ] T056 Manual regression test: Verify old `yen-doku-best-{diff}` migrates to `yen-doku-best-times-{diff}` array format

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phases 3-5)**: All depend on Foundational phase
  - US1 (Timer): Can proceed immediately after Foundational
  - US2 (Best Times): Can proceed in parallel with US1
  - US3 (Completion): Can proceed in parallel with US1 and US2
- **Gattai (Phase 6)**: Can start after Phase 2, mirrors app.js changes
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Independence

- **US1 (Timer)**: Fully independent - no dependencies on US2 or US3
- **US2 (Best Times)**: Fully independent - uses `getElapsedTime()` from foundation
- **US3 (Completion)**: Fully independent - uses `getElapsedTime()` from foundation

### Parallel Opportunities

```text
After Phase 2 (Foundational) completes:

┌──────────────────┬──────────────────┬──────────────────┐
│  US1 (Timer)     │  US2 (Best)      │  US3 (Complete)  │
│  T008-T014       │  T015-T019       │  T020-T033       │
└──────────────────┴──────────────────┴──────────────────┘
         │                  │                  │
         └──────────────────┴──────────────────┘
                           │
                    ┌──────────────┐
                    │ Phase 6-7    │
                    │ Gattai+CSS   │
                    └──────────────┘
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T007)
3. Complete Phase 3: US1 Timer (T008-T014)
4. **STOP and VALIDATE**: Timer pauses correctly
5. Ship if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 Timer → Test → Ship (immediate value)
3. US2 Best Times → Test → Ship (enhancement)
4. US3 Completion → Test → Ship (full feature)
5. Gattai + Polish → Complete feature

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1. Setup | 3 | State and constants |
| 2. Foundational | 4 | Core utilities |
| 3. US1 Timer | 7 | Pause/resume |
| 4. US2 Best Times | 5 | Top 3 storage |
| 5. US3 Completion | 14 | Persistence + UI |
| 6. Gattai | 10 | Mirror changes |
| 7. Polish | 13 | CSS + fallbacks + testing |
| **Total** | **56** | ~5.5 hours |

---

## Quick Reference: When to Clear Completion Badge

| Trigger | Clear? | Task |
|---------|--------|------|
| Play Again button | ✅ Yes | T032 |
| Reset on completed | ✅ Yes | T033 |
| 30 days pass | ✅ Yes | T006 |
| Navigate away | ❌ No | - |
| Reveal solution | ❌ No | - |
