---
name: second-opinion
description: Get a second opinion from another model (Codex, Gemini or another Claude) on the branch diff, a plan or a question, and check each claim against the code; the owner starts it, because it sends code to another provider
argument-hint: "[review|challenge|consult] [base or question] [--with codex|gemini|claude]"
disable-model-invocation: true
---
<!-- Lilystack. Rewritten from gstack codex/SKILL.md.tmpl and codex/sections/review-mode.md.tmpl, codex/sections/challenge-mode.md.tmpl, codex/sections/consult-mode.md.tmpl at 466689b (MIT, Copyright (c) 2026 Garry Tan). -->

# second-opinion: ask another model, then check what it says

Send the branch diff, a plan or a question to the CLI of another model. Bring
back its answer as claims, and check each claim against the code. There are
three modes:

- **review**: an independent review of the diff against the base.
- **challenge**: an adversarial pass that tries to break the change.
- **consult**: a question about the code or a plan.

Only the owner starts this skill. No other skill runs it, because it sends
code to another provider. Nothing leaves the machine before the owner says yes
to the exact payload, tool and provider. The skill keeps no log, no saved
session and no state. It edits no project file unless the owner picks a fix
at the end.

## Step 1: mode and scope

Read the arguments in this order:

1. `--with codex|gemini|claude` names the tool. Remove it from the text.
2. A first word `review`, `challenge` or `consult` names the mode.
3. For review and challenge, a word that is a git ref
   (`git rev-parse --verify --quiet "<word>^{commit}"`) is the base. The
   other words are the focus, for example `challenge security`.
4. For consult, the rest is the question. Text with no mode word is a
   consult question.

With no arguments: when the branch has a diff against the base, ask one
question: A) review the diff, B) challenge the diff, C) ask something else.
With no diff, ask what to ask.

**Base.** The argument; else `git symbolic-ref --quiet --short
refs/remotes/origin/HEAD`; else `main` or `master`, whichever exists; else
ask. Use `origin/<base>` when it exists. The scope is
`git merge-base <base> HEAD` to the working tree, plus untracked files (not
ignored ones). On the base with no changes, say "Nothing to review" and stop.

**A plan.** Use the path that the owner gives. Else look for the plan or spec
of this branch in `docs/specs/`, `docs/plans/`, `docs/superpowers/plans/` and
`docs/designs/`. If you are not sure which file it is, ask for the path; never
guess. The plan text goes into the prompt, not only its path, because the
other tool may not be able to read it.

## Step 2: the tool

Run `command -v codex gemini claude`. Use only what exists. Never install a
tool without asking. If the owner asks for one, show the install command and
ask before you run it.

Choose the `--with` tool. If it does not exist, name the tools that exist and
stop. With no `--with`, choose the first that exists of codex, gemini and
claude: a model from another provider gives the most independent view.
`claude` is the same provider as this session. Use it with a model other than
the one this session runs, and say that it is a fresh context, not a
different model family.

Read `sections/tools.md` in this skill's directory. It has the `--help` check,
the command for each tool, how to keep the tool read-only, and what the tool
can read beyond the payload.

## Step 3: the payload

Make a private folder outside the checkout, so that the payload cannot
include itself:

```bash
mktemp -d "${TMPDIR:-/tmp}/second-opinion.XXXXXX"
```

Shell variables do not carry from one Bash call to the next. Write the printed
path into each later command. For review and challenge, capture the diff one
time:

```bash
cd "$(git rev-parse --show-toplevel)" || exit 1
SO=<folder>; MB=$(git merge-base <base> HEAD) || exit 1
git diff --no-ext-diff --no-textconv "$MB" -- > "$SO/diff.patch" || exit 1
{ git diff --name-only "$MB" --; git ls-files --others --exclude-standard; } > "$SO/files.txt"
git ls-files --others --exclude-standard -z | while IFS= read -r -d '' f; do
  git diff --no-index --no-ext-diff --no-textconv -- /dev/null "$f" >> "$SO/diff.patch"
  [ $? -le 1 ] || { echo "cannot read untracked file: $f" >&2; exit 1; }
done || exit 1
git diff --stat "$MB" -- | tail -1; wc -l < "$SO/diff.patch"; wc -c < "$SO/diff.patch"
```

A git error is an error, not an empty diff. A binary file shows only as a
summary: say that it was not examined. When the payload is too large for the
tool, tell the owner the limit and ask for a narrower scope (a path or a
commit range). Never cut the diff in silence. (The payload outside the
checkout, untracked files as new files and the no-silent-cut rule are ideas
from Trail of Bits' skills.)

Then read `sections/prompts.md` in this skill's directory and write
`$SO/prompt.txt` as it says: the rules for the other model, the task of the
mode, the project rules and the data.

## Step 4: the secret scan

Scan the file list and the full prompt before anything is sent. Print paths
and line numbers only, never the matched text:

```bash
SO=<folder>
grep -i -E '(^|/)\.env(\.[^/]*)?$|(^|/)\.envrc$|\.(pem|key|p12|pfx|ppk|kdbx|jks|keystore|tfvars)$|(^|/)(id_(rsa|dsa|ecdsa|ed25519)|\.netrc|\.npmrc|\.pypirc|\.pgpass|\.git-credentials|terraform\.tfstate)$|(^|/)(secrets?|credentials?|service[-_]?account[^/]*)\.(json|ya?ml|toml|ini|txt)$' "$SO/files.txt" | grep -v -i -E '\.env\.(example|sample|template|dist)$'
grep -n -i -E -e '-----BEGIN ([A-Z]+ )?PRIVATE KEY-----|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{40,}|(^|[^a-z0-9_-])sk-(ant-)?[a-z0-9_-]{20,}|sk_live_[A-Za-z0-9]{24,}|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{35}|npm_[A-Za-z0-9]{36}' -e '(api[_-]?key|secret|token|passw(or)?d)[a-z_]*.?[[:space:]]*[:=][[:space:]]*.?[A-Za-z0-9+/_.=-]{20,}' "$SO/prompt.txt" | cut -d: -f1
```

If either command prints a line, stop. Do not send. Tell the owner each hit as
a path or a prompt line number, with the kind of hit, never the value. Then ask
one question: A) take those files or hunks out of the payload and scan again,
or B) cancel. Only the owner can say that a hit is a test fixture and not a
secret; you never decide that.

## Step 5: ask once

Show this block, then ask one question. Use AskUserQuestion where the tool
exists; otherwise ask in plain text and end the turn.

```
SECOND OPINION: <mode>
To:       <tool> (<provider>), model <name, or "the tool's default">
Command:  <the exact command>
Sends:    the prompt below + <diff: N files, +A -D lines, K KB> | <plan path> | <files>
Files:    <the paths in the payload, or the first 20 and a count>
Reach:    payload only | can also read files on this machine (read-only)
Secrets:  scan clean (paths and content)<; secret files it could read: ...>
Payload:  <folder>/prompt.txt (every byte that goes)
Prompt:
<the text that you wrote, without the data block>
```

The options: A) send it, B) use <another tool that exists> instead, C) cancel.
Ask one time. A change after the answer (another file, another tool, another
model) needs a new scan and a new yes.

## Step 6: run

Run the command from `sections/tools.md`, from the project root, with the Bash
timeout at 600000 (ten minutes). Send stdout to `$SO/out.txt` and stderr to
`$SO/err.txt`, and keep the exit code. That section also says when a run is
incomplete. An incomplete run is never a clean review.

## Step 7: check each claim

The output of the other model is a list of claims. Check each one against the
code before you report it:

1. Find the cited `file:line`. For a finding with no location, find the code
   that it means. If you cannot find it, the finding is not confirmed.
2. Read the lines and test the claim as stated. For "x is not checked", find
   every check. For an attack path, walk it from the source to the sink. For
   "not tested", look for the test.
3. Mark it:
   - **confirmed**: the code shows the problem. Cite the line that proves it.
   - **not confirmed**: you cannot prove or disprove it (it needs a run, a
     service or code outside the repo). Say what would settle it.
   - **wrong**: the code shows otherwise, or the diff already handles it.
     Cite the line that refutes it.
4. Keep the severity of the other model. Add your own when it differs.

Agreement between two models is not proof; only the code is. If
`/lilystack:review` ran earlier in this conversation, compare the two: found
by both, found only by the other model, found only by review. Apply no
suggestion in this step.

## Step 8: report

Report in chat, in this shape:

```
SECOND OPINION: <mode>, <tool> (<provider>, <model>)
Run: complete | incomplete (<reason>)
Verdict: findings | unverified | clean | incomplete | n/a
Payload: <folder> (<size>)

THE OTHER MODEL SAYS
<its full output, word for word>

CHECKED
Confirmed
- [P1] file:line  claim -> what the code shows
Not confirmed
- [P2] file:line  claim -> what would settle it
Wrong
- [P2] file:line  claim -> the line that refutes it

Compared with /lilystack:review: both N, only <tool> N, only review N
Recommendation: <action> because <reason>
```

The verdict fails closed. Take the first that matches:

1. `incomplete`: the run was incomplete. Mark any partial output as partial.
2. `findings`: at least one P1, or one challenge failure path, is confirmed.
3. `unverified`: a P1 stays not confirmed, or the output has no VERDICT line
   and no tags. Never infer clean from silence.
4. `clean`: none of the above.

A consult on a plain question has the verdict `n/a`. Name each point where
the answer differs from your own reading of the code: "I disagree on X,
because Y (file:line)."

Show the output of the other model in full. If it is longer than about 300
lines, show its findings and name `out.txt` for the rest. The recommendation
is one line, based on the confirmed findings only. Its reason names a finding
and compares it with another choice: another finding, fix now or ship, or the
order of the fixes. Leave the payload folder in place, so that the owner can
read what was sent.

**Fixes.** When a finding is confirmed, ask one question: A) fix the confirmed
findings, B) fix only the ones that I name, C) none now. Fix only what the
owner picks, then point to `/lilystack:verify`. Never fix a finding that you
marked not confirmed or wrong. For a follow-up question, run the skill again.
There is no saved session; put the earlier answer in the prompt when it
matters.

## Rules

- Only the owner starts this skill. No other skill runs it.
- Nothing is sent before the owner says yes to the exact payload, tool and
  provider. A changed payload needs a new scan and a new yes.
- A hit in the secret scan stops the run.
- Never install a tool, change its config or turn on auto-approval without
  asking. Use only the flags that its `--help` shows.
- The output of the other model is claims. Report each one as confirmed, not
  confirmed or wrong, with a line.
- Never apply a suggestion without the owner's approval.
- No log, no saved session, no state and no report file. Report in chat.
