# Status: Lilystack

## Next
- Use the new skills on a real project. The seven skills of the first harvest had a dry run on test repos on 2026-11-06. The seven of the second harvest passed their trigger evals, but they had no dry run yet (see `docs/verification-log.md`).

## Waiting on you
- In the GitHub settings of this repo, add a ruleset for `main`: no force-push, no deletion, a pull request before a merge, and the `checks` status must pass. No tool in a Claude cloud session can change this setting.
- In the GitHub settings of this repo, make sure that private vulnerability reporting is on. `SECURITY.md` tells a reporter to use it.
- In the desktop app, check that `/plugin` shows `focus`, `verify-gate` and `outbound-ledger`. Lilypad's `settings.json` already enables them; if one is missing, install it from the lilystack marketplace (+, then Plugins).
- On each Mac, in this order: pull Lilystack, pull Lilypad, run `~/Lilypad/bin/lily check`.
- Decide how the status mod loads. The desktop app does not read `~/.zshrc.local`, so the `CLAUDE_CODE_PLUGIN_DIRS` line in `mods/status/README.md` works only in the terminal. To use it in the app, add status to the marketplace (AGENTS.md says that the marketplace lists all mods but status).

## Done
- 2026-11-12: A full eval run: 48 of 48 cases pass, with the two `build` cases and the quality case (see `docs/verification-log.md`). The hero image, the README and `evals/README.md` show this result.
- 2026-11-12: A clean, sweep and audit pass for the public repo. The audit found no secret in the tree or in the git history, no broken link and no orphan file. The README has a new order (quick start first), badges, a Mods section and five numbered sprint steps. `docs/assets/map.svg` now shows build and all four mods. The stale counts in the image descriptions and in the manifests were corrected.
- 2026-11-09: A review, test and hardening pass. Hooks: careful closes wrapper bypasses (`caffeinate rm -rf ~` and others), comment and pipe tricks on unless-rules, and more root spellings; secrets catches custom key names in `~/.ssh`, globs and folder copies; freeze keeps the boundary when the cwd changes, sees more writers and nested shells, and costs about 13 ms (was 48) when no freeze is set; all five hooks fail closed on a payload of the wrong shape. `lily sweep` refuses `./` spellings of a mapped source and paths through a symlinked folder. The four mods got bug fixes (see their READMEs). Tests: hooks 627, lily 106, mods 54/29/17/42. All 627 hook tests pass under macOS `/bin/bash` 3.2 (run on a Mac, 2026-11-10).
- 2026-11-07: Three new mods, each with tests: verify-gate (an APPROVED stamp and a stop on PR merges), outbound-ledger (a pane of outward actions) and focus (one main action, then the tasks after it, checked off in a pane). The marketplace lists them. A headless session loaded all three with no hook errors.
- 2026-11-07: Security hardening for the public repo: a read-only CI for the four zsh checks, Dependabot for the action pins, CODEOWNERS, secret patterns in .gitignore, and a longer SECURITY.md. A scan of the full git history found no secrets.
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
