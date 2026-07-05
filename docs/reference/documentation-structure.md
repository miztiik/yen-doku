# Documentation Structure

**Last Updated**: 2026-07-05

How `docs/` is organised and where a new piece of project knowledge belongs. Companion to [CLAUDE.md](../../CLAUDE.md): this doc defines the _placement rules_; CLAUDE.md defines the _constraints_ (ASCII-only per Holy Law #10, `docs/` as the single source of truth, no duplicate definitions).

Note that `docs/` is also the GitHub Pages web root, so it holds the game itself (`index.html`, `app.js`, `gattai.*`, `style.css`, `sw.js`) and `docs/puzzles/` alongside these Markdown docs.

## Diataxis tiers

Every document belongs to exactly one tier:

| Tier         | Directory            | Reader question                                  |
| ------------ | -------------------- | ------------------------------------------------ |
| Architecture | `docs/architecture/` | Why is it designed this way? What is the shape?  |
| How-to       | `docs/how-to/`       | How do I perform a specific task?                |
| Concepts     | `docs/concepts/`     | What is this concept / vocabulary?               |
| Reference    | `docs/reference/`    | What are the exact options / values / contracts? |

Support tiers:

- `docs/getting-started/` - onboarding entry points.
- `docs/archive/` - historical or superseded material.
- `docs/agents/` - instructions for AI coding agents working in this repo.

## Depth rule (maximum 3 levels)

- Allowed: `docs/<tier>/<topic>/<file>.md`
- Forbidden: `docs/<tier>/<topic>/<subtopic>/<file>.md` or deeper.

A topic that needs deeper nesting is two topics. Split it.

## Required elements (every doc)

- One H1 title.
- A `**Last Updated**: YYYY-MM-DD` line directly under the title.
- A "See also" section with cross-tier links (architecture <-> how-to <-> concepts <-> reference).
- Content that stays in its tier (no mixed-purpose docs).
- ASCII only - see CLAUDE.md.

## Where does a new statement go?

1. Current gameplay rule, UI shape, tuning invariant, or subsystem contract -> a **concept**, **how-to**, or **architecture** doc. This is the default.
2. A vocabulary term used across subsystems -> a **concept** doc, defined once, and linked from everywhere else.
3. A step-by-step procedure an operator runs -> a **how-to** doc that cites the concept or architecture doc for the "why".
4. An exact value, schema, or key format -> a **reference** doc.

## A decision lives on the page it impacts

There is no separate decision log or `decisions/` directory. When a choice is worth recording - it has a real rejected alternative, cross-system consequences, and a non-trivial reversal cost - capture it as a `## Design rationale` (and, if useful, `## Rejected alternatives`) section on the living architecture, concept, or reference doc it affects. Git history is the immutable record of when it changed; most changes simply update the current-state text in place.

One concept is defined once; everywhere else links to it.

## See also

- [../../CLAUDE.md](../../CLAUDE.md) - the engineering contract (ASCII-only rule, `docs/` as canonical knowledge).
- [../architecture/overview.md](../architecture/overview.md) - the top of the architecture tier.
- [../concepts/design-principles.md](../concepts/design-principles.md) - the philosophy the docs and code follow.
