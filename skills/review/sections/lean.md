<!-- Lilystack. Rewritten from andrej-karpathy-skills CLAUDE.md at 2c60614 (MIT per its README, no copyright holder named); and ponytail skills/ponytail/SKILL.md and skills/ponytail-review/SKILL.md at 96608e0 (MIT, Copyright (c) 2026 DietrichGebert); and gstack review/SKILL.md.tmpl at 466689b (MIT, Copyright (c) 2026 Garry Tan). -->

# The lean scan

Every changed line traces to the request. The request is the plan or spec
that Step 3 found, else the branch's commit subjects and the owner's words.
Read the diff once for lines that do not trace, and once for code that did not
need to exist. Scope drift in Step 3 asks the same question about whole tasks;
this scan asks it about lines.

## Lines that do not trace

- adjacent code, comments or formatting reworded, reformatted or "improved"
  when the request did not touch them;
- a refactor of code that was not broken;
- pre-existing dead code deleted;
- a style that differs from the code around it.

Each is INFORMATIONAL and ASK: the fix is to revert the hunk, and that is the
author's call. Unrelated dead code is mentioned under ADVISORY, never deleted.

Orphans are the exception. An import, variable, function or file that this
change made unused is removed as AUTO-FIX.

## Code that did not need to exist

For each new piece, find the first rung that would have done the job. When the
diff climbed higher, that is a finding.

1. Does it need to exist? A feature, option or flexibility nobody asked for is
   cut.
2. Is it already in this codebase (a helper, component, service or pattern)?
   Use it as the code around it does.
3. Does the standard library or the platform do it? Use that, unless the
   project has its own.
4. Does an installed dependency do it? Use it. A new dependency for a few lines
   is a finding.
5. Can a reader get it at a glance as one line? One line.
6. Otherwise, the minimum code that works.

A 200-line change that could be 50 is a finding. The shortest diff wins only
once it reaches every caller, test and fixture the change must touch, and a
one-liner that needs decoding is not short.

Never cut, and never flag as lean: validation at trust boundaries, error
handling that prevents data loss, security, accessibility, the calibration
real hardware needs, anything the request asked for.

## Finding kinds

- **delete**: dead code, a dead branch, commented-out code, an unused option,
  a speculative feature.
- **reuse**: the repo already has this; name the path.
- **stdlib**: the standard library or the platform already does it, or a new
  dependency stands in for a few lines.
- **yagni**: an abstraction with one implementation, config nobody sets. The
  checklist's "Unrequested mechanism" row says when a mechanism may stay.
- **merge**: near-copies, often copy-pasted blocks, that must change together.
  An extraction follows the shared-code rule in Step 4.
- **split**: one function doing several unrelated jobs, so it is hard to read
  or test. Split by job, never by line count, and never into helpers that exist
  only to make a function shorter.

A generic name that hides what a thing holds is a nit, named under ADVISORY.

No case, no finding. Each lean finding names its case: the unused line, the
helper's path, the standard call, the option no caller sets, the two jobs.
Re-read the lines before you report: the code really is unused, and the helper
really does the same thing.

Lean findings are ADVISORY. Prefer the fix that deletes code. Never propose a
layer, framework or config the problem does not need. Sum the saving in the
report: `Lean: -<N> lines possible`.

## Marked shortcuts

A comment of the form `shortcut: <the limit>, <when to upgrade>` records a
decision. It is not a finding, unless the expected load already crosses the
limit. Find the expected load in the repo (README, deploy config) and say which
load you assumed. An unmarked shortcut with a known limit is ADVISORY: propose
the marker.
