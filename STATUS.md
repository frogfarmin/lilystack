# Status: Lilystack

## Next
- Use the new skills on a real project. The seven skills of the first harvest had a dry run on test repos on 2026-11-06. The seven of the second harvest passed their trigger evals, but they had no dry run yet (see `docs/verification-log.md`).

## Waiting on you
- On each Mac, in this order: pull Lilystack, pull Lilypad, run `~/Lilypad/bin/lily check`.
- On the main Mac, point `~/.zshrc.local` at `$HOME/Lilystack/mods/status` (Lilypad `Claude/README.md`, section "Status mod").

## Done
- 2026-11-06: The docs now point to the public Lilypad repo (https://github.com/frogfarmin/Lilypad).
- 2026-11-06: The repo was cleaned for a public release: no machine names, general install steps, an Original label in the README, and SECURITY.md.
- 2026-11-06: A code review of the branch. careful, secrets and freeze closed more bypasses; the lint checks each skill with a hook (see `docs/verification-log.md`). All 464 hook tests pass under bash 3.2.57, built from Apple's source (the bash of macOS `/bin/bash`).
- 2026-11-06: The owner removed the rules that blocked good work (Apache-2.0 avoidance, "no marketplace", "no second model", "no browser", "no network", "no orchestration", the 400-line limit). The rules that protect the owner stay.
- 2026-11-06: The second harvest: plan-design-review, plan-devex-review, autoplan, frontend-design, security-audit, compound and second-opinion; a web page surface in qa; an apply step in context-audit. 46 of 46 evals pass after a repair to prose.
- 2026-11-06: A live check in one headless session: guard, secrets, secure, freeze, careful and test-first each gave the correct answer. Dry runs of the seven new skills behaved as designed.
- 2026-11-06: Newer Claude Code parts: the `lens` agent, the `ste` output style, 32 trigger evals (32 of 32 pass), `disallowed-tools` on context-audit and retro, a plugin icon and a marketplace file for the fallback.
- 2026-11-06: The harvest. Four research agents read 25 top repositories. Writer agents added 7 skills (spec, qa, test-audit, feedback, context-audit, write-skill, prose) and 3 hooks (secure and test-first from upstream; secrets is original).
- 2026-11-06: careful closed six silent bypasses and has 45 rules (31 new). freeze asks before a Bash write outside the boundary. guard starts careful, secrets, secure and freeze with one call.
- 2026-11-06: The owner's builds came from Lilypad: `bin/lily` (with a new `lily pull`) and its test, the three `lily-*` skills, and `mods/status`. Lilypad is now config only and keeps a shim at `bin/lily`.
- 2026-11-06: The support for other agent hosts was removed. The git history keeps it.
- 2026-11-04: The owner accepted wave one, after `/lilystack:plan-eng-review` did a full review of a design doc from outside the repo.

## Notes
- The sources, the licenses and the rejected repositories of the harvest are in `docs/designs/harvest.md`.
- All five checks in `AGENTS.md` pass.
