<!-- Lilystack. Rewritten from gstack plan-devex-review/sections/review-sections.md.tmpl, plan-devex-review/sections/checklist.md.tmpl, plan-devex-review/dx-hall-of-fame.md and scripts/resolvers/dx.ts at 466689b (MIT, Copyright (c) 2026 Garry Tan). -->

# The eight passes

Run them in order, after Step 0. Continue the working ledger from Step 0: a
new pass does not reset an approval, and you cite an earlier answer instead of
asking again. A finding from one pass that another pass owns stays where it
belongs; do not ask it twice.

## The rating method

For each pass:

1. Recall the Step 0 evidence: the persona, the clock and the target, the
   vehicle, the friction trace, the confusion log.
2. Read the pass's entry in `sections/hall-of-fame.md` in this skill's
   directory.
3. Rate 0 to 10 on the scale below. Say the evidenced gap, and what a 10
   means for this product.
4. Run the decision gate on each gap. Record routine work; ask only the new or
   reopened choices, one at a time.
5. Record the approved changes, then rate the amended plan again. Keep the
   remaining risks visible.

| Score | Means |
|---|---|
| 9-10 | Best in class; developers recommend it |
| 7-8 | Good; usable without frustration; minor gaps |
| 5-6 | Works with friction; developers tolerate it |
| 3-4 | Poor; developers complain; adoption suffers |
| 1-2 | Broken; developers leave after the first try |
| 0 | Not addressed |

"Fix to 10" means: resolve the evidenced gaps inside the scope through the
decision gate, and keep an honest remaining score. Never add scope only to
earn a 10.

- **DX EXPANSION** also proposes what would make the dimension best in class
  for the persona, each proposal as its own opt-in question.
- **DX POLISH** examines every touchpoint inside the accepted scope and
  contracts, and traces each issue to evidence.
- **DX TRIAGE** flags the blockers (below 5) and every CAP4 finding, and
  skips the nice-to-haves (5 to 7).

Each pass ends with its findings, its before and after scores, and one
question when a decision is pending. Recommend, say why, and name the persona.

## Pass 1. Getting started (zero friction)

Rate: can the persona go from zero to hello world inside the 0C target?

- **Install**: one command or one click? Are the prerequisites checked, or at
  least named?
- **First run**: does the first command print visible, meaningful output?
- **Try first**: a sandbox, a playground or a dry run before the install?
- **Cost of entry**: no credit card, no sales call, no company email?
- **Quick start**: complete when pasted? Does it show the real output?
- **Credentials**: how many steps from "I want to try" to "it works"?
- **Magical moment**: is the 0D vehicle in the plan?
- **Gap**: how far is the current time from the 0C target?

Fix to 10: write the ideal getting-started sequence, with exact commands, the
expected output and a time budget for each step. Three steps or fewer, inside
the target.

The test: can the persona go from "never heard of it" to "it worked" in one
terminal session, without leaving the terminal?

## Pass 2. API, CLI and SDK design (usable, useful)

Rate: is the interface intuitive, consistent and complete? Does it match the
persona's mental model? A founder expects `tool.do(thing)`; a platform
engineer expects `tool.configure(options).run(thing)`.

- **Naming**: guessable without docs; one grammar across the surface.
- **Defaults**: each parameter has a sensible one; the simplest call gives a
  useful result.
- **Consistency**: the same patterns everywhere.
- **Completeness**: or do developers drop to raw HTTP or a shell for the edge
  cases?
- **Discoverability**: can a developer explore it from the CLI or the help,
  without the docs?
- **Reliability and trust**: latency, retries, rate limits, idempotency,
  behaviour when offline.
- **Progressive disclosure**: the simple case is ready for production, and
  complexity comes gradually, on the same API.
- **Persona fit**: does it match how the persona thinks about the problem?
- **Agent ergonomics** (record with evidence; no separate score):
  non-interactive by default, structured output (`--json`), layered `--help`,
  plain output when piped.

The test: can the persona use it correctly after one example?

## Pass 3. Errors and debugging (agent-ready)

Rate: when something fails, can the reader (often an agent that runs
unattended) tell what happened, recover safely and debug it without reading
the source? The 0A persona is one lens; the agent reader is always the second.

Recall the error friction from 0F and the confusion points from 0G. Read
`sections/errors.md` in this skill's directory before you score, and use its
contract, failure classes, surfaces and caps.

Trace three specific error paths plus one unexpected-failure path (a crash, a
dependency failure) from the plan or the code. If the plan names no handling
for unexpected failures, that absence is the trace gap. Write one matrix, with
prose only for the failures:

```
ERROR PATH MATRIX
Path    | Class | what | fix  | recovery | code | context | trace | redaction | channel | Cap
<path>  | usage | pass | fail | N/A      | pass | N/A     | N/A   | pass      | pass    | CAP6:fix
```

For each capped path, show what an agent sees today and the corrected error
line. Also note the permission and safety model (what can go wrong, and how
clear the blast radius is) and whether a verbose or debug mode exists.

DX TRIAGE reports only the gaps that set a cap, and always every CAP4.

## Pass 4. Documentation (findable, learn by doing)

Rate: can the developer find what they need, and learn by doing? Does the
shape of the docs match the persona? A founder needs copy-paste examples
first; a platform engineer needs the architecture and the reference.

- **Information architecture**: found in under 2 minutes?
- **Progressive disclosure**: beginners see the simple path; experts find the
  advanced one.
- **Examples**: complete when pasted, run as they are, in a real context.
- **Interactive parts**: a playground, a sandbox, a "try it", a `--dry-run`.
- **Versions**: do the docs match the version that the developer runs?
- **Tutorial and reference**: do both exist?
- **Docs ship with the feature**: is the doc work in the plan, or left for later?

## Pass 5. Upgrade and migration (credible)

Rate: can developers upgrade without fear?

- **Backward compatibility**: what breaks, and how far does it reach?
- **Deprecation warnings**: early and actionable ("use newMethod() instead").
- **Migration guides**: step by step, for each breaking change.
- **Codemods**: a script that does the migration.
- **Versioning**: semantic versions, a stated policy, a changelog.

## Pass 6. Environment and tooling (valuable, accessible)

Rate: does it fit the developer's existing workflow? Does local setup work in
the persona's usual environment?

- **Editor**: a language server, completion, inline docs.
- **CI**: GitHub Actions, GitLab CI; a non-interactive mode.
- **Types**: shipped with the package; good completion.
- **Testing**: easy to mock; test helpers and fixtures.
- **Local loop**: watch mode, hot reload, fast feedback.
- **Platforms**: macOS, Linux, Windows; containers; ARM and x86.
- **Reproducibility**: across operating systems, package managers, containers
  and proxies.
- **Observability**: a dry run, verbose output, sample apps.

## Pass 7. Community and ecosystem (findable, desirable)

Rate: is there a community, and does the plan invest in the ecosystem?

- **Open source**: is the code open, with a permissive license?
- **Channels**: where do developers ask, and who answers?
- **Examples**: real and runnable, beyond hello world.
- **Extensions**: can developers extend it (plugins, hooks)?
- **Contributing guide**: is the process clear?
- **Pricing**: no surprise bills.

For a tool with one user, most lines are N/A: give the reason in one line,
and check only the examples and the extension points.

## Pass 8. Measurement and feedback (implement, refine)

Rate: does the plan include ways to measure and improve the DX over time?

- **Time to hello world**: can it be measured? How?
- **Journey**: where do developers drop off?
- **Feedback**: bug reports, a feedback channel.
- **Friction audits**: is a check planned after release?
- **Boomerang**: after the build, can a re-run measure reality against this
  plan's target?

Measure the 0C clock up to the 0D result, from the full documented start; not
a warm rerun and not a different endpoint. Prefer the simplest method that
measures the target, and prefer one that sends nothing (a timed run from a
clean container) over telemetry. A target tier does not approve telemetry, an
automatic release gate or a recurring human process. Each is its own
decision, with its owner and frequency, asked only when you propose it.

## Claude Code skill and plugin checklist

Only when the product type is a Claude Code skill or plugin. This is not a
scored pass. For each line that fails, say what is missing and the fix; ask
one question for each line that needs a design decision.

- [ ] **Questions**: one issue per AskUserQuestion call; each question names
  the project, the branch and the task again; a plain-text fallback that ends
  the turn.
- [ ] **Triggering**: a one-line description that says what the skill does
  and when to use it; a near-miss request does not start it; an eval case
  proves both.
- [ ] **Bounded autonomy**: clear limits; a stop and an explicit yes before a
  destructive or outward action (delete, commit, push, send); a skill with
  side effects starts only when the user calls it.
- [ ] **Agent-readable errors**: every error meets the contract in
  `sections/errors.md` in this skill's directory: a safe fix, a recovery
  class, a code, context, and a result line with a status.
- [ ] **Error recovery**: resumes after a failure; keeps partial results; safe
  to run again.
- [ ] **State**: names every file it writes and where; global state lives
  under one documented root; no hidden caches.
- [ ] **Consent**: asks before each risky action; a consent is scoped and can
  be taken back; settings and instruction files change only after the user
  approves the exact diff.
- [ ] **Network**: says what it sends and to where; no telemetry, no update
  check, no background call.
- [ ] **Composition**: names what it reads from earlier skills (a plan, a
  design) and what it hands to the next one; it suggests the next skill and
  does not start it by surprise.
- [ ] **Continuity**: the plan and the progress live on disk, so a compact or
  a new session can resume.
- [ ] **Hooks**, if any: fast and offline, because they run on each tool
  call; a block says why and names the fix.

# Required outputs

The block between the markers holds, in this order:

1. **Mode and decisions**: the mode, then the ledger (id, question, answer,
   scope) for every question asked.
2. **Developer persona**: the 0A card.
3. **Developer perspective**: the 0B narrative, with the owner's corrections.
4. **Time to hello world**: the clock, the current estimate and the target;
   the benchmark table if one ran, with this product's time after the review.
5. **Magical moment**: the chosen vehicle, and what the implementation must do
   to deliver it.
6. **Developer journey map**: from 0F, with the resolution of each friction
   point.
7. **First-time developer report**: from 0G, each point marked addressed,
   deferred or open.
8. **Error path matrix**: from Pass 3, with the corrected error lines.
9. **Claude Code checklist**: the results, or `SKIPPED (not a Claude Code
   skill or plugin)`.
10. **What already exists**: docs, examples, error handling and DX patterns
    that the plan should reuse.
11. **NOT in scope**: the DX improvements considered and not taken, each with
    the answer and a one-line reason; the out-of-scope opportunities from DX
    POLISH in their own list.
12. **Deferred items**: for each, what, the developer pain it causes, the
    effort (S, M, L, XL), where to start, and what would reopen it: the
    observation that would change the decision, and when it could arrive. A
    "later" that can name neither is avoidance; decide now or list it as
    unresolved.
13. **DX implementation checklist**.
14. **Unresolved decisions**: each question with no answer. Never a silent
    default.
15. **DX scorecard**, which is also printed in the reply.

```
DX PLAN REVIEW: SCORECARD
Product type        <type>
Persona             <who>
Mode                <EXPANSION | POLISH | TRIAGE>
TTHW                <current> min, target <tier> (<n> min)
Magical moment      <designed | missing> through <vehicle>
                    before   after
1 Getting started   <n>/10   <n>/10
2 API/CLI/SDK       <n>/10   <n>/10
3 Errors            <n>/10   <n>/10   <n> paths, <n> CAP4, <n> CAP6
4 Documentation     <n>/10   <n>/10
5 Upgrade path      <n>/10   <n>/10
6 Environment       <n>/10   <n>/10
7 Community         <n>/10   <n>/10
8 Measurement       <n>/10   <n>/10
Overall             <n>/10   <n>/10   (a judgement, not a mean; name the limit)
Principles          covered or gap: zero friction, learn by doing, fight
                    uncertainty, defaults and escape hatches, code in
                    context, magical moment, agents as users
Skill checklist     <n> gaps, or SKIPPED
NOT in scope        <n> items
Unresolved          <n>
Status              DONE | DONE_WITH_CONCERNS | BLOCKED
```

Verdict lines under the scorecard: every pass at 8 or more, "The DX plan is
solid." Any pass below 6: flag it as critical DX debt, with its effect on
adoption. Time to hello world over 10 minutes: a blocking issue.

The implementation checklist keeps only the lines that apply; mark the rest
N/A:

```
DX IMPLEMENTATION CHECKLIST
[ ] Time to hello world under <target from 0C>
[ ] Install is one command
[ ] The first run prints meaningful output
[ ] The magical moment arrives through <vehicle from 0D>
[ ] Every error meets the agent-ready contract (Pass 3)
[ ] Names are guessable without docs
[ ] Every parameter has a sensible default
[ ] Doc examples run as pasted
[ ] Examples show real use, not only hello world
[ ] The upgrade path has a migration guide
[ ] Breaking changes get a deprecation warning and a migration script
[ ] Types ship with the package
[ ] Works in CI with no special setup
[ ] Free to try, with no credit card
[ ] A changelog exists and is kept up to date
[ ] The docs have search
[ ] A community channel exists, and someone answers it
```
