<!-- Lilystack. Rewritten from gstack spec/SKILL.md.tmpl and the "Rules for the implementing agent" of the generated spec/SKILL.md at 466689b (MIT, Copyright (c) 2026 Garry Tan); and spec-kit templates/spec-template.md, templates/tasks-template.md and templates/commands/checklist.md at d649834 (MIT, Copyright GitHub, Inc.); and ECC skills/intent-driven-development/SKILL.md at b38be6a (MIT, Copyright (c) 2026 Affaan Mustafa); and superpowers skills/writing-plans/SKILL.md at 22f0b46 (MIT, Copyright (c) 2025 Jesse Vincent). -->

# The spec template and self-check

Fill this at Phase 4. Keep the headings in this order and replace every
`<...>`. Remove a section that does not apply; never write "N/A".

```markdown
# <Title that states the outcome>

Date: <YYYY-MM-DD> · Status: Draft | Approved · Read at: <git short sha>
Design: <path of the design doc, or none> · Issue: <#N, or none>

## Why
<Who is affected, what it costs today, why now.>
Goal: <one sentence: an observable outcome>

## Current state (verified <YYYY-MM-DD>)
<What exists, where it lives and how the parts interact, with path:line. Description only.>
| Component | Has X | Has Y | Gap |
|---|---|---|---|

## Root cause
<Bugs and quality work only: why the problem exists, so the fix covers the whole class.>

## Desired behaviour
<What will be true when this is done, user-visible first.>

## Scope
- In: <behaviour this change delivers>
- Out: <tempting adjacent work, named>
- Smallest version that delivers the value: <...>

## Context
- Discovered (from the repo): <fact, path:line>
- Owner-supplied constraints (never inferred from code): <rule, SLA, retention, priority, or "none supplied">
- Assumptions to confirm: <claim>, or "Unknown - measure by <method>"

## Decisions
- <decision>: chose <X> because <Y>. Rejected <A> (<why>), <B> (<why>).
- Open (keeps Status at Draft): <a choice the owner deferred>

## Design
<Real shapes, not prose: schema, API or CLI contract, data model, state transitions.
A change tree where ownership matters: + new, ~ changed, - removed.>
| File | Change |
|---|---|
| `path/to/file:42` | <what changes> |

## Acceptance criteria
### AC-001: <observable behaviour>
- Scenario: <starting state>
- Action: <one trigger>
- Expected: <observable result>
- Must not: <prohibited side effect, where one is meaningful>
- Verification: <test, command or manual check>
- Priority: Required | Important | Optional

## Edge cases and failure modes
<For each that applies: empty, null, huge, duplicated, wrong role, called twice, stopped midway.>

## Test plan
| Layer | What | Protects | Fails when | No claim |
|---|---|---|---|---|
| Unit | `<module.function()>` | <observable> | <wrong result it rejects> | <what green does not prove; which fakes stand in> |

## Phases
- [ ] Phase 1: <what now works end to end>
  - [ ] T001 <task, with the exact path>
    - Interfaces: consumes <exact names and signatures from earlier tasks, or nothing>; produces <exact names, parameter and return types that later tasks rely on, or nothing>
  - [ ] T002 <task>
    - Interfaces: consumes <...>; produces <...>
  - Verify: `<runnable command>`
- [ ] Phase 2: <the next thin slice>

## Review focus
<At most five inputs or failure modes that the spec implies and no test-plan row exercises, most likely to hurt a user first. One line each: the input or condition, and the behaviour a reasonable user expects. "None found" when you looked and found none.>

Next step: <the single next action>

## Rules for the implementing agent
1. Each test is accepted by its Protects, Fails when and No claim row, never by "make the tests pass".
2. Real code and real tests land in the same change; a stub assertion or a deferred test is not done.
3. Any change to a test, validator, CI step, timeout, threshold, snapshot or suppression is reported first, on its own line, with its reason.
4. A reported command names the command and its observed result; a command not run is not reported.
5. Do not change an acceptance criterion to make it pass; stop and ask for a revision of the spec.
6. The report is a claim until someone re-runs it: say what was verified, what was reused and what could not be checked.

## Rollback
<How to undo it. "Revert the PR" is worth writing down.>

## Effort and risks
<Per component, such as "2h schema + 3h service + 4h tests"; name the riskiest assumption.>
```

**Variants.** A parent spec adds `## Child specs` as a table
(`| # | Title | Effort | Depends on |`), an ASCII dependency sketch, and a
line on why that order. An audit or cleanup spec adds `## Full inventory`
(every instance with `path:line`, an exact count) and `## What works (do not
touch)`, so nothing correct is "fixed" into a regression.

**Phase rules** (an idea from humanlayer):

- A phase is a thin vertical slice: one thing works end to end through every
  layer it needs. Never "schema, then API, then UI, then tests".
- Phase N can be verified without phase N+1.
- Each phase ends in a command that shows it works. Use a manual check only
  where no command can show it.
- Task lines read `- [ ] T001 <description with exact path>`, numbered across
  the whole spec. Every task belongs to a phase.
- Each task has an Interfaces line. The builder of one task may see only
  that task, so this line is how it learns the names and types of its
  neighbours. A name that a later task consumes is spelled the same way
  where an earlier task produces it.

**Review focus.** The spec says what the software must do, not everything it
will meet, and its silence on an input does not permit that input to break
the program. Where a line can get a test, add the test-plan row and the task
and drop the line. What stays is checked on purpose by the final review of
`/lilystack:build`, and `/lilystack:ship` counts each line as a gap until a
test names it.

**Acceptance criteria.** Fail: "AC-001: The export works correctly and is
secure"; nobody can say whether it was met. Pass: Scenario "orders older than
30 days exist", Action "GET /orders/:id as each of the 4 roles", Expected
"HTTP 410", Must not "return the order body", Verification
"`tests/test_orders.py::test_expired_410`". Two readers agree on the result.

## Self-check

The spec is code written in English; these are its unit tests. Each item
asks about the text, not the code. Answer every item yes or no; a no is
fixed before the draft is shown, or listed at its top after three passes.

1. Does every Required AC have a scenario, an observable expected result, a
   "Must not" where one is meaningful, and a named verification?
2. Is every vague word ("correctly", "securely", "fast", "robust",
   "intuitive") replaced by evidence, or marked as human judgment?
3. Is Out of scope explicit, with the adjacent work named?
4. Are owner-supplied constraints kept apart from discovered facts, with
   none inferred from code?
5. Does every file reference carry its full path, and a line where it names
   logic?
6. Is every quantity a number ("47 files across 12 directories"), or
   "Unknown - measure by <method>"?
7. Does every phase end in something a command can verify, and can phase N
   be verified without phase N+1?
8. Does every Required AC map to at least one test-plan row and one task?
9. Is every design decision made, with none left for the implementer?
10. If a decision is still Open, does Status say Draft?
11. Do all sections agree, with one term for each concept?
12. Is the text free of secrets, tokens and personal data, even as examples?
13. Does each task that uses another task's work name it on its Interfaces
    line, with the same spelling on both sides?
14. Is Review focus filled in, or "None found" after a real look?
