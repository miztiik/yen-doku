# UI/UX Design System — Yen-Doku

**Created**: 2026-01-11  
**Last Updated**: 2026-01-11  
**Status**: Implemented  
**Philosophy**: Apple Human Interface Guidelines (HIG) inspired

---

## Design Philosophy

> **"Premium casual gaming experience"** — Every detail should feel intentional, delightful, and polished.

### Core Principles

1. **Clarity** — Content is the hero; UI gets out of the way
2. **Deference** — Subtle animations enhance, never distract  
3. **Depth** — Visual hierarchy guides the eye naturally
4. **Delight** — Small touches (celebration, transitions) create joy

---

## Typography System

### Font Stack

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| **Logo** | Josefin Sans | 600 | Brand name "Yen-Doku" only |
| **UI** | Nunito | 400-700 | Buttons, labels, toasts, modals |
| **Numbers** | Outfit | 500-600 | Grid cells (monospace-feel for alignment) |
| **System Fallback** | -apple-system, BlinkMacSystemFont, sans-serif | — | Accessibility fallback |

### Logo Treatment

```css
.logo {
    font-family: 'Josefin Sans', sans-serif;
    font-size: 2rem;
    font-weight: 600;
    letter-spacing: -0.5px;
    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #7c3aed 100%);
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: gradientShift 4s ease infinite;
}
```

**Design Rationale**: 
- Animated gradient creates visual interest without being distracting
- Purple tones establish brand identity
- Subtle shimmer effect suggests premium quality

### Date Subtitle

```css
.subtitle {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-tertiary);  /* Muted, not competing with logo */
    margin-top: 2px;
    letter-spacing: 0.3px;
}
```

**Design Rationale**:
- Significantly smaller than logo (11px vs 32px)
- Tertiary color keeps it unobtrusive
- Provides context without visual weight
- Letter-spacing improves readability at small size

---

## Color System

### Light Mode

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `linear-gradient(160deg, #f0f9ff 0%, #fdf4ff 50%, #fff7ed 100%)` | Page background (soft tri-color gradient) |
| `--bg-solid` | `#ffffff` | Cards, elevated surfaces |
| `--text-primary` | `#0f172a` | Headings, important text |
| `--text-secondary` | `#475569` | Body text, labels |
| `--text-tertiary` | `#94a3b8` | Hints, timestamps, metadata |
| `--accent` | `#7c3aed` | Interactive elements, selections |
| `--accent-hover` | `#6d28d9` | Hover states |
| `--success` | `#22c55e` | Correct, completed |
| `--warning` | `#f59e0b` | Medium difficulty |
| `--danger` | `#ef4444` | Errors, conflicts |

### Dark Mode

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `linear-gradient(160deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a2e 100%)` | Deep navy with purple hints |
| `--bg-solid` | `#1e1e2e` | Cards |
| `--text-primary` | `#f8fafc` | Headings |
| `--text-secondary` | `#cbd5e1` | Body |
| `--accent` | `#a78bfa` | Lighter purple for contrast |

### Difficulty Colors

| Level | Color | Hex | Rationale |
|-------|-------|-----|-----------|
| Easy | Green | `#22c55e` | Go = safe, approachable |
| Medium | Yellow | `#eab308` | Caution = moderate challenge |
| Hard | Orange | `#f97316` | Warning = significant effort |
| Extreme | Red | `#ef4444` | Stop and think = expert only |

---

## Difficulty Indicator (Pip System)

### Design Decision

Instead of text labels, we use a **visual pip system** below the difficulty buttons:

```
Easy     Medium     Hard     Extreme
  •        ••       •••       ••••
```

### Implementation

```css
.difficulty-indicator {
    display: flex;
    gap: 3px;
    margin-top: 4px;
}

.pip {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.7;
}
```

### Rationale

1. **Universal** — Works without translation
2. **Compact** — Takes minimal vertical space
3. **Scannable** — Quick visual comparison between levels
4. **Elegant** — Cleaner than text badges

---

## Layout & Spacing

### Grid System

All spacing uses an 8px base unit:

```css
--space-xs: 4px;   /* Half unit — tight grouping */
--space-sm: 8px;   /* Base unit — default gap */
--space-md: 16px;  /* 2x — section padding */
--space-lg: 24px;  /* 3x — major sections */
--space-xl: 32px;  /* 4x — page margins */
```

### Center Alignment

**Everything centers.** This is a focused, single-purpose app.

```css
body {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
}

.container {
    max-width: 500px;
    width: 100%;
    text-align: center;
}
```

### Rationale

- Mobile-first (works on any width)
- No awkward left-aligned elements
- Grid naturally becomes the focal point
- Buttons and controls fall neatly below

---

## Sudoku Grid Design

### Cell Styling

```css
.cell {
    width: 44px;
    height: 44px;           /* Minimum touch target (Apple HIG) */
    font-family: 'Outfit';
    font-size: 1.5rem;
    font-weight: 500;
    border: 1px solid var(--border);
    transition: all 0.15s var(--ease);
}

.cell.given {
    font-weight: 600;
    color: var(--cell-given);   /* Darker, authoritative */
}

.cell.user-entered {
    color: var(--cell-user);    /* Purple, user's work */
}
```

### 3×3 Box Borders

```css
/* Every 3rd cell gets thicker right border */
.cell:nth-child(3n):not(:nth-child(9n)) {
    border-right: 2px solid var(--border-strong);
}

/* Rows 3 and 6 get thicker bottom border */
.grid-row:nth-child(3n):not(:nth-child(9n)) .cell {
    border-bottom: 2px solid var(--border-strong);
}
```

### Selection States

| State | Style | Purpose |
|-------|-------|---------|
| **Selected** | Blue glow + scale(1.02) | Current focus |
| **Related** | Subtle blue tint (6% opacity) | Same row/col/box |
| **Same Number** | Stronger blue tint (12% opacity) | All matching values |
| **Conflict** | Red background (15% opacity) | Rule violation |

---

## Interaction Feedback

### Toast Notifications

```css
.toast {
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 24px;
    border-radius: 12px;
    background: var(--bg-elevated);
    box-shadow: var(--shadow-lg);
    animation: slideUp 0.3s var(--ease-spring);
}
```

**Types**:
- Default (info icon) — Neutral information
- Success (✓) — Green, completed actions
- Error (✕) — Red, problems or conflicts

**Auto-dismiss**: 3 seconds

### Check Button Behavior

**Critical UX Decision**: The Check button does **NOT** reveal correct answers.

| Scenario | Behavior |
|----------|----------|
| Has errors | `"3 incorrect"` + red highlight (1.5s) |
| All filled correctly | Triggers victory celebration |
| Some correct, more to go | `"Looking good! 12 left"` |
| Nothing entered yet | `"42 cells to go"` |

**Rationale**: Showing green on correct cells would spoil the solve. Check is for catching mistakes, not getting free hints.

---

## Victory Celebration

### Trigger Conditions

Victory celebration fires when:
1. All 81 cells are filled
2. Grid matches solution exactly
3. User did NOT just use Reveal/Hint

### Animation Sequence

```
0ms     — Detect completion
0-800ms — Staggered green fill (cells ripple from center)
800ms   — Confetti burst (50 particles)
1000ms  — Victory modal slides up
3000ms  — Confetti fades
```

### Cell Reveal Pattern

Cells turn green in a **spiral pattern from center**:
```javascript
const centerRow = 4, centerCol = 4;
const distance = Math.abs(row - centerRow) + Math.abs(col - centerCol);
const delay = distance * 50; // 50ms per "ring" from center
```

### Confetti System

```javascript
function createConfetti() {
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.background = randomColor();
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        container.appendChild(confetti);
    }
    setTimeout(() => cleanup(), 3000);
}
```

### Victory Modal

```
┌─────────────────────────────┐
│                             │
│      🎉 Puzzle Complete!    │
│                             │
│        ⏱️ 4:32              │
│      Saturday, Jan 11       │
│          Extreme            │
│                             │
│   [ Share ]  [ New Puzzle ] │
│                             │
└─────────────────────────────┘
```

---

## Responsive Breakpoints

### Mobile First

```css
/* Base: Mobile (< 600px) */
.grid { max-width: 100vw; padding: 0 8px; }
.cell { width: calc((100vw - 32px) / 9); }

/* Tablet+ (≥ 600px) */
@media (min-width: 600px) {
    .grid { max-width: 400px; }
    .cell { width: 44px; height: 44px; }
}
```

### Touch Targets

All interactive elements are minimum **44×44px** per Apple HIG:
- Grid cells: 44px
- Buttons: 44px height, padding: 12px 24px
- Number pad buttons: 48px (larger for thumbs)

---

## Accessibility

### ARIA Labels

```html
<div class="cell" 
     role="button" 
     aria-label="Row 3, Column 5, value 7"
     tabindex="0">
    7
</div>
```

### Focus States

```css
.cell:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
}

button:focus-visible {
    box-shadow: 0 0 0 3px var(--accent-soft);
}
```

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `↑↓←→` | Navigate cells |
| `1-9` | Enter number |
| `0` / `Backspace` | Clear cell |
| `N` | Toggle notes mode |
| `Tab` | Move to next interactive element |
| `Enter` | Activate button |

---

## Theme Toggle

### System Preference Detection

```javascript
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
```

### Manual Override

```javascript
// Persisted to localStorage
document.documentElement.setAttribute('data-theme', theme);
localStorage.setItem('theme', theme);
```

### Toggle Button

```
Light: ☀️ (sun icon)
Dark:  🌙 (moon icon)
```

Smooth transition between themes (0.3s on background-color, color).

---

## Animation Curves

```css
--ease: cubic-bezier(0.25, 0.1, 0.25, 1);         /* Standard easing */
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275); /* Bouncy */
```

| Use Case | Curve |
|----------|-------|
| Cell selection | `--ease` (subtle) |
| Toast entry | `--ease-spring` (bouncy) |
| Modal appearance | `--ease-spring` |
| Victory cell fill | `--ease` (staggered) |
| Confetti fall | CSS `@keyframes` with gravity |

---

## Design Decisions Log

| Decision | Rationale |
|----------|-----------|
| **Gradient logo** | Creates visual interest, establishes brand without being gaudy |
| **Smaller date** | Reduces visual noise; date is context, not primary info |
| **Pip difficulty indicators** | Universal, compact, scannable |
| **Center alignment** | Focus on the grid; no awkward layouts |
| **Purple accent** | Modern, distinctive, works in both themes |
| **Check doesn't reveal greens** | Preserve solving experience; check is for mistakes |
| **Spiral victory animation** | More visually interesting than random or linear |
| **3-second toasts** | Long enough to read, short enough to not annoy |
| **44px touch targets** | Apple HIG compliance; comfortable for fingers |

---

## File References

| File | Lines | Purpose |
|------|-------|---------|
| `docs/style.css` | 1-70 | Design tokens (CSS custom properties) |
| `docs/style.css` | 130-160 | Logo and subtitle styling |
| `docs/style.css` | 250-400 | Grid and cell styling |
| `docs/style.css` | 900-1100 | Victory celebration (confetti, modal) |
| `docs/app.js` | 460-520 | Check button logic |
| `docs/app.js` | 530-650 | Victory celebration JS |

---

**Last Updated**: 2026-01-11  
**Maintainer**: Vibe-coded with GitHub Copilot 🤖
