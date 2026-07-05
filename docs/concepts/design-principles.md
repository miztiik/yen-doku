# Design Principles

**Last Updated**: 2026-07-05

The reusable engineering philosophy behind Yen-Doku. These are the "why" and "how we build"; the binding, project-specific rules are in [../../CLAUDE.md](../../CLAUDE.md), and the concrete client patterns are in [architecture/frontend.md](../architecture/frontend.md).

## Core tenets

- **Clarity over cleverness.** Write code that is obvious, not impressive.
- **Files over services.** Static files scale infinitely at zero cost - do not spin up a server if a JSON file will do.
- **Determinism over randomness.** Given the same input, produce the same output; date-seeded generation makes bugs and tests tractable.
- **Fail fast, fail loud.** Surface errors immediately with clear messages; a CI failure beats a silently corrupt puzzle.
- **Single responsibility.** Each function, file, and component does one thing. If it cannot be named simply, it is doing too much.
- **Start simple.** Do not add abstraction until the pain of not having it is real.
- **Offline by default.** Assume the network is unavailable; cache aggressively and sync when possible.
- **Respect user preferences.** Dark mode, reduced motion, safe areas, and text size are requirements, not suggestions.
- **Validate at boundaries.** External data (fetched JSON, URL params, localStorage) is untrusted; check it the moment it enters.
- **Namespace everything.** Storage keys, CSS classes, and event names are prefixed to prevent collisions.

## Patterns that follow from them

- **No build step when possible.** Serve source files directly; browsers are capable, and build tools add complexity and break sourcemaps.
- **Generated content lives with deployed content.** CI writes puzzles straight into `docs/`, the folder Pages serves - no copy or sync step.
- **Date-based naming for time-series data.** ISO `YYYY-MM-DD` sorts naturally and is globally unambiguous; it goes in the filename, not just metadata.
- **One state object; cache DOM once; delegate events.** See [architecture/frontend.md](../architecture/frontend.md).
- **Wrap all storage access in try/catch** and prefix every key - storage fails in private mode and when the quota is exceeded.
- **Design tokens in `:root`.** All colors, spacing, fonts, and durations are CSS custom properties, named by purpose; dark mode is a media-query override.

## See also

- [../../CLAUDE.md](../../CLAUDE.md) - the binding engineering contract.
- [architecture/frontend.md](../architecture/frontend.md) - how these patterns are applied in the browser client.
- [architecture/overview.md](../architecture/overview.md) - the static-first, two-runtime architecture.
