<!-- Lilystack. Rewritten from gstack cso/SKILL.md.tmpl (Phase 12) and scripts/resolvers/sideways.ts (as rendered in cso/SKILL.md) at 466689b (MIT, Copyright (c) 2026 Garry Tan). The false-positive gate, the exact-match-first sweep and the severity ladder are ideas from Trail of Bits' skills, in Lilystack's own words. -->

# The gate

Read from Step 5 of the skill. A challenger gets this file too. Every
candidate goes through it before it is reported.

## No blanket exclusions

A pre-landing review can set some classes aside to stay fast. An audit does
not. Judge each candidate on who controls the input and what they get. None
of these is excluded by its type:

- development dependencies, because they run with CI and publishing
  credentials;
- availability and cost attacks: a crash loop, an unbounded query, paid work
  that an attacker can start;
- secrets that are old, removed from the tree, or said to be rotated;
- prompt injection through a user message (the role neither proves nor
  excludes it);
- environment variables and CLI arguments, which a workflow, a job runner or a
  wrapper can fill from untrusted data;
- the repo's own skills, hooks and tooling, Lilystack's included;
- tests, fixtures and examples, when they run in CI with secrets or ship in
  the package.

Also: a UUID is not authorization. A URL path that a user controls can cross a
boundary. A framework escape hatch (`|safe`, raw SQL,
`dangerouslySetInnerHTML`) turns off a safe default. Missing hardening alone
(a header, a rate limit, a pin) needs a concrete failure scenario before it is
a finding. Without one, it is a hardening note.

## Three judgments, kept apart

- **Severity**: the impact and the attacker's realistic preconditions in this
  application. A pattern or a CVSS number alone does not set it.
- **Exploitability**: `proven` (walked in code from an entrypoint that an
  attacker controls to the impact, each control on the path checked, or a
  test shows it); `likely` (each step shown, with one named assumption open,
  such as a deploy setting that the repo does not hold); `unproven` (a
  hypothesis).
- **Confidence**, from 1 to 10: how well the evidence supports this exact
  claim. The number sums up the evidence; it never replaces it.

| Score | Means |
|---|---|
| 9-10 | proven: the path is walked end to end, or a test shows it |
| 7-8 | likely: each step shown, one named assumption open |
| 5-6 | the input and the sink exist, but a gap in the path is still open: a hypothesis |
| 1-4 | it fails a second read: drop it, and count it as refuted |

A **supported finding** scores 7 or more and has all four parts: an
entrypoint that an attacker controls, a crossing of a trust boundary, an
impact inside the scope, and the controls on the path checked and shown to
fail. A 5-6 candidate goes to the hypotheses list, labeled, with the evidence
that would settle it. Never mix the two lists.

## Severity

Find the impact row, then the precondition column. Use the cell that the
evidence supports, not the worst one that you can imagine.

| Impact | None, any account, or the default config | A common config, or one realistic step (a click, a second account) | An unusual config, a privileged attacker, or deliberate misuse |
|---|---|---|---|
| Severe: code execution, auth bypass, cross-tenant or bulk data access, a live secret, money or ownership moved, the release path taken | critical | high | medium |
| Moderate: one user's or one object's data, stored XSS, limited integrity loss | high | medium | low |
| Minor: information that helps a later attack, one request crashed | medium | low | a hardening note |

The columns follow the sharp-edges ladder: insecure by default ranks above an
easy misconfiguration, which ranks above an unusual one, which ranks above
deliberate misuse. A chain takes the severity of its end, with the
precondition of its hardest step.

## The false-positive gate

Treat each candidate as refuted until the evidence holds. Expect your own
lean toward seeing bugs and rating them too high.

1. **Restate it** as claim, root cause, trigger, impact and threat model (who
   the attacker is, and what they already have). Drop what you cannot restate
   that precisely.
2. **Trace back from the sink** to the entrypoint, through each caller,
   middleware, gateway, validator and config value on the path. Note each
   condition that makes the line unreachable.
3. **Count only controls that run** on this path. A defence-in-depth layer
   that fails is not a vulnerability while the primary control holds. A
   comment that says "validated upstream" is a claim: find the upstream check.
4. **Attacker data or not.** A value that a trusted party wrote (install-time
   config, a migration, an admin-only setting) is not attacker data, unless a
   lower party can change it. A race needs proof that the value can change
   between the check and the use.
5. **A configurable value** passes the five refute-first checks for insecure
   defaults in `sections/classes.md` in this skill's directory.
6. **Chains.** Before you drop candidates that each fail, check whether two
   join into one attack: an open redirect and an OAuth flow, an SSRF and a
   cloud metadata endpoint, a log leak and a token replay.

## Sideways sweep

A finding is a root cause, not a line. After a finding holds, search for the
same pattern at every other entrypoint, command and call site in the scope.
Start with an exact match of the vulnerable line, then widen one element at a
time: the function, the argument, the framework call. Read each match. List
the siblings under one finding; its severity follows the worst sibling.
Order the work by impact, exposure, known exploitation and the benefit to the
owner. Unknown reachability stays unknown, never "unreachable".

## The challenge

Before you report a high or critical candidate, get a second, independent
read. Send a read-only subagent (prefer `lilystack:lens`; at most three at a
time, and wait for them). Give it:

- the cited locations and the invariant;
- the claim as a question ("can an account holder read another tenant's
  invoices through `GET /invoices/:id`?");
- the absolute path of this file;
- the owner's rules that bear on the code.

Never give it your conclusion or your confidence. With no subagent tool, make
a separate skeptical pass yourself, and label it `sequential challenge; no
independent agent`. Record dissent and open assumptions in the finding.
Agreement and a scanner warning do not prove how the code behaves at run
time. A subagent's answer is a claim: read the lines it cites.

## For a challenger

You get a claim as a question, its locations and the invariant. Try to refute
it. Read the callers, the middleware, the config, the validation and the
legitimate uses on every path to the sink. Report one block in your usual
format. Put `holds`, `partial` or `refuted` where the class goes, use the
confidence scale above, and quote the lines that decide it. When the answer
needs a command (`git log`, a test run), name the command and why; do not
guess its result.
