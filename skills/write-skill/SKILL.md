---
name: write-skill
description: Write a new skill or change, test and slim an existing one on Lilystack's diet; use for "write a skill", "add this lesson to the <name> skill" or "put this skill on a diet"
argument-hint: "[skill name or folder]"
---
<!-- Lilystack. Rewritten from gstack write-skill/SKILL.md.tmpl and write-skill/references/diet.md at 466689b, and write-skill/SKILL.md.tmpl at 274fb34 (MIT, Copyright (c) 2026 Garry Tan; diet.md adapts nicobailon/skill-diet at 5f41df1, MIT); and anthropics-skills skills/skill-creator/SKILL.md and skills/skill-creator/agents/grader.md at ca45fc4 (Apache-2.0, Copyright 2026 Anthropic, PBC; changed); and claude-plugins-official plugins/plugin-dev/skills/skill-development/SKILL.md, plugins/plugin-dev/agents/skill-reviewer.md and plugins/hookify/agents/conversation-analyzer.md at a1ecfbc (Apache-2.0, Copyright Anthropic, PBC; changed); and compound-engineering-plugin skills/ce-resolve-pr-feedback/references/evaluation-rubric.md at 173bd33 (MIT, Copyright (c) 2025 Every). -->

# write-skill: skills on Lilystack's diet

Superpowers' writing-skills and mattpocock's writing-for-agents cover general
skill craft; this is Lilystack's own diet. It writes only the skill being
changed, and its `NOTICE.md` row in Lilystack.

## 1. Find the live file

The skill is `$ARGUMENTS`, else ask. Every Lilypad-linked skill is a symlink,
so a copied entry can be a second name for the live file: before editing
anything called a copy, check it is not a link (`test -L`) and its `SKILL.md`
has a different inode (`stat -f %i`). Record the size first: `wc -l` and
`wc -c` of SKILL.md and each `sections/` file.

## 2. Intent

Pull the answers from the conversation first: the tools used, the steps, the
owner's corrections, the input and output seen. Ask only the gaps, one at a
time (AskUserQuestion where the tool exists; otherwise plain text, ending the
turn). Push back twice on a vague answer, then move on. Say the intent back
in five lines and get a yes before writing.

1. What should the skill let Claude do?
2. When should it trigger, and which nearby asks belong to another skill?
3. What does it produce, and where? (In Lilystack, an output diet rule 5 allows.)
4. Rewrite (project, paths, commit, license) or original?
5. Which two or three prompts would show it works?

## 3. Levels

Put each fact on the lowest level that still reaches the agent before it
needs it.

| Level | Holds | Loaded |
|---|---|---|
| description | what and when, one line | every session |
| SKILL.md | what every use needs | every use |
| a `sections/` file | what some uses need, behind a line saying when to read it | that case |
| the tool's `--help` | flags, values, examples | when the agent picks the command |
| the tool's replies, errors, tests | the right name, the fix, the next step | when a guess is wrong |

## 4. Edit ladder

Stop at the first step that handles the change.

1. **Fix it below the skill.** A clearer error, a flag, a check or a test in
   the tool. Prose is for judgment calls.
2. **Earn its place.** Add a skill, step, rule, check or default only with
   evidence it helps (a fresh-session run that went wrong without it) or a
   dated plan to measure it. If a fresh session does it right without the
   line, add nothing.
3. **Edit, don't append.** Change the line that already covers the idea.
4. **Pick its level** (step 3).
5. **Rule, not story.** One positive rule under a short name; the incident
   goes in the commit message.

Keep two or three safety lines inline for each risky area: writes, data
leaving the machine, paid spend. When code renames a thing a skill teaches,
update the skill in the same change.

## 5. Writing rules

- Imperative mood. Explain why a rule matters instead of shouting it: ALWAYS
  or NEVER in capitals is a yellow flag (the tiers CRITICAL, ASK, STOP stay).
- Generalize from a failure; a fix that only covers the test prompt is overfit.
- Cut what the model already knows and what only a human needs (history goes
  in the commit message). Replace a list of cases with the idea behind them.
- **Instruction prose is not code.** Anyone can find a plausible edge case
  against any natural-language rule, and patching each one dilutes it. A case
  the stated condition already decides needs no edit. Fix only a wrong or
  missing condition (goal, done state, safe failure direction), or a rule
  sitting where the agent does not read it when it applies. A second finding
  on a block you already patched: delete the patches and restate the block as
  its goal, done condition and safe direction.
- **Description:** one line, what and when, with the phrases the owner would
  say; no workflow steps. Claude consults a skill only for work it cannot
  easily do alone.

## 6. Test

Write two or three realistic test prompts, each with the outcomes that show
success. The owner runs them in a fresh session and pastes the result back;
for a change, once on the old version first as the baseline. No subagent runs
and no `claude -p`.

**Grade** each outcome PASS or FAIL, quoting the line that proves it. A pass
needs substance, not surface: the file exists and holds the right content.
When unsure it fails; no partial credit. A passing grade on a weak check is
worse than none, because it gives false confidence: name any check a clearly
wrong output would pass, and any outcome no check covers. Read the transcript,
not only the answer; work that every run repeated goes in the tool, once.

**Trigger queries.** Write 8 to 10 should-trigger and 8 to 10 should-not
queries, concrete (paths, context, casual phrasing), never "Format this
data". Should-trigger: varied phrasings, asks that never name the skill, asks
where it should beat a rival skill. Should-not: near-misses that share
keywords but need something else, never plainly unrelated ones. Mark which
the description catches and why, revise it, and let the owner try a few in a
fresh session.

## 7. A repeat gets a barrier

An idea from task-observer (Eoghan Henn). Frustration signals ("don't use X",
"stop doing Y", "why did you do X?", "I didn't ask for that", a reverted
change, the same mistake twice) show a rule that text is not holding. On a
second break, propose a barrier, not firmer wording: a line in
`hooks/careful-patterns.txt`, a check in `tests/lint-skills.zsh`, or a
permission rule for the owner to add. Count it only once it has refused one
real bad command and passed one real good one.

## 8. Caps and moves

- **A cap that only falls.** The cap is the after-value of the skill's last
  `Skill-Size:` line in `git log`, else its current length. Trimming lowers
  it; raising it needs a written reason. The lint's 500 stays the hard stop.
- **A coverage table for moves.** For a merge, or a split with wording
  changed, list each source heading against where it landed (moved, merged,
  left behind, dropped with a reason). Check a verbatim split line by line.

## 9. Lilystack's checks

`zsh tests/lint-skills.zsh` must print `clean`; add `zsh tests/test-lint.zsh`
if the lint changed. Check the rest by hand against `AGENTS.md`: a one-line
description; `argument-hint` where arguments exist;
`disable-model-invocation: true` for the skills that `AGENTS.md` lists;
the provenance comment (Apache-2.0 adds "; changed") and its `NOTICE.md` row;
under 300 lines; questions one at a time; commits ask; every referenced file
exists; no fact in two files.

## 10. Report and record

```
SKILL: <name>  Pass | Needs work | Needs a rewrite
Size: <before>→<after> lines, <before>→<after> bytes
Changed: <file>: <what, one line each>
Tests: <prompt> -> PASS/FAIL (<evidence>)   (or: not yet run)
Triggers: <n>/<m> should, <n>/<m> should-not, as judged
Open: <issue> (Critical/Major/Minor)   (or none)
```

When the owner asks for the commit, its message carries
`Skill-Size: <before>→<after> lines, <before>→<after> bytes (<file>)` per file.
