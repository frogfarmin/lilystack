<!-- Lilystack. Rewritten from gstack plan-eng-review/sections/review-sections.md.tmpl at 466689b (MIT, Copyright (c) 2026 Garry Tan); and compound-engineering-plugin skills/ce-doc-review/references/personas/coherence-reviewer.md at 173bd33 (MIT, Copyright (c) 2025 Every); and superpowers skills/writing-plans/SKILL.md at 22f0b46 (MIT, Copyright (c) 2025 Jesse Vincent); the design-twice pass derives from pstack (Lauren Tan, MIT). -->

# The review sections

Plan-review evidence: implementation steps are proposals. Quote the plan
requirement a finding rests on (`file:line`), check existing interfaces, and
never call a proposed regression observed. Bounded probes of current behaviour
are fine; building the proposed code is not.

## 0. Document coherence

Read the plan, and the design it names, for disagreement with itself. Whether
the plan is good is Sections 1 to 4; here the test is whether two careful
readers would build the same thing from it. Look for:

- **Contradictions**: two passages that cannot both be true.
- **Terminology drift**: one concept under two names, or one name for two,
  where a reader could be confused. Names, types and signatures in later
  tasks match what earlier tasks define.
- **Undefined forward references**, and **broken internal references** ("see
  Task 7" with no Task 7, or one that says something else).
- **Genuine ambiguity**: a quantifier with no bound, a condition without all
  its cases, a list that may be complete or only examples, a passive that
  hides who acts, a time with no edge ("after the migration": started,
  finished or verified?).
- **Unresolved dependencies**: "needs X" with no owner, date or fallback.
- **Proportion**: "a plan longer than the code it describes has written the
  code instead"; the fix is signatures, test names and assertions in place of
  bodies. A step that decides nothing ("handle edge cases") is the reverse gap.

The mechanical classes have one right answer, and the more detailed text
wins: a heading's count that its list does not match; a reference to a
missing section; two synonyms for one concept (keep the dominant term); a
summary the body contradicts; a passage less specific than another on the
same point; a list that omits a peer the document sets up elsewhere. Resist
the strawman: before you excuse one, ask whether a competent author meant the
other reading, or whether you invented it to keep options open.

Not findings: style and formatting; vagueness that is not ambiguity ("fast");
gaps another section owns; terms the audience knows; work the plan defers in
so many words ("out of scope", "Phase 2"), which the decision procedure's
deferral test judges.

Each finding quotes its passages with `file:line`. Never edit the plan body:
findings go into the review block and through the decision procedure, one at
a time, except that the mechanical ones share one question (record them as
corrections, or take them one by one). Record each answer as a correction for
the author.

## 1. Architecture

Evaluate: component boundaries, dependencies and coupling; data flow,
bottlenecks, scaling and single points of failure; auth, data access and API
boundaries; which flows need ASCII diagrams; one realistic production failure
per new path or integration and whether the plan handles it; for a new
artifact, its build, publish and update path or an explicit deferral.

### Two shapes before one

Only when the plan introduces a new module, service, package or boundary (a
public surface other code calls); otherwise say so in one line.

A plan with one design usually took the first shape that compiled in the
author's head. Require a second shape that is structurally different: another
owner for the state, another split of responsibilities, another place for the
boundary. A point fix inside the first shape does not count. If the plan has
none, sketch one in five lines (types and signatures, bodies "not
implemented") and record it as the alternative. Compare on interface depth:
how much behaviour and policy each hides behind how small a surface, and
prefer the one that hides more behind less. A deep module is not a deep call
chain.

Then screen the chosen shape for the eight red flags, assuming the next
contributor is an agent that sees only the files it opened, copies the nearest
example and takes the shortest path that compiles. Each flag is a finding
with a symbol and a fix:

1. **Shallow module**: a large interface over little hidden complexity.
2. **Information leakage**: one decision (a representation, a policy, a wire
   or storage detail) living in more than one module; re-exported transport
   types count, parse at the boundary.
3. **Temporal decomposition**: modules split by execution order rather than
   by the knowledge they own.
4. **Pass-through method**: forwards the same arguments to a call of the same
   shape.
5. **Split ownership**: two modules write the same state or keep copies.
6. **Two ways to do one task**: keep one, move the callers, delete the rest in
   the same change.
7. **Importable internals**: make an outside import fail the build.
8. **Hand-synced list**: derive the second copy or fail the build when they
   disagree.

Record both shapes, the pick, the depth argument and each flag with its fix.

## 2. Code quality

Organisation and module structure; shared-code opportunities in the target
and its callers (common behaviour plus a reliability gain or net savings,
with the duplicate's `file:line`; similar looks alone are not enough);
error-handling gaps and missing edge cases, flagged explicitly; debt,
fragility and needless complexity against the preferences; whether touched
files' diagrams stay accurate. An extraction is its own choice; scope
approval does not approve it.

## 3. Tests

Diagram everything new: flows, code paths, jobs, integrations, error paths.
For each item: the test type (unit, integration, system, end to end); whether
the plan has it; the happy-path test; the specific failure-path test; the
edge-case test (nil, empty, boundary, concurrent). For each requirement name
the observable assertion, a wrong result it would reject, and what a green
run does not prove (which fixtures or mocks stand in for what). Reuse settled
coverage without asking; ask, one at a time, only about an open behavioural
choice or an uncovered failure mode. For shared-code changes, audit the
shared contract's tests (behaviour, errors, side effects, boundaries) and each
migrated caller. Then the ambition check: the test that makes you confident
shipping at 2am on a Friday, the one a hostile QA engineer writes, the chaos
test. Note flakiness risks (time, randomness, external services, order). The
result is the **Test plan**: the tests the plan now includes, each named with
what it covers, added to the plan's tasks.

## 4. Performance

N+1 queries and access patterns; memory; caching; slow or complex paths. On
per-request or looped paths: queries in loops, unbounded queries or caches,
missing indexes, whole-file loads, blocking calls without timeouts. Give each
finding a scale (rows, requests per second, bytes) or mark it unknown; never
invent a benchmark.

# Required outputs

- **Decision ledger**: every `R<n>`: finding, baseline, evidence, question,
  options, answer, accepted scope.
- **Scope challenge result**: `scope accepted as-is` or `scope reduced per
  recommendation`, with the cuts.
- **NOT in scope**: considered work explicitly deferred, one sentence each.
- **What already exists**: existing solutions, and reuse versus rebuild.
- **Coherence**: each Section 0 finding with its quotes, the answer and the
  correction for the author; or "no coherence findings".
- **Two shapes and red flags**: both shapes, the pick, the depth argument,
  the flags and fixes; or "no new module or boundary".
- **Diagrams**: non-trivial flows, states and pipelines in ASCII; files that
  need an inline diagram.
- **Failure modes**: for each new diagrammed path, a realistic production
  failure, its test and error-handling coverage, and whether the user sees a
  clear error or silence. No test, no handling and silent is a
  **CRITICAL GAP**.
- **Test plan**: from Section 3.
- **Unresolved decisions**: "that may bite you later", with ids and the
  missing answer. Never silently default.
- **Completion summary**:

```
ENG REVIEW: COMPLETION SUMMARY
Scope challenge       <accepted as-is | reduced per recommendation>
0 Coherence           <n> findings, <n> mechanical
1 Architecture        <n> issues; design-twice <run | not needed>
2 Code quality        <n> issues
3 Tests               diagram produced, <n> gaps, <n> tests added
4 Performance         <n> issues
NOT in scope          written
What already exists   written
Failure modes         <n> critical gaps
Unresolved decisions  <n>
Completeness          <x>/<y> answers chose the complete option (N/A if none scored)
```
