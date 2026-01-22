# Feature Spec: Timer, Completion State, and Best Times Enhancements

**Branch**: `003-timer-completion-best-times` | **Date**: 2026-01-22 | **Version**: 1.0.0

## Problem Statement

Three UX issues degrade the puzzle-solving experience:

1. **Timer runs in background**: When users switch tabs or minimize the window, the timer continues running, penalizing them unfairly and wasting resources.

2. **Completed puzzles reload as empty**: After completing a puzzle, closing and reopening the app shows an empty puzzle with no indication it was already solved. Users lose their achievement context.

3. **Single best time is limiting**: Only storing one best time per difficulty doesn't show improvement over time or provide meaningful goals.

## Requirements

### FR-1: Timer Pause on Tab Hidden

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | Timer MUST pause when the browser tab becomes hidden | P0 |
| FR-1.2 | Timer MUST resume when the browser tab becomes visible | P0 |
| FR-1.3 | Elapsed time MUST be preserved accurately across pause/resume cycles | P0 |
| FR-1.4 | Timer MUST stop permanently on puzzle completion or reveal | P0 |
| FR-1.5 | Timer state MUST persist to localStorage on pause | P1 |

### FR-2: Completed Puzzle State

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1 | System MUST store a completion record when puzzle is solved | P0 |
| FR-2.2 | Completed puzzles MUST display with solved grid (not empty) | P0 |
| FR-2.3 | Completed puzzles MUST show "✓ Completed in MM:SS" badge (CSS class: `.completion-badge`) | P0 |
| FR-2.4 | Completed puzzles MUST show completion time (included in badge) | P1 |
| FR-2.5 | Completed puzzles MUST show suggestion for next challenge (next higher difficulty if available, e.g., "Try Medium →") | P1 |
| FR-2.6 | User MUST be able to "Play Again" to reset a completed puzzle | P1 |
| FR-2.7 | Completion badge MUST clear on "Play Again" action | P0 |
| FR-2.8 | Completion records MUST be cleaned up after 30 days | P2 |

### FR-3: Top 3 Best Times

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1 | System MUST store up to 3 best times per difficulty | P0 |
| FR-3.2 | Each best time record MUST include `ms` (elapsed time), `date` (puzzle date string), and `achievedAt` (Unix timestamp) | P0 |
| FR-3.3 | Victory modal MUST show rank badge if time is in top 3 (🥇 New Record!, 🥈 #2 Best!, 🥉 #3 Best!) | P1 |
| FR-3.4 | Victory modal MUST show all 3 best times as mini-leaderboard (CSS class: `.best-times-list`) | P2 |
| FR-3.5 | Best times MUST persist indefinitely (no cleanup) | P0 |

## Non-Functional Requirements

| ID | Requirement | Metric |
|----|-------------|--------|
| NFR-1 | Timer accuracy | ±1 second cumulative drift over 1 hour of active play (excluding paused time). Measured by comparing `getElapsedTime()` to wall-clock time with console timestamps. |
| NFR-2 | localStorage operations | <10ms each |
| NFR-3 | Page Visibility API support | Chrome, Firefox, Safari, Edge (graceful fallback: timer continues if API unavailable) |
| NFR-4 | Completion check on load | <50ms |

## User Flows

### Flow 1: Tab Switch During Puzzle

```
User playing puzzle → Switches to email tab
  → Timer pauses, elapsedBeforePause updated
  → Returns to puzzle tab
  → Timer resumes from paused value
  → Completes puzzle
  → Total time = elapsedBeforePause + (now - resumeTime)
```

### Flow 2: Return to Completed Puzzle

```
User completes "Jan 22 Easy" → Victory modal shown
  → Closes browser
  → Returns next day
  → Navigates to "Jan 22 Easy"
  → Sees solved grid with "✓ Completed in 4:32"
  → Sees "Try Medium →" suggestion
  → Can click "Play Again" to reset
```

### Flow 3: Top 3 Achievement

```
User completes "Easy" in 3:45 → Checks against stored times
  → [4:00, 5:30, 6:00] existing
  → 3:45 becomes new #1
  → Victory modal: "🥇 New Record! 3:45"
  → Leaderboard: 3:45*, 4:00, 5:30
```

## Data Model

### Completion Record (NEW)

```javascript
// Key: yen-doku-completed-{date}-{difficulty}
// Key (gattai): yen-doku-gattai-completed-{date}-{mode}-{difficulty}
{
  "completedAt": 1737561600000,  // Unix timestamp when puzzle was completed
  "timeMs": 273000,              // Elapsed solving time in milliseconds
  "date": "2026-01-22"           // Puzzle date string (YYYY-MM-DD) for display
}
```

### Best Times Array (REPLACES single value)

```javascript
// Key: yen-doku-best-times-{difficulty}
// Key (gattai): yen-doku-gattai-best-times-{mode}-{difficulty}
// Fields: ms = elapsed time in milliseconds, date = puzzle date string (YYYY-MM-DD), achievedAt = Unix timestamp
[
  { "ms": 225000, "date": "2026-01-22", "achievedAt": 1737561600000 },
  { "ms": 240000, "date": "2026-01-20", "achievedAt": 1737388800000 },
  { "ms": 273000, "date": "2026-01-18", "achievedAt": 1737216000000 }
]
```

### Timer State (ENHANCED)

```javascript
// Added to existing save data
{
  "startTime": 1737560000000,    // When current session started
  "elapsedBeforePause": 45000,  // Accumulated time from previous sessions
  // Total elapsed = elapsedBeforePause + (Date.now() - startTime)
}
```

## Migration

### Best Times Migration

Old format: `yen-doku-best-{difficulty}` = `"225000"` (string)
New format: `yen-doku-best-times-{difficulty}` = `[{time, date, achievedAt}]`

```javascript
function migrateBestTimes() {
  ['easy', 'medium', 'hard', 'extreme'].forEach(diff => {
    const oldKey = `yen-doku-best-${diff}`;
    const newKey = `yen-doku-best-times-${diff}`;
    const oldValue = localStorage.getItem(oldKey);
    
    if (oldValue && !localStorage.getItem(newKey)) {
      const time = parseInt(oldValue, 10);
      localStorage.setItem(newKey, JSON.stringify([
        { time, date: 'legacy', achievedAt: Date.now() }
      ]));
      localStorage.removeItem(oldKey);
    }
  });
}
```

## Edge Cases

| Case | Behavior |
|------|----------|
| Tab hidden during victory animation | Pause after animation completes |
| Browser crash mid-puzzle | Restore from last auto-save |
| Completed puzzle from before feature | Show empty (no completion record) |
| Play Again on completed puzzle | Clear completion record, reset timer |
| Date navigation to completed puzzle | Show completed state |
| Best time tie | Keep older record (first achiever wins) |
| localStorage quota exceeded | Graceful degradation, warn user |

## Acceptance Criteria

- [ ] Timer pauses within 100ms of tab hidden event
- [ ] Timer resumes within 100ms of tab visible event
- [ ] Completed puzzles show solution grid on reload
- [ ] "Play Again" clears completion badge and resets puzzle
- [ ] Victory modal shows rank (1st/2nd/3rd) when applicable
- [ ] Old best time format migrated transparently
- [ ] All features work in both app.js and gattai.js
