---
name: retro
description: A retrospective over a git window: what shipped, test health, hotspots, patterns, shortcut debt, three insights and three habits
argument-hint: "[window, default 7d]"
disallowed-tools: Edit, Write, NotebookEdit
---
<!-- Lilystack. Rewritten from gstack retro/SKILL.md.tmpl, retro/sections/report-format.md.tmpl and openclaw/skills/gstack-openclaw-retro/SKILL.md at 466689b (MIT, Copyright (c) 2026 Garry Tan); and compound-engineering-plugin skills/ce-compound/references/form.md at 173bd33 (MIT, Copyright (c) 2025 Every); and ponytail skills/ponytail-debt/SKILL.md at 96608e0 (MIT, Copyright (c) 2026 DietrichGebert). -->

# Retro

A retrospective on the current repo over a time window: what shipped, how the
tests fared, where the work clustered, and what to change next. It reads git
and reports in chat. It writes nothing.

## Arguments

The text after the command is the window: `7d` (default), `14d`, `30d`, or `--since <date>`.
Project mode only: the repo at `git rev-parse --show-toplevel`. If the working
directory is not in a git repo, say so and stop. There is no global or
multi-repo mode.

Day windows start at local midnight: for `7d` on 2026-03-18, use
`--since="2026-03-11T00:00:00"`. Report all times in local time; never set `TZ`.
Call the result `<window>` below.

## Step 1: gather

Run these, all read-only. Use the current branch (`HEAD`), not a fetched ref.

```sh
git log --since=<window> --no-merges --format='C|%H|%aN|%at|%ai|%s' --numstat
git shortlog -sn --no-merges --since=<window> HEAD
git log --since=<window> --no-merges --format= --name-only | grep -v '^$' | sort | uniq -c | sort -rn | head -20
git log --since=<window> --no-merges --format='%at|%ai' | sort -n
git log --since=<window> --no-merges --format=%ad --date=format:%Y-%m-%d | sort -u
git ls-files | grep -E '(test|spec|__tests__|tests/)' | wc -l
git grep -nE '(#|//|/[*]) ?shortcut:'
```

The last command finds deliberate shortcuts marked in the form
`shortcut: <the limit>, <when to upgrade>`, across the whole tree at HEAD,
not only the window.

Test files touched are the paths in the numstat that match `test`, `spec`,
`__tests__` or `tests/`. For tests added or removed, compare the lines added
and deleted in those files. For skipped tests, grep the added lines of the
window's diff of those files for `skip`, `xit`, `xdescribe`, `.only`,
`@pytest.mark.skip`, `t.Skip`, `#[ignore]`.

If there are fewer than three commits, stop after this step (see Rules).

## Step 2: compute

Only from the output above. A figure not computed is left out.

- **Totals**: commits, lines added, lines removed, net, files touched.
- **Commit types** by conventional prefix (`feat`, `fix`, `docs`, `refactor`,
  `test`, `chore`), else the first word of the subject mapped to the nearest
  type, else `other`. Flag a fix share above 50%: a ship-fast, fix-fast
  pattern that may mean a review gap.
- **Test health**: test files touched against source files touched, tests
  added or removed, skipped tests introduced.
- **Hotspots**: the five most-touched files. Flag any touched five or more
  times as churn. Say whether each is source or test.
- **Time**: commits per hour bucket (a histogram) and per weekday, from the
  author dates. Note the peak, the dead zones, and work after 22:00.
- **Sessions**: sort commits by time; commits within 2 hours of each other
  form one session. Count sessions, and give the longest and the average
  span. A lone commit is a micro session.
- **Focus score**: the share of commits that touch the top three directories
  (top-level, or the first two path parts in a flat repo). High means deep
  work; low means scattered context-switching.
- **Ship of the week**: the commit, or run of commits, with the biggest
  user-facing effect, judged from messages and paths rather than line count
  alone. Name the hash and say why it matters.
- **Streak**: consecutive days with at least one commit, counting back from
  the most recent commit day. Say if today has none.
- **Week over week**, only when the window is 14d or more: split into
  7-day buckets and show commits, lines and fix share per bucket.
- **Authors**, only when `git shortlog` lists more than one: commits and
  lines per author, and each person's top area. A single-author repo never
  mentions authors at all.
- **Debt ledger**: one row per `shortcut:` marker, grouped by file:
  `<file>:<line>, <what was simplified>. ceiling: <limit>. upgrade: <trigger>.`
  Take the limit and the trigger from the comment. Tag a marker that names no
  upgrade trigger `no-trigger`: those are the ones that rot. Skip a hit that
  is not a deferral (a note about a keyboard shortcut).

## Step 3: the report

Write it in chat in this shape, under 70 lines. Open with one summary line.

```
Retro: <start> to <end> (<window>)
<N> commits, +<A>/-<D> across <F> files, <S> sessions, streak <K>d

## Shipped
<2-5 bullets grouping the commits by theme, each anchored in a hash or
path; then the commit-type mix as a short bar chart>

## Test health
<test files touched vs source files touched; tests added or removed;
skipped tests introduced; flag if tests touched are under 20% of source>

## Patterns
<hotspots (top five, with counts); hour and weekday distribution; sessions;
focus score; streak; week over week if computed; authors if more than one>

## Ship of the week
<hash, what it did, why it matters>

## Debt ledger
<no-trigger rows first, then the rest, up to ten rows, then a count of
the others by file; end with "<N> markers, <M> with no trigger.", or
"No shortcut debt." when there are none>

## 3 insights
<three observations the numbers support, each naming the evidence>

## 3 habits
<three concrete, small habits for the next window, each naming a file,
script or check>
```

Insights say what the data shows and what it suggests; they are not praise.
Name what was good when it was good, by commit. Habits are not generic: "run
the suite before touching `src/db.ts` again" beats "write more tests".

Prefer a check over advice. For a pattern the window shows (a fix that
returns, a churn hotspot), take the first rung that holds: one owner and one
way, when two ways to do one task caused it; a check the repo can run (a
test, a lint rule through tooling it already has), saying where it would run
and what it would catch; one condition for an existing `CODING_STANDARDS.md`,
never a new one; advice only where none of these can hold it. A habit is a
proposal: retro writes nothing. A lesson worth keeping goes through
`/lilystack:compound`.

## Rules

- Read-only. Retro never commits, writes, edits or creates a file; the debt
  ledger and the habits are in chat only.
- No history is saved or compared; each retro stands alone. Do not look for
  earlier retros.
- Numbers come from the commands run. Never estimate a missing figure; omit it.
- An empty or tiny window is said plainly. With fewer than three commits, give
  a short note (commit count, the one or two subjects, a suggestion to widen
  the window such as `30d`), not the report.
- No network, no fetch. Work from the local history as it stands.
- Questions, if any are needed, one at a time: AskUserQuestion where it
  exists, plain text otherwise, ending the turn.
