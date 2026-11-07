---
name: lily-sweep
description: Use when Lilypad files should go to ~/to-delete, given as repo paths, or with no paths for a full hygiene sweep of lint findings, finished plans, stale README text and old backups.
argument-hint: "[path ...]"
disable-model-invocation: true
---
<!-- Lilystack. Original. Housekeeping for the Lilypad config repo; moved here from Lilypad's Claude/skills. -->

These act on the Lilypad repo (`~/Lilypad`, the author's config repo), not on the
project you are in. The tool is `~/Lilypad/bin/lily` (a shim that runs the real
one in Lilystack) and Lilypad's `README.md` documents it. Never `git commit`.

Paths given: `$ARGUMENTS`

If paths are given (repo paths, as `lily lint` prints them), the user has
already chosen what goes:

1. Run `~/Lilypad/bin/lily sweep` with those paths. It moves them to
   `~/to-delete/lilypad-sweep-<YYYYmmdd>/` and stages the removals, or refuses
   and moves nothing. Report a refusal and its reason; do not work around it.
2. Run `~/Lilypad/bin/lily lint` and report the result.

If no paths are given, run a full hygiene sweep:

1. Collect candidates, reading each one before listing it:
   - `lily lint` findings that look unneeded;
   - plans in `~/Lilypad/Claude/plans/` whose work is done;
   - README statements about files, settings, or tools that no longer exist;
   - folders in `~/.lilypad-backup/` whose targets `lily check` reports `ok`
     (each holds the target's full path under the stamp folder);
   - `git -C ~/Lilypad gc`, when `git -C ~/Lilypad count-objects -v` shows
     more than 100 loose objects.
2. If there are none, say so and stop. Otherwise show one table (candidate, why
   it is not needed, action), change nothing yet, and ask which to apply.
3. Apply only the approved ones: repo paths with
   `~/Lilypad/bin/lily sweep <path ...>`, backup folders with `mv` into
   `~/to-delete/lilypad-backup/`, README fixes by editing, gc by running it.
4. Rerun `lily lint` and `lily check` and report both.
