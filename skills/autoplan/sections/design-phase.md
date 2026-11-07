<!-- Lilystack. Rewritten from gstack autoplan/sections/design-phase.md.tmpl at 466689b (MIT, Copyright (c) 2026 Garry Tan). -->

# Phase 2: the design review

Run this phase only with UI scope. Run `/lilystack:plan-design-review` in
full, with the changes below. Each decision goes through the decision
procedure of autoplan. Tiebreakers: P5 explicit over clever, then P1
completeness.

## Overrides

- **Scope gate.** Skip the UI-scope check of the skill. Intake decided it,
  with evidence.
- **Current screens.** Do not ask to look at the current screens with a
  browser, unless the owner asked for that in this run. Review from the text
  and the code.
- **Input.** Review the plan as it stands after Phase 1. Use the CEO block
  for the accepted, deferred and rejected scope. Do your own passes; a CEO
  finding does not replace one.
- **Focus (0D).** Review all passes at the same depth (P1), Mechanical. Do
  not ask the focus question. Rate each pass from 0 to 10, as the skill says.
- **Slop tiers.** A Floor item is never waived: fix it, Mechanical. A waiver
  of a Reflex item, with its reason about this product, is Taste. A Finish
  item is a note, not a decision.
- **Structural issues.** A missing state (loading, empty, error, partial), a
  broken hierarchy, a missing keyboard path or contrast rule: fix it in the
  plan, Mechanical (P5).
- **Aesthetic choices.** Look, tone, density, layout taste: Taste.
- **Design system.** When `DESIGN.md` exists and the fix to match it is
  obvious: Mechanical. When the fix is not obvious, or there is no design
  system: Taste.
- **Scope changes.** A design change that adds or drops a feature or a
  screen that the owner set: User Challenge.
- **Mockups, image generation and browser steps.** Skip them, unless the
  owner asked for them in this run.
- **Next step.** Skip the question at the end of the skill. The next phase
  follows.

## Required outputs

The block of the skill in full, as its Outputs section says: scores (one for
each pass); decision ledger; accepted design decisions; Floor, waivers and
finish notes; NOT in scope; What already exists; deferred design work;
tasks; unresolved decisions; completion summary. Say whether the plan is
design-complete, as the skill defines it.

Then close the phase with `sections/phase-close.md` in this skill's
directory.
