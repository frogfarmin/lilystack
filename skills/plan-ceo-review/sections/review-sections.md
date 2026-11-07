<!-- Lilystack. Rewritten from gstack plan-ceo-review/sections/review-sections.md.tmpl at 466689b (MIT, Copyright (c) 2026 Garry Tan). -->

# The eleven review sections

Evaluate each in full. Use **CRITICAL GAP**, **WARNING** and **OK** so findings
scan. After each section, resolve what needs a decision with one question,
record the answer, then move on; do not write a later section's conclusions
early. Preserve accepted requirements: never weaken a guarantee, accept its
violation, or change a test to expect it.

## 1. Architecture

Open with the current scope: the mode, the decisions so far, what is accepted,
deferred, rejected and pending. Then evaluate and diagram: component
boundaries and the dependency graph; every new data flow on all four paths
(happy, nil, empty, upstream error); a state machine for every new stateful
object, including impossible transitions and what prevents them; new coupling
and whether it is justified; what breaks first at 10x and 100x; single points
of failure; auth boundaries and data access for every new endpoint or
mutation (who can call it, what they get, what they can change); one
realistic failure per integration point and whether the plan handles it; the
rollback path and time if it ships broken. When the plan adds an artifact
about the work that nothing consumes (a report, a matrix, a certificate),
ask who uses it and what changes because it exists. Expansion modes add: what
would make this obvious to a new engineer, and what makes it a platform.
Required diagram: the system with new components among existing ones.

## 2. Error and rescue map

The section that catches silent failures. For every new method or code path
that can fail:

```
METHOD/CODEPATH       | WHAT CAN GO WRONG     | EXCEPTION CLASS
EXCEPTION CLASS       | RESCUED? | RESCUE ACTION          | USER SEES
TimeoutError          | Y        | retry twice, then raise | temporary outage
JSONParseError        | N  GAP   |                        | 500      BAD
```

Catch-all handlers are a smell: name the exception. Generic logging is not
enough: log what was attempted, with what, for whom. A rescued error retries
with backoff, degrades with a visible message, or re-raises with context;
swallowing is almost never acceptable. For each GAP, specify the rescue and
what the user sees. For model calls, treat malformed, empty, invalid and
refused answers as distinct failures.

## 3. Security and threat model

New attack surface (endpoints, params, paths, jobs); validation of every new
input against nil, empty, wrong type, too long, unicode, injection; whether
each data access is scoped to the right user and whether an id can be
manipulated; secrets in env not code, rotatable; new dependencies and their
record; data classification (PII, payment, credentials); injection vectors
including prompt injection; audit logging for sensitive operations. For each
finding: threat, likelihood, impact, mitigated or not.

## 4. Data flow and interaction edge cases

Diagram every new data flow as `INPUT -> VALIDATION -> TRANSFORM -> PERSIST
-> OUTPUT` with shadow paths (nil or empty or wrong type; invalid or too long;
exception, timeout, out of memory; conflict, duplicate, lock; stale, partial,
bad encoding) and say what happens at each node, and whether it is tested.
For flows that share mutable state: state the invariant and its boundary,
show both completion orders for each pair of overlapping awaits, name the
mechanism that excludes the bad order, and specify the regression test with
controlled pause points. For every new interaction, a table
`INTERACTION | EDGE CASE | HANDLED? | HOW?` covering double submit, navigate
away, timeout and retry, zero and large and changing lists, failed and
duplicate jobs. Each unhandled case is a gap with a fix.

## 5. Code quality

Fit with existing patterns; duplicated behaviour with file and line (similar
looks alone are not a reason to extract); names that say what, not how; error
handling patterns (Section 2 holds the specifics); missing nil, empty,
timeout and boundary cases; over-engineering (abstractions for problems that
do not exist); under-engineering (happy-path fragility); any new method that
branches more than five times, with a refactor.

## 6. Tests

Diagram everything new (flows, code paths, jobs, integrations, error paths)
and for each item: the test type, whether the plan has it, the happy-path
test, the specific failure-path test, the edge-case test. For each
requirement, name the observable assertion, a wrong result it would reject,
and what a green run does not prove (which fixtures or mocks stand in for
what). Reuse settled coverage without asking again; ask only about an open
behavioural choice or an uncovered failure mode, one at a time. Then the
ambition check: the test that makes you confident shipping at 2am on a
Friday; the test a hostile QA engineer writes; the chaos test. Check the
pyramid, flakiness risks (time, randomness, external services, order) and
load tests for hot paths. For prompt or model changes, name the eval cases
and baselines.

## 7. Performance

N+1 queries and preloading; the maximum production size of every new data
structure; an index for every new query; caching for expensive calls; worst
case payload, runtime and retries for every new job; the three slowest new
paths with estimated p99; connection pool pressure.

## 8. Observability and debuggability

Structured logs at entry, exit and significant branches of every new path;
the metric that says it works and the one that says it is broken; trace ids
across services and jobs; new alerts; day-one dashboard panels; whether a bug
reported three weeks later can be reconstructed from logs; admin tooling;
a runbook per failure mode. Expansion modes: what would make this a joy to
operate.

## 9. Deployment and rollout

Migration safety (backward compatible, zero downtime, locks); feature flags;
rollout order (migrate, then deploy); an explicit rollback; what breaks while
old and new code run together; environment parity; the first five minutes
and first hour of post-deploy checks; smoke tests.

## 10. Long-term trajectory

Debt introduced (code, operations, tests, docs); path dependency; knowledge
concentration; reversibility on a 1 to 5 scale (1 is a one-way door); fit
with the repo's conventions; whether a new engineer understands it in a year.
Expansion modes: what comes after this ships, and whether the architecture
supports it; selective mode: were the right cherry-picks taken.

## 11. Design and UX (UI scope only)

Not a pixel audit; the founder calling in the designer. Information
architecture (first, second, third thing seen); a state map
`FEATURE | LOADING | EMPTY | ERROR | SUCCESS | PARTIAL`; journey coherence;
slop risk (generic patterns); alignment with the design system; responsive
intent; accessibility basics. Required diagram: screens, states and
transitions.

# Required outputs

- **Decision ledger**: id, class (Mechanical, Taste, User Challenge),
  question, answer, scope, for every question asked.
- **Accepted scope**: what the plan now includes.
- **NOT in scope**: deferred and rejected work listed separately, each with the
  actual answer and a one-line reason.
- **Deferred items**: for each, what, why, pros, cons, context for someone
  picking it up in three months, effort as S, M, L or XL, priority, blockers,
  and the observation that would reopen it with when it could arrive.
- **What already exists**: code and flows that partly solve sub-problems and
  whether the plan reuses them.
- **Dream state delta**: where this plan leaves the twelve-month ideal.
- **Error and rescue registry**: every method that can fail, its exceptions,
  rescue status and action, user impact.
- **Failure modes registry**:
  `CODEPATH | FAILURE MODE | RESCUED? | TEST? | USER SEES? | LOGGED?`; a row
  with RESCUED N, TEST N and USER SEES silent is a CRITICAL GAP.
- **Diagrams**, all that apply: system architecture, data flow with shadow
  paths, state machine, error flow, deployment sequence, rollback. Then a
  stale-diagram audit of diagrams already in the touched files.
- **Unresolved decisions**: any question left unanswered, never silently
  defaulted.
- **Completion summary**:

```
PLAN REVIEW: COMPLETION SUMMARY
Mode                    <mode>
Audit                   <key findings>
Step 0                  <decisions>
1 Architecture          <n> issues
2 Errors                <n> paths mapped, <n> gaps
3 Security              <n> issues, <n> high
4 Data and interaction  <n> edge cases, <n> unhandled
5 Quality               <n> issues
6 Tests                 diagram produced, <n> gaps
7 Performance           <n> issues
8 Observability         <n> gaps
9 Deployment            <n> risks
10 Trajectory           reversibility <n>/5, <n> debt items
11 Design               <n> issues, or SKIPPED (no UI scope)
NOT in scope            <n> items
Failure modes           <n> total, <n> CRITICAL GAPS
Scope proposals         <n> proposed, <n> accepted
Diagrams                <list>
Unresolved decisions    <n>
```
