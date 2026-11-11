---
name: test-first
description: Ask before a source edit when no test file has changed yet in the working tree, for the rest of this session
disable-model-invocation: true
hooks:
  PreToolUse:
    - matcher: "Edit|Write|MultiEdit"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/hooks/test-first.sh"
          statusMessage: "lilystack test-first: looking for a changed test"
---
<!-- Lilystack. Rewritten from tdd-guard src/hooks/fileTypeDetection.ts and docs/enforcement.md at ffb7026 (MIT, Copyright (c) 2025 Nizar Selander); and superpowers skills/test-driven-development/SKILL.md and writing-good-tests.md at 22f0b46 (MIT, Copyright (c) 2025 Jesse Vincent). -->

# test-first: a test changes before the code does

Test-first mode is now on for the rest of this session. Before each Edit,
Write or MultiEdit, `hooks/test-first.sh` looks at the target and at `git
status`. Tell the user that, in one line, and what it means:

- **Asks first** when the target is a source file (`.ts`, `.tsx`, `.js`,
  `.jsx`, `.mjs`, `.cjs`, `.py`, `.go`, `.rb`, `.rs`, `.swift`, `.php`, `.kt`,
  `.java`, `.sh`, `.zsh`), it is not a test file, and no test file in that
  working tree is added, modified, renamed or untracked. The reason reads "No
  test file has changed in this working tree yet. Write the failing test
  first, or approve to skip."
- **Passes** a test file (`*.test.*`, `*.spec.*`, `tests/`, `test/`,
  `__tests__/`, `spec/`, `*_test.go`, `*_test.py`, `test_*.py`, `*_spec.rb`,
  `*Test.php` and its Swift, Kotlin and Java kin), any other file, and any
  edit outside git.

When it asks, write or change the failing test first, then make the source
edit. Approve the prompt only for a change with no behaviour to test (a
rename, a comment, config) or when the user says to skip.

## The discipline

The hook is only a barrier in front of the first source edit. The practice
is these rules, for every test in the session:

- **Name the break.** Before the test body, name the production change that
  should make this test fail. If you cannot, or only a decision could (the
  value of a constant, the exact wording of a message), test the behaviour
  that depends on it instead.
- **Take the expected value from outside the code.** Use a literal or a
  hand-checked fixture from the spec. An expectation that the code under
  test or its helpers compute passes whatever that code does.
- **Watch it fail for the right reason.** Run the test before the code
  exists. The right failure is its assertion, because the behaviour is
  missing. A typo, an import error or bad setup is not that failure: fix it
  and run again. A pass means the test covers behaviour that already
  exists: change the test.
- **Then the least code that passes.** Run the project's suite, not only
  your file, and report every red by name.
- **Code written before its test** is not kept beside you as a reference,
  because a test fitted to it proves nothing. Move it to
  `~/to-delete/<date>/<original path>` (never delete it) and write it again
  from the test.

## Limits

- Once any test file is dirty, every later source edit passes, whether or not
  that test covers it. A stateless check of git status can do no better.
- It does not run tests or judge them: an empty or always-green test file
  still counts.
- It sees the file tools only. A file written through the shell (`sed -i`,
  `echo >`, `perl -i`) does not trigger it.
- It keeps no state and makes no network call. Missing jq blocks every edit
  with a message naming the fix.

It is a separate opt-in: `/lilystack:guard` does not register it. The hook
stays registered until this session ends.
