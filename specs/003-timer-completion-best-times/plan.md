# Implementation Plan: Timer, Completion State, and Best Times

**Branch**: `003-timer-completion-best-times` | **Date**: 2026-01-22 | **Spec**: [spec.md](spec.md)

## Summary

Enhance the Sudoku app with three interconnected features:
1. **Timer pause/resume** using Page Visibility API
2. **Completion state persistence** with visual badges and next-challenge suggestions
3. **Top 3 best times** leaderboard per difficulty

All changes apply to both `app.js` (standard Sudoku) and `gattai.js` (Samurai/Twin modes).

## Technical Context

**Language/Version**: JavaScript ES2020+  
**Primary Dependencies**: None (vanilla JS, Page Visibility API)  
**Storage**: localStorage (browser)  
**Testing**: Manual + existing test infrastructure  
**Target Platform**: Modern browsers (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)  
**Performance Goals**: Timer accuracy ±1s, localStorage ops <10ms  
**Constraints**: Offline-capable, no external APIs  
**Scale/Scope**: 2 files to modify (app.js, gattai.js), ~300 lines added

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Correctness First | ✅ PASS | Timer accuracy preserved via elapsed tracking |
| II. Technology Separation | ✅ PASS | All changes in browser JS, no Python impact |
| III. Static-First | ✅ PASS | Only localStorage, no new APIs |
| IV. Test-Driven | ⚠️ MANUAL | Browser API mocking needed for visibility tests |
| V. Simplicity | ✅ PASS | Standard browser APIs, no frameworks |
| VI. Clarity Over Cleverness | ✅ PASS | Clear function names, documented state |
| VII. Offline-First | ✅ PASS | All data in localStorage |
| VIII. Fail Fast | ✅ PASS | Graceful degradation if APIs unavailable |

**Storage Contract Compliance**:
- New keys follow `yen-doku-` prefix convention ✅
- Completion records cleaned up (30 days) ✅
- Best times persist indefinitely (intentional) ✅

## Second-Order Impact Analysis

### 🔄 State Lifecycle Changes

| Event | Current Behavior | New Behavior | Impact |
|-------|------------------|--------------|--------|
| Tab hidden | Timer continues | Timer pauses, state saved | Fairer timing |
| Tab visible | N/A | Timer resumes | Seamless continuation |
| Victory | Clear saved game | Clear game + store completion | Completion persists |
| Load completed puzzle | Show empty grid | Show solved grid + badge | Better UX |
| "Play Again" | N/A (new button) | Clear completion + reset | Fresh start |
| Date nav to completed | Show empty grid | Show completed state | Consistent |
| Difficulty switch from completed | Load new puzzle | Load new puzzle (no change) | No impact |

### 🗑️ When to Clear Completion Badge

| Trigger | Clear Badge? | Clear Record? | Rationale |
|---------|--------------|---------------|-----------|
| **Play Again button** | ✅ Yes | ✅ Yes | User explicitly wants fresh start |
| **Reset button (on completed)** | ✅ Yes | ✅ Yes | Same as Play Again |
| Navigate to different date | N/A | N/A | Badge is per-puzzle |
| Navigate back to completed | ❌ No | ❌ No | Still completed |
| Switch difficulty (same date) | N/A | N/A | Different puzzle |
| **Reveal solution** | ❌ No badge | ❌ No record | Not "completed" - use "Revealed" badge |
| **30 days pass** | N/A | ✅ Yes (cleanup) | Retention policy |
| **Browser storage cleared** | ✅ Gone | ✅ Gone | Can't prevent |

### 🎯 Complete Badge State Machine

```
                    ┌──────────────┐
                    │   FRESH      │
                    │  (no badge)  │
                    └──────┬───────┘
                           │ user starts playing
                           ↓
                    ┌──────────────┐
                    │ IN PROGRESS  │←─────────────────┐
                    │  (no badge)  │                  │
                    └──────┬───────┘                  │
                           │                          │
              ┌────────────┼────────────┐            │
              ↓            ↓            ↓            │
       ┌──────────┐  ┌──────────┐  ┌──────────┐     │
       │ VICTORY  │  │ REVEALED │  │  RESET   │     │
       │    ✓     │  │  (eye)   │  │          │─────┘
       └────┬─────┘  └────┬─────┘  └──────────┘
            │              │
            ↓              ↓
     ┌────────────┐  ┌────────────┐
     │ COMPLETED  │  │ REVEALED   │
     │ "✓ 4:32"   │  │ "(eye)"    │
     │ persisted  │  │ no record  │
     └────┬───────┘  └────────────┘
            │
            │ Play Again
            ↓
     ┌────────────┐
     │   FRESH    │ (completion record deleted)
     │  (no badge)│
     └────────────┘
```

### 📊 localStorage Key Changes

| Old Key | New Key | Migration Strategy |
|---------|---------|-------------------|
| `yen-doku-best-{diff}` | `yen-doku-best-times-{diff}` | Auto-migrate on init, delete old |
| N/A | `yen-doku-completed-{date}-{diff}` | New key |
| N/A | `yen-doku-gattai-completed-{date}-{mode}-{diff}` | New key |
| `yen-doku-gattai-best-{mode}-{diff}` | `yen-doku-gattai-best-times-{mode}-{diff}` | Auto-migrate |

### 🎯 UI State Matrix

| Puzzle State | Timer Display | Badge | Grid State | Actions Available |
|--------------|---------------|-------|------------|-------------------|
| Fresh (no save) | 0:00, running | None | Empty cells | Play normally |
| In progress | MM:SS, running | None | Partial fill | Play, Reset, Undo |
| Tab hidden | Frozen | None | Unchanged | None (hidden) |
| **Completed** | Stopped (final) | "✓ Completed" | **Solution shown** | **Play Again** |
| Revealed | Stopped | "👁 Revealed" | Solution shown | Reset |

### ⚡ Regression Risk Areas

| Area | Risk Level | What Could Break | Mitigation |
|------|------------|------------------|------------|
| Timer accuracy | Medium | Pause/resume math errors | Unit tests for elapsed calc |
| Saved game restore | Medium | New fields break old saves | Default values, version check |
| Victory detection | Low | Existing logic unchanged | No changes to core logic |
| Victory modal | Medium | New best times format | Graceful fallback |
| "Play Again" flow | Medium | Badge not clearing | Explicit clearCompletion() call |
| Gattai parity | **High** | Two files diverge | Shared utility pattern |
| Date navigation | Medium | Completed state not loading | Check completion before fetch |

### 🔗 Function Dependency Changes

```
loadPuzzle() / load()
    │
    ├── [NEW] checkCompletion(date, difficulty)
    │         │
    │         ├── If completed → showCompletedState()
    │         │                  ├── Render solution grid
    │         │                  ├── Show badge
    │         │                  ├── Show suggestion
    │         │                  └── Show "Play Again" button
    │         │
    │         └── If not completed → existing flow
    │
    └── [EXISTING] loadSavedGame() / resumeGame()

checkWin() / checkVictory()
    │
    ├── [EXISTING] clearSavedGame()
    ├── [NEW] saveCompletion(date, difficulty, elapsedTime)
    ├── [NEW] saveBestTime(difficulty, elapsedTime, date) ← returns rank
    └── [EXISTING] celebrateWin() → showVictoryModal()
                                      │
                                      └── [ENHANCED] Show rank badge
                                                     Show top 3 times

doReset() / resetPuzzle()
    │
    ├── [NEW] clearCompletion(date, difficulty) ← if was completed
    └── [EXISTING] reset grid, timer, etc.

[NEW] playAgain()
    │
    ├── clearCompletion(date, difficulty)
    └── doReset()

[NEW] visibilitychange handler
    │
    ├── If hidden → pauseTimer() + saveGameState()
    └── If visible → resumeTimer()
```

## Project Structure

### Modified Files

```text
docs/
├── app.js              # +150 lines: visibility, completion, best times
├── gattai.js           # +150 lines: same changes
├── style.css           # +30 lines: completed badge, suggestion card
└── gattai.css          # +30 lines: same styles
```

### New Artifacts

```text
specs/003-timer-completion-best-times/
├── spec.md             ✅ Created
├── plan.md             ✅ This file
├── research.md         📋 To generate
├── tasks.md            📋 To generate
└── contracts/
    └── completion-record.schema.json  📋 To generate
```

## Phase 0: Research Findings

### Page Visibility API

```javascript
// Detection
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Tab is hidden - pause timer
  } else {
    // Tab is visible - resume timer
  }
});

// Browser support: All modern browsers (IE10+)
// Fires on: tab switch, minimize, screen lock, mobile app switch
```

### Timer Implementation Pattern

```javascript
// Pausable timer with accurate elapsed tracking
const state = {
  startTime: null,          // Current session start (null when paused)
  elapsedBeforePause: 0,    // Accumulated time from previous sessions
};

function getElapsedTime() {
  if (!state.startTime) return state.elapsedBeforePause;
  return state.elapsedBeforePause + (Date.now() - state.startTime);
}

// Returns elapsedMs for use in victory and completion records
function pauseTimer() {
  if (state.startTime) {
    state.elapsedBeforePause += Date.now() - state.startTime;
    state.startTime = null;
  }
}

function resumeTimer() {
  if (!state.startTime && !state.revealed) {
    state.startTime = Date.now();
  }
}
```

## Dependency Graph

```
┌───────────────────────────────────────────────────────────┐
│                    INITIALIZATION                          │
├───────────────────────────────────────────────────────────┤
│  1. migrateBestTimes()     ← One-time migration           │
│  2. cleanupOldCompletions() ← 30-day retention            │
│  3. Add visibilitychange listener with handleVisibilityChange() │
└───────────────────────────────────────────────────────────┘
                              │
                              ↓
┌───────────────────────────────────────────────────────────┐
│                    PUZZLE LOAD                             │
├───────────────────────────────────────────────────────────┤
│  checkCompletion() ──┬── completed? → showCompletedState()│
│                      └── not completed? → normal load     │
└───────────────────────────────────────────────────────────┘
                              │
                              ↓
┌───────────────────────────────────────────────────────────┐
│                    GAMEPLAY                                │
├───────────────────────────────────────────────────────────┤
│  Tab hidden  → pauseTimer() + saveGameState()             │
│  Tab visible → resumeTimer()                              │
│  User input  → existing handlers                          │
└───────────────────────────────────────────────────────────┘
                              │
                              ↓
┌───────────────────────────────────────────────────────────┐
│                    VICTORY                                 │
├───────────────────────────────────────────────────────────┤
│  checkWin() → saveCompletion() → saveBestTime()           │
│            → celebrateWin() → showVictoryModal(rank)      │
└───────────────────────────────────────────────────────────┘
```

## Implementation Order (with Rationale)

| Phase | Task | Depends On | Why This Order |
|-------|------|------------|----------------|
| 1 | Timer pause/resume (app.js) | None | Foundation - most isolated |
| 2 | Timer state in saveGame | Phase 1 | Persist timer across page reload |
| 3 | Best times migration | None | Must run before new best times code |
| 4 | Best times top 3 storage | Phase 3 | Data layer before UI |
| 5 | Victory modal rank display | Phase 4 | UI uses new data format |
| 6 | Completion record storage | Phase 1 | Depends on accurate timer |
| 7 | Completed state UI | Phase 6 | UI uses completion records |
| 8 | Play Again flow | Phase 7 | Needs completion state to exist |
| 9 | Next challenge suggestion | Phase 7 | Enhancement to completed UI |
| 10 | Gattai.js parity | Phases 1-9 | Mirror all changes |
| 11 | CSS for badges | Phase 7 | Styles for new UI elements |
| 12 | Cleanup + retention | Phase 6 | Final polish |
| 13 | Regression testing | All | Verify nothing broke |

## Risk Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Timer drift after many pauses | Medium | Low | Monotonic elapsed tracking |
| Old saved games break | High | Medium | Default values for new fields |
| Completion badge stuck | Medium | Low | Explicit state machine |
| localStorage full | Low | Low | Graceful degradation |
| Gattai divergence | High | Medium | Extract shared utilities |

---

**Next Step**: Generate [tasks.md](tasks.md) with detailed implementation tasks
