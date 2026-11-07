<p align="center"><img src="docs/assets/hero.svg" width="100%" alt="Lilystack: short rewrites of the best Claude Code skills. 32 skills, 5 safety hooks, 46 of 46 evals pass, 0 telemetry. From 18 upstreams, about 2.1k tokens in each session."></p>

**Lilystack is a Claude Code plugin. It has short rewrites of the best skills from the top Claude repositories on GitHub.**

- Each skill is Markdown. Each hook is a bash script.
- No telemetry, no update check, no background calls. A skill uses the network only when its task needs it, and it tells you what goes out.
- A browser tool and a second model are opt-in. Claude asks before data goes to another model, and before any commit, push or pull request.
- Each skill names its source and its license on its first line.
- 🌱 **Original** marks a part that Lilystack made itself. All other parts are rewrites of an upstream.
- The plugin uses about 2,100 tokens in each session before a skill starts (`claude plugin details lilystack`).

[What is inside](#what-is-inside) · [Quick start](#quick-start) · [Everyday use](#everyday-use) · [Safety](#safety-hooks) · [Evals](#evals) · [Checks](#checks) · [Sources](#where-the-skills-come-from)

## What is inside

<p align="center"><img src="docs/assets/map.svg" width="100%" alt="Map of Lilystack. The sprint: 1 Think (office-hours, spec), 2 Plan (plan-ceo-review, plan-eng-review), 3 Check (review, verify, qa, test-audit), 4 Ship (ship, feedback). Safety hooks: careful, secrets, secure, test-first, freeze, unfreeze, guard. Anytime: investigate, retro, context-audit, write-skill, prose. Lily tools: bin/lily, lily-check, lily-lint, lily-sweep, and the status mod. Also inside: the lens agent, the ste output style and the evals."></p>

Each call starts with `/lilystack:`. For example, type `/lilystack:spec`. An argument in `[ ]` is optional. If a skill needs an argument that you did not give, it asks for it.

### 1. Think

| Skill&nbsp;name&nbsp;that&nbsp;you&nbsp;type | What it does |
|---|---|
| [`office-hours`](skills/office-hours) | Asks hard questions about an idea, one at a time. Then it writes a design to `docs/designs/`. Arguments: `[idea]`. |
| [`spec`](skills/spec) | Reads the code first. Asks one question at a time. Writes a spec with acceptance criteria, a test plan and small phases to `docs/specs/`. Arguments: `[request or design]`. |

### 2. Plan

| Skill&nbsp;name&nbsp;that&nbsp;you&nbsp;type | What it does |
|---|---|
| [`plan-ceo-review`](skills/plan-ceo-review) | Examines the scope of a plan as a founder does: expand it, hold it or cut it. Adds a review block to the plan. Arguments: `[plan]`. |
| [`plan-eng-review`](skills/plan-eng-review) | Locks the architecture, the data flow, the failure modes and the tests. Makes sure that the plan agrees with itself. Adds a review block to the plan. Arguments: `[plan]`. |
| [`plan-design-review`](skills/plan-design-review) | Scores the UI design of a plan from 0 to 10 in seven passes, and finds the generic AI-default looks before code. Arguments: `[plan]`. |
| [`plan-devex-review`](skills/plan-devex-review) | Scores the developer experience of a plan: time to hello world, errors, docs, upgrades. For a CLI, API, SDK, library or plugin. Arguments: `[plan]`. |
| [`autoplan`](skills/autoplan) | Runs all the plan reviews that apply, in order. It decides the mechanical choices, asks the taste choices at one gate at the end, and never decides a User Challenge for you. Arguments: `[plan]`. |

### 3. Check

| Skill&nbsp;name&nbsp;that&nbsp;you&nbsp;type | What it does |
|---|---|
| [`review`](skills/review) | Finds the bugs that pass CI and break in production. Repairs the obvious ones and asks about the others. Has lenses for security, silent failures, comments, tests, types and lean code. Arguments: `[base] [plan]`. |
| [`verify`](skills/verify) | Runs the checks of the repo and the tests that cover the change, until they pass. If no test covers the change, verify does not report "green". |
| [`qa`](skills/qa) | Probes CLI, API, job, webhook and web page behaviour against the contract. A page needs a browser tool. It reports first. It repairs only a batch that you approve. `--quick` and `--exhaustive` set the depth. Arguments: `[surface] [--fix]`. |
| [`test-audit`](skills/test-audit) | Finds the tests that cost more than they protect, with evidence for each. It changes nothing until you approve. `--since <ref>` limits it to recent tests. Arguments: `[path ...]`. |

### 4. Ship

| Skill&nbsp;name&nbsp;that&nbsp;you&nbsp;type | What it does |
|---|---|
| [`ship`](skills/ship) | Takes a branch to a pull request: merge, verify, review, audits, commits, push and PR. It asks before each of these steps. It examines each acceptance criterion of the spec. Arguments: `[base] [plan]`. |
| [`feedback`](skills/feedback) | Gives a verdict for each review comment before any change: fix, reply, or ask you. Arguments: `[PR or comments]`. |

### Anytime

| Skill&nbsp;name&nbsp;that&nbsp;you&nbsp;type | What it does |
|---|---|
| [`investigate`](skills/investigate) | Finds the root cause before a fix. Stops after three failed fixes. Has a recipe for slow code and a step that prevents the same bug again. `--freeze <dir>` also sets a boundary. Arguments: `[symptom]`. |
| [`retro`](skills/retro) | Looks back at a git window: what shipped, test health, hotspots and marked shortcuts. It cannot edit a file. Arguments: `[window]`. |
| [`context-audit`](skills/context-audit) | Grades each `CLAUDE.md` and `AGENTS.md` against the real code. It applies only the diffs that you approve. Arguments: `[path]`. |
| [`write-skill`](skills/write-skill) | Writes or edits a skill with the Lilystack diet, test prompts and trigger checks. Arguments: `[skill]`. |
| [`prose`](skills/prose) | Removes the signs of AI writing and keeps every fact. With `--ste`, the result is in Simplified Technical English. Arguments: `[file or text] [--ste]`. |
| [`frontend-design`](skills/frontend-design) | Guides a UI build so that it is distinctive and correct, then looks at it in a browser at phone and desktop width, light and dark. |
| [`security-audit`](skills/security-audit) | A security audit of the whole repo: secrets in the git history, dependencies, CI, auth, data and agents. |
| [`compound`](skills/compound) | Records a solved problem in `docs/solutions/`, after you say yes, so that the next session does not solve it again. |
| [`second-opinion`](skills/second-opinion) | Asks another model (Codex, Gemini or another Claude) to review, challenge or answer. You start it. It shows what it will send, and asks first. |

### Safety hooks

Call a safety skill, and its hook is active until the session ends. You must call these skills yourself. Claude cannot start them.

<p align="center"><img src="docs/assets/guards.svg" width="100%" alt="How the guards work. Claude calls a tool, and the guards that you started read the call and answer deny, ask, warn or allow. careful reads Bash: rm -rf ~ is denied. secrets reads Bash, Read, Grep, Edit and Write: cat ~/.ssh/id_ed25519 is denied. secure reads Edit and Write: eval(user_input) gets a warning. test-first reads Edit and Write: an edit with no test yet asks. freeze reads Bash, Edit and Write: an edit outside src/ is denied."></p>

| Skill&nbsp;name&nbsp;that&nbsp;you&nbsp;type | What it does |
|---|---|
| [`careful`](skills/careful) | Stops destructive shell commands, for example `rm -rf ~` or a force-push to `main`. Asks before other risky commands. |
| [`secrets`](skills/secrets) | 🌱 **Original.** Stops reads of private keys and credential files. Asks before `.env` files and tokens. |
| [`secure`](skills/secure) | Warns when an edit adds dangerous code, for example `eval` or `shell=True`. It does not block. |
| [`test-first`](skills/test-first) | Asks before a source edit when no test file has changed yet. |
| [`freeze`](skills/freeze) | Limits edits and Bash writes to one folder. [`unfreeze`](skills/unfreeze) removes the limit. Arguments: `[dir]`. |
| [`guard`](skills/guard) | Starts careful, secrets, secure and freeze with one call. Arguments: `[dir]`. |

careful, secrets and secure read a plain rules file beside the script (`hooks/*-patterns.txt`). freeze and test-first keep their few rules in the script. "Edit, Write" in the image also means MultiEdit, and NotebookEdit for secrets, secure and freeze.

### Lily tools (optional)

These are the author's own tools. They are all 🌱 **Original**. The `lily` tool and the `lily-*` skills act on a clone of the author's hub repo (config and ideas), [Lilypad](https://github.com/frogfarmin/Lilypad), at `~/Lilypad`, not on the project that you are in. Without a `~/Lilypad` folder they do nothing useful, so you can ignore them. You can also read or fork Lilypad as an example. The status mod works in any project.

| Item&nbsp;or&nbsp;skill | What it does |
|---|---|
| [`bin/lily`](bin/lily) | 🌱 **Original.** The Lilypad link tool. It links Lilypad's config into place. Commands: `link`, `check`, `adopt`, `lint`, `sweep`, `pull`. |
| [`lily-check`](skills/lily-check) | 🌱 **Original.** Finds and repairs broken links. Asks before a repair. |
| [`lily-lint`](skills/lily-lint) | 🌱 **Original.** Gives a hygiene report for Lilypad, with a fix for each finding. |
| [`lily-sweep`](skills/lily-sweep) | 🌱 **Original.** Moves files to `~/to-delete`. You start it, not Claude. Arguments: `[path ...]`. |
| [`mods/status`](mods/status) | 🌱 **Original.** A separate mod, loaded through `CLAUDE_CODE_PLUGIN_DIRS`. It keeps `STATUS.md` correct and shows a band above the prompt. |

### Also inside

| Part&nbsp;of&nbsp;the&nbsp;plugin | What it does |
|---|---|
| [`marketplace`](.claude-plugin/marketplace.json) | A one-plugin marketplace, so that you can install Lilystack with `claude plugin install`, from the folder or from GitHub. |
| [`lens`](agents/lens.md) | 🌱 **Original.** An agent: a read-only subagent for one review lens. review sends it, also when ship runs review. Its tools are Read, Grep and Glob, so it cannot edit or run a command. |
| [`ste`](output-styles/ste.md) | 🌱 **Original.** An output style: Claude writes each reply in ASD-STE100 Simplified Technical English. It is off until you choose it with `/output-style lilystack:ste`. |
| [`evals`](evals) | 🌱 **Original.** An eval suite: 46 cases for `claude plugin eval`. Each skill must start on its own request, and must not start on a near-miss. A quality case examines the output of prose. See [Evals](#evals). |

## Quick start

You need Claude Code, `jq` (the hooks use it) and `zsh` (only for the checks and `bin/lily`).

1. Install the plugin from GitHub:

   ```sh
   claude plugin marketplace add frogfarmin/Lilystack
   claude plugin install lilystack@lilystack
   ```

   - Or clone this repo, then use the folder: `claude plugin marketplace add ./Lilystack`.
   - Or load the clone for each session: `export CLAUDE_CODE_PLUGIN_DIRS="$HOME/Lilystack"`. Then `/plugin` shows `lilystack@inline`.
2. Start Claude Code. Type `/plugin`. The list must show `lilystack`.
3. Start with `/lilystack:office-hours <idea>`, or call the skill that you need.

## Everyday use

| I want to | Run |
|---|---|
| Examine a new idea | `/lilystack:office-hours <idea>` |
| Make a spec that I can test | `/lilystack:spec <request>` |
| Review a plan from every side | `/lilystack:autoplan <plan>` |
| Merge a change | `/lilystack:review`, then `/lilystack:verify`, then `/lilystack:ship` |
| Get another model's view | `/lilystack:second-opinion review` |
| Keep a hard-won fix | `/lilystack:compound` |
| Answer review comments | `/lilystack:feedback <PR>` |
| Find the cause of a bug | `/lilystack:investigate <symptom>` |
| Work near something fragile | `/lilystack:guard <dir>` |
| Make a text easy to read | `/lilystack:prose <file> --ste` |

## Evals

`claude plugin eval` gives two requests to each of the 22 skills that Claude can start. One request is for the skill. The other request only uses the same words. A case passes when the skill starts on the first request and does not start on the second.

```sh
claude plugin eval . --tag trigger --ablation none --no-publish
```

The last full run (`--runs 1`) passed 46 of 46 cases for about $2.60, on 2026-11-06. The trigger graders need no model. The quality case also asks a judge model. `--no-publish` keeps the report on your machine. Each run starts real Claude sessions, so it costs money. It is not one of the five checks. See [`evals/README.md`](evals/README.md).

## Checks

```sh
zsh tests/lint-skills.zsh      # every SKILL.md, eval grader and agent against the rules; prints clean
zsh tests/test-lint.zsh        # the tests of the lint
zsh tests/test-hooks.zsh       # the hooks
zsh tests/test-lily.zsh        # bin/lily, in a temporary HOME and Lilypad root
claude plugin validate .       # the manifest and the layout
```

After a change to `mods/status`, also run `claude plugin validate .` and `claude plugin test` in `mods/status`. The details are in [`AGENTS.md`](AGENTS.md#checks).

## Where the skills come from

<p align="center"><img src="docs/assets/harvest.svg" width="100%" alt="How the harvest worked. Four research agents read 25 top repositories at fixed commits. Text and rules came from ten MIT repositories and two Apache-2.0 repositories from Anthropic. Ideas only came from five more. Six were not taken, each for a stated reason. The steps: read the license, keep the core, remove the runtime. The result: 25 skills, 5 hooks, 1 lens agent, 32 evals."></p>

Each skill is a short rewrite. It keeps the questions, the checklists, the rules and the output formats of its source, and removes the runtime. [`docs/designs/harvest.md`](docs/designs/harvest.md) tells how the harvest found the sources, and why it did not take other repositories. [`NOTICE.md`](NOTICE.md) has the notices and one row for each skill.

| Upstream | What Lilystack took | License |
|---|---|---|
| [garrytan/gstack](https://github.com/garrytan/gstack) | The sprint: office-hours, the plan reviews, review, verify, ship, investigate, retro, the first safety hooks, spec, qa, test-audit, write-skill, plan-design-review, plan-devex-review, autoplan, security-audit, second-opinion | MIT |
| [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) | Review lenses, the security rubric, the `secure` patterns, the CLAUDE.md audit, the skill checklist for write-skill | Apache-2.0 |
| [anthropics/skills](https://github.com/anthropics/skills) | skill-creator's rules for write-skill; frontend-design | Apache-2.0 |
| [github/spec-kit](https://github.com/github/spec-kit) | The question loop and self-check of spec; ship's spec checks | MIT |
| [EveryInc/compound-engineering-plugin](https://github.com/EveryInc/compound-engineering-plugin) | The adversarial and coherence reviewers, feedback, the prevention ladder, compound | MIT |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | The performance recipe, contract rows, the mutation probe | MIT |
| [affaan-m/ECC](https://github.com/affaan-m/ECC) | The shape of an acceptance criterion; when to compact; the "what did not work" record | MIT |
| [obra/superpowers](https://github.com/obra/superpowers) | Its plan and spec folders, the builder read, the test shapes | MIT |
| [blader/humanizer](https://github.com/blader/humanizer) | prose | MIT |
| [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) | The lean ladder and the shortcut ledger | MIT |
| [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) | The rule that each changed line traces to the request | MIT |
| [nizos/tdd-guard](https://github.com/nizos/tdd-guard) | The test-first gate | MIT |
| [Nutlope/hallmark](https://github.com/Nutlope/hallmark) | The floor of frontend-design and plan-design-review | MIT |
| impeccable, Elaya (through gstack) | The surface modes, reflexes and Persuade checks of plan-design-review | Apache-2.0, MIT |
| [mattpocock/skills](https://github.com/mattpocock/skills), [humanlayer/humanlayer](https://github.com/humanlayer/humanlayer), [trailofbits/skills](https://github.com/trailofbits/skills) | Ideas only, written again in Lilystack's words | MIT, Apache-2.0, CC-BY-SA-4.0 |
| task-observer, skill-diet, pstack, disler/claude-code-hooks-mastery | Ideas only (see `NOTICE.md`) | CC-BY-4.0, MIT, MIT, none |

<details>
<summary>Install notes</summary>

- **To make sure that it loaded:** `/plugin` shows `lilystack`, and the `/` menu shows `lilystack:<skill>`.
- **The variable.** `CLAUDE_CODE_PLUGIN_DIRS` loads a clone with no install step. Sometimes Claude Code does not receive the variable, for example when you start the app outside a shell. Then use the marketplace install. It keeps its state in `~/.claude/plugins/`.
- **Upgrade:** `claude plugin marketplace update lilystack`, or `git pull` in your clone.
- **jq is missing:** the hooks fail closed and tell you to install `jq`.

</details>

<details>
<summary>The author's setup: Lily and the status mod</summary>

These are the author's own tools (🌱 **Original**). The author keeps config and ideas in a second repo, [Lilypad](https://github.com/frogfarmin/Lilypad), and uses Lilystack on two Macs, in the Claude desktop app. The desktop app loads Lilystack from its marketplace, which Lilypad's `Claude/settings.json` names.

<p align="center"><img src="docs/assets/repos.svg" width="100%" alt="How Lilystack and Lilypad fit in the author's setup. Lilypad holds the config: links.conf and the config files. bin/lily in Lilystack reads links.conf and makes symlinks on the two Macs. Claude Code on the Macs loads the Lilystack skills and hooks through CLAUDE_CODE_PLUGIN_DIRS. The main Mac also loads the status mod. lily pull updates Lilystack first, then Lilypad, then runs lily check."></p>

- **`bin/lily`** (zsh) links Lilypad's config into the home folder from Lilypad's `links.conf`. Its root is `$HOME/Lilypad`; `LILYPAD_ROOT` changes it. The commands are `link`, `check`, `adopt`, `lint`, `sweep` and `pull`. `pull` runs `git pull --ff-only` in Lilystack, then in Lilypad, and reports each result. Lilypad's `bin/lily` is a shim that runs this file.
- **Upgrade order on each Mac:** pull Lilystack first, then Lilypad, then run `~/Lilypad/bin/lily check`. `~/Lilypad/bin/lily pull` does the two pulls in that order, fast-forward only.
- **`mods/status`** is a Claude Code mod. It keeps the `STATUS.md` of a project correct and shows a band above the prompt. It is not a part of the lilystack plugin. It loads only where `CLAUDE_CODE_PLUGIN_DIRS` names it. See [`mods/status/README.md`](mods/status/README.md).

</details>

<details>
<summary>Why Lilystack exists</summary>

gstack has an excellent process, but it needs a runtime that this setup does not accept:

- Bun helper programs at the start of each skill;
- an update check;
- telemetry;
- reviews by a second model;
- a browser.

Other top repositories have the same problem in different forms. They use Node and Python hooks, loops that prompt Claude again, and many agents that run at the same time. Lilystack keeps the questions, the checklists, the rules and the output formats, and writes them again, short.

Its rules protect you, but they do not block good work. There is no telemetry and no update check. A browser, the network and a second model are opt-in, and a change to `settings.json` or `CLAUDE.md` waits for your approval of the exact diff.

More: the design is in [`docs/designs/lilystack.md`](docs/designs/lilystack.md), the rules for work on the repo are in [`AGENTS.md`](AGENTS.md), and the current state is in [`STATUS.md`](STATUS.md).

</details>

<details>
<summary>Layout</summary>

```
.claude-plugin/plugin.json   the manifest (name lilystack)
.claude-plugin/marketplace.json  a one-plugin marketplace, for the fallback install
.claude-plugin/icon.png      the plugin icon
AGENTS.md                    how to work on this repo, and the diet rules
NOTICE.md                    the upstream notices, the pins, one row for each skill
licenses/                    the full license texts that NOTICE.md refers to
skills/<name>/SKILL.md       one folder for each skill; sections/*.md are read on demand
hooks/                       the hook scripts, their rules files and lib-path.sh
agents/lens.md               the read-only lens subagent for review
output-styles/ste.md         the opt-in Simplified Technical English output style
evals/                       trigger, near-miss and quality cases for claude plugin eval
bin/lily                     the Lilypad link tool (it acts on ~/Lilypad)
mods/status/                 the status mod: its own manifest, hooks and tests
tests/                       lint-skills.zsh, test-lint.zsh, test-hooks.zsh, test-lily.zsh
docs/designs/lilystack.md    the design
docs/designs/harvest.md      how the harvest found, chose and licensed the skills
docs/verification-log.md     the dated live checks and dry runs
docs/assets/                 the images in this README and the icon source
STATUS.md                    where the project is
SECURITY.md                  how to report a security problem
```

</details>

## Contributing and security

Read [`AGENTS.md`](AGENTS.md) before a change, and run the five [checks](#checks). To report a security problem, read [`SECURITY.md`](SECURITY.md).

## Credits

Lilystack is MIT. Lilystack rewrote its skills from the upstreams in the table above. Each upstream keeps its own license. [`NOTICE.md`](NOTICE.md) has the notices and the sources of each skill.
