---
name: freeze
description: Restrict Edit, Write, MultiEdit, NotebookEdit and shell writes to one directory until unfreeze
disable-model-invocation: true
argument-hint: "[directory]"
hooks:
  PreToolUse:
    - matcher: "Edit|Write|MultiEdit|NotebookEdit|Bash"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/hooks/freeze.sh"
          statusMessage: "lilystack freeze: checking the boundary"
---
<!-- Lilystack. Rewritten from gstack freeze/SKILL.md.tmpl and freeze/bin/check-freeze.sh, freeze/bin/freeze-state.sh at 466689b (MIT, Copyright (c) 2026 Garry Tan). -->

# freeze: edits stay inside one directory

The directory is `$ARGUMENTS`. If that is empty, ask for it (AskUserQuestion
with a text answer where the tool exists, otherwise one plain question), and
stop until the answer arrives. Then set the boundary:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/hooks/freeze.sh" set "<directory>"
```

It prints the absolute boundary. Report exactly that path and say: any Edit,
Write, MultiEdit or NotebookEdit outside it is now denied, and a shell
command that writes a file outside it asks first, each with the reason naming
the boundary; `/lilystack:freeze <other>` moves it; `/lilystack:unfreeze`
lifts it.

If the script exits non-zero, show its message and stop; never write the
state file yourself.

## How it works

The boundary is stored under `~/.lilystack/freeze/`, keyed by this project's
git toplevel (or the working directory outside git), so another repo is not
affected. The hook resolves each target path (`~`, `.` and `..`, relative
paths, symlinks at any depth, a link that points nowhere yet) before
comparing. No state file means allow, so after unfreeze the registered hook
is harmless.

For a Bash command it reads the files the command writes: the target of `>`,
`>>`, `&>` and `2>`; the files of `tee`; the files of `sed -i` and `perl -i`;
the last argument of `cp`, `mv`, `install` and `ln` (or their `-t`
directory), and each source of `mv`; `dd of=`. It follows `cd` within the
command and the commands run by `find -exec`. It skips quoted text, comments,
heredoc bodies and `/dev/null`. When one of these paths is outside the
boundary it asks, so a real need can be approved.

## Limits

- The shell check is a heuristic, not a parser. A path held in a variable
  (`> "$out"`; only `$HOME` is expanded), a write by another program
  (`python -c`, `git apply`, `npm install`, `touch`, `mkdir`), or a script
  that writes for you can still change files outside the boundary.
  `/lilystack:careful` or `/lilystack:guard` covers deletes.
- The boundary persists across sessions until cleared: a later session that
  runs `/lilystack:freeze` or `/lilystack:guard` picks it up.
- Missing jq blocks every edit and shell command with a message naming the
  fix, rather than letting them through.
