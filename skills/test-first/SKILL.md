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
<!-- Lilystack. Rewritten from tdd-guard src/hooks/fileTypeDetection.ts and docs/enforcement.md at ffb7026 (MIT, Copyright (c) 2025 Nizar Selander). -->

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

When it asks, write or change the failing test first and run it to see it
fail for the right reason, then make the source edit. Approve the prompt only
for a change with no behaviour to test (a rename, a comment, config) or when
the user says to skip.

The discipline itself lives in superpowers' `test-driven-development` skill
and mattpocock's `tdd` skill; this hook only adds a barrier in front of the
first source edit.

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
