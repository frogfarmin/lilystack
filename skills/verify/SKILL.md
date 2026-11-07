---
name: verify
description: Run the repo's own checks and the tests that cover the change, fix, repeat until green; never calls a change green without a covering test
---
<!-- Lilystack. Rewritten from gstack verify/SKILL.md.tmpl at 466689b (MIT, Copyright (c) 2026 Garry Tan); and agent-skills skills/code-review-and-quality/SKILL.md at 301b02b (MIT, Copyright (c) 2025 Addy Osmani); and compound-engineering-plugin skills/ce-code-review/references/personas/testing-reviewer.md at 173bd33 (MIT, Copyright (c) 2025 Every). -->

# Verify: run, fix, run

Use this while building, before landing. It runs the repo's checks and fixes
code. It never reviews, bumps a version, edits a changelog, commits, pushes or
opens a PR; that is `/lilystack:ship`.

## Step 1: see what will run

Detect the commands from the repo's own files; never invent one it does not
declare:

- `package.json` scripts, `Makefile`, `justfile`, `Cargo.toml`, `pyproject.toml`
- a `tests/` folder of shell scripts
- CI config (`.github/workflows/`), as a hint to what the repo treats as its gate

Find the tests that cover the change: the files in `git diff --name-only
main...HEAD` (`master` if that is the base), the uncommitted changes and
untracked source, then the test files that import, name or sit beside each
changed file. List every command with where it came from. If the repo declares
no check and no test, say so and stop.

Then ask once, in one question, before running any repo command: show the list
and let the owner pick. Use AskUserQuestion where the tool exists; otherwise
ask in plain text and end the turn. Prefer the commands that cover the changed
files. When the change is wide (many modules, shared code, config, build
files), name the full suite as the option.

## Step 2: loop

Run the chosen commands. Read the output; do not rely on the exit code alone.

On a failure:

- Fix the subject under test, not the assertion. A changed source file
  breaking an untouched test is your bug, not a pre-existing one. Call a red
  pre-existing only if it was already red on your first run, before any edit.
- Change a test only when it is wrong and you can say why from the code.
- A missing tool, service, secret, env var or network is not a code failure.
  Report it with the log line; do not stub, skip or work around it.
- A failure that needs a design choice: stop and ask, one question.
- Rerun the failing command while fixing it, then every chosen command before
  you stop.

Never weaken a gate to get green: no skipping or deleting a test, no raised
timeout, no snapshot updated without reading its diff, no suppression pragma,
no loosened threshold, no edited checker config or script. That is a finding to
report, not a fix.

Stop after five runs, when the same failure returns twice after a fix, or on an
environment failure. Report what is still red and why, and point a stubborn
red in your own change to `/lilystack:investigate`.

## Step 3: hand off

```
VERIFY: green | uncovered | red | blocked
Commands:
  <exact command>   <pass/fail/skip counts>
Covering tests:
  <changed file> -> <test name or file>
Not covered:
  <changed file>   (or none)
Still red:
  <check>: <why>   (or none)
```

Green needs every chosen command passing and every changed source file named
against a test that ran it. A change with no covering test is never called
green: report `VERIFY: uncovered`, list the file under Not covered, and offer
to write the test. Write it only if the owner says yes. `blocked` is an
environment failure or a question the owner has not answered.

When the owner wants proof that a covering test can fail, offer the mutation
probe that `/lilystack:ship` Step 5 uses, and ask first: in a scratch worktree
whose HEAD is this commit, with the uncommitted change carried over, flip one
condition the change adds and run the test. Red proves the test; green names
the missing test case. Never mutate the shared checkout.

Then point on: `/lilystack:ship` when the branch is ready to land, or
`/lilystack:review` first if the change has not been reviewed.

## Rules

- Ask before running any repo command, once, in one question.
- Never green without a covering test, and never green from memory; quote the
  run you saw.
- Fix code, not gates. A weakened gate is reported, never applied.
- Read-only on git: never commit, push, open a PR or an issue.
- Docs-only changes with no code to run: say so, and do not call that green.
