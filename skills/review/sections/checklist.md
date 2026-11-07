<!-- Lilystack. Rewritten from gstack review/checklist.md at 466689b (MIT, Copyright (c) 2026 Garry Tan); and compound-engineering-plugin skills/ce-code-review/references/personas/api-contract-reviewer.md and data-migration-reviewer.md, skills/ce-work/references/implementation-loop.md and skills/ce-resolve-pr-feedback/references/evaluation-rubric.md at 173bd33 (MIT, Copyright (c) 2025 Every); and agent-skills skills/api-and-interface-design/SKILL.md and skills/security-and-hardening/SKILL.md at 301b02b (MIT, Copyright (c) 2025 Addy Osmani); and claude-plugins-official plugins/code-review/commands/code-review.md at a1ecfbc (Apache-2.0, Copyright Anthropic, PBC; changed). -->

# The review checklist

Decide the PR type first. On application and mixed diffs run every category.
On a docs-only, CI/infra or scripts/tooling diff always run Gate Integrity,
Shell Injection, Derived Paths, Public Contract, Completeness Gaps, Prompt
Issues, Distribution, Repo Conventions and Written Standards, and list the
rest once as `Not applicable (PR type: <type>): <categories>`.

## Pass 1: CRITICAL

**SQL and data safety.** String interpolation in SQL, even of numbers; use
parameters. Check-then-set that should be one atomic `UPDATE … WHERE`.
Writes that bypass model validation. Missing eager loading for associations
used in loops. Any path that deletes or overwrites data without a guard.

**Destructive operations on derived paths.** A delete, move or overwrite is
only as safe as the value that names its target, and trust follows who wrote
that value, not how it arrived; a shape check proves form, not permission.
Before the call, require all three: the resolved target (symlinks resolved)
sits under an allowlisted root; it is at least one level below that root; and
ownership evidence (a marker, a manifest, a recorded link) was read before
the operation. On refusal the code stops and names the target; it never falls
back to a broader default path. The adversarial lens's deletion-liveness
check is the other half.

**Races and concurrency.** Read-check-write without a uniqueness constraint
or a retry on duplicate key; find-or-create without a unique index;
status transitions that are not `UPDATE … WHERE old_status = ?`; shared
mutable state across awaits; unsafe HTML rendering of user data.

**Idempotency.** An operation a client, queue or retry can send twice. The
key comes from the intent, not the attempt: a fresh UUID or a timestamp per
attempt makes every retry new, and `user:amount` merges two real charges.
Claim the key atomically; check-then-act is a race, so let a unique
constraint pick the winner. The same key with a different body fails loudly.
An in-flight duplicate gets one deliberate answer: reject (409), a bounded
wait, or pending (202). A timeout is a third outcome, unknown, so record the
intent before the call. Keys live as long as the longest retry chain,
dead-letter replays included.

**Public contract.** A field, endpoint, command, flag, skill name or output
format renamed or removed; a changed response shape, status or exit code;
narrowed input; an error shape unlike its siblings. Hyrum's Law: a field
whose meaning shifts while its type stays (a `count` that stops including
deleted rows), a changed default, a changed sort order. Sentinel overloads: a
new `null`, empty value or fallback enum that reuses an existing value for a
new state, so callers cannot tell "no data" from "data we cannot show". A
widened return type (`string` to `string | null`) with consumers not
updated. CRITICAL when consumers sit outside the repo, above all with no
version bump, deprecation or migration path. Not findings: internal
refactors behind a stable interface, additive optional fields.

**Trust boundaries.** Input at every ingress validated for nil, empty, wrong
type, too long, unicode and injection; auth and tenancy checks on every new
data access, and ids that could be swapped; model-generated values (emails,
URLs, names, structured output) validated before persisting, fetching
(allowlist, or SSRF) or storing in a knowledge base.

**Shell injection.** A subprocess with a shell and interpolated text;
`os.system` with variables; `eval` or `exec` on generated code. Use argument
arrays.

**Enum and value completeness.** A new enum value, status, tier, type
constant, accepted MIME type, extension or flag, or a loosened validator:
read every consumer that switches on, filters by or displays the value, and
every allowlist holding its siblings; the broken code is usually outside the
diff.

**Resource and connection leaks.** Files, sockets, connections, temp files
and child processes opened without a guaranteed close; pool connections used
inside a caller's transaction; unbounded caches, queues or retries.

**Gate integrity.** The scan in the skill: a test removed or disabled, a
snapshot changed without its test, a placeholder committed, environment
sniffing, a suppression pragma, a bypass, a relaxed threshold or timeout, an
exception swallowed, a mock presented as proof, a test that cannot fail. One
question per hunk: does the relaxation silence the failure it was added for,
or is it justified by a measurement visible here? Always ASK.

**Data loss and migrations.** Destructive migrations without a backfill or a
reversible step; locks on big tables; a data repair reachable from startup or
upgrade, or without a preview. Think in the deploy window: old code on the
new schema, new code on old data, a partial failure leaving mixed state.
Expand, migrate, then contract only when nothing reads the old shape. `NOT
NULL` with no default or backfill fails on existing rows. References left
after a drop or rename (jobs, serializers, admin, scheduled tasks). Silent
truncation or precision loss (`text` to `varchar(n)`, float to integer).
Swapped id or enum mappings.

## Pass 2: INFORMATIONAL

**Error handling.** Catch-alls that hide the class; errors logged without
what was attempted and for whom; retries without backoff or a cap; failures
that leave partial state; an error the user never sees.

**Timeouts and retries.** External calls with no timeout; retries that are
not idempotent; a timing bound raised or a retry added to make a flake
pass (route that to `/lilystack:investigate`).

**Secrets.** Credentials in code, logs, error messages, URLs or test
fixtures that ship.

**Empty, null and boundaries.** Nil and empty inputs, zero and negative
sizes, off-by-one at ranges and pagination, the first and last element,
unicode and case in comparisons.

**Async and sync mixing.** Blocking calls (subprocess, file, network, sleep)
inside async code.

**Field names and types.** ORM column names that do not exist return empty
quietly; values crossing language or JSON boundaries change type (8 versus
"8"), which breaks hashes and comparisons.

**Prompt issues.** Zero-indexed lists in prompts; a prompt that lists tools
not wired up; a limit stated in two places. Instruction prose is not code: a
natural-language rule can always be made narrower, so an edge case can be
built against any rule, and patching each one dilutes it. A case the rule's
wording already decides is not a fix; quote the condition that decides it.
Fix only a wrong or missing condition (the goal, the done state, the safe
direction), or a rule placed where the agent will not read it when it
applies. A second round of comments on the same block becomes one class
item: restate the block as its goal, done condition and safe direction, and
check it against every path the earlier patches served.

**Completeness gaps.** A shortcut where the complete version costs under
thirty minutes: partial enum handling, a missing error path, a missing
negative-path test that mirrors the happy path, a feature at 90% when 100%
is modest extra code.

**Unrequested mechanism.** A guard, retry, fallback, validation layer,
option, mode, abstraction or second interface that neither the request nor
the plan asked for. It stays only when an existing contract requires it,
when leaving it out lets harm land before anything notices (traced here, not
imagined), or when adding it later is expensive because it touches stored
data or its format, a public or shared interface, money or security. A
replaced function whose callers are all in the repo has its callers updated
and the old version removed, not kept as a wrapper or alias.

**Time windows.** "Today" assumed to be 24 hours; hourly and daily buckets
mixed for the same data; timezone-naive timestamps.

**Timing-dependent tests.** An assertion on elapsed wall-clock time or a
fixed sleep before an assertion, with no stated reason; keyboard-count loops
in browser tests that encode today's DOM order.

**Dependency changes.** A new dependency's size, maintenance and record;
version pins loosened; lockfile and manifest out of step.

**Views and frontend.** Inline styles re-parsed per render; quadratic
lookups in templates; filtering in code that should be a query.

**Distribution and CI.** Build tool versions, artifact names, secrets as
`${{ secrets.X }}`, a publish workflow for a new artifact and its platforms,
tag format consistency, idempotent publish steps, strict mode and quoting in
scripts CI relies on, third-party actions pinned to a tag or SHA. Do not
flag services with an existing deploy pipeline or internal tools.

**Repo conventions.** A new file in a language or tool the repo does not
use for that job, a script the CI runners cannot run, a second tool doing
an existing tool's job. A finding names its consequence; a style preference
is not one.

**Written standards.** Read `CODING_STANDARDS.md`, `CONTRIBUTING.md`,
`AGENTS.md` and `CLAUDE.md` where they exist (Step 2 collects them). A
convention finding cites the file and quotes the rule. The repo's written
rule wins over this checklist's defaults both ways: it can add a finding and
it can silence one.

## Severity and the fix-first heuristic

CRITICAL: a test would fail, production breaks, or data or secrets are lost.
INFORMATIONAL: everything else that a senior engineer on this team would
change in review. Forced CRITICAL from the sideways sweep: data loss, a
trust-boundary bypass, uncapped spend.

```
AUTO-FIX (mechanical, no discussion)       ASK (human judgment)
  dead code, unused variables                security: auth, injection, XSS
  missing eager loading                      races
  stale comments contradicting code          design decisions
  magic numbers to named constants           fixes over twenty lines
  missing validation of model output         enum completeness
  version or path mismatches                 removing functionality
  variables assigned but never read          anything user-visible
  inline styles, quadratic view lookups      gate integrity (always; four options)
  orphans the change created                 adversarial scenarios, contract breaks
```

Severity words: a **blocker** is the intended case being wrong; a **should**
is a real bug a caller will hit, fixed when it is in the diff and filed when
it is not; a **nit** is style, naming or taste, named in the report and
never a reason for another pass.

## Suppressions: do not flag

Zero findings is a valid outcome. Not findings: harmless redundancy that
aids reading; "add a comment explaining this constant"; an assertion that
could be tighter but already covers the behaviour; consistency-only changes;
regex edge cases the input cannot produce; a test that exercises several
guards at once; eval thresholds as a code-quality comment (gate integrity
still applies); harmless no-ops; anything already addressed in the diff;
"consider error handling" where the caller or framework already owns the
error; "function too long" for an exhaustive switch, a config object, a test
table or generated code; "possible null" where a guard in scope already
narrows it; N+1 on a loop with small fixed cardinality or an already batched
path; hardcoded values in fixtures, examples and docs; non-cryptographic
randomness for jitter, sampling or animation.

Also not findings: a pre-existing issue, except a sibling of a defect class
the diff touches, which the sideways sweep still covers; something that looks
like a bug but is correct; a pedantic nitpick a senior engineer would not
flag; an issue a linter the repo runs will catch (do not run the linter to
check); a rule silenced by an ignore comment that was there before the diff
(a new silencer is still a gate-integrity finding). If you are not sure a
finding is real, do not flag it.
