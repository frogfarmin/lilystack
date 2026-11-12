<!-- Lilystack. Rewritten from gstack ship/sections/test-coverage.md.tmpl at 466689b (MIT, Copyright (c) 2026 Garry Tan); and agent-skills skills/code-review-and-quality/SKILL.md at 301b02b (MIT, Copyright (c) 2025 Addy Osmani); and compound-engineering-plugin skills/ce-code-review/references/personas/testing-reviewer.md at 173bd33 (MIT, Copyright (c) 2025 Every); and superpowers skills/test-driven-development/writing-good-tests.md, skills/writing-plans/SKILL.md at 22f0b46 (MIT, Copyright (c) 2025 Jesse Vincent). -->

# Coverage: map, rate, probe

Read when `/lilystack:ship` reaches Step 5. Map the diff to its tests, rate
each test by what it can catch, and prove the doubtful ones by experiment.

## The diagram

One line for each changed code path, with its tests:

```
[+] path/to/file.ext
  fn parse()
    happy path          [★★ tested  test/parse_test.ext:14]
    empty input         [GAP]
    malformed input     [★ smoke only  test/parse_test.ext:30]
  fn save()
    write fails         [GAP: mutation survived  test/save_test.ext:9]
Review focus (docs/specs/<slug>.md)
  duplicate ids         [GAP]
```

A required row from a spec's `## Review focus` goes under its own heading. It
stays `[GAP]` until a test names its input or condition and asserts the
behaviour the line expects.

## Ratings

- ★ it runs and does not crash (smoke).
- ★★ it asserts the happy-path result.
- ★★★ it asserts edge cases and error paths too.

Weak means ★, or an unrated test. A test that cannot fail when the code is
broken is no coverage, whatever it asserts.

## False-confidence shapes

These tests pass when the code under test is broken. Rate each one ★ at most
and name its shape:

- It asserts only that a call does not throw, or checks truthiness where a
  specific value is known.
- Its expected value comes from the helper, builder or renderer under test (a
  mirror assertion). Expected values are literals or hand-checked fixtures.
- A mock or fixture supplies the result, ordering or side effect that the
  code is meant to produce, or the test asserts on the mock itself.
- Its negative case is rejected by a different guard than the one the test
  names.
- It greps the text of a script or config instead of running it and checking
  the output, side effect or exit code.

**Mirror tests.** A test that compares a file or an output with a hard-coded
list or fixture covers the change only if it also checks the source of truth
that makes the list. Ask: if the source script changes and this expected list
does not, does the test fail? If not, the missing source-of-truth assertion is
a gap.

## The mutation probe

Reading cannot prove that a test can fail; an experiment can. Probe the tests
that a coverage claim leans on: each ★★★ claim on a condition the change
adds, and any test you doubt. At most three probes in a run.

1. ASK once for the batch, before anything runs. Show the worktree command,
   each mutation as `file:line: before -> after`, and the test command for
   each. A) run them (recommended), B) skip; the ratings stay as read.
2. Make a scratch worktree under the scratchpad or `$TMPDIR`, whose HEAD is
   the reviewed commit: `git worktree add --detach <scratch>/probe HEAD`. Make
   sure `git -C <scratch>/probe rev-parse HEAD` prints the same SHA as
   `git rev-parse HEAD`. Carry the uncommitted candidate over with
   `git diff HEAD --binary | git -C <scratch>/probe apply`, and copy in the
   untracked source files Step 1 named. If the trees do not match, stop the
   probe and say so.
3. Never mutate the shared checkout. Every edit below happens in the
   worktree.
4. Copy the target file aside. Flip one condition that the change adds: drop
   a negation, swap `&&` and `||`, move a boundary (`<` to `<=`), or return
   the empty or default value. One mutation for each run.
5. Run the covering test with the command Step 3 used, and read its summary
   line. Red: the test is sensitive to that condition; keep its rating.
   Green: the mutation survived. Name the missing test case ("no test passes
   an empty list to parse()") and mark the row `[GAP: mutation survived]`. A
   run that cannot start (a missing dependency, no build) is "probe not run",
   never a pass.
6. Put the copy back before the next mutation. When the batch is done, ask
   before removing the worktree, as Step 3 does.

Each surviving mutation joins the gaps for Step 5's ask, and the PR body names
it under "How it was tested".
