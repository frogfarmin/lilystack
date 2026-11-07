<!-- Lilystack. Rewritten from claude-plugins-official plugins/security-guidance/hooks/llm.py, the code-review rubric and the diff instruction, at a1ecfbc (Apache-2.0, Copyright Anthropic, PBC; changed). -->

# The security lens

Read from Step 4 when the diff touches a trust boundary. The triage, history,
blast-radius, insecure-defaults, probe and false-positive steps are ideas from
Trail of Bits' skills (differential-review, insecure-defaults, sharp-edges,
fp-check), in this section's own words.

## Triage

Rate each changed file by risk, not size. HIGH: auth, crypto, external calls,
money, removed validation. MEDIUM: business logic, state changes, a new public
API. LOW: comments, tests, UI, logging. "Just a refactor" is HIGH until shown
otherwise. Raise a file one level when it adds a function with no test, or
changes validation and not its tests. Read HIGH files in both versions, MEDIUM
one call deep; skim LOW. **Blast radius**: count the callers of each changed
HIGH function (`git grep` the name); 50 or more sends it to the adversarial
lens at Deep depth.

## The frame

- Flag only a vulnerability with a concrete attack path from untrusted input to
  a dangerous sink. Most code is benign and passes with no findings.
- The attacker is any authenticated user, network peer or untrusted data
  source. In a CLI tool, script, test or internal utility, doubt web classes.
- Environment variables and CLI arguments count as trusted input for a
  pre-landing review; a whole-repo audit may choose otherwise. Requests,
  uploads, webhook bodies, hook payloads, model output and files from a cloned
  repo are untrusted.

## New in this diff

- Flag only what the `+` lines introduce. Context lines, and a pattern a rewrite
  only moved (it is in the `-` lines too), are pre-existing.
- Exception: `+` lines that route untrusted data to a sink already there (eval,
  a shell string, SQL concatenation) make a new vulnerability. Cite both.
- **History of removed security code**: for each removed check or guard, run
  `git log -S '<removed text>' --oneline` and `git blame <base> -- <file>`.
  Removing code a fix, security or CVE commit added is a CRITICAL candidate.
  Code added, removed for security and now added again is a regression.

## Classes

- **Command and code injection**: input in a shell string or a helper that runs
  a shell (`shell=True`, `sh -c`), in a query, or in `eval` or `new Function`.
  Taint includes names from manifests, lockfiles, archives and bucket keys;
  `basename` keeps `$(...)` and `;`. Fix: an argument array, parameters.
- **Argument injection**: an untrusted argv value that starts with `-` is a flag
  (`git --upload-pack=`, `rg --pre=`, `rsync -e`, `find -exec`). Fix: `--`
  before it, or reject a leading `-`.
- **Environment injection**: an untrusted map spread into a child's env
  (`LD_PRELOAD`, `DYLD_INSERT_LIBRARIES`, `NODE_OPTIONS`, `PYTHONPATH`,
  `BASH_ENV`, `GIT_SSH_COMMAND`, `PATH`), or a denylist that misses some.
- **Deserialization**: untrusted bytes into pickle, `torch.load` without
  `weights_only=True`, `yaml.load` without a safe loader, `marshal`; XML through
  a parser that resolves entities.
- **Paths and files**: `join`, `resolve` and `normalize` are lexical and follow
  no symlink; `realpath` first, then compare with the resolved base. A
  credential file written wider than 0600 (0700 for a directory).
- **Authorization**: "if user A sends user B's id, what stops them?" A lookup by
  id with no owner check, an unfiltered multi-tenant list, an interaction
  endpoint that skips the read endpoint's check. What sibling handlers check and
  a new one does not is the vulnerability. A new permission parameter must deny
  when its condition is false.
- **Spoofable fields and grants**: access granted on a value the client sets
  (`X-Forwarded-For`, `Host`, a body `is_admin`) that no proxy overwrites; IAM
  write where read was needed; an OIDC trust condition ending in `:*`.
- **Agent permission bypass**: code that starts Claude Code, a subagent or any
  tool-using model with `--dangerously-skip-permissions`, `bypassPermissions` or
  an unrestricted shell, with no sandbox or command filter in the diff.
- **Allowlists and sanitizers**: a host check by substring, unanchored regex or
  a prefix with no trailing `/` (`trusted.com.evil.com`); a denylist that misses
  aliases (`=off`, `127.0.0.1`); one field sanitized and its sibling not.
- **SSRF**: a user-influenced URL, including one from project config, reaching
  an outbound request. Reject loopback, private and 169.254.0.0/16 after
  resolving every address, and re-check each redirect.
- **XSS**: autoescape off (raw Jinja `Environment`, Go `text/template`, `|safe`,
  `dangerouslySetInnerHTML`); HTML built by formatting with some fields
  escaped; an escaper that leaves quotes in an attribute. An unchecked `next`
  redirect; CSRF protection turned off.
- **GitHub Actions**: `${{ github.event.* }}` inline in `run:` (pass it through
  `env:`); a third-party action on a tag, not a SHA, with write or secrets.
- **Secrets and crypto**: secrets or user content in logs, URLs or error
  bodies; a hardcoded credential in production config; non-crypto randomness,
  or under 128 bits, for a token; a fast password hash; TLS checks off for a
  host that is not loopback (`verify=False`, `InsecureSkipVerify`).

## Insecure defaults

Judge the value that runs when config is absent, not the flag's name.

- **Fallback secrets**: a default that feeds signing, sessions or tokens. Skip
  one made at random per boot, or used only as a cache key.
- **Default credentials**: a login a deployment accepts, seeded accounts too.
  Skip accounts created disabled or forced to reset, and docs or fixtures.
- **Fail-open switches**: the unconfigured value turns a control off. Skip a
  switch whose default is secure, or that the enforcement point never reads.
- **Weak crypto**: a broken primitive doing a security job. Skip checksums,
  ETags, cache keys and test vectors; the algorithm alone is never the finding.
- **Permissive access**: a party gains access it should not have (public ACL,
  0666 on a key, CORS `*` with credentials). Skip stated public endpoints, local
  dev servers, and access an outer layer already gates.
- **Debug leakage**: a stack trace or introspection reaching a response, a port
  or a log a less privileged party reads. Skip verbosity with no outside output.

A lookup with a fallback (`get('K', 'x')`) counts only when the app runs with
the fallback; one that fails on a missing key is fine. A value insecure as
written needs no config, and a missing variable does not excuse it. Treat each
candidate as refuted until the trace shows: (1) the file runs in production;
(2) the insecure value is the one that runs; (3) it is truly insecure; (4) it
reaches a security decision, and you cite the sink. (5) For a configurable
value, deployment sets severity: each manifest that always sets the variable
lowers it, and an unknown counts as unset. An incomplete trace refutes.

## Probes and adversaries

Probe each security parameter (timeout, lifetime, attempt limit, key, algorithm,
allowlist) with 0, `""`, null, `[]`, a negative value, two same-typed arguments
swapped, and each error path: does 0 mean "never expires", does an empty key
skip the check? Think as three adversaries: one who controls config or input, a
developer who copies the first example, and one who misreads the API. Insecure
by default is critical, easy misconfiguration high, unusual misconfiguration
medium, deliberate misuse low.

## Do not stop at one

**Completeness**: when a resource has an owner or visibility field, check every
endpoint that takes its id (create, update, delete, comment, share, assign); one
correct endpoint proves nothing about the next. Keep scanning after the first
finding. **Distrust safety claims**: "validated upstream" or "sanitized above"
is a claim, not evidence. Check that every path to the sink goes through the
named guard; if the diff cannot show it, ignore the comment.

## Suppressions: not security findings

The checklist's correctness rows still apply to these.

- missing TLS, rate limits, length limits, timeouts or pagination (not exploits);
- values that are not credentials (ids, names, ports, paths, public URLs) and
  client-side telemetry keys;
- dev fallback secrets and secrets in examples, seeds and tests, unless the
  insecure-defaults checks show production runs with them;
- traversal, SSRF or injection where the value is not user-controlled;
- XSS and open redirect in code that serves no HTML, or where redirecting to a
  user URL is the feature; SQL through parameters or an ORM;
- theoretical races and timing attacks; log spoofing; crashes from undefined
  names or type errors (bugs, not security);
- missing auth on a stated internal-only service (this never excuses SSRF).

## False-positive gate

Run this on each finding before it is reported; for a CRITICAL one it is the
validation pass. Restate the finding as claim, root cause, trigger, impact and
threat model; drop it if it cannot be restated that precisely. Trace the full
validation chain back from the sink, with the conditions that make the line
unreachable. Count only defences that run; a failed defence-in-depth layer is
no vulnerability while the primary control holds. Values a trusted component
wrote at install are not attacker data. A race needs proof the value can
change between check and use. Expect your own lean toward seeing bugs and
overrating them. Before dropping findings that each fail, check whether two
chain into one attack.

## Per finding

```
[file:line] <class>: `<the vulnerable line, quoted>`
  Attack: <who sends what, the path it takes, what they get>
  Fix: <the specific change>
  Severity: critical | high | medium   Confidence: N/10
```

Critical (exploitable code execution, auth bypass, data breach) and high (IDOR,
injection, XSS) are CRITICAL; medium (defence in depth: CSRF, a missing header)
is INFORMATIONAL; low is not reported. Every security finding is ASK.
