---
name: lily-lint
description: Use when Lilypad needs a hygiene report, before a Lilypad commit, after installing or updating an app, or when bin/lily lint prints findings instead of clean.
---
<!-- Lilystack. Original. Housekeeping for the Lilypad config repo; moved here from Lilypad's Claude/skills. -->

These act on the Lilypad repo (`~/Lilypad`, the author's config repo), not on the
project you are in. The tool is `~/Lilypad/bin/lily` (a shim that runs the real
one in Lilystack) and Lilypad's `README.md` documents it. Never `git commit`.

1. Run `~/Lilypad/bin/lily lint`. It is read-only and prints `clean`, or one
   `kind  path` line per finding.
2. If it prints `clean`, reply with that and stop.
3. Otherwise read the Hygiene section of `~/Lilypad/README.md`, look at each
   flagged file, and give one recommendation per finding using that section's
   fixes. Group them by kind.
4. Change nothing yet. Ask which recommendations to apply. Apply sweeps with
   `~/Lilypad/bin/lily sweep <path ...>` and other fixes by editing, then rerun
   lint until it prints `clean`.
