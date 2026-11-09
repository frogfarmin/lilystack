# verify-gate

`verify-gate` is a Claude Code mod. It does three things:

1. It shows a stamp above the prompt. The stamp says **✅ APPROVED** only when
   all of these are true:
   - each required check passed after the last edit,
   - the checks ran on the tree as it is now,
   - all changes are committed,
   - all commits are pushed.
2. Until the stamp says APPROVED, it stops a PR merge: `gh pr merge`,
   `gh api .../pulls/N/merge`, `mcp__github__merge_pull_request` and
   `mcp__github__enable_pr_auto_merge`. It also finds `gh pr merge` after
   `env`, `command`, `sudo`, `nohup`, `time` or `timeout N`, after
   `gh -R o/r` or `gh --repo o/r`, and inside `bash -c "..."` (also `sh` and
   `zsh`). The deny message tells Claude what to do next. It also stops a
   merge when it cannot read a git repo or when git fails, because then it
   cannot see what is committed. A local `git merge` is not stopped, because
   `ship` uses it to merge the base into the branch.
3. At the end of a turn with edits and no check after them, it shows a toast.

This mod is not a part of the lilystack plugin. You install it by itself
(see [How to install](#how-to-install)).

## The stamp

| Stamp | When |
|---|---|
| `○ verify-gate · no changes or checks yet` (dim) | No edits, no check runs, and a clean tree |
| `✅ APPROVED · 5/5 checks pass · committed · pushed · clear to merge` (green) | All the conditions above are true |
| `⛔ NOT APPROVED · <reasons>` (red) | A check failed, a check did not run, or a file changed after the checks |
| `⛔ NOT APPROVED · <reasons>` (yellow) | The checks pass, but a change is not committed or not pushed |

Under a NOT APPROVED stamp, a dim `next:` line tells the next step. Type
`/gate` to see each check, the time it ran, and the git state.

## The checks

A project lists its required checks in `.claude/verify-gate.conf`. Write one
command on each line, as you type it. `#` starts a comment. Lilystack's file
lists the five checks of `AGENTS.md`.

- A command counts when it starts with a line of the file. For example,
  `zsh tests/lint-skills.zsh && zsh tests/test-hooks.zsh` counts for two checks.
- A check counts only when each operator after it is `&&`. A check before
  `|`, `||`, `;`, a new line or `&` does not count, because then the exit
  code of the command is not the exit code of the check. For example,
  `zsh tests/test-lily.zsh | tail` and `zsh tests/test-lily.zsh || true` do
  not count.
- A check that runs in the background does not count.
- A failed check stays failed until that same check passes. A pass of a
  different check does not clear it.
- With no conf file, one pass of a known test or lint command is enough:
  `npm test`, `bun test`, `pytest`, `cargo test`, `go test`, `make test`,
  `tsc`, `zsh tests/…`, `claude plugin validate`, and others (`hooks/gate.ts`).

## How it knows that the tree did not change

After each check run, at the end of each turn, before a merge, and on `/gate`,
the mod calculates the tree that `git add -A && git commit` would make. The
mod uses a copy of the index, `.git/verify-gate-<id>.index`. Each calculation
has its own copy, and the mod removes the copy after it. It does not change
your real index or your files. Because a commit does not change that tree, a
check that passed before the commit is still good after the commit. A check
with no known tree does not count when the mod knows the tree now.

`git add -A` on the copy writes blob objects into `.git/objects`. `git gc`
removes them when nothing uses them.

## When the session moves

The desktop app can start a session in a spare folder and then move it to the
project. `/cd` moves a session too. So the mod asks the engine for the project
folder (`$.session.root()`) as it works, and does not keep the folder from the
start of the session. After a move it starts over: it reads the conf of the new
project, and a check from the old folder does not count.

## What it can reach

- It runs `git`, `cp` and `rm` on your computer, in the project root. `rm`
  removes only its own copy of the index.
- It reads `.claude/verify-gate.conf`.
- It makes no network call and no model call. It sends nothing out.

## How to install

The Lilystack marketplace lists this mod as `verify-gate`.

- **In the desktop app:** click **+** next to the prompt box, then
  **Plugins**. If the `lilystack` marketplace is not there, add the marketplace
  `frogfarmin/Lilystack`. Then add the plugin `verify-gate`.
- **In a terminal:**

  ```sh
  claude plugin install verify-gate@lilystack
  ```

- **For development:** add this folder to `CLAUDE_CODE_PLUGIN_DIRS`, or add
  your clone as a marketplace (`claude plugin marketplace add ~/Lilystack`).
  Then an edit takes effect after `/reload-plugins`.

## Files

| File | What it does |
|---|---|
| `hooks/register.ts` | The hooks. All calls to the mods API are in this file. |
| `hooks/gate.ts` | The rules: which commands are checks, the verdict, the stamp text and the `/gate` report. It has no side effects. |
| `hooks/hooks.json` | The module list. |
| `tests/` | The tests. Run them with `claude plugin test` from this folder. |

## Do a check of the mod

```sh
cd mods/verify-gate
claude plugin validate .
claude plugin test
```

Tested with Claude Code 2.1.319.
