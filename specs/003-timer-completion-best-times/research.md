# Research: Timer, Completion State, and Best Times

**Branch**: `003-timer-completion-best-times` | **Date**: 2026-01-22

## Page Visibility API

### Decision
Use the standard Page Visibility API for detecting tab visibility changes.

### Rationale
- Native browser API, no dependencies
- Supported in all modern browsers (Chrome 33+, Firefox 18+, Safari 7+, Edge 12+)
- Fires reliably on tab switch, minimize, screen lock
- Single event listener, clean implementation

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| `blur`/`focus` events | Don't fire on tab switch, only window focus |
| `beforeunload` | Only fires on page close, not tab switch |
| Intersection Observer | For element visibility, not page visibility |
| Polling `document.hasFocus()` | Wasteful, unreliable timing |

### Implementation

```javascript
// The API
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Tab is hidden - pause timer
    } else {
        // Tab is visible - resume timer
    }
});

// Alternative check (deprecated but wider support)
document.visibilityState === 'hidden' // or 'visible'
```

### Edge Cases
- **Multiple monitors**: Tab can be "visible" but not focused - still counts as visible
- **Picture-in-picture**: Depends on browser implementation
- **Mobile app switch**: Fires correctly on iOS Safari and Android Chrome
- **Screen lock**: Fires on most devices

---

## Pausable Timer Pattern

### Decision
Use elapsed-accumulator pattern with separate `startTime` and `elapsedBeforePause`.

### Rationale
- Accurate across multiple pause/resume cycles
- No drift from setInterval timing issues
- Easy to serialize to localStorage
- Used successfully in gattai.js already

### Implementation

```javascript
// State
let startTime = null;        // null when paused
let elapsedBeforePause = 0;  // accumulated time

// Get current elapsed time
function getElapsedTime() {
    if (!startTime) return elapsedBeforePause;
    return elapsedBeforePause + (Date.now() - startTime);
}

// Pause
function pause() {
    if (startTime) {
        elapsedBeforePause += Date.now() - startTime;
        startTime = null;
    }
}

// Resume
function resume() {
    if (!startTime) {
        startTime = Date.now();
    }
}

// Reset
function reset() {
    startTime = Date.now();
    elapsedBeforePause = 0;
}
```

### Why Not Use setInterval Directly?

```javascript
// BAD: Drift accumulates
let elapsed = 0;
setInterval(() => elapsed++, 1000); // Can drift 100ms+ per hour

// GOOD: Calculate from timestamps
const elapsed = Date.now() - startTime; // Always accurate
```

---

## localStorage Data Structures

### Completion Record Schema

```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "CompletionRecord",
    "type": "object",
    "required": ["completedAt", "time", "date"],
    "properties": {
        "completedAt": {
            "type": "integer",
            "description": "Unix timestamp when puzzle was completed"
        },
        "time": {
            "type": "integer",
            "description": "Elapsed time in milliseconds"
        },
        "date": {
            "type": "string",
            "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
            "description": "Puzzle date (YYYY-MM-DD)"
        }
    }
}
```

### Best Times Array Schema

```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "BestTimesArray",
    "type": "array",
    "maxItems": 3,
    "items": {
        "type": "object",
        "required": ["time", "date", "achievedAt"],
        "properties": {
            "time": {
                "type": "integer",
                "description": "Elapsed time in milliseconds"
            },
            "date": {
                "type": "string",
                "description": "Puzzle date or 'legacy' for migrated times"
            },
            "achievedAt": {
                "type": "integer",
                "description": "Unix timestamp when time was achieved"
            }
        }
    }
}
```

---

## Key Naming Convention

### Current Keys (from constitution)
- Game state: `yen-doku-{date}-{difficulty}`
- Best times: `yen-doku-best-{difficulty}`
- Gattai state: `yen-doku-gattai-{date}-{mode}-{difficulty}`

### New Keys
- Best times (v2): `yen-doku-best-times-{difficulty}`
- Completion: `yen-doku-completed-{date}-{difficulty}`
- Gattai best times (v2): `yen-doku-gattai-best-times-{mode}-{difficulty}`
- Gattai completion: `yen-doku-gattai-completed-{date}-{mode}-{difficulty}`

### Migration Strategy
1. On init, check for old `yen-doku-best-{difficulty}` keys
2. If found and no new key exists, migrate to array format
3. Delete old key after successful migration
4. Log migration for debugging

---

## Retention Policies

| Data Type | Retention | Rationale |
|-----------|-----------|-----------|
| Game saves | 7 days | Already implemented, sufficient for resume |
| Completion records | 30 days | Longer than saves, shows recent achievements |
| Best times | Indefinite | User's personal records, never expire |

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Page Visibility API | 33+ | 18+ | 7+ | 12+ |
| localStorage | 4+ | 3.5+ | 4+ | 12+ |
| JSON.parse/stringify | All | All | All | All |
| Template literals | 41+ | 34+ | 9+ | 12+ |

All target browsers supported. No polyfills needed.
