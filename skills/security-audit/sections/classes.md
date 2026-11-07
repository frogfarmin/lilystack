<!-- Lilystack. Rewritten from claude-plugins-official plugins/security-guidance/hooks/llm.py at a1ecfbc (Apache-2.0, Copyright Anthropic, PBC; changed), through Lilystack's review security lens; and gstack cso/sections/audit-phases.md.tmpl (Phase 9) at 466689b (MIT, Copyright (c) 2026 Garry Tan). The insecure-defaults checks and the sharp-edges probes are ideas from Trail of Bits' skills, in Lilystack's own words. -->

# The code classes

Read from the `code` phase. For each class, find the sinks in the scope, then
trace each sink back to an input. A sink with no input that an attacker
controls is not a finding.

In an audit, these inputs count as attacker-controlled: requests, uploads,
webhook bodies, queue messages from other parties, files that the code parses
from a user or from a cloned repo (manifests, lockfiles, archives, `.mcp.json`,
editor settings), model output, and environment variables or CLI arguments
when an untrusted workflow or a wrapper can set them.

The OWASP Top 10:2025 tag for each class is in parentheses. Use it as a label
in the report, not as a claim of compliance.

## Injection (A05)

- **Shell and code**: input in a shell string or in a helper that runs one
  (`shell=True`, `sh -c`, `os.system`, `exec`, backticks), in `eval`, in
  `new Function`, or in a template compiled at run time. `basename` and prefix
  checks keep `$(...)`, `;` and `|`. Fix: an argument array and no shell.
- **Arguments**: an untrusted argv value that starts with `-` becomes a flag
  (`git --upload-pack=`, `rg --pre=`, `tar --checkpoint-action=`, `rsync -e`,
  `ssh -oProxyCommand=`, `find -exec`). Fix: `--` before it, or reject a
  leading `-`.
- **Environment**: an untrusted map spread into a child's env
  (`LD_PRELOAD`, `DYLD_INSERT_LIBRARIES`, `NODE_OPTIONS`, `PYTHONPATH`,
  `BASH_ENV`, `GIT_SSH_COMMAND`, `PATH`), or a denylist that misses some; a
  secret in the parent's env that a less trusted child inherits.
- **Queries**: SQL, NoSQL operators from JSON (`$where`, `$ne`), LDAP or XPath
  built by concatenation or formatting. Bound parameters are safe; a raw
  fragment inside an ORM call is not.
- **HTML and templates (XSS)**: autoescape off (a raw Jinja `Environment`, Go
  `text/template` for HTML, `|safe`, `mark_safe`, `dangerouslySetInnerHTML`,
  `v-html`, `innerHTML`); HTML built by string formatting; an escaper that
  leaves quotes in an attribute; user text in an `href` (`javascript:`); user
  text compiled as a server-side template.

## Access and requests (A01)

- **Paths**: `join`, `resolve` and `normalize` are lexical and follow no
  symlink. Resolve with `realpath`, then compare with the resolved base. On
  extract, check archive entries for `../`, absolute names and links.
- **SSRF**: a URL or host that a user, a webhook or project config can set,
  and that reaches an outbound request, a storage client or an OAuth metadata
  fetch. A safe check resolves every address; rejects loopback, private and
  link-local ranges (`169.254.0.0/16`); compares the parsed hostname (not a
  prefix, and not a `netloc` that can hold `user@`); and checks each redirect
  again.
- **Allowlists**: a host check by substring, by an unanchored regex, or by a
  prefix with no trailing `/` (`trusted.com.evil.com`); a denylist that misses
  aliases (`127.1`, `[::1]`, `0.0.0.0`, `=off`); one field sanitized and its
  sibling not.
- **Redirects and CSRF**: an unchecked `next` or `return_to`; CSRF protection
  off where cookies authenticate a state change.
- **Spoofable fields**: access granted on a value that the client sets
  (`X-Forwarded-For`, `Host`, `Origin`, a body `role` or `is_admin`) and that
  no proxy overwrites.
- **Agent permission bypass**: code that starts Claude Code, a subagent or any
  model with tools, with `--dangerously-skip-permissions`, `bypassPermissions`
  or an open shell tool, and with no sandbox or command filter.

## Integrity and crypto (A04, A08)

- **Deserialization**: untrusted bytes into pickle and its kin, `torch.load`
  without `weights_only=True`, `yaml.load` without a safe loader, `marshal`,
  Java `ObjectInputStream` or PHP `unserialize`; XML through a parser that
  resolves external entities.
- **Crypto**: non-crypto randomness, or under 128 bits, for a token; a fast or
  unsalted password hash; a static IV or ECB mode; a JWT accepted without a
  fixed algorithm (`alg: none`, RS256 read as HS256), audience or expiry; TLS
  checks off for a host that is not loopback (`verify=False`,
  `InsecureSkipVerify`, `rejectUnauthorized: false`).
- **Uploads**: the type checked by name or by a client header only; stored
  under the web root, or served with a type that the browser renders (HTML,
  SVG); no size limit.

## Failure handling (A10)

- A `catch` or `except` that grants access, skips a check, or returns success
  on an error (fail-open).
- A change in several steps with no rollback, which leaves a partial state
  that an attacker can use (shipped but not charged, revoked but still
  cached).

## Insecure defaults (A02)

Judge the value that runs when config is absent, not the name of the flag.
There are six kinds:

- **Fallback secrets**: a default that feeds signing, sessions or tokens
  (`os.getenv('SECRET_KEY', 'dev')`). Skip a value made at random at each
  boot, or one used only as a cache key.
- **Default credentials**: a login that a deployment accepts, seeded accounts
  too. Skip accounts created disabled or forced to reset.
- **Fail-open switches**: the value when unset turns a control off
  (`AUTH_ENABLED` unset means off).
- **Weak crypto** that does a security job. Skip checksums, ETags, cache keys
  and test vectors. The algorithm alone is never the finding.
- **Permissive access**: a public ACL, 0666 on a key, CORS `*` with
  credentials, a server bound to `0.0.0.0` with no auth.
- **Debug leakage**: a stack trace, an introspection endpoint or a debug
  console that reaches a response, a port or a log that a lower party reads.

Treat each candidate as refuted until all five checks hold:

1. The file runs in production.
2. The insecure value is the one that runs. A lookup that fails on a missing
   key is fine.
3. The value is truly insecure.
4. It reaches a security decision, and you cite the sink.
5. No deployment manifest in the repo always sets a safe value. Each manifest
   that always sets it lowers the severity. An unknown deployment counts as
   unset, and the finding names that assumption.

A value that is insecure as written needs no config. An incomplete trace
refutes the candidate.

## Sharp edges

Probe each security parameter (a timeout, a lifetime, an attempt limit, a key,
an algorithm name, an allowlist) with 0, `""`, null, `[]`, a negative value,
two arguments of the same type swapped, and each error path. Does 0 mean
"never expires"? Does an empty key skip the check? Does an empty allowlist
allow all?

Think as three adversaries: one who controls the config or the input, a
developer who copies the first example in the docs, and a developer who
misreads the API. Rank what you find: insecure by default is critical; an
easy misconfiguration is high; an unusual misconfiguration is medium;
deliberate misuse is low.
