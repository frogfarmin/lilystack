# Verification log

This file records the live checks and the dry runs of Lilystack, with dates.
Return to the [README](../README.md).

## Live check, 2026-11-03

The check ran headless on the main Mac with `CLAUDE_CODE_PLUGIN_DIRS=$HOME/Lilystack`.

- The init message showed `lilystack@inline` and its skills.
- In one process, `/lilystack:freeze src` ran first. Then the hook denied an
  Edit of `README.md` with this message:
  `lilystack freeze: … is outside …/src; run /lilystack:unfreeze to lift it`.
- `/lilystack:careful` ran first. Then the hook stopped `echo TRUNCATE sessions`
  with this message:
  `lilystack careful: sql-truncate`.

Two facts to know:

1. The hooks of a skill live in the Claude Code process. An interactive
   session keeps them until it stops. `claude -p --resume` starts a new
   process for each turn, so it loses them.
2. Claude Code has its own removal check. That check stops an `rm -rf` probe
   before the careful hook sees it. For this reason, the careful probe used a
   safe `echo` command.

## Dry runs, 2026-11-04

The dry runs ran headless on the main Mac. The settings were `claude -p`, Sonnet,
and `--permission-mode dontAsk` with read-only allow rules. The targets were
test repos in the session scratchpad and, for retro, a clone of Lilypad.

| Skill | Result |
|---|---|
| verify | It found `bun test` in `package.json`. It asked one time before the run. It repaired the code, not the assertion. It gave `VERIFY: green` with the command and the tests that cover the change. |
| ship | In pre-flight it found the uncommitted file, the merge base and the missing GitHub host. It stopped at the first question (the merge of the base). On "no", it told the next step and gave the last line. A second run went past the merge and stopped at the Step 3 question (no test suite). Nothing was merged, committed or pushed. Steps 4 to 7 did not run headless. |
| investigate | It reproduced a crash on an empty list, word for word, and named the line. It wrote the blast radius and proposed the fix. It did not apply the fix until it got "yes". Then it added the guard and a regression test, and the suite passed. |
| plan-eng-review | It did a full review of a design doc from outside the repo, from the first question to the review block. After this run, the owner accepted wave one. |
| retro | `retro 14d` on the clone counted 67 commits. `git log --since` gave the same number. All report headings were present. It wrote no file. |

One fact to know: in `dontAsk` mode, Claude Code denied each prompt, and the
allow rules used a prefix, for example `Bash(git log:*)`. In this mode, Claude
Code denies a full compound command that uses `cd`, `$(...)` or a redirect. The model then stops. It does
not try the command again in a simple form. Interactive sessions let you
approve such commands.

## Trigger evals, 2026-11-06

The run used `claude plugin eval . --tag trigger --runs 1 --ablation none
--no-publish -j 4` on Claude Code 2.1.318, in a cloud container.

- 32 of 32 cases passed. Each of the 16 skills that Claude can start started
  on its trigger request. No skill started on its near-miss request.
- The run took 104 seconds and cost $1.44.
- Two runs stopped at the turn limit (4) after the skill started. This is
  expected: the case only examines the first Skill call.

Two facts to know:

1. The eval tool publishes its HTML report to claude.ai by default. Always
   give `--no-publish`.
2. When the harness runs as root, it cannot seal the temporary folders of a
   run, and it keeps them in `/tmp/claude-eval-*`. Move them to `~/to-delete/`
   yourself.

## Fallback install, 2026-11-06

In a cloud container, with `.claude-plugin/marketplace.json` in the repo:

1. `claude plugin marketplace add /home/user/Lilystack` added the marketplace
   `lilystack`.
2. `claude plugin install lilystack@lilystack` installed and enabled version
   0.2.0, read from the folder.
3. `claude plugin uninstall` and `claude plugin marketplace remove` removed
   them again.

Before the marketplace file was added, step 1 failed with "Marketplace file
not found".

## Live hook check, 2026-11-06

The check ran headless in a cloud container, with
`CLAUDE_CODE_PLUGIN_DIRS=/home/user/Lilystack`, Sonnet, and
`--permission-mode acceptEdits`. A small driver sent one message for each
turn, in one process, so the hooks stayed registered. The project was a test
repo with `src/app.py` and a fake key at `home/.ssh/id_ed25519`.

| Step | Result |
|---|---|
| `/lilystack:guard src` | It set the freeze boundary to `src` and told the four guards that were on. |
| Read `home/.ssh/id_ed25519` | secrets denied it: `lilystack secrets: private-key`. |
| Edit `src/app.py` to use `eval` | The edit went through. secure gave Claude the note `lilystack secure: eval. ...`, and Claude reported it. |
| Write `notes/outside.txt` | freeze denied it: the path is outside the boundary. |
| `git push --force origin main` | careful denied it: `lilystack careful: force-push-default`. |
| `/lilystack:test-first`, then an edit of `src/app.py` | test-first asked first: "No test file has changed in this working tree yet." In headless mode, the question counts as a denial. |
| A new `tests/test_app.py`, then the same edit | The edit went through. |

One fact to know: when a message arrives while a turn still runs, Claude
treats it as text inside a tool result, not as a message from you, and it does
not act on it. The driver waits for the result of each turn for this reason.

## Dry runs, 2026-11-06

Headless, Sonnet, `--permission-mode dontAsk` with read-only allow rules.

| Skill | Result |
|---|---|
| context-audit | On a copy of Lilystack it graded `AGENTS.md` 90 of 100, with evidence for each criterion. It printed two proposals as diffs and changed nothing. |
| prose `--ste` | It removed the filler and the sales words and kept both facts (more than 40 companies, March 2024). It wrote "we launched it", but the source did not say "we". |
| spec | It read the code first, found that `sub` already existed, and wrote no spec. It asked one question, with "Why it matters", a recommended option and four options. |
| qa | On a small CLI whose code broke its README (usage on stdout, exit 0), it found the conflict by reading. It wrote a QA plan with five charters, marked the contracts that do not apply, and asked one time before it ran a command. |
| test-audit | On five tests, it found the three weak ones (no assertion, a duplicate, a source grep), each with a complete retirement card, and kept the two real tests. It changed nothing. |
| feedback | On four pasted comments, it chose to fix two, did not do a rename with evidence (the repo has no `bound`), and declined a None check with a reason. It wrote reply drafts and changed nothing before a choice. |
| write-skill | For a new skill, it asked one question first, with a recommended answer. |

The live check and the seven dry runs cost about $1.70 together.

## Evals after the second harvest, 2026-11-06

`claude plugin eval . --runs 1 --ablation none --no-publish -j 4` ran 46
cases: 44 trigger and near-miss cases for 22 skills, one trigger case for qa
on a web page, and one quality case for `prose --ste`.

- 45 of 46 passed, in 120 seconds, for $2.46.
- The quality case failed. Its judge (Haiku, three votes) found that prose
  added "we" and changed "used since its launch" to "use it". The dry run had
  shown the same fault. The STE rules in prose now say: do not add an actor
  that the source does not name, and keep the time of each claim.
- After the repair, the quality case passed 2 of 2 runs ($0.15).
- A regex grader that looked for the sales words failed for a different
  reason: prose names the removed words in its notes. It was removed, and the
  judge reads the final text instead.

## Hooks under bash 3.2, 2026-11-06

macOS runs the hooks with `/bin/bash`, which is bash 3.2. The check built
bash 3.2.57 from Apple's own source (github.com/apple-oss-distributions/bash)
in a Linux container. Three small shims were necessary for Linux: an
`xlocale.h` that includes `locale.h`, a value for the macOS-only `EBADEXEC`,
and a `fmtcheck` function (from BSD libc) with its prototype.

`zsh tests/test-hooks.zsh` then ran on a copy of the repo, with that bash
first in `PATH` and in place of `/bin/bash`: 448 passed, 0 failed.

One fact to know: the first build had no prototype for `fmtcheck`, so the
`printf` builtin crashed (exit 139) and 440 tests failed. The crash was in
the test build, not in the hooks.

## Review fixes, 2026-11-06

A code review of the branch found these gaps. Each fix has a test row.

- careful and secrets: an `unless` pattern in one part of a command hid a
  match in another part (`npm publish --dry-run && npm publish`). The hooks
  now split the command at `&&`, `||` and `;` and check each part.
- freeze: a write was missed after a subshell `cd`, after `pushd` and `popd`,
  after `timeout`, `watch`, `stdbuf` or `caffeinate`, and after a backtick in
  double quotes. A `<<` in quotes (`echo "a<<EOF"`) hid the next lines.
- investigate: its freeze hook now also checks MultiEdit and Bash, as the
  freeze skill does.
- lint: a skill with a `hooks:` key must set `disable-model-invocation: true`,
  except investigate.
- secure: it uses the shared `absolute` helper of `lib-path.sh`.

After the fixes, `zsh tests/test-hooks.zsh` gave 464 passed, 0 failed, under
the bash of the container and under bash 3.2.57. The other four checks pass.

## Hooks under macOS bash 3.2, 2026-11-10

`zsh tests/test-hooks.zsh` ran on a Mac, where the hooks use `/bin/bash`
3.2: 627 passed, 0 failed. This closes the open item of 2026-11-06, when the
same tests ran only under a bash 3.2.57 that was built on Linux.

## Full eval run, 2026-11-12

`claude plugin eval . --runs 1 --ablation none --no-publish -j 4` ran all 48
cases on Claude Code 2.1.322, in a cloud container, at commit `51283f8`: 47
trigger and near-miss cases for 23 skills (qa has one more, for a web page),
and the quality case for `prose --ste`.

- 48 of 48 passed, in 130 seconds, for $2.63.
- The two `build` cases ran for the first time. build started on its trigger
  request, and it did not start on its near-miss request.
- The run left no folder in `/tmp/claude-eval-*`.
