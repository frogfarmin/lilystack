---
name: lily-check
description: Use when Lilypad's links need checking or repairing, e.g. after an app rewrote its settings, after editing links.conf, or when bin/lily check reports anything but ok or absent.
---
<!-- Lilystack. Original. Housekeeping for the Lilypad config repo; moved here from Lilypad's Claude/skills. -->

These act on the Lilypad repo (`~/Lilypad`, the author's config repo), not on the
project you are in. The tool is `~/Lilypad/bin/lily` (a shim that runs the real
one in Lilystack) and Lilypad's `README.md` documents it. Never `git commit`.

1. Run `~/Lilypad/bin/lily check`. It is read-only and prints one
   `status  target` line per mapping.
2. If every line is `ok` or `absent`, reply with the counts, name the `absent`
   targets (rows whose Lilypad source does not exist yet), and stop.
3. Otherwise find each remaining target's source in `~/Lilypad/links.conf` and
   explain it:
   - `missing`: nothing at the target; `lily link` creates the link.
   - `wrong-link`: the target links elsewhere; `lily link` moves that link to
     `~/.lilypad-backup` and links the source.
   - `file`: an app rewrote its config as a plain file. Show
     `diff -u <source> <target>`. If they are identical, `lily adopt <target>`
     retires the copy. If they differ, the user chooses: keep the app's version
     (`mv <target> <source>`, then `lily link`) or Lilypad's (`lily link`; the
     app's file goes to `~/.lilypad-backup`).
4. `lily check` only sees links that `links.conf` still maps, so a link left
   behind by a removed row (for example `~/.claude/skills/lily-*` or
   `~/.claude/mods` after those moved to Lilystack) goes unreported. List
   dangling ones with `find -L ~/.claude/skills ~/.claude/mods -maxdepth 1 -type l`
   (with `-L`, only a broken link still shows as `l`) and offer to move each to
   `~/to-delete/`, never `rm`.
5. Show the output of `~/Lilypad/bin/lily link --dry-run`, change nothing yet,
   and ask. Apply only what the user approves, then rerun check.
