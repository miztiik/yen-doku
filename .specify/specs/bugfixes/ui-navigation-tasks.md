# Yen-Doku Bug Fixes - Tasks

**Feature**: UI/Navigation Bug Fixes  
**Created**: January 15, 2026  
**Branch**: `fix/ui-navigation-bugs`  
**Status**: ✅ **COMPLETE** — Merged to master

---

## Phase 1: Setup

- [x] T001 Create feature branch `fix/ui-navigation-bugs` from main
- [x] T002 Verify current app state by running local server

---

## Phase 2: Critical Bug Fix - Navigation

**Goal**: Fix the date navigation bug where changing difficulty on an old date jumps back to today.

- [x] T003 Fix `load()` function to preserve current date in docs/app.js
- [x] T004 Test navigation: go to Jan 13, change difficulty, verify date stays Jan 13
- [x] T005 Test edge case: fresh app load still defaults to today correctly

---

## Phase 3: Grid Alignment Fix

**Goal**: Prevent grid cells from shifting when pencil marks are added/removed.

- [x] T006 Add `position: relative` to `.cell` if not present in docs/style.css
- [x] T007 Change `.cell .pencil` to `position: absolute` with `inset: 2px` in docs/style.css
- [x] T008 Change pencil font-size from `0.35em` to fixed `clamp(8px, 1.8vw, 11px)` in docs/style.css
- [x] T009 Add `min-width: 0; min-height: 0; overflow: hidden;` to `.cell` in docs/style.css
- [x] T010 Test pencil marks on multiple cells - verify no grid shifting

---

## Phase 4: Tooltip Persistence Fix

**Goal**: Make tooltips disappear after clicking toolbar buttons, especially on touch devices.

- [x] T011 Add tooltip dismiss handler on button click in docs/app.js
- [x] T012 Add touchend blur handler for touch devices in docs/app.js
- [x] T013 [P] Add CSS fallback `@media (hover: none)` to hide tooltips on touch in docs/style.css
- [x] T014 Test on desktop: click hint button, tooltip should dismiss
- [x] T015 Test on mobile/touch: tap buttons, no sticky tooltips

---

## Phase 5: Hint Button Enhancement

**Goal**: Add visual glow/shine effect when hint is revealed.

- [x] T016 [P] Add `.tool.tool-hint.hint-active` styles with glow animation in docs/style.css
- [x] T017 [P] Add `@keyframes hintGlow` animation in docs/style.css
- [x] T018 Add `hint-active` class toggle in `hint()` function in docs/app.js
- [x] T019 Test hint button: verify glow appears and fades after ~800ms

---

## Phase 6: Erase Button Centering

**Goal**: Center the touch highlight on the erase button.

- [x] T020 Add CSS transform to center erase SVG: `#btn-erase svg { transform: translateX(1px); }` in docs/style.css
- [x] T021 Test erase button touch highlight is visually centered

---

## Phase 7: Cache Cleanup

**Goal**: Automatically remove puzzle saves older than 7 days from localStorage.

- [x] T022 Add `STORAGE_RETENTION_DAYS` constant in docs/app.js
- [x] T023 Add `cleanupOldSaves()` function in docs/app.js
- [x] T024 Call `cleanupOldSaves()` at start of `init()` function in docs/app.js
- [x] T025 Test: manually add old entries to localStorage, verify cleanup on reload

---

## Phase 8: Final Testing & Merge

- [x] T026 Run full regression test on all features (60 pytest tests passing)
- [x] T027 Test on mobile device (touch interactions)
- [x] T028 Commit all changes with descriptive message
- [x] T029 Merge branch to main after verification

---

## Post-Merge Updates

- [x] T030 Fix README badge formatting (badges on same line)
- [x] T031 Remove R keyboard shortcut for Reveal Solution (conflicts with browser hard refresh)

---

## Dependencies

```
T001 → T002 → T003 → T004, T005
                 ↓
T006 → T007 → T008 → T009 → T010
                              ↓
T011 → T012 → T013 (parallel) → T014, T015
                                    ↓
T016, T017 (parallel) → T018 → T019
                               ↓
T020 → T021
         ↓
T022 → T023 → T024 → T025
                       ↓
T026 → T027 → T028 → T029
```

## Parallel Execution Opportunities

| Phase | Parallelizable Tasks |
|-------|---------------------|
| Phase 4 | T013 can run with T011-T012 |
| Phase 5 | T016, T017 can run in parallel |
| Phase 3-6 | Phases 3, 4, 5, 6 are independent after Phase 2 |

---

## Task Count Summary

| Phase | Tasks | Status |
|-------|-------|--------|
| Setup | 2 | ✅ |
| Navigation Fix | 3 | ✅ |
| Grid Alignment | 5 | ✅ |
| Tooltip Fix | 5 | ✅ |
| Hint Enhancement | 4 | ✅ |
| Erase Centering | 2 | ✅ |
| Cache Cleanup | 4 | ✅ |
| Final Testing | 4 | ✅ |
| Post-Merge | 2 | ✅ |
| **Total** | **31** | **✅ All Complete** |

---

## Files to Modify

| File | Tasks |
|------|-------|
| docs/app.js | T003, T011, T012, T018, T022, T023, T024 |
| docs/style.css | T006, T007, T008, T009, T013, T016, T017, T020 |

