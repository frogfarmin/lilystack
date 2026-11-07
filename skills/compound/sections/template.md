<!-- Lilystack. Rewritten from compound-engineering-plugin skills/ce-compound/assets/resolution-template.md, skills/ce-compound/references/yaml-schema.md and skills/ce-compound/references/schema.yaml at 173bd33 (MIT, Copyright (c) 2025 Every). -->

# The solution doc

Fill this at Step 5. Keep the fields and the headings in this order. Replace
every `<...>`. Aim for one screen: 40 to 80 lines. The code holds the rest.

```markdown
---
title: <the problem, in the words that someone would search for>
date: <YYYY-MM-DD>
category: <one value>
tags: [<keyword-one>, <keyword-two>, <keyword-three>]
symptoms:
  - <what someone sees first; the exact error text>
root_cause: <one short snake_case value>
components: [<module-or-area>, <module-or-area>]
retire_when: <optional; the outside change that ends this doc, and how to check for it>
---

# <title>

## Problem

<One or two sentences: what broke, and who saw it.>

## Symptoms

- <The error text as it appeared (secrets redacted), the command that showed it, the wrong behaviour.>

## What did not work

- <Each attempt, and the exact reason that it failed, from the output.>

## Solution

<The fix, with `file:line` and a short before and after snippet. The PR number if there is one.>

## Why it works

<The root cause, and why the fix removes it.>

## Prevention

- <The rung: the test or lint rule (path), the standard (file and line), the consolidation as follow-up work, or "none" with the reason. The always-on signal, if one was proposed.>

## Related

- <Other docs in docs/solutions/, issues, PRs, the spec or plan. Relative links.>
```

## The fields

- **title**: name the problem, not the fix. Use the words of the symptom.
- **date**: today, from `date +%F`. An update keeps `date` and adds
  `last_updated: YYYY-MM-DD` below it.
- **category**: one value. Reuse the values that the folder already uses, as
  spelled. With no folder, take one of: `build-error`, `test-failure`,
  `runtime-error`, `performance`, `data`, `security`, `integration`,
  `logic-error`, `config`, `tooling`, `workflow`, `convention`.
- **tags**: three to eight lowercase, hyphenated words that someone will grep
  for: the library, the error class, the command, the feature.
- **symptoms**: one to five items. Each is something a person can observe.
  Put the exact error text in one item when there is error text.
- **root_cause**: the cause, not the area. Reuse the value that the folder's
  docs use for the same cause, wherever those docs are. With no match, use a
  plain value such as `wrong_api`, `config_error`, `concurrency`,
  `async_timing`, `data_integrity`, `missing_validation`,
  `missing_permission`, `test_isolation`, `stale_cache`, `environment_drift`,
  `missing_step` or `logic_error`. Do not make a near-synonym of a value that
  the folder already has.
- **components**: the modules, services or folders involved, with the names
  that the code uses. Reuse the folder's names for the same area.
- **retire_when**: only when the doc is true only while something outside
  the repo is true (an open upstream bug, a tool or platform version). One
  string. Leave the line out otherwise.

## A lesson that is not a bug

A convention, a tool choice or a workflow trap keeps the same headings.
Symptoms lists the friction that started it. What did not work lists the
options that were rejected, and why. Solution states the practice.

## YAML rules

Strict parsers reject or quietly change some unquoted values. Before you show
the draft, make sure of these:

- The opening and the closing delimiters are lines with only `---`.
- A top-level value that contains `: ` or ` #` is in double quotes. Without
  quotes, `: ` can read as a mapping and ` #` cuts the value as a comment.
- An array item that starts with `` ` ``, `[`, `*`, `&`, `!`, `|`, `>`, `%`,
  `@` or `?`, or that contains `: `, is in double quotes.
- `date` and `last_updated` match `YYYY-MM-DD`.

Example:

```yaml
symptoms:
  - "`npm ci` fails: ERESOLVE could not resolve"
```
