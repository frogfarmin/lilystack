<!-- Lilystack. Rewritten from gstack qa/SKILL.md.tmpl (Phases 8 to 10), the generated qa/sections/exploratory.md and scripts/resolvers/test-value.ts at 466689b (MIT, Copyright (c) 2026 Garry Tan). -->

# The fix loop

Read this only for a batch the owner approved. Before the first edit, run
`git status --short` and note every file that already has changes. A fix that
must touch one of them was named in the batch question; if it was not, ask
before editing it.

## For each finding, in severity order

1. **Reproduce.** Use the replay-confirmed command and the minimized input.
   Write down the actual and the documented behaviour before any edit. Touch
   only the files responsible.
2. **Check the test is worth writing.** The reproduced bug already answers
   what the test protects and what makes it fail. Also answer:
   - Why does existing coverage not catch it? Prefer a new row in an existing
     table-driven test or shared fixture over a near-duplicate.
   - Does it need a production seam (an export, flag, wrapper or injection
     hook) that no production caller needs? If yes, test at the real boundary
     instead.

   Record a value card:
   `Value: protects=<...>; fails_when=<...>; why_new=<...>; seam=none`
   (`seam` is `none` or the seam's name). A healthy contract with no test may
   gain a passing test with no product edit.
3. **Write the regression test first.** Use the smallest native test: unit
   for logic, integration for state or requests, end-to-end only when the
   smaller ones miss the journey. Mock only unrelated services. Match two or
   three nearby tests in naming, imports, assertions and fixtures, and use the
   command that runs them. Never overwrite an existing test file and never add
   a test framework; no framework means report the gap. Mark the test in the
   language's comment syntax:

   ```text
   Regression: QA-NNN <short defect>
   Found by /lilystack:qa on YYYY-MM-DD
   ```

4. **Show it red for the right reason.** Run it before the fix. It must fail
   in its own assertion, on the defect. An import, fixture or service failure
   is a test defect: correct it once, or report the gap. A pass before the
   fix means it is not a regression test. Quote the failing line.
5. **Make the minimal fix.** Read the surrounding source first. Change only
   what the defect needs: no refactor, no feature, no unrelated cleanup.
6. **Re-run three things:** the regression test, the original probe from a
   fresh fixture, and the adjacent happy path. Inspect the final durable
   state; acceptance alone does not verify a worker repair. For a page
   defect, also follow "After a fix" in `sections/browser.md` in this skill's
   directory. If a recheck fails or cannot run, try one revised minimal fix,
   then revert.
7. **Classify:**
   - `verified`: all three rechecks passed on fresh evidence.
   - `best-effort`: the fix is in, but a recheck could not run; name what is
     missing (an external service, an auth state).
   - `reverted`: a recheck failed or the finding stays open. Undo only this
     run's edits, by reversing them with the edit tool; never `git checkout`
     or `git restore` a file that held the owner's changes. Keep the valid red
     regression test and name it. The finding becomes `deferred`.
   - `deferred`: below the tier, not fixable from source, skipped, or
     reverted.

## Stop and check

- After every five fixes, and after any revert, show what is done and ask
  whether to continue.
- Stop at once after two reverts, or after one edit to a file unrelated to
  the finding.
- Also stop when fixes keep spreading across many files, or only low findings
  remain.
- Hard cap: 50 fixes in one run.

## Final pass

Re-run the affected contracts and the adjacent happy paths on the final code.
A recheck that is `blocked` or `inconclusive` never verifies a repair. Warn
first, in the report's opening line, about any contract that regressed.

Add to each finding in the report:

```
    Fix status:    verified | best-effort | reverted | deferred
    Files changed: <paths>
    Regression:    <test path>   <command>
    Red before:    <the failing assertion line>
    Green after:   <regression, original probe, adjacent happy path>
    Value:         protects=...; fails_when=...; why_new=...; seam=none
```

Close with: `QA found N, fixed M (V verified, B best-effort), R reverted, D
deferred.` List every changed file. Never commit: point to `/lilystack:verify`
for the full suite, then `/lilystack:ship` when the owner wants it landed.
