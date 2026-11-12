# Evals: does each skill start when it must?

This folder holds an eval suite for `claude plugin eval` (Claude Code 2.1.269
or later). For each skill that Claude can start by itself, there are two
trigger cases:

| Folder | Case | It passes when |
|---|---|---|
| `triggers/<skill>-fires/` | A request that the skill is for | Claude calls the Skill tool with `lilystack:<skill>` |
| `near-misses/<skill>-near-miss/` | A request that only shares the words of the skill | Claude does not call that skill |

`quality/` holds cases that examine the output of a skill, for example that
`prose --ste` keeps every fact. They use `regex` graders and one `llm` grader.

A weak `description` is the usual cause of a failure. Repair the description
first. `/lilystack:write-skill` tells how.

## Run it

Run it yourself, from the repo root, in a terminal:

```sh
claude plugin eval . --tag trigger --ablation none --no-publish
```

- `--no-publish` keeps the HTML report on your machine. Without it, the eval
  tool can publish the report to claude.ai.
- `--ablation none` runs only the arm with the plugin. A Skill grader cannot
  pass in an arm without the plugin.
- Add `--runs 1 -j 4` for a fast, cheap run. Add `--case 'review-*'` for one
  skill. Use `--tag quality` for the quality cases.
- The results go to `evals/results/`, which git ignores.

## Rules for this folder

- Trigger cases use only the graders that need no model (`tool_used`). They
  are cheap and exact.
- A quality case may use an `llm` grader. It calls a judge model (Haiku by
  default, or `--judge-model`). Put a `regex` grader beside it where a fact
  can be matched exactly.
- Each run starts a real Claude session with your credentials. It costs money
  and it uses the network. For this reason, it is not one of the five checks
  in `AGENTS.md`, and no skill or hook starts it.
- A near-miss grader needs `arm: both`. Without it, the grader does not count
  in a run with two arms.
- The ten skills that set `disable-model-invocation: true` have no trigger
  cases: the seven safety skills, ship, lily-sweep and second-opinion. Claude
  cannot start them by itself.

## Last full run

2026-11-12, Claude Code 2.1.322, `--runs 1 -j 4`, all tags: 48 of 48 cases
passed, in 130 seconds, for $2.63. The run includes the two `build` cases and
the quality case.

The run before it (2026-11-06, Claude Code 2.1.318, `--runs 1`) passed 45 of
46 cases, in 120 seconds, for $2.46. The quality case failed, and it found a
real fault: with `--ste`, prose added an actor ("we") that the source did not
name. After the repair to prose, the quality case passed 2 of 2 runs ($0.15).

The command above runs each case two times, so it costs about two times as
much.
