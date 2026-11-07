# The harvest: the best Claude skills, rewritten for Lilystack

Date: 2026-11-06. Status: done. Read this file before you add material from an
upstream repository.

<p align="center"><img src="../assets/harvest.svg" width="100%" alt="How the harvest worked. Four research agents read 25 top repositories at fixed commits. Text and rules came from ten MIT repositories and two Apache-2.0 repositories from Anthropic. Ideas only came from five more. Six were not taken, each for a stated reason. The steps: read the license, keep the core, remove the runtime. The result: 25 skills, 5 hooks, 1 lens agent, 32 evals."></p>

## 1. Goal

Find the best Claude Code skills, hooks and setups in the top repositories on
GitHub. Add the parts that obey the Lilystack rules (`AGENTS.md`). Record the
parts that do not obey the rules, and the reason.

## 2. Method

1. A search of GitHub by stars found the top repositories for Claude skills,
   hooks, subagents and plugins.
2. The harvest cloned 25 repositories, each at one fixed commit. No upstream
   code ran.
3. Four read-only research agents read the repositories in four groups:
   - A: the official Anthropic repositories;
   - B: process frameworks (superpowers, mattpocock, agent-skills, compound engineering);
   - C: planning, specs and context (spec-kit, humanlayer, planning-with-files,
     ECC, wshobson, and the gstack skills that Lilystack did not have yet:
     spec, qa, test-audit, write-skill and others);
   - D: safety hooks and style (tdd-guard, hooks-mastery, Trail of Bits,
     Karpathy, ponytail, caveman, humanizer, hallmark, tips, awesome-claude-code).
4. Each agent read the licenses from the files, ranked the candidates, and
   recorded what a diet rewrite keeps and cuts.
5. Writer agents then did the diet rewrites. Each writer had its own files.
   The checks ran after each writer.
6. A fifth agent read the current Claude Code docs for newer plugin features
   (section 4.4). A sixth agent audited all documents against the real files.

## 3. Selection rules

The first harvest used strict rules. On 2026-11-06 the owner relaxed them
(`AGENTS.md`), and section 9 records the second harvest. Now a candidate goes
in if all of these are true:

- Its license lets Lilystack rewrite it (section 6).
- It sends nothing out that the owner does not expect: no telemetry, no
  update check, no background calls. A browser or a second model is opt-in.
- It asks before an outward or irreversible action.
- It does a task that Lilystack and the owner's other skills do not do now.
  The owner also runs superpowers and mattpocock's skills in full. A
  candidate that only copies one of those skills gets a cross-reference, not
  a port.

## 4. What went in

### 4.1 New skills

| Skill | What it does | Sources |
|---|---|---|
| spec | Changes a request or a design into a spec that you can test, in `docs/specs/<slug>.md` | gstack spec; spec-kit specify, clarify, checklist and templates; ECC intent-driven-development; ideas from humanlayer |
| qa | Probes CLI, API, job and webhook behaviour. It reports first. It repairs only an approved batch | gstack qa and qa-only, merged |
| test-audit | Finds tests that cost more than they protect, with evidence for each | gstack test-audit and its test-value rules |
| feedback | Gives a verdict for each review comment before a code change | compound-engineering ce-resolve-pr-feedback |
| context-audit | Grades CLAUDE.md and AGENTS.md files against the code. It cannot edit | claude-plugins-official claude-md-management |
| write-skill | Writes or edits a skill with the Lilystack diet, with test prompts and trigger queries | gstack write-skill; anthropics-skills skill-creator; claude-plugins-official plugin-dev and hookify; compound-engineering; the task-observer ideas in `lilystack.md` section 6.3 |
| prose | Removes the signs of AI writing from prose. It keeps every fact. `--ste` gives Simplified Technical English | humanizer |

### 4.2 New hooks

| Skill | Hook | What it does | Sources |
|---|---|---|---|
| secrets | `hooks/secrets.sh` | Denies reads and copies of private keys and credential stores. Asks before `.env` files, environment dumps and secrets in new text | Original. The idea of a `.env` guard is from disler/claude-code-hooks-mastery (no license, so the idea only) |
| secure | `hooks/secure.sh` | Warns, but does not block, when an edit adds a dangerous code sink (eval, shell=True, unsafe deserialisation, TLS off, and more) | claude-plugins-official security-guidance patterns |
| test-first | `hooks/test-first.sh` | Asks before a source edit when no test file has changed yet | tdd-guard (the idea of the gate; no model call) |

guard now starts careful, secrets, secure and freeze together.

### 4.3 Changes to existing skills

| Skill | What changed | Sources |
|---|---|---|
| careful | Closed six silent bypasses (`/bin/rm`, `\rm`, a subshell, `bash -c`, `ssh`, `$(...)`), more deny targets, and 31 new rules (45 in all) | New rules, written from the behaviour of each tool |
| freeze | Also asks when a Bash command writes outside the boundary (`>`, `tee`, `sed -i`, `cp`, `mv`, and more). Repaired a `..` bypass under a folder that does not exist | An idea from tdd-guard's enforcement notes |
| review | A security lens, four narrow lenses (silent failures, comments, tests, types), a larger adversarial pass, anchored confidence, a validation pass, a rules-file lens, a lean lens, and new checklist rows | claude-plugins-official security-guidance, pr-review-toolkit, code-review and feature-dev; compound-engineering adversarial and API-contract reviewers; agent-skills; Karpathy's guidelines; ponytail; ideas from Trail of Bits and mattpocock |
| ship | Reads specs and superpowers plans, examines each acceptance criterion with evidence, a docs coverage map, a mutation probe for weak tests, `Closes #N` only when the spec is complete | gstack document-release and spec; spec-kit converge; agent-skills; compound-engineering testing reviewer; superpowers file layout; ideas from mattpocock's pr and tdd |
| verify | Offers the mutation probe | agent-skills; compound-engineering testing reviewer |
| plan-ceo-review | Reads specs and superpowers plans; tags each decision Mechanical, Taste or User Challenge; "a later with no trigger is a delay" | gstack autoplan; task-observer |
| plan-eng-review | Reads specs and superpowers plans; a document coherence pass; the lean ladder; "a later with no trigger is a delay" | compound-engineering coherence reviewer; superpowers writing-plans; ponytail; task-observer |
| office-hours | A builder read before approval; spec as the next step; when to compact | superpowers brainstorming; agent-skills interview-me; ECC strategic-compact |
| investigate | A performance recipe; a prevention ladder after a fix; a record of what did not work | agent-skills performance-optimization; compound-engineering ce-compound and ce-debug; ECC save-session |
| retro | The prevention ladder in the habits; a ledger of marked shortcuts | compound-engineering; ponytail-debt |

### 4.4 Newer Claude Code features

| Part | What it does |
|---|---|
| `evals/` | 32 trigger and near-miss cases for `claude plugin eval`, with graders that need no model. The first full run passed 32 of 32 |
| `agents/lens.md` | A read-only lens subagent for review. Its tools are Read, Grep and Glob |
| `output-styles/ste.md` | An opt-in output style for Simplified Technical English |
| `disallowed-tools` | context-audit and retro cannot edit while they run |
| `.claude-plugin/marketplace.json` and `icon.png` | The fallback install works, and `claude plugin validate .` has no warning |

## 5. What Lilystack did not take

| Item | Reason |
|---|---|
| superpowers and mattpocock skills (TDD, debugging, plans, worktrees, grilling, handoff, and more) | The owner already runs them. Lilystack now reads their plan and spec folders instead |
| anthropics-skills docx, pdf, pptx, xlsx | Source-available. No derivative works |
| anthropics-skills doc-coauthoring | No license file |
| claude-plugins-official claude-security | Proprietary license |
| anthropics/claude-code | All rights reserved |
| Dicklesworthstone/destructive_command_guard | Its license rider forbids any use by or for Anthropic. Lilystack takes nothing from it, and the harvest removed its clone |
| disler/claude-code-hooks-mastery, ykdojo/claude-code-tips | No license, or all rights reserved. Ideas only |
| The code-review plugin, feature-dev, code-simplifier, commit-commands as plugins | They copy built-in commands, start many agents, or commit with no question. review keeps the rules of code-review and feature-dev |
| The security-guidance reviews by a model, tdd-guard as shipped, caveman compress | They call a model. review keeps the rubric of security-guidance as text |
| ralph-loop, the planning-with-files hooks, the fp-check Stop hooks | A loop that prompts Claude again, or a Stop gate |
| hookify as a plugin, diet103 skill activation, session-report, receipts | A Python or Node runtime. write-skill keeps hookify's list of frustration signals |
| wshobson/agents, ECC agents, compound-engineering orchestration | Persona agents or orchestration. Lilystack allows subagents only as lenses in review |
| caveman, the output-style plugins of others | They set a voice. The owner's CLAUDE.md sets the voice. Lilystack's own `ste` style is opt-in, and it changes only the grammar |
| webapp-testing, the hallmark build flow | Python and Node tools that duplicate the qa browser section and frontend-design. The rules are in; the tools are not |
| gstack autoplan in unattended mode | It decides questions without the owner. Lilystack's autoplan (section 9) asks each User Challenge |

## 6. Licenses

| License | What Lilystack does |
|---|---|
| MIT | Rewrite. `NOTICE.md` keeps the copyright line and the pin |
| Apache-2.0 (Anthropic, humanlayer) | Rewrite with a change note: `; changed` in the provenance comment. The full text is in `licenses/Apache-2.0.txt`. humanlayer gives ideas only, so it needs no notice |
| CC-BY-SA-4.0 (Trail of Bits), CC-BY-4.0 (task-observer) | Ideas only, in Lilystack's own words. Lilystack copies no text, so share-alike does not apply. A credit is in the prose |
| No license file | The license that the README states (andrej-karpathy-skills), or ideas only |
| All rights reserved, source-available | Ideas only, or nothing |
| A rider against Anthropic | Nothing |

Note: the design of 2026-11-03 did not use Apache-2.0 material. The harvest
takes Apache-2.0 material from Anthropic's own plugins, with the notice and
the change note that the license needs.

## 7. Pins

`NOTICE.md` has the full pin list. These are the pins of the harvest:

| Upstream | Commit | Date | License |
|---|---|---|---|
| garrytan/gstack | `466689b` | 2026-11-03 | MIT |
| garrytan/gstack (HEAD, write-skill only) | `274fb34` | 2026-11-06 | MIT |
| github/spec-kit | `d649834` | 2026-11-06 | MIT |
| affaan-m/ECC | `b38be6a` | 2026-10-29 | MIT |
| EveryInc/compound-engineering-plugin | `173bd33` | 2026-11-06 | MIT |
| addyosmani/agent-skills | `301b02b` | 2026-11-01 | MIT |
| obra/superpowers | `22f0b46` | 2026-11-03 | MIT |
| mattpocock/skills | `4ae2317` | 2026-10-31 | MIT (ideas only) |
| anthropics/claude-plugins-official | `a1ecfbc` | 2026-11-05 | Apache-2.0 |
| anthropics/skills | `ca45fc4` | 2026-10-28 | Apache-2.0 |
| blader/humanizer | `0ef9fe5` | 2026-10-28 | MIT |
| DietrichGebert/ponytail | `96608e0` | 2026-10-29 | MIT |
| multica-ai/andrej-karpathy-skills | `2c60614` | 2026-04-20 | MIT (stated in its README) |
| nizos/tdd-guard | `ffb7026` | 2026-11-03 | MIT |
| humanlayer/humanlayer | `f9bd735` | 2026-11-02 | Apache-2.0 (ideas only) |
| trailofbits/skills | `470419e` | 2026-11-04 | CC-BY-SA-4.0 (ideas only) |
| nicobailon/skill-diet, through gstack | `5f41df1` | | MIT (ideas only) |
| rebelytics/one-skill-to-rule-them-all (task-observer) | `f867557` | 2026-11-04 | CC-BY-4.0 (ideas only) |
| disler/claude-code-hooks-mastery | `052ad1c` | 2026-02-01 | No license (idea only) |

To re-sync, read each upstream again and compare it with its pin. No script
does this.

## 8. Later

- Repositories to read next: kenryu42/claude-code-safety-net,
  JeongJaeSoon/agent-guard, conorbronsdon/avoid-ai-writing,
  anthropics/claude-code-security-review, glittercowboy/taches-cc-resources.
  Read the license of each first.
- A mod that shows which guards are on, beside the status band.

## 9. The second harvest (after the rules changed)

On 2026-11-06 the owner removed the rules that blocked good work. These parts
then came in. Eight writer agents did the rewrites.

| Part | What it does | Sources |
|---|---|---|
| plan-design-review | Scores the UI of a plan before code: seven passes, the AI-default looks, floor, reflex and finish tiers | gstack plan-design-review; Anthropic frontend-design; hallmark; impeccable and Elaya through gstack |
| plan-devex-review | Scores the developer experience of a plan: persona, time to hello world, eight passes, the error-path matrix | gstack plan-devex-review |
| autoplan | Runs the plan reviews in order, decides the mechanical choices, and asks the rest at one gate | gstack autoplan |
| security-audit | A whole-repo security audit: secrets in history, dependencies, CI, auth, data, agents | gstack cso; ideas from Trail of Bits |
| second-opinion | Another model reviews, challenges or answers, only when the owner asks | gstack codex; ideas from Trail of Bits |
| compound | A solved problem becomes `docs/solutions/<slug>.md` | compound-engineering ce-compound |
| frontend-design | Guides a UI build, then looks at it in a browser | Anthropic frontend-design; hallmark |
| qa (browser section) | A web page is now a surface | gstack qa browser sections |
| context-audit (apply) | Applies the diffs that the owner approves | Anthropic claude-md-management |
| marketplace | `.claude-plugin/marketplace.json` is a first-class way to install | Claude Code |

destructive_command_guard stays out. Its license, not a Lilystack rule,
forbids any use by or for Anthropic.
