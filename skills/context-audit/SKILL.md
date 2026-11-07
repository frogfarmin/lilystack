---
name: context-audit
description: Grade a project's CLAUDE.md and AGENTS.md files against the real codebase, propose fixes as numbered diffs, and apply only the diffs the owner approves; use when instruction files may be stale, thin or bloated
argument-hint: "[project path, default the project root]"
---
<!-- Lilystack. Rewritten from claude-plugins-official plugins/claude-md-management/skills/claude-md-improver/SKILL.md (Phases 1 to 5), references/quality-criteria.md and references/update-guidelines.md at a1ecfbc (Apache-2.0, Copyright Anthropic, PBC; changed). -->

# context-audit: grade the instruction files

Claude Code loads these files into every session, so a dead path or a stale
command costs every session. This audit grades each file against the codebase
as it is and prints proposed changes as numbered diffs. Then it asks one
question, and applies only the diffs that the owner approves, exactly as
shown. It never edits a file the owner did not approve, and never commits.

## Step 1: find the files

The project root is `$ARGUMENTS`, else the git toplevel, else the working
directory. From the root:

```sh
find . \( -name node_modules -o -name .git -o -name vendor \) -prune -o \
  \( -name CLAUDE.md -o -name CLAUDE.local.md -o -name AGENTS.md \) -print
```

That covers the root, nested and package files and `.claude/`. Add
`~/.claude/CLAUDE.md`, the owner's global file; if it is a symlink, name its
target. For each file note its kind (root, nested, package, local, global) and
whether a `CLAUDE.md` and an `AGENTS.md` sit side by side, since both may load.
A `CLAUDE.local.md` is personal: `git check-ignore -q` should pass for it.
If there is no instruction file, say so and stop.

## Step 2: check every claim

Read each file in full, then test what it claims. Never score from the text
alone.

- **Paths.** Every file and folder it names exists (`test -e`, relative to
  the file's folder, then the root). For a missing one,
  `git log --oneline -1 -- <path>` shows the commit that moved or removed it.
- **Commands.** The tool is installed (`command -v <tool>`). A script it
  names exists (`test -f`), and is executable (`test -x`) if it is run
  directly. A `package.json` script, or a `Makefile` or `justfile` target, is
  declared there.
- **Running.** Do not run a documented command by default. If a claim can
  only be checked by running it, ask once, listing the exact commands, as
  `/lilystack:verify` does. Read the output, not only the exit code.
- **Architecture.** The folders it maps exist; name the top-level folders it
  leaves out (`git ls-files | cut -d/ -f1 | sort -u`).
- **Currency.** Tools and versions match the manifests (`package.json`,
  `pyproject.toml`, `Cargo.toml`, `Brewfile`).
- **Duplicates.** The same fact in two instruction files, the global one
  included.
- **Leftovers.** `TODO`, `TBD` or `FIXME` in the file.

Record each check as `<claim>: ok | missing | fails | unverified`.

## Step 3: score

| Criterion | Points | Full marks look like |
|---|---|---|
| Commands and workflows | 20 | build, test, lint and run commands, with when to use each |
| Architecture clarity | 20 | key folders, how modules relate, entry points, data flow where it matters |
| Non-obvious patterns | 15 | gotchas, workarounds, edge cases, why an odd choice was made |
| Conciseness | 15 | every line adds something; nothing the code or its names already say |
| Currency | 15 | commands work, paths exist, the stack is current |
| Actionability | 15 | copy-paste commands, concrete steps, real paths |

Score in bands: 20, 15, 10, 5, 0 for full, minor gaps, basic only, sparse,
absent (15, 10, 5, 0 on a 15-point row). A global or local file is scored
on what it is for: mark a criterion that does not apply `n/a` and scale the
total to 100.

Grades: **A** 90-100 comprehensive, current, actionable; **B** 70-89 good,
minor gaps; **C** 50-69 basic, key sections missing; **D** 30-49 sparse or
outdated; **F** 0-29 missing or badly outdated.

**Red flags**, each listed with its line:

- a command that would fail (wrong path, missing tool or script);
- a reference to a deleted file or folder;
- an outdated tool or version;
- template text never fitted to the project;
- generic advice that fits any project;
- a TODO never done;
- the same fact in two instruction files;
- a tracked `CLAUDE.local.md`.

## Step 4: propose

The context window is precious: every line must earn its place. Propose only
what a fresh session needs and cannot find fast from the code: commands found
during the audit, gotchas seen in the code, relationships between modules,
test approaches that work, configuration quirks. Propose removing lines that
the checks proved stale or duplicated.

Never propose what the code or its names already say, generic best practice
("write tests", "use clear names"), a one-off fix that will not recur, or a
paragraph where one line will do.

Before printing a proposal, check that it is specific to this project, that
its commands and paths passed Step 2 (or are marked unverified), and that it
is the shortest form that works.

Number the proposals 1, 2, 3 across the whole report, one number per diff, so
that the owner can name them. A diff holds enough unchanged context lines to
find its place in the file without doubt. A proposal touches only an
instruction file from Step 1, or creates a new `CLAUDE.md` or `AGENTS.md`.

## Step 5: the report

````
## Context audit: <project>

Files: N   Average: X/100   Needing changes: K

### 1. ./CLAUDE.md (root)   XX/100, grade X

| Criterion | Score | Notes |
|---|---|---|
| Commands and workflows | x/20 | ... |
| Architecture clarity | x/20 | ... |
| Non-obvious patterns | x/15 | ... |
| Conciseness | x/15 | ... |
| Currency | x/15 | ... |
| Actionability | x/15 | ... |

Checks: N ok, N missing, N fails, N unverified
Red flags:
- line 12: `npm run e2e`: no such script in package.json

#### Proposed 1: ./CLAUDE.md
Why: <one line: what a future session gains>
```diff
 ## Commands
+`npm run test:unit` runs without the database; `npm test` needs it.
-See docs/setup-old.md for the dev server.
```

### 2. ./packages/api/CLAUDE.md (package)
...
````

With no proposal, end with one line: "No changes proposed. Nothing was
changed." and stop. Else go to Step 6.

## Step 6: apply what the owner approves

Ask one question after the report. Use AskUserQuestion where the tool exists;
otherwise ask in plain text and end the turn.

- A) Apply all proposed diffs (1 to N).
- B) Apply only the numbers I name.
- C) Stop. Change nothing.

Recommend nothing; the owner chooses. On C, end with "Nothing was changed."
On B, the owner names the numbers; a number that is not in the report gets
one follow-up question. If the owner wants a diff changed, show the new diff
and get a yes for that exact diff before you apply it. If the owner rejects a
proposal, give your reason two times at most, then drop it.

For each approved diff, in number order:

1. Read the file again. If the lines the diff removes, or its context lines,
   are no longer there as shown, do not apply it. Show what changed and mark
   it `not applied: file changed`.
2. Apply it exactly as shown, with the edit tool: the same lines, at the same
   place, and nothing else. Keep the rest of the file as it is: its order,
   headings and line breaks. Create a file only when the approved diff
   creates it. For a symlink, edit the target that Step 1 named.
3. Never touch a file, or a part of a file, that no approved diff names.

Then grade again. Run the Step 2 checks and the Step 3 score on each changed
file only, and show the change:

```
### After
| File | Before | After | Grade |
|---|---|---|---|
| ./CLAUDE.md | 62/100 | 81/100 | C -> B |

Applied: 1, 3   Not applied: 2 (file changed)
New red flags: none
```

A score that falls, or a new red flag, gets one line on why. Show
`git diff --stat -- <changed files>` where the project is a git repository.
End with one line: "Applied K diffs to <files>. Nothing was committed."

## Rules

- Edit only after approval: only the files and the diffs that the owner
  approved, exactly as shown. Never move or delete a file, and keep no notes
  file; the report lives in chat.
- Never commit, stage, stash or push. The owner commits, on request.
- Every score and red flag has a check or a line behind it; mark the rest
  unverified instead of guessing.
- Ask once before running any documented command.
- Propose the smallest change that fixes a finding; a file with no finding
  needs no proposal.
