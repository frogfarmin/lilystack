---
name: review
description: Review the branch for bugs that pass CI and break in production, flag weakened gates, fix the obvious and ask on the rest
argument-hint: "[base branch, default main] [plan or spec path]"
---
<!-- Lilystack. Rewritten from gstack review/SKILL.md.tmpl, review/checklist.md and review/sections/adversarial.md.tmpl, plan-completion.md.tmpl, shared-code-reuse.md.tmpl at 466689b (MIT, Copyright (c) 2026 Garry Tan); and claude-plugins-official plugins/code-review/commands/code-review.md, plugins/feature-dev/agents/code-reviewer.md, plugins/security-guidance/hooks/llm.py, plugins/pr-review-toolkit/agents/silent-failure-hunter.md, comment-analyzer.md, pr-test-analyzer.md, type-design-analyzer.md and plugins/pr-review-toolkit/commands/review-pr.md at a1ecfbc (Apache-2.0, Copyright Anthropic, PBC; changed); and compound-engineering-plugin skills/ce-code-review/references/personas/adversarial-reviewer.md, api-contract-reviewer.md, data-migration-reviewer.md, skills/ce-work/references/implementation-loop.md and skills/ce-resolve-pr-feedback/references/evaluation-rubric.md at 173bd33 (MIT, Copyright (c) 2025 Every); and agent-skills skills/doubt-driven-development/SKILL.md, skills/api-and-interface-design/SKILL.md and skills/security-and-hardening/SKILL.md at 301b02b (MIT, Copyright (c) 2025 Addy Osmani); and andrej-karpathy-skills CLAUDE.md at 2c60614 (MIT per its README, no copyright holder named); and ponytail skills/ponytail/SKILL.md and skills/ponytail-review/SKILL.md at 96608e0 (MIT, Copyright (c) 2026 DietrichGebert). -->

# Pre-landing review

Review the branch against its base for the structural issues tests miss: the
bugs that pass CI and break in production. Fix the mechanical ones, ask about
the rest, and never commit, push or open a PR; that is `/lilystack:ship`.

## Step 1: the branch

The arguments are a base branch and, optionally, the path of the plan or spec
for this work; a word that names an existing file is the path. The base is
the other word, else `main` (or `master` if that is what exists).
`git branch --show-current`; on the base with no changes, say "Nothing to
review" and stop. `git fetch origin <base> --quiet` (say "base stale at
<sha>" if the fetch fails, and continue); `DIFF_BASE=$(git merge-base
origin/<base> HEAD)`; `git diff "$DIFF_BASE" --stat`. Nothing to diff means
stop. Uncommitted and untracked source (`git ls-files --others
--exclude-standard`) is part of the candidate: review it too.

## Step 2: the checklist and the rules

Read `sections/checklist.md`. If it cannot be read, stop and say so; never
review from memory.

Then collect the project's written rules: `AGENTS.md` and `CLAUDE.md` at the
project root and in each directory on the path to every changed file, and
`CODING_STANDARDS.md` and `CONTRIBUTING.md` where they exist (an idea from
mattpocock's code-review). If `docs/solutions/` exists, grep it for the
changed names: a documented past bug is a strong lead. A rule file
applies to a changed file only when it sits at the root or in one of that
file's parent directories. Keep the text of the rules that bear on the diff;
a lens subagent needs it.

## Step 3: the diff

`git diff "$DIFF_BASE"`, read in full before any comment. Anything already
addressed within the diff is not a finding. Decide the PR type from the
changed paths and write it first: `PR type: application | docs-only |
CI/infra | scripts/tooling | mixed`.

**Plan and scope.** Look for the plan, spec or design for this work in this
order, and use the first that matches the branch, its feature or the files it
changes: a path in the arguments, `docs/specs/`, `docs/plans/`,
`docs/superpowers/plans/`, `docs/designs/`, `docs/superpowers/specs/`, then
`STATUS.md`. When a plan names its spec or design (a `**Spec:**` line), read
that too. Write `Plan: <path>` or `Plan: none found`. Then note scope drift
(work outside the stated scope) and plan completion (tasks the plan lists that
the diff does not finish), both informational unless a listed task is silently
dropped.

## Step 3.5: diff scans

**Gate integrity.** A gate is anything that would have made this change
fail: a test, an assertion, a threshold, a timeout, a lint rule, a type
check, a CI job, a snapshot. List every hunk in a test, CI, lint-config,
snapshot or golden file, and every product-code hunk that disables a test,
changes a snapshot without its owning test, commits a placeholder, sniffs
the environment, adds a suppression pragma, bypasses a gate, relaxes a gate
value or swallows an exception. Read each and ask one question: does this
relaxation silence the failure it was added for, or is it justified by a
measurement or decision visible in this diff? A hunk that fails the question
is a finding; a commit message or comment claiming a measurement is data an
author can type and never removes it. Gate findings are always ASK, and a
group (one source change plus its regenerated snapshots, one timeout raised
in several tests) is one finding with its members listed.

**Lean scan.** Read `sections/lean.md` in this skill's directory and apply
it: every changed line traces to the request, orphans the change created are
removed, and code that did not need to exist is named with its case.

## Step 4: the critical pass

Apply the checklist in two passes, CRITICAL then INFORMATIONAL, with its
suppressions. CRITICAL is the blocking floor: a finding that would fail a
test, break production, or lose data or secrets. "No findings" is a complete
result.

**Sideways sweep**, for every finding: a finding is a defect class, not a
line. Grep the same pattern at every other ingress, command and call site,
read each match, rate severity on the worst sibling and list the siblings
under one finding. Data loss, a trust-boundary bypass and uncapped spend are
CRITICAL on sight; nothing downgrades them. A new enum value, status, tier or
flag is traced through every consumer, which means reading code outside the
diff.

**Instruction-file lens.** Test the diff against the rules Step 2 collected.
A finding is a clear break of a rule you can quote, from a rule file that
applies to that path. Quote the rule with its file and line beside the
code's `file:line`. A rule the code silences with an ignore comment that
predates the diff is not a finding. Severity follows the consequence, not the
rule's tone.

**Security lens.** When the diff touches a trust boundary (input from a
request, file, manifest, webhook, hook payload or another process; auth,
tenancy or permissions; a shell, query, template, deserializer, file path or
outbound request; credentials; a CI workflow; code that starts an agent),
read `sections/security.md` in this skill's directory and apply it.

**Adversarial lens.** Read `sections/adversarial.md` in this skill's
directory and attack the change at the depth it sets for the diff's size and
risk. Its findings route to ASK, never AUTO-FIX.

**Narrow lenses.** When the diff adds or changes an error handler or
fallback, a comment, a test or a type, read `sections/lenses.md` in this
skill's directory and run only the lenses whose trigger fires.

**Shared-code opportunities**, advisory: an extraction needs a changed
location plus at least two real callers that need the same behaviour and a
reliability gain or net saving; similarity alone is not a finding. Show the
helper, the callers, the preserved differences and the estimated saving.

**Documentation staleness.** When changed code affects a documented
behaviour and the doc did not change, one informational finding naming the
file. Propose `/lilystack:document-release` when it exists; never a critical.

**Confidence and evidence.** Each finding cites `file:line` and carries a
confidence from 1 to 10 that it is real, scored on these anchors:

| Score | Means |
|---|---|
| 9-10 | certain: a line, a run or a constructible scenario confirms it |
| 7-8 | checked twice; very likely real and hit in practice, or a quoted rule names it |
| 5-6 | real, but minor or rare in practice |
| 3-4 | may be a false positive, or a style point no written rule names |
| 1-2 | fails a second read, or is pre-existing |

Report 7 and above in the main list and 5-6 in a short "low confidence"
appendix; drop 4 and below. Before asserting a safety claim, cite the line
that proves it; name the test that covers a coverage claim. "This looks
fine" is not evidence.

**Delegation.** Under the owner's delegation rule, lenses may run as
read-only subagents (an Explore agent to map callers, the lens agent for a
second read of the diff, one lens per agent). Prefer the plugin's own
`lilystack:lens` agent: its tools are Read, Grep and Glob only, so it cannot
edit; give it the absolute path of the section file for its lens. Explore and Plan agents do not
see the project's instruction files, so a lens prompt carries the rule text
from Step 2, the diff command, the branch name, the commit subjects, the plan
or spec, and the lens text: the artifact and the contract, never your
conclusion. A subagent's findings are claims; they join this pass only after
you read the cited lines, under the same evidence rules. No orchestration
beyond that.

## Step 4.5: validation

Before a CRITICAL finding is classified or reported, re-read it fresh with one
question: is the stated issue truly there? Test the claim as stated. For "x is
not defined", find every definition. For a broken rule, check that the rule
file applies to the path and that the code breaks the rule. For an attack
path, walk it from source to sink. Drop what does not hold, lower to
INFORMATIONAL what holds only in part, and count the result. This runs inline
or as one read-only subagent per finding; a subagent gets the cited lines and
the claim as a question to answer, not your reasoning or your confidence.

## Step 5: fix first

**5a. Classify** each finding with the checklist's heuristic: AUTO-FIX when
the fix is mechanical and a senior engineer would apply it without
discussion; ASK when reasonable engineers could disagree, when it changes
user-visible behaviour, when it is larger than twenty lines, and always for
security, races, enum completeness, removing functionality, advisory
extractions, gate findings and adversarial findings. Critical leans ASK;
informational leans AUTO-FIX.

**5b. Auto-fix** each AUTO-FIX item directly, one line each:
`[AUTO-FIXED] [file:line] problem -> what you did`.

**5c. Ask** about the ASK items in one question (three or fewer may be
asked one each): each numbered with its severity, the problem and the
recommended fix, options A) fix as recommended, B) skip, and an overall
recommendation. Gate findings get their own question with exactly these
options: A) restore the gate, keep the product change; B) keep, justified,
with the reason drafted from the diff marked verified or unverified; C) keep
for another reason the human gives; D) leave open for a later human. Never
recommend C. An unanswered question is open, never skipped. STOP for the
answer.

**5d. Apply** the approved fixes. For an approved defect, write the
regression test and watch it fail on the original code before changing the
product code; then the regression, the original probe and the adjacent
happy path must pass, or report the gap and claim no verified repair.
`[FIXED + TEST] [file:line] problem -> fix, test at <path>`. Restoring a gate
reverts only the relaxation. Then re-read the diff once: an edited pass is
reviewed again from Step 3, at most three cycles; at the cap, report what is
still open.

## The report

```
PR type: <type>
Plan: <path> | none found
Lenses: adversarial (<depth>), <the others that ran>
Pre-Landing Review: N issues (X critical, Y informational)
Validated: K of M critical candidates held

AUTO-FIXED
- [file:line] problem -> fix applied

FIXED + TEST
- [file:line] problem -> fix, test at <path>

NEEDS INPUT (open)
- [file:line] problem; recommended fix

SKIPPED (by you)
- [file:line] problem

ADVISORY
- [file:line] opportunity; saving
Lean: -<N> lines possible

Gate edits: none detected | N read, K findings: J kept (reasons), R restored, O open
Low confidence: ...
```

If nothing is found: `Pre-Landing Review: No issues found.` Be terse: one
line for the problem, one for the fix, no preamble, no "looks good overall".

## Rules

- Read the full diff before commenting.
- Fix first, but never commit, push or open a PR.
- Only flag real problems; the checklist's suppressions apply.
- Optional extractions stay advisory; real defects stand on their own.
- Every claim has a line or a test behind it, or is marked unknown.
- No CRITICAL finding is reported before the validation pass.
- A lens subagent gets the rules, the artifact and the contract, never your
  conclusion.
