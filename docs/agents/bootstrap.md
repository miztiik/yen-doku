# Agent Bootstrap

**Last Updated**: 2026-07-05

The loading ritual an agent runs before answering a non-trivial task - whether invoked as the default agent, a specialized persona under [.github/agents/](../../.github/agents/), or the [.claude/skills/bootstrap](../../.claude/skills/bootstrap/SKILL.md) skill. This is the *what to load*; its companion [guardrails.md](guardrails.md) is the *what not to do*, and this ritual loads it.

Write agent and customization Markdown in ASCII only: `-`, `->`, `>=`, "section".

## The ritual (in order)

1. **Read [CLAUDE.md](../../CLAUDE.md) end-to-end.** It is the engineering contract. Identify which Holy Laws are load-bearing for the task and be ready to cite them by number.
2. **Read [guardrails.md](guardrails.md).** The constraints restated: non-goals, git hygiene and stop conditions, escalation.
3. **Read the doc that matches the task surface**, in the right tier (see [../reference/documentation-structure.md](../reference/documentation-structure.md)):
   - Architecture - [../architecture/overview.md](../architecture/overview.md) (the pipeline and runtime boundaries), [../architecture/frontend.md](../architecture/frontend.md) (the browser client), [../architecture/gattai.md](../architecture/gattai.md) (the multi-grid variant).
   - Reference - [../reference/data-contracts.md](../reference/data-contracts.md) (puzzle JSON and `localStorage` shapes).
   - Concepts - [../concepts/difficulty.md](../concepts/difficulty.md), [../concepts/design-principles.md](../concepts/design-principles.md).

   Do not critique what you have not read. Design rationale, where it exists, lives as a section on the doc it impacts.
4. **Skim recent git history** (`git log --oneline -20`) for in-flight work that overlaps the task.
5. **State, in your first paragraph back to the user,** which laws and which docs are load-bearing for the answer, so the load is explicit and easy to challenge.

## When bootstrap is mandatory

- Any specialized-persona invocation - they all start here.
- Any task that crosses a subsystem boundary (touches >= 2 of `scripts/`, `docs/`, `tests/`, `specs/`).
- Any task escalated to Correction Level 2 or higher (CLAUDE.md section 6).

## When bootstrap is optional

- Level-0 or Level-1 changes inside a single file (typo, comment, log string, isolated bug fix).
- Pure read questions ("where is X defined?") that propose no change.

## Autonomous execution

When a user authorises autonomous execution, stay in scope: progress the in-flight mandate, run the Definition of Done (CLAUDE.md section 9), and use the reversible git workflow (guardrails, git hygiene). Escalate only on a genuine trigger - a proposal that would change a persisted contract, an unresolved conflict, or a Level-5 trigger (CLAUDE.md section 6). Do not invent new scope or narrow existing scope without surfacing it.

## Why this exists as a doc, not duplicated in every agent file

`docs/` is the shared agent memory and duplication is forbidden; the loading preamble lives here once so there is one place to update it.

## See also

- [guardrails.md](guardrails.md) - the rules every agent must honour.
- [../../CLAUDE.md](../../CLAUDE.md) - the engineering contract.
- [../reference/documentation-structure.md](../reference/documentation-structure.md) - the doc tiers this ritual loads from.
