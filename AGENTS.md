# How to work on Lilystack

Quick map: [What it is](#what-it-is) · [Rules](#rules) · [Diet rules](#diet-rules-for-every-skill) · [Add a skill from an upstream](#add-a-skill-from-an-upstream) · [Evals](#evals) · [Checks](#checks)

## What it is

Lilystack is a Claude Code plugin. It has these parts:

- **Skills.** Each skill is Markdown only. Most skills are short rewrites of
  the best skills from top Claude repositories on GitHub (gstack and others).
- **Hooks.** Bash scripts in `hooks/`. careful, secrets and secure read a
  plain rules file beside the script.
- **A lens agent** (`agents/lens.md`). It is a read-only subagent for review
  (also when ship runs review). Its tools are Read, Grep and Glob only.
- **An output style** (`output-styles/ste.md`). It is opt-in. It makes Claude
  write in Simplified Technical English.
- **Evals** (`evals/`). They make sure that each skill starts when it must,
  and does not start on a near-miss.
- **The owner's tools.** The `lily` tool (`bin/lily`), the three `lily-*`
  skills that use it, and the status mod (`mods/status`).

Claude Code reads the plugin through `CLAUDE_CODE_PLUGIN_DIRS`, or you install
it from its marketplace (`.claude-plugin/marketplace.json`). The Lilypad repo
holds config only.

Before a structural change, read `docs/designs/lilystack.md`. Before you add
material from an upstream, read `docs/designs/harvest.md`. The README has the
file map.

## Rules

These rules protect the owner. They do not block good work. If a rule stops a
good skill or setup, change the rule in the same pull request and say why.

1. **Prefer Markdown and bash.** A skill is Markdown. A hook is a bash script.
   A part may use another runtime (a TypeScript mod, a Python or Node tool)
   when bash cannot do the job well. Keep that part self-contained, give it
   its own tests, and tell why in `docs/designs/lilystack.md`.
2. **Network only for the task.** A skill may use the network when its task
   needs it: web research, `gh`, an install that the owner asks for, or a
   second opinion. The skill tells what it sends, and to where. No telemetry,
   no update check and no background calls. Hooks stay offline, because they
   run on each tool call.
3. **Browsers and other models are opt-in.** A skill may use a browser tool
   (for example the Playwright MCP or Claude in Chrome) to test a page. A
   skill may ask another model (Codex, Gemini, another Claude) for a second
   opinion when the owner asks for it. Never import or decrypt real browser
   cookies, and never control a logged-in personal session unless the owner
   asks for that session.
4. **Settings and instructions change only after approval.** A skill may
   propose a change to `settings.json`, `CLAUDE.md` or `AGENTS.md`. It applies
   the change only after the owner approves that exact diff.
5. **Commit only when the owner asks.** Do not delete a file. Move it to
   `~/to-delete/`.

## Diet rules for every skill

1. **No shared preamble.** The owner's global CLAUDE.md sets the voice and the
   rules. Each skill is self-contained. Try to keep a SKILL.md shorter than
   300 lines. The lint fails above 500 lines. Use a `sections/` file for a
   phase that the skill reads on demand.
2. **Provenance.** The first line after the frontmatter is the provenance
   comment, on one line. A rewrite uses this form:

   `<!-- Lilystack. Rewritten from <project> <paths> at <commit> (<license>, <copyright>). -->`

   - A skill with more than one source adds `; and <project> <paths> at <commit> (...)`.
   - An Apache-2.0 source adds `; changed` inside its parentheses.
   - A skill that is not a rewrite starts with `<!-- Lilystack. Original. ... -->`.
   - A `sections/` file starts with its own comment on line 1.
   - `NOTICE.md` repeats the sources for each skill. `licenses/` holds the
     full license texts that the notices refer to.
3. **Cut what only serves the upstream:** its helper binaries and state roots,
   its update checks and telemetry, its memory caches, its host rendering and
   its promotion text. Keep a second-opinion step or a browser step only as an
   opt-in (rule 3).
4. **Questions.** Ask one question at a time. Use AskUserQuestion where the
   tool exists. If not, ask in plain text and end the turn. If the owner does
   not agree, give your reason two times at most. Then continue. A skill that
   makes a plan does not start the implementation unless the owner asks. Say
   that a `sections/` file is "in this skill's directory".
5. **Outputs.** Paths are relative to the project root (the git toplevel, else
   the working directory).

   | Skill | Writes |
   |---|---|
   | office-hours | `docs/designs/<topic>.md` |
   | spec | `docs/specs/<slug>.md` |
   | compound | `docs/solutions/<slug>.md`, and a check, a standard or a pointer line, each after the owner says yes |
   | plan reviews and autoplan | The plan or design file that they get, between `<!-- lilystack:<skill>:start -->` and `:end` markers |
   | write-skill | The skill that it gets |
   | context-audit | `CLAUDE.md` or `AGENTS.md`, only the diffs that the owner approves |
   | All other skills | No report file unless the owner asks. They report in chat. A code change follows the rule of the skill |

   Project memory is in the docs of each project (`docs/solutions/` too),
   `CLAUDE.md` and Bear. Global state goes only under `~/.lilystack/`.
6. **Subagents.** Any skill may send read-only subagents for research and
   review lenses. Prefer `lilystack:lens`. Give a subagent the material and
   the rules, not your conclusion. A skill may run other Lilystack skills in
   order (autoplan does this). Each question to the owner still goes one at a
   time, and a skill never decides a User Challenge for the owner. Each agent
   in `agents/` has an explicit `tools` list. The lint makes sure of this.
7. **Frontmatter.** Use `name`, `description` and, where the skill takes
   arguments, `argument-hint`. The description is one line. It tells what the
   skill does and when to use it, so that Claude can suggest the skill. It
   does not list the steps. ship, unfreeze, lily-sweep, second-opinion and each
   skill that registers a hook set `disable-model-invocation: true`. The one
   exception is investigate: its freeze hook does nothing until the owner sets
   a boundary. The lint makes sure of this. A skill that only reports and
   never writes sets `disallowed-tools: Edit, Write, NotebookEdit` (retro). Do
   not use it on a skill that edits after a question in the same turn.
8. **Research** uses the web search tool, the web fetch tool, `gh`, and a
   browser tool when the page needs one.
9. **Ask first.** Ask before any commit, push, pull request or issue, and
   before data goes to another model. The owner commits only on request.

## Add a skill from an upstream

1. Read the upstream files in full, at one fixed commit.
2. Read the license of the repo and of the skill folder.
   - MIT or Apache-2.0: you can rewrite it, with a notice.
   - CC-BY-4.0 or CC-BY-SA-4.0: take ideas only, in your own words.
   - No license file: use the license that the README states (as for
     andrej-karpathy-skills), or take ideas only.
   - Source-available, "all rights reserved", or a rider against a user of
     Lilystack: do not use it. This is the law of the upstream, not a rule of
     Lilystack.
3. Make sure that it does not copy a skill that the owner already runs
   (superpowers and mattpocock's skills). If it does, add a cross-reference
   only.
4. Do a diet rewrite. Keep the questions, checklists, rules and output
   formats. Remove the runtime. Obey the diet rules above.
5. Add the provenance comment, a row in the skills table of `NOTICE.md`, and
   the commit in its pin table.
6. Add the skill to the README and to `docs/designs/harvest.md`. If Claude
   can start the skill, add its two eval cases.
7. Run the checks.

## Evals

`evals/` has a trigger case and a near-miss case for each skill that Claude
can start. Run them yourself; they start real sessions and cost money:

```sh
claude plugin eval . --tag trigger --ablation none --no-publish
```

Give `--no-publish` unless you want the report on claude.ai. Trigger cases
use the graders that need no model (`tool_used`, `regex`). Quality cases may
use `llm` graders. When you add a skill that Claude can start, add its two
trigger cases. `evals/README.md` has the details.

## Checks

```sh
zsh tests/lint-skills.zsh      # every SKILL.md and agent against the rules above; prints clean
zsh tests/test-lint.zsh        # the tests of the lint
zsh tests/test-hooks.zsh       # the hooks
zsh tests/test-lily.zsh        # bin/lily, in a temporary HOME and Lilypad root
claude plugin validate .       # the manifest and the layout
```

After a change to `mods/status`, also run `claude plugin validate .` and
`claude plugin test` in `mods/status`.

Run all five checks before a commit. A root `CLAUDE.md` causes a warning from
`claude plugin validate`. For this reason, this file is `AGENTS.md`.
