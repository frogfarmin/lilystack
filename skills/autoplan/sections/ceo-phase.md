<!-- Lilystack. Rewritten from gstack autoplan/sections/ceo-phase.md.tmpl at 466689b (MIT, Copyright (c) 2026 Garry Tan). -->

# Phase 1: the CEO review

Always run this phase, first. Run `/lilystack:plan-ceo-review` in full, with
the changes below. Each decision goes through the decision procedure of
autoplan. Tiebreakers: P1 completeness, then P2 blast radius.

## Overrides

- **Mode (0E).** Use the mode that the owner named. Else use SELECTIVE
  EXPANSION: hold the scope, make it solid, and decide each expansion on its
  own. Record the mode as Mechanical. Do not ask the mode question.
- **Premises (0A).** Accept a reasonable premise (P6), as Mechanical. A
  premise that looks wrong, or that the evidence contradicts, is a User
  Challenge. Give the assumption, why it looks wrong, and the cost of going
  on with it.
- **Existing code (0B).** Map each sub-problem to code, with `file:line`. A
  rebuild where the existing path can be refactored is a finding (P4).
- **Alternatives (0D).**
  - The plan as written, at equal coverage: keep it, Mechanical.
  - An alternative that clearly covers more and keeps the owner's direction:
    Mechanical (P1). If the top two are close: Taste. If they tie: the
    simpler one (P5).
  - An alternative that replaces the owner's approach: User Challenge.
- **Expansions (0G).** Run the HOLD SCOPE checks first, then the 10x check
  and the delight scan. Decide each candidate:
  - inside the blast radius and small (fewer than five files; no new
    service, dependency or infrastructure): Taste, "add" recommended (P2);
  - outside the blast radius, or larger: defer it to NOT in scope and the
    Deferred list, Mechanical (P3), with the observation that would reopen
    it;
  - a duplicate of existing code: reject, Mechanical (P4);
  - a new feature, skill or workflow that you would add now instead of
    defer: User Challenge.
  Decide each candidate. The limit of six offers does not apply here.
- **Cuts.** Never reduce the scope of a complete plan (Mechanical: no cut).
  A cut of something that the owner asked for is a User Challenge.
- **Timing (0I).** Resolve each ambiguity that the implementer would hit,
  through the decision procedure.
- **Sections 1 to 11.** Run each in full. Section 11 runs only with UI scope;
  else record `SKIPPED (no UI scope)`. Each finding goes through the decision
  procedure. A section with no findings gets one or two sentences on what you
  examined and why nothing was flagged. Never reduce a section to its name in
  a table row.
- **Next step.** Skip the question at the end of the skill. The next phase
  follows.

## Required outputs

The block of the skill in full, as its Outputs section says: mode and
decision ledger; accepted scope; NOT in scope; Deferred items; What already
exists; dream state delta; error and rescue registry; failure modes registry;
diagrams; unresolved decisions; completion summary.

Then close the phase with `sections/phase-close.md` in this skill's
directory.
