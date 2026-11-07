<!-- Lilystack. Rewritten from gstack autoplan/sections/dx-phase.md.tmpl at 466689b (MIT, Copyright (c) 2026 Garry Tan). -->

# Phase 3: the developer experience review

Run this phase only with developer scope. Run `/lilystack:plan-devex-review`
in full, with the changes below. Each decision goes through the decision
procedure of autoplan. Tiebreakers: P5 explicit over clever, then P1
completeness.

## Overrides

- **Mode.** Use the mode that the owner named. Else use DX POLISH: keep the
  scope and make each touchpoint solid. If the skill names its modes in a
  different way, take the one that keeps the scope and examines each
  touchpoint. Record the mode as Mechanical. Do not ask the mode question.
- **Input.** Review the plan as it stands after the earlier phases. Use their
  blocks for the accepted, deferred and rejected scope.
- **Product type.** Infer it from the plan and the repo, as the skill says.
  Do not ask the owner to confirm it. Record it as Mechanical when one type
  is clear, Taste when two are close. If no type applies, end the phase as
  `SKIPPED (no developer-facing surface)`, with the evidence, and go on.
- **Persona (0A).** Infer it from the README, the docs and the plan: the most
  common type of developer. Record it as an assumption, Taste (P6). Do not
  ask the persona question.
- **Developer perspective (0B).** Write it from the real docs and code. Mark
  each predicted or unknown step. Do not ask the accuracy question.
- **Time to hello world (0C).** Define the clock and estimate as the skill
  says. Take the Competitive tier (2 to 5 minutes) as the target, or Champion
  when the plan already reaches it. Record the target as Taste. Do not ask
  the target question.
- **Benchmark.** Run it only when the owner asked for one in this run. It
  sends only search terms, as the skill says.
- **Magical moment (0D).** Choose the vehicle with the least effort that
  reaches the target (P5): Mechanical when one is clear, Taste when two are
  close. In DX POLISH, only vehicles that use existing capabilities.
- **Getting started.** Fewer steps wins, Mechanical (P5).
- **Error messages.** Require the full error contract of the skill: what
  happened, the fix, how to recover. Mechanical (P1).
- **CLI and API naming.** Consistency over cleverness, Mechanical (P5).
- **Defaults against flexibility.** Opinionated defaults or more options:
  Taste.
- **Scope changes.** A change that adds or drops a command, an API or a
  workflow that the owner set: User Challenge.
- **Next step.** Skip the question at the end of the skill. Phase 4 follows.

## Required outputs

The block of the skill in full, as its Outputs section says: mode and
decisions; developer persona; developer perspective; time to hello world
(the clock, the estimate, the target); magical moment; developer journey
map; first-time developer report; error path matrix; Claude Code checklist
(or its SKIPPED line); What already exists; NOT in scope; deferred items; DX
implementation checklist; unresolved decisions; DX scorecard with a score
for each pass.

Then close the phase with `sections/phase-close.md` in this skill's
directory.
