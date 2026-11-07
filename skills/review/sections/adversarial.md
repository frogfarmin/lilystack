<!-- Lilystack. Rewritten from compound-engineering-plugin skills/ce-code-review/references/personas/adversarial-reviewer.md at 173bd33 (MIT, Copyright (c) 2025 Every); and gstack review/sections/adversarial.md.tmpl at 466689b (MIT, Copyright (c) 2026 Garry Tan). -->

# The adversarial lens

Attack the change instead of grading it. Build concrete scenarios in which it
fails: "if this happens, then that happens, which breaks this". The checklist,
the security section and the narrow lenses each own one pattern. This lens owns
the space between them: combinations, assumptions, sequences, and bad results
that come from normal use.

## Depth

Count the changed lines in the hunks (additions plus deletions), leaving out
tests, generated files and lockfiles. Scan the diff, the branch name, the
commit subjects and the plan for risk signals: authentication, authorization,
payment, billing, data migration, backfill, external API, webhook,
cryptography, session management, personal data, a delete or move of files.

| Depth | When | Run |
|---|---|---|
| Quick | under 50 lines, no risk signal | assumptions only: name two or three, at most three findings |
| Standard | 50 to 199 lines, or a minor risk signal | assumptions, composition, abuse |
| Deep | 200 lines or more, a strong risk signal (auth, money, data mutation), or a HIGH-risk function with 50 or more callers | all four, then multi-step chains, then a second pass over the busiest interaction points |

**Verification override.** When the diff is itself a check that stands in for
the real thing (CI gating logic, a merge-blocking check, a build or deploy
step, a coverage or lint gate, a hook, a test harness, a mock or a fixture that
could mask production), never pick Quick, whatever its size, and run the
fidelity attack in section 5. In a repo of skills and hooks, the hooks, the
lint and the test scripts are this kind of code.

## 1. Assumptions

For each assumption, build the input or condition that breaks it and trace the
result through the code.

- **Data shape**: the API always returns JSON, the config key is set, the queue
  is not empty, the list has at least one element.
- **Timing**: the call ends before the timeout, the resource exists when it is
  read, the lock is held for the whole block.
- **Ordering**: events arrive in order, start-up finishes before the first
  request, cleanup runs after all the work.
- **Value range**: ids are positive, strings are not empty, counts are small,
  timestamps are in the future.
- **Liveness in a deletion**: a deleted file is assumed to be unreachable, and
  the diff shows only its header. Look past static imports: references by
  string (asset paths, config and plugin names, skill and section names),
  routes resolved from file names, and registrations the file made when it
  loaded. A finding quotes the surviving line that still uses the file. A
  deleted test is a different question: does the code it tested still ship?
  Read the old body with `git show <base>:<path>` only when the attack needs it.

## 2. Composition

Each part is correct alone, and the combination fails.

- **Contract mismatch**: the caller passes a value the callee does not expect,
  or reads the return value differently from what the callee meant.
- **Shared state**: two parts read and write the same row, cache key, file or
  global with no coordination.
- **Ordering across boundaries**: part A assumes part B already ran, and nothing
  makes it so; a callback fires before setup ends.
- **Error contract divergence**: part A throws errors of type X, part B catches
  type Y, and the error escapes.

## 3. Cascades

One condition sets off the next. Give the trigger, each step and the final
state.

- **Exhaustion**: A times out, B retries, the retries load A, and A times out
  more often.
- **Corruption spread**: A writes partial data, B decides on it, C acts on B's
  decision.
- **Recovery-induced**: the error path makes new errors. A retry creates a
  duplicate; a rollback leaves orphaned state; a circuit breaker opens and
  blocks the recovery path.

## 4. Abuse

Normal-looking use with a bad result. These are not exploits and not
performance patterns.

- **Repetition**: the same action sent fast. What happens the 1000th time?
- **Timing**: a request during a deploy, between a cache flush and its refill,
  just after a dependency restarts.
- **Concurrent mutation**: two users edit one resource, two processes claim one
  job, two requests change one counter.
- **Boundary walking**: the maximum size, the minimum value, exactly the rate
  limit, a value that is valid but makes no sense, the empty and the huge case.
- **External failure**: each external call fails, hangs or answers twice.

End with the strongest objection a hostile reader would raise against the
change. If it holds, it is a finding.

## 5. Fidelity of a check

A check can go green while the thing it protects is red. Build the scenario in
which the guard passes and the real thing fails. Then confirm that the check
reproduces the real context, inputs and steps: build context, working
directory, prepared directories, environment and the exact command sequence,
not only that it runs. It is a finding when the check runs in a different
context from production, mocks away the path that breaks, or asserts on a proxy
instead of the real output.

Gate integrity (Step 3.5) asks whether a relaxed gate is justified. Fidelity
asks whether a new or changed gate tests the real thing at all.

## Confidence and titles

| Confidence | The scenario |
|---|---|
| 9-10 | mechanically constructible: every step checks out against the diff and the code around it, with no assumed runtime condition |
| 7-8 | complete and concrete: this input or state, this path, this line, this wrong result |
| 5-6 | one step depends on a condition you can see but not confirm (an external format, a race window); report it only if it would be CRITICAL, in the low-confidence appendix |
| 4 or less | speculation: no traceable steps, or several unlikely conditions at once. Drop it |

Title each finding by the failure you built, not the pattern you matched:
"Cascade: payment timeout sets off an unbounded retry loop", not "Missing
timeout handling". Under the title give the trigger, the path and the outcome,
one line each.

## Routing

Adversarial findings go to ASK, never AUTO-FIX: they raise a risk for the owner
to judge. Severity follows the checklist's floor. A read-only subagent may run
this lens. It gets the diff command, the plan or spec, the rule text from
Step 2 and this text, never your conclusions.

## Not this lens

Leave these to the rest of the review: one logic bug with no effect across
parts; known vulnerability patterns (`sections/security.md`); one missing error
handler on one I/O call (the silent-failures lens); N+1 queries and missing
indexes; style, naming and dead code (the lean scan); test coverage and weak
assertions (the tests lens), except when the harness or mock is itself the
change, which is fidelity; public contract breaks and migration safety (the
checklist).
