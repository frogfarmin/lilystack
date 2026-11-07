<!-- Lilystack. Rewritten from gstack autoplan/sections/eng-phase.md.tmpl at 466689b (MIT, Copyright (c) 2026 Garry Tan). -->

# Phase 4: the eng review

Always run this phase, last. Run `/lilystack:plan-eng-review` in full, with
the changes below. Each decision goes through the decision procedure of
autoplan. Tiebreakers: P5 explicit over clever, then P3 pragmatic.

## Overrides

- **Input.** The plan as each earlier phase changed it, with each provisional
  Taste answer in place. Read the CEO, design and DX blocks for the accepted,
  deferred and rejected scope.
- **Scope challenge (Step 0).** Read the code that the plan names. Never
  reduce the accepted scope (P2).
  - A lean-ladder finding (new code where an earlier rung holds): reuse,
    Mechanical (P4).
  - The complexity gate wants to cut or defer something that the owner asked
    for: User Challenge, one question for each cut.
  - The structure question (the original arrangement or a smaller one, with
    the same features): Mechanical when one is clearly simpler (P5); Taste
    when they are close.
- **Architecture.** Explicit over clever (P5). When two options are close:
  Taste.
- **Code quality.** Each finding goes through the decision procedure. Most
  are Mechanical.
- **Tests.** Never skip or shorten this section. Read the code. Make the
  diagram of each new flow, code path and branch, and name the test that
  covers each one. A missing test for a new code path: add it to the plan,
  Mechanical (P1). A test gap that you defer: Taste, with its reason. A
  prompt or model change: include each eval suite that applies (P1).
- **Performance.** A hot path with no budget and no benchmark step is a
  finding.
- **Deferred items.** Collect the deferrals of all phases for the Deferred
  list of the autoplan block. Do not write `TODOS.md` or another file.
- **Next step.** Skip the question at the end of the skill. The pre-gate
  check and the taste gate follow.

## Required outputs

The block of the skill in full, as its Outputs section says: decision
ledger; scope challenge result; NOT in scope; What already exists;
coherence; two shapes and red flags (or its one line); diagrams; failure
modes; test plan; unresolved decisions; completion summary.

Then close the phase with `sections/phase-close.md` in this skill's
directory.
