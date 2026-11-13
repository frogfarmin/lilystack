# Lilystack: the design

First version: 2026-11-03. Rewritten in Simplified Technical English on
2026-11-06, after the harvest (`harvest.md`). The same day, the owner relaxed
the rules: they protect the owner, but they do not block good work.

## 1. Goal

Lilystack gives Claude Code on the two Macs a set of good, quiet skills:

- The skills are Markdown. The hooks are bash scripts.
- There is no telemetry, no update check and no background network call. A
  skill uses the network only when its task needs it, and it tells what goes
  out.
- A browser tool and a second model are opt-in.
- A change to `settings.json`, `CLAUDE.md` or `AGENTS.md` happens only after
  the owner approves the diff.

The first source was gstack (https://github.com/garrytan/gstack). The harvest
of 2026-11-06 added the best parts of 14 more repositories.

**Success:** on each Mac, every `/lilystack:<skill>` works in any project, and
no skill or hook sends data out that the owner did not expect.

**Non-goals:** other agent hosts, Windows.

## 2. Decisions

| Question | Answer |
|---|---|
| Relation to superpowers | Lilystack stands alone. On 2026-11-12 the techniques that it took from superpowers by reference (plan execution, the test-first discipline, how review is received, proof before a claim, the size triage, landing a branch) came in as diet rewrites; `harvest.md` section 10 lists them. No skill reads the folders of another plugin. |
| Repo shape | A Claude Code plugin repo, `~/Lilystack`, loaded through `CLAUDE_CODE_PLUGIN_DIRS` on the two Macs. |
| Port method | A diet rewrite. Keep the questions, checklists, rules and output formats. Write the prose again, short. Record the source of each skill. |
| Name | `lilystack`. The calls are `/lilystack:<skill>`. |
| Rules | `AGENTS.md` holds the rules and the diet rules. This file does not repeat them. |
| Rules that block good work | On 2026-11-06 the owner removed them: the Apache-2.0 avoidance, "no marketplace", "no second model", "no browser", "no network", "no orchestration" and the 400-line limit. The rules that stay protect the owner: no telemetry, ask before outward actions, never delete, never cookie import. |

## 3. Context

- **Lilypad** is the owner's hub: a small config core (Claude Code, git,
  zsh) that `bin/lily` links into place from `links.conf`, and an `ideas/`
  inbox for ideas, development and fun. Its lint wants a README in each area,
  no file larger than 100 KB, and no untracked files. A folder whose README
  holds `lily:hub` is free from the orphan check, so a new note needs no
  README line (2026-11-07). On 2026-11-06, the owner's builds
  (`bin/lily`, the `lily-*` skills and the status mod) came from Lilypad into
  Lilystack. Lilypad keeps a shim at `bin/lily`.
- **gstack.** The owner installed gstack one time (Lilypad commit `9f4bd04`),
  with its telemetry, update check and outside reviews set to off. The owner
  removed it the next day (`0ac2d60`). Lilystack replaced it.

## 4. Why not gstack as it is

gstack (main at `466689b`, version 1.94.1.0) has about 64 skills and a very
good process. But:

- each skill starts and ends with helper programs that do an update check
  (GitHub) and send telemetry (Supabase);
- 46 skills load the same 255-line preamble;
- outside reviews send diffs and plans to the Codex CLI or the Claude CLI,
  and they are on by default;
- the browser skills control real browser sessions with logins, and one
  skill decrypts real Chrome and Arc cookie databases;
- the runtime is 189 helper programs and 106,000 lines of library on Bun.

Four plain skills under `openclaw/skills/` use no runtime at all. They showed
that a prompt-only port works.

## 5. The repo

```
Lilystack/
  .claude-plugin/plugin.json       the manifest: name, version, description, author, license, repository
  .claude-plugin/marketplace.json  a one-plugin marketplace, for the fallback install
  .claude-plugin/icon.png          the plugin icon (source: docs/assets/icon.svg)
  AGENTS.md                        how to work on this repo, and the diet rules
  README.md                        what is inside, how to start, the checks, the credits
  LICENSE                          MIT, the owner's copyright
  NOTICE.md                        the upstream notices, the pins, one row for each skill
  licenses/                        the full license texts that NOTICE.md refers to
  STATUS.md                        where the project is, in the grammar of the status mod
  skills/<name>/SKILL.md           one folder for each skill; sections/*.md are read on demand
  hooks/                           the hook scripts, their rules files and lib-path.sh
  agents/lens.md                   the read-only lens subagent for review, security-audit and the plan skills
  output-styles/ste.md             the opt-in Simplified Technical English output style
  evals/                           the trigger, near-miss and quality cases for claude plugin eval
  bin/lily                         the Lilypad link tool
  mods/status/                     the status mod: its own manifest, hooks and tests
  mods/verify-gate/                the APPROVED stamp and the merge stop
  mods/outbound-ledger/            the pane of outward actions
  mods/focus/                      one main action, then the tasks after it
  .claude/verify-gate.conf         the checks that verify-gate requires here
  tests/                           the lint, its tests, the hook tests, the lily tests
  docs/designs/                    this file and harvest.md
  docs/verification-log.md         the dated live checks and dry runs
  docs/assets/                     the README images and the icon source
```

The repo is on GitHub under the owner's name. The owner clones it to
`~/Lilystack` on the two Macs.

**How it loads.** There are two ways. Both are supported. Since 2026-11-07
the owner uses the marketplace, because the owner now works in the Claude
desktop app, which does not read zsh files.

- **The variable.** `CLAUDE_CODE_PLUGIN_DIRS="$HOME/Lilystack"` loads the
  plugin as `lilystack@inline` in a session that has the variable. A
  `~/.zshrc.local` (outside Lilypad) can set it, and add the status mod with
  a colon. The variable needs Claude Code 2.1.280 or later.
- **The marketplace.** Lilypad's `Claude/settings.json` names the GitHub
  marketplace in `extraKnownMarketplaces` and enables `lilystack@lilystack`.
  By hand: `claude plugin marketplace add ~/Lilystack`, then
  `claude plugin install lilystack@lilystack`. From GitHub:
  `claude plugin marketplace add shaunjones-gh/lilystack`, then
  `claude plugin install lilystack@lilystack`.
  `.claude-plugin/marketplace.json` makes this possible. It keeps its state in
  `~/.claude/plugins/`, outside Lilypad. It was tested on 2026-11-06 in a
  cloud container: add, install, enable, uninstall and remove all worked.

**What Lilypad records.** Lilypad has no new area. It records three items:

- the marketplace and plugin entries in `Claude/settings.json`;
- a paragraph in `Claude/README.md`;
- one restore step in the top README: clone Lilystack (for `bin/lily`).

**State.** The plugin keeps only `~/.lilystack/freeze/<project-key>` for the
freeze boundary. The mods keep their own state: each mod's README tells what
and where (for example, focus keeps its list in the mod store, and verify-gate
uses a temporary index in `.git/`). There are no analytics and no network calls.

**Upstream.** `NOTICE.md` gives the pin of each upstream. To re-sync, read
each upstream again and compare it with its pin. No script does this.

## 6. The skills

### 6.1 The groups

| Group | Skills |
|---|---|
| Think | office-hours, spec |
| Plan | plan-ceo-review, plan-eng-review, plan-design-review, plan-devex-review, autoplan |
| Build | build |
| Check | review, verify, qa, test-audit |
| Ship | ship, feedback |
| Anytime | investigate, retro, context-audit, write-skill, prose, frontend-design, security-audit, compound, second-opinion |
| Safety | careful, secrets, secure, test-first, freeze, unfreeze, guard |
| Lily tools | lily-check, lily-lint, lily-sweep (with `bin/lily`) |

Wave one is office-hours to retro, and the four safety skills of 2026-11-03.
The owner accepted it on 2026-11-04. The harvest of 2026-11-06 added spec,
qa, test-audit, feedback, context-audit, write-skill, prose, secrets, secure
and test-first. It also made the old skills stronger. After the owner relaxed
the rules the same day, the second harvest added plan-design-review,
plan-devex-review, autoplan, frontend-design, security-audit, compound and
second-opinion, a browser surface for qa, and an apply step for
context-audit. `harvest.md` gives the sources of each part.

### 6.2 Where each skill comes from

`NOTICE.md` has one row for each skill, with the upstream paths. The first
line of each SKILL.md has the same information.

### 6.3 Four ideas from task-observer, for write-skill

task-observer (https://github.com/rebelytics/one-skill-to-rule-them-all, by
Eoghan Henn, CC-BY-4.0) was read on 2026-11-04 at `f867557` (3.9.0). It
records corrections and patterns in each session. A weekly review then
changes them into skill updates. Lilystack does not port it, for three
reasons:

- its core is a log across sessions, which diet rule 5 forbids;
- it needs bash and Python helpers;
- it needs a trigger before the first tool call of each session.

write-skill takes four ideas, in Lilystack's own words:

1. **A repeat gets a barrier, not new words.** If Claude breaks a rule of a
   skill a second time, propose a hook, a lint check or a permission rule. Do
   not make the text stronger. The barrier counts only after it refuses one
   real bad command and lets one real good command pass.
2. **Find the live file before you edit a copy.** Each skill that Lilypad
   links is a symlink. For this reason, a copy can be a second name for the
   live file. Before you edit a file that is called a copy, make sure of two
   facts. The copy is not a link. Its `SKILL.md` has a different inode
   (`stat -f %i`).
3. **A line cap that only decreases.** The cap of a skill starts at its
   current length. A trim lowers the cap in the same change. To raise the cap,
   write a reason. The lint limit of 500 lines stays the hard limit.
4. **A coverage table for moves.** When you merge or split a skill and change
   its words, make a coverage table. For each source heading, write where it
   went: moved, merged, left, or dropped with a reason. Do this before you call
   the move done. If a split keeps the words, you can examine it line by line
   instead.

The plan reviews take a fifth idea. A "later" must name the observation that
can change the decision, and when that observation can arrive. If it cannot,
the "later" is a delay.

Lilystack writes these ideas again in its own words. It copies no text, so the
ideas need no notice. If Lilystack ever adapts the words, `NOTICE.md` gets a
CC-BY-4.0 row with the pin and a change note.

### 6.4 Claude Code features in use

Lilystack uses these features of Claude Code (2.1.318).

| Feature | Where | Why |
|---|---|---|
| Hooks in skill frontmatter | careful, secrets, secure, test-first, freeze, guard | A guard is active only after you call it. Then it is active until the session ends |
| `disable-model-invocation: true` | ship, unfreeze, lily-sweep, second-opinion and each skill with a hook | Only you can start these skills |
| `disallowed-tools` | retro | A skill that only reports cannot edit while it runs |
| Plugin agents with a `tools` list | `agents/lens.md` | The lens can read, but it cannot write or run a command. Each agent declares its tools |
| Plugin output styles | `output-styles/ste.md` | Replies in Simplified Technical English, when you choose it with `/output-style` |
| `claude plugin eval` | `evals/` | Proof that each description starts its skill. Trigger cases use graders that need no model |
| A marketplace | `.claude-plugin/marketplace.json` | A second way to install, from the folder or from GitHub |
| `claude plugin details` | the README | The cost of the plugin in tokens: about 2,100 tokens in each session before a skill starts (`claude plugin details lilystack`) |
| A plugin icon | `.claude-plugin/icon.png` | `claude plugin validate .` passes with no warning |
| Mods (TypeScript hooks modules) | `mods/` | A band, a pane, a model tool or a merge stop needs the mods API. Bash cannot draw in the app. Each mod is self-contained, has its own tests (`claude plugin test`), and makes no network call (rule 1) |
| Marketplace entries for mods | `.claude-plugin/marketplace.json` | The desktop app does not read zsh files, so `CLAUDE_CODE_PLUGIN_DIRS` does not reach it. A marketplace entry with a relative path is read from the clone itself |

Lilystack does not use these features now, by choice and not by rule:

- monitors and workflows, because no skill needs a background process;
- `!` shell commands in a skill, because the command runs before you see the
  skill, and a failure stops the skill;
- `allowed-tools`, because it approves tools in advance. It does not limit
  them.

## 7. The safety hooks

Each safety skill registers its hook in its SKILL.md frontmatter. Claude Code
supports this for plugin skills. After you call the skill, its hook is active
until the session ends. The hook command is
`${CLAUDE_PLUGIN_ROOT}/hooks/<script>`. When the skill loads, Claude Code
replaces `${CLAUDE_PLUGIN_ROOT}` with the plugin folder.

Each hook reads the payload with jq. careful, secrets and secure read a plain
rules file beside the script (`hooks/*-patterns.txt`), so a change to a rule
is a change to one line. freeze and test-first keep their few rules in the
script. `hooks/lib-path.sh` holds the path resolver that freeze, secrets,
secure and test-first share.

| Hook | Tools (matcher) | Answers |
|---|---|---|
| careful | Bash | `deny`, `ask` |
| secrets | Read, Edit, Write, MultiEdit, NotebookEdit, Grep, Bash | `deny`, `ask` |
| secure | Edit, Write, MultiEdit, NotebookEdit | a warning only (`additionalContext`) |
| test-first | Edit, Write, MultiEdit | `ask` |
| freeze | Edit, Write, MultiEdit, NotebookEdit, Bash | `deny` for an edit, `ask` for a Bash write |

**careful** has 45 rules.

- `deny`: a recursive delete of `/`, `~`, `$HOME`, `.`, `..`, `*`, a system
  folder or a home folder (also through `/bin/rm`, `\rm`, a subshell,
  `bash -c` or `ssh`); a force-push to `main` or `master`; a disk erase; a
  write to a raw disk.
- `ask`: other deletes; force-pushes; hard resets and discards; history
  rewrites; SQL drops and an unbounded `DELETE` or `UPDATE`; database resets;
  container, infrastructure and cloud deletes; package publishing; a pipe to a
  shell; `sudo`; a Claude start with permissions bypassed.
- The reason for `rm` says to move the target to `~/to-delete/`.

**secrets** denies reads and copies of private keys and credential stores. It
examines each path three times: as given, as an absolute path, and with
symlinks resolved. It asks before `.env` files, environment dumps, reads from a
secret manager, and a key or a token in new text.

**secure** warns when new text adds a dangerous sink, for example `eval`,
`shell=True`, unsafe deserialisation or TLS off. A sink that was already in
the old text gives no warning.

**test-first** asks before an edit of a source file when no test file has
changed in the working tree.

**freeze** keeps the boundary in `~/.lilystack/freeze/<project-key>`. The key
is a hash of the git toplevel (else the `cwd`) when you set it. The hook finds
the boundary from the nearest folder at or above the `cwd` that has one, else
at or above the folder of the target (or of each path that a Bash command
writes). So a change of `cwd` does not lose the boundary. No boundary file
means allow, and with no freeze folder at all the hook stops at once. It
denies an edit outside the boundary. It asks when a Bash command writes
outside the boundary: redirects, `tee`, `sed -i`, `perl -i`, `cp`, `mv`,
`install`, `ln`, `dd of=`, `find -exec`, `touch`, `mkdir`, `rm`, `truncate`,
`rsync`, `curl -o`, `wget -O`, `tar -x`/`-C`, `unzip -d`, and the same writes
inside `bash -c "…"` and `eval`.

- `/lilystack:unfreeze` removes the boundary file. The registered hook then
  does nothing.
- `/lilystack:guard` starts careful, secrets, secure and freeze, and asks for
  the directory.
- **Fail closed.** The script stops the tool call (exit 2) if jq is missing,
  the payload does not parse, or the rules file is missing. It prints one line
  that names the fix.
- These hooks are guardrails, not a security boundary. They match text, so a
  hook cannot see a command that a script makes at run time. Claude Code's
  permission rules are the stronger layer.

## 8. Tests

The tests run local, and in CI since the repo became public (2026-11-07).
`.github/workflows/checks.yml` runs the four zsh checks on each push to
`main` and each pull request. It has a read-only token, no secrets and no
`pull_request_target`, and it pins each action to a commit (Dependabot keeps
the pins current). The reason: a stranger's pull request that weakens a hook
must fail before the owner reads it. `claude plugin validate .` stays local,
because CI would need the Claude Code CLI and an account.

- `claude plugin validate .` passes on the two Macs.
- `tests/lint-skills.zsh` makes sure that each `skills/*/SKILL.md` has:
  - frontmatter with `name` and `description`;
  - `disable-model-invocation: true` where the rules need it;
  - the provenance comment;
  - no `gstack-` or `GSTACK_` token and no gstack skills path;
  - 500 lines or fewer;
  - a real file for each `sections/` reference.

  The lint also makes sure that each agent in `agents/` declares its `tools`.
- `tests/test-lint.zsh` tests the lint itself.
- `tests/test-hooks.zsh` gives prepared payloads to each hook. For each rule,
  it makes sure of the answer: deny, ask, warn or allow. It also tests path
  tricks and a run without jq.
- `tests/test-lily.zsh` tests `bin/lily` in a temporary HOME and Lilypad root.

## 9. Failure modes

| Failure | Answer |
|---|---|
| jq is missing | The hooks fail closed and name `brew install jq`. |
| Claude Code starts outside a shell, so the variable is missing | The plugin does not load. The README tells how to examine it (`/plugin` shows `lilystack@inline`) and names the fallback. |
| A plan review cannot find the plan file | It asks for the path. It never guesses. |
| A safety skill is copied outside the plugin | `${CLAUDE_PLUGIN_ROOT}` has no value, so Claude Code cannot find the hook command (exit 127). Claude Code blocks only on exit 2, so the tool call continues and the hook fails open. Do not copy a safety skill out of the plugin. |
| Two sessions in the same repo freeze different directories | They share one boundary file. The later freeze wins, with no warning. This is accepted for one user. |
| A commit message contains a destructive string | careful can stop the command. Write the message to a file and use `git commit -F`. |

## 10. Licenses

Lilystack is MIT, under the owner's copyright. Each upstream keeps its own
license:

- gstack and the other MIT sources: `NOTICE.md` keeps each copyright line and
  pin.
- Apache-2.0 sources (Anthropic's plugins and skills): the rewrite has a
  change note, and the full text is in `licenses/Apache-2.0.txt`.
- CC-BY-SA-4.0 (Trail of Bits) and CC-BY-4.0 (task-observer): ideas only, in
  Lilystack's own words, with a credit in the prose.
- impeccable (Apache-2.0) and Elaya (MIT) reach plan-design-review through
  gstack's design rules. They are credited as gstack credits them.
- A license that forbids use by or for Anthropic (destructive_command_guard):
  nothing. This is the law of that upstream, not a rule of Lilystack.
- plan-eng-review's red flags and investigate's blast radius credit pstack,
  as gstack credits them.

`harvest.md` section 6 gives the full license rules.

## 11. To examine by test, not by the docs

- `CLAUDE_CODE_PLUGIN_DIRS` on the Claude Code of the second Mac (2.1.316).
- The hooks on a real Mac. Examined: on 2026-11-06 all hook tests passed
  under bash 3.2.57 built from Apple's source on Linux, and on 2026-11-10 all
  627 passed under macOS `/bin/bash` 3.2 (`verification-log.md`).
- A symlink `~/.claude/skills/lilystack` as a skills-folder plugin, only if
  the variable does not work. The docs say that Claude Code rejects symlinks
  outside a plugin.
