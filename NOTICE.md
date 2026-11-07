# Notice

Lilystack is MIT, under the owner's copyright (see `LICENSE`). Most of its
skills are rewrites of skills from other repositories. Each SKILL.md names its
sources on the first line after its frontmatter. This file repeats the sources
for each skill and keeps the notices that their licenses need.

These parts are the owner's own work. They do not come from an upstream:

- `bin/lily`, the `lily-*` skills, and the mods `mods/status`,
  `mods/verify-gate`, `mods/outbound-ledger` and `mods/focus`;
- the `secrets` hook, `hooks/lib-path.sh`, and the Bash-write parser in
  `hooks/freeze.sh`;
- the `lens` agent, the `ste` output style and the eval suite in `evals/`.

## Upstream pins

| Upstream | Commit | Date | License | Copyright |
|---|---|---|---|---|
| [garrytan/gstack](https://github.com/garrytan/gstack) | `466689b` | 2026-11-03 | MIT | Copyright (c) 2026 Garry Tan |
| garrytan/gstack (HEAD, for write-skill's "Earn its place" step) | `274fb34` | 2026-11-06 | MIT | Copyright (c) 2026 Garry Tan |
| [github/spec-kit](https://github.com/github/spec-kit) | `d649834` | 2026-11-06 | MIT | Copyright GitHub, Inc. |
| [affaan-m/ECC](https://github.com/affaan-m/ECC) | `b38be6a` | 2026-10-29 | MIT | Copyright (c) 2026 Affaan Mustafa |
| [EveryInc/compound-engineering-plugin](https://github.com/EveryInc/compound-engineering-plugin) | `173bd33` | 2026-11-06 | MIT | Copyright (c) 2025 Every |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | `301b02b` | 2026-11-01 | MIT | Copyright (c) 2025 Addy Osmani |
| [obra/superpowers](https://github.com/obra/superpowers) | `22f0b46` | 2026-11-03 | MIT | Copyright (c) 2025 Jesse Vincent |
| [blader/humanizer](https://github.com/blader/humanizer) | `0ef9fe5` | 2026-10-28 | MIT | Copyright (c) 2025 Siqi Chen |
| [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) | `96608e0` | 2026-10-29 | MIT | Copyright (c) 2026 DietrichGebert |
| [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) | `2c60614` | 2026-04-20 | MIT (stated in its README; no LICENSE file) | The andrej-karpathy-skills contributors |
| [nizos/tdd-guard](https://github.com/nizos/tdd-guard) | `ffb7026` | 2026-11-03 | MIT | Copyright (c) 2025 Nizar Selander |
| [Nutlope/hallmark](https://github.com/Nutlope/hallmark) | `407fa68` | 2026-11-05 | MIT | Copyright (c) 2026 Hallmark contributors |
| [pbakaus/impeccable](https://github.com/pbakaus/impeccable), through gstack's design rules | as gstack's NOTICE records | | Apache-2.0 | Copyright Paul Bakaus |
| [elayadesign/ai-design-skills](https://github.com/elayadesign/ai-design-skills) `38bbe576` and [redesign-skill](https://github.com/elayadesign/redesign-skill) `64627f6e`, through gstack's design rules | | | MIT | Copyright (c) 2026 Elaya |
| [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) | `a1ecfbc` | 2026-11-05 | Apache-2.0 | Copyright Anthropic, PBC |
| [anthropics/skills](https://github.com/anthropics/skills) | `ca45fc4` | 2026-10-28 | Apache-2.0 | Copyright 2026 Anthropic, PBC |

To re-sync, read each upstream again and compare it with its pin. No script
does this. `docs/designs/harvest.md` tells how the harvest chose these
sources.

## Ideas only

These sources gave ideas only. Lilystack wrote the ideas again in its own
words and copied no text. For this reason, their licenses need no notice.
This file and the prose of each skill give them a credit.

| Source | License | Where the idea went |
|---|---|---|
| [mattpocock/skills](https://github.com/mattpocock/skills) at `4ae2317` | MIT, Copyright (c) 2026 Matt Pocock | ship: the one-way or two-way door, and a note for each test seam; review: read the written standards of the repo |
| [humanlayer/humanlayer](https://github.com/humanlayer/humanlayer) at `f9bd735` | Apache-2.0, QueryTale, Inc. | spec: the newest source wins; the current state only describes; only the owner closes a decision; thin vertical phases |
| [trailofbits/skills](https://github.com/trailofbits/skills) at `470419e` | CC-BY-SA-4.0 | review's security section: risk triage, the history check, insecure defaults, sharp edges, the false-positive gate |
| [rebelytics/one-skill-to-rule-them-all](https://github.com/rebelytics/one-skill-to-rule-them-all) (task-observer) at `f867557` | CC-BY-4.0, Eoghan Henn | write-skill and the plan reviews (design, section 6.3) |
| [nicobailon/skill-diet](https://github.com/nicobailon/skill-diet) at `5f41df1`, through gstack's `write-skill/references/diet.md` | MIT | write-skill: the size discipline |
| OpenAI, "Designing Delightful Frontends with GPT-5.4" (an article), through gstack's design rules | Article | plan-design-review: the hard rejections and the litmus checks, written again |
| pstack (Lauren Tan), [cursor/plugins](https://github.com/cursor/plugins) `pstack/` at `99b609a7` | MIT | plan-eng-review's design-twice pass and red flags, investigate's blast radius, credited as gstack credits them |
| [disler/claude-code-hooks-mastery](https://github.com/disler/claude-code-hooks-mastery) at `052ad1c` | No license file | The idea of a hook that guards `.env` files, for `secrets` |

## License texts

### MIT

This text applies to each MIT upstream in the pin table, with the copyright
line of that upstream.

```
MIT License

Copyright (c) <year> <copyright holders: see the pin table above>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Apache-2.0

The full text is in [`licenses/Apache-2.0.txt`](licenses/Apache-2.0.txt). It
applies to the material from anthropics/claude-plugins-official,
anthropics/skills and impeccable. Lilystack changed these files: each one is a short rewrite
for this plugin, not a copy. The provenance comment of each file that uses
this material says `changed`.

## Skills

Paths are relative to each upstream at its pin. A row lists every upstream
whose words or rules the skill uses.

| Skill | Upstream sources | Notes |
|---|---|---|
| careful | gstack `careful/SKILL.md.tmpl`, `careful/bin/check-careful.sh` | The rule list is `hooks/careful-patterns.txt`. The rows added on 2026-11-06 are new work, written from the behaviour of each tool |
| freeze | gstack `freeze/SKILL.md.tmpl`, `freeze/bin/check-freeze.sh`, `freeze/bin/freeze-state.sh` | State in `~/.lilystack/freeze/<key>`; fails closed. The Bash check is an idea from tdd-guard's enforcement notes |
| guard | gstack `guard/SKILL.md.tmpl`, the careful and freeze scripts above | Now also registers secrets and secure |
| unfreeze | gstack `unfreeze/SKILL.md.tmpl`, `freeze/bin/freeze-state.sh` | |
| secrets | None (original) | The `.env` guard idea is from disler/claude-code-hooks-mastery |
| secure | claude-plugins-official `plugins/security-guidance/hooks/patterns.py`, `security_reminder_hook.py` | Warn-only, as upstream. Changed: bash and ERE, a stateless filter for sinks that were already present |
| test-first | tdd-guard `src/hooks/fileTypeDetection.ts`, `docs/enforcement.md` | No model call: a check of git state only |
| office-hours | gstack `office-hours/SKILL.md.tmpl`; `office-hours/sections/phase-2a-startup-diagnostic.md.tmpl`, `phase-2b-builder-brainstorm.md.tmpl`, `design-and-handoff.md.tmpl`; `openclaw/skills/gstack-openclaw-office-hours/SKILL.md`. superpowers `skills/brainstorming/SKILL.md`, `builder-check-prompt.md` (the builder read). agent-skills `skills/interview-me/SKILL.md`. ECC `skills/strategic-compact/SKILL.md` | Dropped: cross-model views, distribution plan, builder profile, founder resources, landscape research by browser, state root, telemetry |
| spec | gstack `spec/SKILL.md.tmpl`, `spec/sections/gate-and-file.md.tmpl`, the generated `spec/SKILL.md`. spec-kit `templates/commands/specify.md`, `clarify.md`, `checklist.md`, `templates/spec-template.md`, `templates/tasks-template.md`. ECC `skills/intent-driven-development/SKILL.md` | Dropped: the gate by another model, spawned sessions, the state archive, the decision log, numbered spec folders, the constitution |
| plan-ceo-review | gstack `plan-ceo-review/SKILL.md.tmpl`; `plan-ceo-review/sections/checklist.md.tmpl`, `review-sections.md.tmpl`; `openclaw/skills/gstack-openclaw-ceo-review/SKILL.md`; `autoplan/SKILL.md.tmpl` (the three decision classes) | Dropped: the decision-ledger rules, the taste binary, landscape research by browser, the outside voice, the plan archive, the review log, learnings, telemetry |
| plan-eng-review | gstack `plan-eng-review/SKILL.md.tmpl`; `plan-eng-review/sections/checklist.md.tmpl`, `review-sections.md.tmpl`. compound-engineering `skills/ce-doc-review/references/personas/coherence-reviewer.md`. superpowers `skills/writing-plans/SKILL.md`. ponytail `skills/ponytail/SKILL.md` | The design-twice pass and its red flags come from pstack. Dropped: the scope-gate selector, the report-file machinery, learnings, the outside voice, TODOS updates, worktree parallel work, the review log, telemetry |
| review | gstack `review/SKILL.md.tmpl`, `review/checklist.md`; `review/sections/adversarial.md.tmpl`, `plan-completion.md.tmpl`, `shared-code-reuse.md.tmpl`. claude-plugins-official `plugins/security-guidance/hooks/llm.py`, `plugins/pr-review-toolkit/agents/*.md`, `plugins/pr-review-toolkit/commands/review-pr.md`, `plugins/code-review/commands/code-review.md`, `plugins/feature-dev/agents/code-reviewer.md`. compound-engineering `skills/ce-code-review/references/personas/adversarial-reviewer.md`, `api-contract-reviewer.md`, `data-migration-reviewer.md`, `skills/ce-work/references/implementation-loop.md`, `skills/ce-resolve-pr-feedback/references/evaluation-rubric.md`. agent-skills `skills/api-and-interface-design/SKILL.md`, `skills/security-and-hardening/SKILL.md`, `skills/doubt-driven-development/SKILL.md`. andrej-karpathy-skills `CLAUDE.md`. ponytail `skills/ponytail/SKILL.md`, `skills/ponytail-review/SKILL.md` | Ideas from Trail of Bits in the security section, and from mattpocock's `engineering/code-review` (read the written standards of the repo). Dropped: review bots, the version queue, the army of specialist agents, the gate-diff and banned-terms helpers, the review log, learnings, telemetry, posts to GitHub, model routing |
| verify | gstack `verify/SKILL.md.tmpl`. agent-skills `skills/code-review-and-quality/SKILL.md`. compound-engineering `skills/ce-code-review/references/personas/testing-reviewer.md` | The mutation probe offer comes from ship's coverage section. Dropped: the checks runner, untrusted-repo handling, the verdict codes, telemetry |
| qa | gstack `qa/SKILL.md.tmpl`, `qa-only/SKILL.md.tmpl`, the generated `qa/sections/browser-setup.md`, `browser-verify.md`, `qa-patterns.md`, `qa-only/sections/reporting.md.tmpl`, the generated `qa/sections/scope.md`, `system-functional.md`, `exploratory.md`, `qa/references/issue-taxonomy.md`, `qa/templates/functional-report-template.md`, `scripts/resolvers/test-value.ts` | qa and qa-only merged. A web page is a surface through the browser sections, with generic browser tools. Dropped: gstack's browse binary, health scores, the Bun tools, learnings, auto-commits |
| test-audit | gstack `test-audit/SKILL.md.tmpl`, `scripts/resolvers/test-value.ts` | The keep marker is `lilystack:test-value keep`. Dropped: the state-root report, the JSON sidecar, spawned mode |
| ship | gstack `ship/SKILL.md.tmpl`, `spec/SKILL.md.tmpl` (the close rule); `ship/sections/tests.md.tmpl`, `test-coverage.md.tmpl`, `documentation.md.tmpl`, `pr-body.md.tmpl`, `plan-completion.md.tmpl`; `document-release/SKILL.md.tmpl`, `document-release/sections/audit-scope.md.tmpl`. spec-kit `templates/commands/converge.md`. superpowers `skills/writing-plans`, `skills/executing-plans`, `skills/test-driven-development/writing-good-tests.md`. agent-skills `skills/code-review-and-quality/SKILL.md`. compound-engineering `skills/ce-code-review/references/personas/testing-reviewer.md` | Ideas from mattpocock's `engineering/pr` and `engineering/tdd`. Dropped: VERSION and CHANGELOG bumps, TODOS, release lanes, the review army, evals, receipts, state and evidence files, telemetry |
| feedback | compound-engineering `skills/ce-resolve-pr-feedback/SKILL.md`, `references/evaluation-rubric.md`, `references/full-mode.md` | Every change, reply and resolve asks first. Dropped: the oracle panel of other models, pipeline mode, the scripts |
| investigate | gstack `investigate/SKILL.md.tmpl`; `investigate/sections/blast-radius.md.tmpl`, `flake.md.tmpl`, `race.md.tmpl`, `polluter.md.tmpl`, `backlog.md.tmpl`; `openclaw/skills/gstack-openclaw-investigate/SKILL.md`. agent-skills `skills/performance-optimization/SKILL.md`, `references/optimization-patterns.md`. compound-engineering `skills/ce-compound/SKILL.md`, `skills/ce-compound/references/form.md`, `skills/ce-debug/SKILL.md`. ECC `commands/save-session.md` (one idea) | The blast radius comes from pstack, as gstack credits it. Dropped: eval-bisect, memory context, learnings logs, the state root, the `gh` and `bun` helpers, the learnings corpus, telemetry |
| retro | gstack `retro/SKILL.md.tmpl`; `retro/sections/report-format.md.tmpl`; `openclaw/skills/gstack-openclaw-retro/SKILL.md`. compound-engineering `skills/ce-compound/references/form.md`. ponytail `skills/ponytail-debt/SKILL.md` | Project mode only, nothing written. Dropped: global and compare modes, the saved history, the scorecards, the team breakdown, the tweetable summary, telemetry |
| context-audit | claude-plugins-official `plugins/claude-md-management/skills/claude-md-improver/SKILL.md`, `references/quality-criteria.md`, `references/update-guidelines.md` | It applies only the diffs that the owner approves (upstream Phase 5). Dropped: the session-learnings command, the templates |
| write-skill | gstack `write-skill/SKILL.md.tmpl` (at `466689b` and `274fb34`), `write-skill/references/diet.md`. anthropics-skills `skills/skill-creator/SKILL.md`, `skills/skill-creator/agents/grader.md`. claude-plugins-official `plugins/plugin-dev/skills/skill-development/SKILL.md`, `plugins/plugin-dev/agents/skill-reviewer.md`, `plugins/hookify/agents/conversation-analyzer.md`. compound-engineering `skills/ce-resolve-pr-feedback/references/evaluation-rubric.md` | The four task-observer ideas are Lilystack's own words (design, section 6.3). Dropped: the eval scripts, the viewer, packaging |
| prose | humanizer `SKILL.md` | Adds `--ste` for Simplified Technical English. Dropped: the packaging scripts |
| plan-design-review | gstack `plan-design-review/SKILL.md.tmpl` and its generated `SKILL.md`, `sections/review-sections.md.tmpl`, `checklist.md.tmpl`, `scripts/resolvers/design.ts`, `design-craft.ts`, `constants.ts`. anthropics-skills `skills/frontend-design/SKILL.md`. hallmark `skills/hallmark/SKILL.md` | impeccable (surface modes, reflexes, three looks) and Elaya (Persuade checks) as gstack credits them; ideas from an OpenAI article. Dropped: the designer binary and mockups, outside voices by default, logs, TODOS |
| security-audit | gstack `cso/SKILL.md.tmpl`, `cso/sections/audit-phases.md.tmpl`, `scripts/resolvers/sideways.ts`. claude-plugins-official `plugins/security-guidance/hooks/llm.py` (the code classes) | Ideas from Trail of Bits. Advisory lookups ask first; it never prints a secret. Dropped: the helper binary, Docker runtime profiles, state, resume and replay, budgets, the diff mode |
| plan-devex-review | gstack `plan-devex-review/SKILL.md.tmpl`, `sections/review-sections.md.tmpl`, `sections/checklist.md.tmpl`, `dx-hall-of-fame.md`, `scripts/resolvers/dx.ts`, `lib/dx-error-contract.ts` | Peer benchmarks only on request, with the web search tool. Dropped: outside voice by default, review logs and dashboard, TODOS, learnings, the adoption statistics that cannot be checked |
| autoplan | gstack `autoplan/SKILL.md.tmpl`, `autoplan/sections/ceo-phase.md.tmpl`, `design-phase.md.tmpl`, `dx-phase.md.tmpl`, `eng-phase.md.tmpl`, `phase-close.md.tmpl` | A User Challenge is asked at once and never decided. Dropped: unattended mode, restore points, per-phase subagents, outside voices, the tasks aggregator, state files, telemetry |
| second-opinion | gstack `codex/SKILL.md.tmpl`, `codex/sections/review-mode.md.tmpl`, `challenge-mode.md.tmpl`, `consult-mode.md.tmpl` | Only the owner starts it; it asks before data goes out. Ideas from Trail of Bits' `second-opinion`. Dropped: the helper programs, logs, telemetry, the saved session file |
| compound | compound-engineering `skills/ce-compound/SKILL.md`, its `references/` (form, research, assembly, lightweight, yaml-schema, grounding-validation, refresh-and-discoverability, modes, report, schema.yaml) and `assets/resolution-template.md` | Writes `docs/solutions/<slug>.md` after a yes. Dropped: session mining, the Python validators, refresh mode, the concepts glossary, packs |
| frontend-design | anthropics-skills `skills/frontend-design/SKILL.md`. hallmark `skills/hallmark/SKILL.md` | Some hallmark floor items are reflex items here, so the brief can waive them. Dropped: hallmark's themes, photos, scripts, state and hooks; the persona line |
| lily-check, lily-lint, lily-sweep | None (original) | The owner's own work |
