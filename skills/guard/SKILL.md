---
name: guard
description: careful, secrets, secure and freeze in one step, for work near production or a fragile tree
disable-model-invocation: true
argument-hint: "[directory]"
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/hooks/careful.sh"
          statusMessage: "lilystack careful: checking the command"
    - matcher: "Read|Edit|Write|MultiEdit|NotebookEdit|Grep|Bash"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/hooks/secrets.sh"
          statusMessage: "lilystack secrets: checking the target"
    - matcher: "Edit|Write|MultiEdit|NotebookEdit"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/hooks/secure.sh"
          statusMessage: "lilystack secure: checking the new code"
    - matcher: "Edit|Write|MultiEdit|NotebookEdit|Bash"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/hooks/freeze.sh"
          statusMessage: "lilystack freeze: checking the boundary"
---
<!-- Lilystack. Rewritten from gstack guard/SKILL.md.tmpl, careful/bin/check-careful.sh and freeze/bin/check-freeze.sh at 466689b (MIT, Copyright (c) 2026 Garry Tan). -->

# guard: every guardrail at once

Four guardrails are now on for the rest of this session.

1. **Freeze.** The directory is `$ARGUMENTS`; if empty, ask for it and stop
   until the answer arrives. Then run
   `bash "${CLAUDE_PLUGIN_ROOT}/hooks/freeze.sh" set "<directory>"` and report
   the absolute boundary it prints. File edits outside it are denied; a shell
   command that writes outside it asks first.
2. **Careful.** Every Bash command is checked. Recursive deletes of the root,
   home or the whole directory, force-pushes to the default branch and disk
   erases are blocked. Other deletes, force-pushes, discards, history
   rewrites, database drops and resets, infrastructure and cloud deletes,
   publishes, `sudo`, and starting Claude unchecked or headless ask first.
   The reason for a delete says to move the target to `~/to-delete/` instead.
3. **Secrets.** Reading, searching, copying or printing private keys and
   credential files is blocked, and so is any write in `~/.ssh`. `.env` files,
   secret-looking configs, environment dumps, secret-store reads and literal
   tokens ask first.
4. **Secure.** An edit that adds a risky sink (`eval`, `shell=True`,
   `innerHTML`, pickle, TLS checks off and the like) gets a note naming the
   safe form. It never blocks.

Tell the user all four in four lines. When something is blocked or
questioned, name what matched and choose a safe alternative or ask; never
work around it. When a secure note arrives, fix the code or comment why it is
safe. `/lilystack:unfreeze` lifts the boundary; the other three stay until
the session ends. `/lilystack:test-first` is a separate opt-in and is not
part of guard. Details and limits: the `careful`, `secrets`, `secure` and
`freeze` skills.
