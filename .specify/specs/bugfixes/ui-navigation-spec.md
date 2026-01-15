# Yen-Doku Bug Analysis and Proposed Fixes

**Date**: January 15, 2026  
**Branch**: To be created: `fix/ui-navigation-bugs`

---

## Issue 1: Grid Alignment When Adding Pencil Marks

### Observed Behavior
When adding small digits (pencil marks) in cells, the grid slightly re-adjusts to accommodate the additional character. This happens:
- Once per row when the first pencil mark is added to any cell in that row
- Once per column when the first pencil mark is added to any cell in that column

### Root Cause Analysis
Looking at the CSS and rendering logic:

**In `style.css` (lines 380-396)**:
```css
.cell .pencil {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    width: 100%;
    height: 100%;
    font-size: 0.35em;
    font-weight: 600;
    color: var(--text-secondary);
    pointer-events: none;
}

.cell .pencil span {
    display: flex;
    align-items: center;
    justify-content: center;
}
```

**In `app.js` (lines 568-577)** - `createCell()` function:
```javascript
} else if (marks.size > 0) {
    cell.classList.add('empty');
    cell.appendChild(createPencilMarks(marks));
} else {
    cell.classList.add('empty');
}
```

**The Problem**: The cell content changes structure when pencil marks are added:
1. Empty cells have `textContent = ""` (no child elements)
2. Cells with values have `textContent = number`
3. Cells with pencil marks have a child `div.pencil` element with a 3x3 grid

The issue is that the grid cells don't have **fixed dimensions** - they rely on `aspect-ratio: 1` and `1fr` sizing, but the internal content structure change can cause layout recalculation, especially due to:
- `font-size: 0.35em` in pencil marks creates a relative size that differs from the main cell font
- The 3x3 sub-grid adds new layout context

### Proposed Fixes

#### Option A: Fixed Cell Dimensions with Overflow Control (Recommended)
Add minimum dimensions and ensure consistent internal structure:

```css
.cell {
    /* Add these properties */
    min-width: 0;
    min-height: 0;
    overflow: hidden;
}

.cell .pencil {
    /* Make pencil marks absolute to avoid affecting cell layout */
    position: absolute;
    inset: 2px;  /* Small padding from cell edges */
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    /* Use fixed font size instead of em-relative */
    font-size: clamp(8px, 1.8vw, 11px);
    font-weight: 600;
    color: var(--text-secondary);
    pointer-events: none;
}
```

**Why this works**: By using `position: absolute` for pencil marks, they're taken out of normal flow and don't affect the cell's layout dimensions.

#### Option B: Content-Box Sizing with Placeholder
Always render the pencil grid but hide it when not needed:

```javascript
function createCell(row, col) {
    // ... existing code ...
    
    // Always create pencil container to maintain consistent structure
    const pencilContainer = createPencilMarks(marks);
    pencilContainer.style.visibility = marks.size > 0 ? 'visible' : 'hidden';
    cell.appendChild(pencilContainer);
    
    // Add value overlay for actual numbers
    if (given !== 0 || value !== 0) {
        const valueSpan = document.createElement('span');
        valueSpan.className = 'cell-value';
        valueSpan.textContent = given || value;
        cell.appendChild(valueSpan);
    }
}
```

**Trade-off**: More DOM elements but guaranteed consistent layout.

---

## Issue 2: Tooltip Persistence After Button Click

### Observed Behavior
When clicking on toolbar buttons (hint, pencil, erase), the tooltip remains visible after the action is performed. It only disappears when:
- The user clicks the button again
- The user hovers away and back

### Root Cause Analysis

Looking at the CSS tooltip implementation (`style.css` lines 564-582):
```css
.tool[data-tooltip]:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: calc(100% + 10px);
    /* ... */
}
```

The tooltip is **CSS-only** using `:hover` pseudo-class. The problem is:
- On **touch devices**, `:hover` state gets "stuck" after tap
- On **desktop**, if the button action keeps focus, hover persists

### Proposed Fixes

#### Option A: JavaScript-Based Tooltip with Auto-Dismiss (Recommended)
Replace CSS tooltips with a JavaScript solution that auto-hides after click:

```javascript
// Add tooltip hide on click for all tools
document.querySelectorAll('.tool[data-tooltip]').forEach(tool => {
    tool.addEventListener('click', function() {
        // Temporarily remove tooltip attribute to hide it
        const tooltip = this.dataset.tooltip;
        this.removeAttribute('data-tooltip');
        
        // Restore after a delay (allows re-hover to show again)
        setTimeout(() => {
            this.dataset.tooltip = tooltip;
        }, 100);
    });
});

// For touch devices, remove :hover simulation
document.querySelectorAll('.tool[data-tooltip]').forEach(tool => {
    tool.addEventListener('touchend', function() {
        this.blur(); // Remove focus to clear hover state
    });
});
```

#### Option B: CSS-Only Fix with Focus Handling
Add CSS rules to hide tooltip when button is active/focused:

```css
.tool[data-tooltip]:hover::after {
    content: attr(data-tooltip);
    /* existing styles... */
}

/* Hide tooltip when button is active (clicked) */
.tool[data-tooltip]:active::after,
.tool[data-tooltip]:focus::after {
    display: none;
}

/* Touch device specific: prevent sticky hover */
@media (hover: none) {
    .tool[data-tooltip]::after {
        display: none;
    }
}
```

**Note**: This may affect accessibility. The JavaScript solution is more reliable.

---

## Issue 3: Hint Button (Lightbulb) Enhancement

### Current State
The hint button uses a simple SVG lightbulb that doesn't provide visual feedback when a hint is revealed.

### Proposed Enhancement

#### Brighter Bulb + Shine Animation
1. **Brighter icon**: Increase stroke width and add fill
2. **Shine effect**: Add glow animation when hint is triggered

```css
/* Enhanced hint button styles */
.tool.tool-hint svg {
    transition: all 0.3s ease;
}

/* Active/triggered state with glow */
.tool.tool-hint.hint-active {
    animation: hintGlow 0.8s ease-out;
}

.tool.tool-hint.hint-active svg {
    stroke: #fbbf24;
    filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.8));
}

@keyframes hintGlow {
    0% {
        box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.6);
    }
    50% {
        box-shadow: 0 0 20px 8px rgba(251, 191, 36, 0.4);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(251, 191, 36, 0);
    }
}

/* Bulb "rays" effect - optional SVG addition */
.tool.tool-hint.hint-active::before {
    content: '';
    position: absolute;
    width: 60px;
    height: 60px;
    background: radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%);
    animation: raysPulse 0.6s ease-out;
    pointer-events: none;
}

@keyframes raysPulse {
    0% { transform: scale(0.5); opacity: 1; }
    100% { transform: scale(1.5); opacity: 0; }
}
```

**JavaScript addition**:
```javascript
function hint() {
    // ... existing hint logic ...
    
    // Add glow effect to hint button
    el.btnHint.classList.add('hint-active');
    setTimeout(() => {
        el.btnHint.classList.remove('hint-active');
    }, 800);
    
    // ... rest of function
}
```

---

## Issue 4: Erase Button Touch Target Centering

### Observed Behavior
The touch highlight circle appears off-center relative to the erase button icon.

### Root Cause Analysis
Looking at the button structure in `index.html`:
```html
<button id="btn-erase" class="tool" data-tooltip="Erase (⌫)">
    <svg viewBox="0 0 24 24" ...>
```

And CSS:
```css
.tool {
    position: relative;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-full);
    /* ... */
}

.tool svg {
    width: 22px;
    height: 22px;
}
```

The SVG uses `viewBox="0 0 24 24"` but the actual paths may not be centered within that viewBox. Let's check the erase SVG:
```html
<path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"/>
```

The path starts at x=20 and goes to x=2 (via `l-7 7`), so it spans roughly x: 2-22. This is nearly centered but the visual center of the backspace icon is slightly left-heavy.

### Proposed Fixes

#### Option A: Adjust SVG Path Centering
Recenter the SVG paths to better fill the viewBox:
```html
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <!-- Shift entire icon right by 1px for visual centering -->
    <g transform="translate(1, 0)">
        <path d="M19 5H8l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"/>
        <line x1="17" y1="9" x2="11" y2="15"/>
        <line x1="11" y1="9" x2="17" y2="15"/>
    </g>
</svg>
```

#### Option B: Add CSS Offset
```css
#btn-erase svg {
    transform: translateX(1px);
}
```

---

## Issue 5: Navigation Bug - Date Jumps to Today When Changing Difficulty

### Observed Behavior
1. User is on January 15th, clicks "Hard"
2. User navigates back to January 13th using the caret/arrow
3. User clicks "Extreme" → App jumps back to January 15th

### Root Cause Analysis

Looking at the difficulty tab click handler in `app.js` (line 1103):
```javascript
// Difficulty tabs
el.tabs.forEach(tab => {
    tab.onclick = () => load(tab.dataset.difficulty);
});
```

The `load()` function (lines 372-379):
```javascript
async function load(difficulty) {
    // Check for saved game for today's puzzle at this difficulty
    const todayDate = today();  // <-- PROBLEM: Always uses today's date!
    const saved = loadSavedGame(todayDate, difficulty);
    if (saved) {
        console.log('🔄 Resuming saved game for', difficulty);
        return resumeGame(saved);
    }
    return loadPuzzle(todayDate, difficulty);  // <-- Loads TODAY, not current date
}
```

**The Bug**: The `load()` function always loads today's puzzle, ignoring the currently displayed date (`state.puzzle.date`).

### Proposed Fix

Modify the `load()` function to preserve the current date:

```javascript
async function load(difficulty) {
    // Use current puzzle date if available, otherwise today
    const targetDate = state.puzzle ? state.puzzle.date : today();
    
    // Check for saved game for this puzzle at new difficulty
    const saved = loadSavedGame(targetDate, difficulty);
    if (saved) {
        console.log('🔄 Resuming saved game for', targetDate, difficulty);
        return resumeGame(saved);
    }
    return loadPuzzle(targetDate, difficulty);
}
```

**Why this works**: When changing difficulty, we now respect the currently viewed date instead of always resetting to today.

---

## Issue 6: Cache Clearing for Old Puzzles

### Current Implementation Analysis

Looking at the storage functions in `app.js`:
- `saveGame()` - Saves with key `yen-doku-{date}-{difficulty}`
- `loadSavedGame()` - Loads from localStorage
- `clearSavedGame()` - Only clears current game on win/reveal

**Current Problem**: There is **no automatic cleanup** of old puzzles from localStorage. Puzzles accumulate indefinitely.

### Proposed Solution: Auto-Cleanup on App Start

Add a cleanup function that runs during initialization:

```javascript
// ===== Storage Cleanup =====
const STORAGE_RETENTION_DAYS = 7;

function cleanupOldSaves() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - STORAGE_RETENTION_DAYS);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
            // Extract date from key: yen-doku-{date}-{difficulty}
            const match = key.match(/yen-doku-(\d{4}-\d{2}-\d{2})/);
            if (match) {
                const saveDate = match[1];
                if (saveDate < cutoffStr) {
                    keysToRemove.push(key);
                }
            }
        }
    }
    
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('🗑️ Cleaned up old save:', key);
    });
    
    if (keysToRemove.length > 0) {
        console.log(`🧹 Cleaned up ${keysToRemove.length} old puzzle saves`);
    }
}

// Call during init
function init() {
    cleanupOldSaves();  // Add this at the start
    // ... rest of init
}
```

---

## Summary of All Fixes

| Issue | Root Cause | Fix Complexity | Priority |
|-------|-----------|----------------|----------|
| 1. Grid alignment | Content structure change affects layout | Medium | High |
| 2. Tooltip persistence | CSS :hover stuck on touch/focus | Easy | Medium |
| 3. Hint bulb shine | Missing visual feedback | Easy | Low |
| 4. Erase centering | SVG path not visually centered | Easy | Low |
| 5. Date navigation | `load()` ignores current date | Easy | **Critical** |
| 6. Cache cleanup | No cleanup mechanism exists | Easy | Medium |

---

## Implementation Plan

1. **Create new branch**: `fix/ui-navigation-bugs`
2. **Fix Issue 5 first** (critical navigation bug)
3. **Fix Issue 1** (grid alignment - user-impacting)
4. **Fix Issues 2, 3, 4, 6** (quality of life improvements)
5. **Test all changes**
6. **Merge to main**

---

## Testing Checklist

- [ ] Grid alignment stays stable when adding/removing pencil marks
- [ ] Tooltips dismiss after button clicks (especially on mobile)
- [ ] Hint button shows glow animation when used
- [ ] Erase button touch highlight is centered
- [ ] Changing difficulty on old dates preserves the date
- [ ] Puzzles older than 7 days are cleaned from localStorage
- [ ] All keyboard shortcuts still work
- [ ] Victory celebration still works
- [ ] Saved games resume correctly
