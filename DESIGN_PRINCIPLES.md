# Web App Design Patterns — LLM Reference Template

```
PURPOSE: Reusable principles for modern web applications
FORMAT: Plain English for LLM system prompt injection
SCOPE: Frontend-first PWA with static backend, CI/CD automation
```

---

## 1. Project Organization

**Separate by runtime, not feature.** Keep frontend code (what runs in browser) in one folder, backend/CI tools (what runs on server) in another, and tests in their own space. This makes deployment trivial and dependencies clear.

**No build step when possible.** Serve source files directly. Browsers are powerful enough. Build tools add complexity, break sourcemaps, and slow iteration.

**Generated content lives with deployed content.** If CI creates data files, put them in the same folder that gets deployed. No copy steps, no sync issues.

**Use date-based naming for time-series data.** ISO format (YYYY-MM-DD) sorts naturally and is globally unambiguous. Include it in filenames, not just metadata.

---

## 2. State Management

**One state object to rule them all.** Keep all mutable application state in a single object. This makes debugging trivial (just log the state), serialization easy (just stringify it), and mental model clear (where's the state? in `state`).

**Cache DOM references once.** Query selectors are cheap but not free. Grab all your element references at startup and store them. This also serves as documentation of what elements your code touches.

**Delegate events to parents.** Instead of attaching listeners to every button, attach one listener to their container and check what was clicked. Fewer listeners, works with dynamic content, easier cleanup.

**Keep history as snapshots.** For undo functionality, push deep copies of state to an array. Pop to restore. Limit the array size to prevent memory bloat. Simple beats clever.

---

## 3. Persistence

**Prefix all storage keys.** Every localStorage key should start with your app name. This prevents collisions with other apps on the same domain and makes cleanup easy.

**Always wrap storage in try-catch.** localStorage throws in private browsing mode, when quota is exceeded, or when disabled. Your app should degrade gracefully, not crash.

**Include context in storage keys.** If you're saving state that varies by user choice (like difficulty level or selected date), include that in the key. One key per context, not one key overwritten constantly.

---

## 4. Data Fetching

**Cache-bust dynamic content.** Append a timestamp or version to fetch URLs for content that changes. Browser caching is aggressive and will serve stale data otherwise.

**Validate external data at the boundary.** The moment JSON arrives from a fetch, check that required fields exist and types are correct. Fail immediately with a clear error rather than letting bad data propagate.

**Sync state to URL.** Put important state in query parameters. This makes states shareable and bookmarkable. Read from URL on load, update URL on state change.

---

## 5. Visual Design Tokens

**Define all values as CSS custom properties.** Colors, spacing, fonts, radii, shadows, durations — everything configurable goes in `:root`. This is your single source of truth.

**Name colors by purpose, not appearance.** Use `--text-primary` not `--dark-gray`. Use `--accent` not `--purple`. This makes theming trivial and meaning clear.

**Use a consistent spacing scale.** Pick a base unit (4px or 8px) and derive all spacing from it. This creates visual rhythm and makes spacing decisions automatic.

**Dark mode via media query override.** Define light mode tokens first, then override them inside `@media (prefers-color-scheme: dark)`. No JavaScript needed, respects system preference automatically.

---

## 6. CSS Patterns

**Reset minimally.** Zero out margins and padding, set border-box sizing, normalize button and input styles. Don't include a massive reset library.

**Respect device safe areas.** Modern phones have notches and rounded corners. Use `env(safe-area-inset-*)` with fallbacks to keep content visible.

**Use fluid sizing.** Instead of breakpoints for every size, use `clamp(min, preferred, max)` for typography and spacing. Smooth scaling across all viewports.

**Honor accessibility preferences.** Check `prefers-reduced-motion` and disable animations for users who need it. It's one media query that makes your app usable for more people.

**Distinguish keyboard and mouse focus.** Use `:focus-visible` to show focus rings only for keyboard navigation. Mouse users don't need the visual clutter.

**Loading states should shimmer, not spin.** Skeleton screens with a shimmer animation feel faster than spinners. They also indicate the shape of coming content.

---

## 7. HTML Structure

**Version your assets.** Add `?v=1` to CSS and JS URLs. Bump the number on deploy. This forces browsers to fetch fresh files instead of serving stale cache.

**Use data attributes for JavaScript state.** Put values JS needs in `data-*` attributes, not in classes or IDs. This separates styling concerns from behavior concerns.

**Add ARIA roles to custom controls.** If you build a tab bar from divs, tell screen readers it's a tab bar. Accessibility is not optional.

**Make it installable.** Add the PWA meta tags and a manifest. Users can add your app to their home screen and it works offline. The bar is low, the payoff is high.

---

## 8. UI Components

**Toast notifications for non-blocking feedback.** Brief messages that appear and auto-dismiss. Don't interrupt the user with alerts for routine feedback.

**Confirmation modals for destructive actions.** If an action can't be undone, ask first. Make the destructive option visually distinct (red, not primary color).

**Stagger animations for lists.** When multiple items animate in, delay each slightly. It's more natural and draws attention appropriately.

**Format times human-readably.** Show `3:45` not `225000ms`. If over an hour, show `1:03:45`. Users don't do math.

**Keep the screen awake when appropriate.** If your app involves extended active use (games, timers, reading), request a wake lock so the screen doesn't dim.

---

## 9. Offline & Service Workers

**Version your cache.** Name it `app-v1` and increment on deploy. Delete old caches on activation to prevent stale assets.

**Choose strategy by content type.** Data that changes rarely should be cache-first (fast). App shell files should be network-first (fresh). Match strategy to content lifecycle.

**Activate immediately.** Use `skipWaiting()` and `clients.claim()` so updates take effect without requiring tab refresh.

---

## 10. CI/CD Automation

**Define paths as environment variables.** Hardcoded paths scattered through workflows are maintenance nightmares. Define once at the top.

**Pass data between steps via outputs.** Don't rely on files or environment variable hacks. Use the proper GitHub Actions output mechanism.

**Validate before committing.** If CI generates content, run validation before the commit step. Never let invalid data into the repository.

**Make generation idempotent.** A script should be safe to run twice. Skip files that already exist. Don't duplicate work.

**Commit only when there are changes.** Check if there's anything to commit before committing. Keeps git history clean.

**Allow manual triggers with inputs.** Scheduled jobs should also be manually triggerable with parameter overrides. Essential for debugging and backfilling.

---

## 11. Testing

**Extract pure functions for easy testing.** Logic that doesn't touch DOM can run in Node. Duplicate these functions in a test file if needed to avoid browser dependencies.

**Use descriptive test names.** `it('handles month boundary')` tells you exactly what broke when it fails.

**Define fixtures at the top.** Reusable test data should be constants, not recreated in every test. DRY applies to tests too.

---

## 12. Core Philosophy

1. **Clarity over cleverness.** Write code that's obvious, not impressive. Future you (or the LLM) needs to understand it.

2. **Files over services.** Static files scale infinitely at zero cost. Don't spin up a server if a JSON file will do.

3. **Determinism over randomness.** Given the same input, produce the same output. Makes debugging and testing tractable.

4. **Fail fast, fail loud.** Errors should surface immediately with clear messages. Silent failures corrupt data and waste debugging time.

5. **Single responsibility.** Each function, file, and component does one thing well. If you can't name it simply, it's doing too much.

6. **Start simple.** Don't add abstraction until you feel the pain of not having it. Premature abstraction is worse than duplication.

7. **Offline by default.** Assume the network is unavailable. Cache aggressively. Sync when possible.

8. **Respect user preferences.** Dark mode, reduced motion, text size, safe areas. The user's system settings are requirements, not suggestions.

9. **Validate at boundaries.** External data (API responses, URL params, localStorage) is untrusted. Check it the moment it enters your system.

10. **Namespace everything.** Storage keys, CSS classes, event names — prefix them with your app name. Isolation prevents collisions.

---

*This document captures the **why**, not just the **what**. Apply these principles thoughtfully to any web application.*
