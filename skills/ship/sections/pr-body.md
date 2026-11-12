<!-- Lilystack. Rewritten from gstack ship/sections/pr-body.md.tmpl, document-release/SKILL.md.tmpl and spec/SKILL.md.tmpl at 466689b (MIT, Copyright (c) 2026 Garry Tan); and mattpocock-skills skills/engineering/pr/SKILL.md at 4ae2317 (MIT, Copyright (c) 2026 Matt Pocock; idea only). -->

# PR title and body

Read when `/lilystack:ship` reaches Step 9. Write both from this run's
evidence, never from a prior run. Show them whole at the ASK; post them from a
file (`--body-file`), not a shell string.

## Title

`<type>: <summary>` (feat, fix, chore, refactor, docs, test). The summary names
what the reader gets, not the mechanism. No version prefix.

## Body

```
## What
<Open with the problem in the user's words: what they hit, saw or asked for.
Then the fix and what they get now. Themes from
`git log origin/<base>..HEAD --oneline`, never a commit list or inventory.
BAD:  "Adds a parser helper, wires two callers, refreshes the snapshots."
GOOD: "Empty files crashed the importer with no message. It now reports the
       file and skips it.">

## Why
<The reason this change, in one or two sentences. Link the plan or spec, and
the issue under the closing rule below.>

## How it was tested
- <lane>: <command> -> pass, N tests (or "count unavailable")
- <Coverage line from Step 5, and the coverage diagram, or "All changed paths
  have tests.">
- <Tests added, with regression tests marked "fails on old code, passes now".>
- <Mutation probes: each as file:line, the test, killed or survived; surviving
  ones name the missing test case. Omit when no probe ran.>
- <Not run or could not run, each named.>

## Review
<Findings from the `/lilystack:review` pass: fixed, open, skipped; or "No
issues found." Gate edits line from the review report, verbatim.>

## Blast radius
Door: <one-way or two-way>. <One-way when merging cannot be walked back by a
revert: a destructive migration, a removed public surface, data sent out.>
<One or two sentences: what else the change touches (callers, consumers,
generated files) and the one fact that makes that safe, with its evidence
(file:line read, test name, command run).>

## Documentation
<Files updated, files reviewed, stale lines left and why. Coverage gaps from
Step 6, critical ones first, and any diagram drift. "No documented behaviour
changed" when true.>

## Plan
<Checklist from Step 7: done, changed, partial and not-done tasks; each
Required AC with its evidence; any contradiction with the spec; the
builder's rulings and deferrals from the build ledger, quoted. Omit when
no plan was found.>

## What is not done
<Every NOT DONE or PARTIAL plan item or AC, every accepted test gap and
surviving mutation, every pre-existing failure shipped over, every open review
finding, every critical documentation gap. Write "Nothing known" only when
each list above is empty.>
```

## Rules

- Evidence only: a result is in the body because a command in this run printed
  it. Unavailable or inconclusive is never written as passing.
- Omit a section only where this file says so; keep "What is not done" always.
- Closing keywords: `Closes #N` only when the spec header names issue #N and
  every Required AC is DONE, or, with no spec, when the plan names the issue
  and is fully done and verified. Otherwise `Linked to #N`, naming the
  remainder. Never take the issue number from the branch name.
- No secrets, tokens, private absolute paths or finding snippets that quote
  credentials.
- Keep it short. A reviewer should read it in under a minute.
