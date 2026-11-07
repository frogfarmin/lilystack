---
name: careful
description: Block destructive shell commands and ask before risky ones, for the rest of this session
disable-model-invocation: true
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/hooks/careful.sh"
          statusMessage: "lilystack careful: checking the command"
---
<!-- Lilystack. Rewritten from gstack careful/SKILL.md.tmpl and careful/bin/check-careful.sh at 466689b (MIT, Copyright (c) 2026 Garry Tan). -->

# careful: destructive-command guardrails

Careful mode is now on for the rest of this session. Every Bash command is
checked before it runs by `hooks/careful.sh` against the rules in
`hooks/careful-patterns.txt`. Tell the user that, in one line, and what it
means:

**Blocked outright (deny):**

- a recursive delete of `/`, `/*`, `~`, `~/*`, `$HOME`, `.`, `..`, `*`, a
  top-level system folder or a home folder, however `rm` is reached
  (`/bin/rm`, `\rm`, a subshell, `bash -c`, `sudo`, `xargs`, `find -exec`);
- a force-push to `main` or `master`, with the flag in any position, or a
  bare `git push --force`;
- erasing or repartitioning a disk, and writing onto a raw disk device.

**Asks first (a permission prompt with the reason):**

- **Deletes:** any other `rm -r` or `rm`, `unlink`, `shred`, `find -delete`,
  `rsync --delete`, a move onto `/dev/null`, a recursive delete inside a
  script (`rimraf`, `shutil.rmtree`), `truncate -s`, `dd of=`. The reason says
  to move the target to `~/to-delete/` instead, the house rule.
- **Git:** other force-pushes, remote branch deletes and mirrors, `reset
  --hard`, discards through `checkout`, `restore` and `switch`, `git clean
  -f`, branch deletes, stash drops, history rewrites and reflog expiry, `git
  rm` (but not `git rm --cached`).
- **Databases:** SQL `DROP` and `ALTER TABLE ... DROP`, `TRUNCATE`, `DELETE`
  and `UPDATE` with no `WHERE`, `dropdb`, Redis flushes, Mongo drops, and
  framework resets (Prisma, Rails, Django, Laravel, Supabase, Drizzle,
  Sequelize).
- **Infrastructure:** Docker and Podman force-removes, prunes, volume deletes
  and `compose down -v`; `kubectl delete`; Terraform, OpenTofu, Pulumi, CDK,
  Serverless and Helm destroys; AWS, Google Cloud and Azure deletes; `gh`
  deletes, archives, visibility changes and `api -X DELETE`.
- **Publishing:** `npm`, `pnpm`, `yarn`, `bun`, `cargo`, `gem`, `twine`,
  `poetry`, `uv`, `hatch` and `flit` publishes (not `--dry-run`), and a
  download piped straight into a shell.
- **The machine:** `crontab -r`, Time Machine deletes, keychain deletes,
  world-writable modes and recursive owner changes on the root or home,
  shutdown, reboot and `kill -1`, and any `sudo`.
- **Agents:** starting Claude with `--dangerously-skip-permissions`,
  `--permission-mode bypassPermissions`, or `-p`/`--print`. Lilystack never
  spawns another model or an unchecked agent.

Everything else runs as before. The first matching rule wins, and specific
rules sit above general ones, so `docker volume rm` gets the Docker reason,
not the general one for deleting a file. `npm rm`, `brew unlink` and
`docker run --rm` are not deletes and pass.

The check is text matching, not parsing. A pattern inside a quoted string
also triggers it: a commit message passed with `-m` or a heredoc that
mentions `rm -rf /` is denied. Write such a message to a file with the Write
tool and commit with `git commit -F <file>`. A command built at runtime can
slip past. It is a guardrail, not a security boundary; Claude Code's
permission rules are the stronger layer.

When a command is blocked or questioned, do not look for a way around it. Say
what was matched, and either pick a safe alternative (move instead of delete,
`--force-with-lease` on a feature branch, `git stash` before a discard) or ask
the user.

To add a rule, edit a line of `hooks/careful-patterns.txt`; the tests in
`tests/test-hooks.zsh` pin every row and its order. The hook stays registered
until this session ends; there is no "uncareful".
