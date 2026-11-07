<!-- Lilystack. Rewritten from gstack lib/dx-error-contract.ts, plan-devex-review/dx-hall-of-fame.md and scripts/resolvers/dx.ts at 466689b (MIT, Copyright (c) 2026 Garry Tan). -->

# The agent-ready error contract

An agent meets most errors first. It reads them literally, and it cannot ask
what the author meant. Score each traced error path against eight items.

| Item | The error gives the reader |
|---|---|
| **what** | The operation that failed, and the real values (input, path, id) that caused the failure. |
| **fix** | On the first or the last line, never in the middle of a chain: an exact command, flag or edit. When an agent has no safe repair, the exact thing a human must give (a credential, an approval, a decision); a precise escalation is a full fix. A fix counts only when it is safe and authorized: it does not go around a consent, safety or sandbox boundary, it does not tell the agent to run text copied from untrusted output, and it quotes its arguments correctly. |
| **recovery** | The class: retry unchanged, fix and retry, do X first, or ask a human. The side effects: none, partial, complete or unknown. For an unknown outcome, how to reconcile (a status command, an idempotency key) before a retry. A retry bound, then escalation. |
| **code** | A stable code with a doc anchor or an `--explain` target. The prose may change; the code may not. |
| **context** | The versions, the config in effect, the names (never the values) of the env vars that matter, and the underlying error of the dependency, not swallowed. A remote service gives only facts that are safe for the caller (the parameter, the API version, the request id). |
| **trace** | Only for unexpected failures. Locally: a compact trace, or the path of a file that holds the full one (the full trace under `--verbose` or `DEBUG`). Remotely: a correlation id, with the internals kept in the service's logs. |
| **redaction** | No secret values, tokens or URLs with credentials anywhere, traces and nested causes included. |
| **channel** | The native machine signal of the surface carries the same fields, and a failure is signalled as a failure: never exit 0, HTTP 200 or `isError: false`. |

## Failure classes

- **Usage or validation error**, rejected before any work began: it needs
  what, fix, code, redaction and channel. Its recovery is implied (fix and
  retry, no side effects). Context, reconciliation and retry bounds do not
  apply.
- **Environment, dependency, partial-work and unexpected failures** need every
  item that applies. Trace applies to unexpected failures only.

## Surfaces

- **CLI tool**: stderr and a distinct non-zero exit code; a `--json` form when
  the tool has structured output.
- **API or service**: the HTTP status and an RFC 9457 problem-details body;
  context that is safe for the caller; a correlation id as the trace.
- **Library or SDK**: a typed error class that carries the code and the
  fields; no exit code.
- **Platform**: the CLI rule or the API rule, for the interface that the error
  reaches.
- **Documentation**: what, fix, code and redaction only.
- **Claude Code skill or plugin**: the skill's final result line, with a
  status and a code. An MCP tool returns `isError: true`, with the fields in
  its text or structured content. A hook that blocks exits with code 2 and
  puts the reason on stderr, or returns a JSON decision with a reason. Claude
  reads that reason as its next prompt, so the reason names the fix.

## Evidence

Each item on each path is pass, fail, N/A (with a reason) or unknown. In a
plan review, an item that applies to a path the plan adds, but that the plan
never specifies, is a gap: fail. Keep unknown for existing behaviour that you
could not inspect.

## Caps

Name the path and the item behind each cap, and show the corrected error line.

- **4/10, a Critical finding**, titled `CAP4:<path>:<item> <what fails>`: a
  path leaks a secret, signals a failure as success, gives an unsafe fix, or
  blocks on a terminal (it hangs, or it fails for lack of a terminal and names
  no non-interactive alternative such as `--yes`).
- **6/10, a High finding**, titled `CAP6:<path>:<item> <what fails>`: a path
  lacks a fix, recovery, context or trace item that applies to it.

Every mode, DX TRIAGE included, reports every CAP4 finding.

## Calibration

Each of these three does some items well; none of them meets every item.

- **Elm** (what, fix, a readable first line): a titled error with the file,
  the exact source line marked under the fault, full sentences in the first
  person, and a `Hint:` line with the fix.
- **Rust** (code, fix, `--explain`): `error[E0308]` with
  `rustc --explain E0308`, labels on the source span, and a `help:` line that
  shows the exact edit.
- **Stripe API** (code, doc anchor, structured channel): a JSON error with
  `type`, `code`, `message`, `param` and `doc_url`.

A CLI error with every item that applies, on stderr with exit code 3:

```
sync: write to ~/notes/index.md failed: permission denied (SYNC_WRITE_DENIED)
  cause: ~/notes is read-only (mode 0555); 3 of 7 files were written (side effects: partial)
  context: sync 1.4.0, config ~/.config/sync/config.toml, env SYNC_ROOT is set
  fix: run `chmod u+w ~/notes`, then `sync --resume` (safe to retry once)
  docs: <docs URL>#SYNC_WRITE_DENIED
```

With `--json`, the same fields as an RFC 9457 object with extension members:

```json
{"type":"<docs URL>#SYNC_WRITE_DENIED","title":"Write denied",
 "detail":"write to ~/notes/index.md failed: permission denied",
 "code":"SYNC_WRITE_DENIED","fix":"chmod u+w ~/notes && sync --resume",
 "recovery":{"action":"fix_and_retry","side_effects":"partial","max_retries":1},
 "context":{"version":"1.4.0","config":"~/.config/sync/config.toml","env":["SYNC_ROOT"]}}
```

An unexpected crash adds a line such as `trace: ~/.sync/logs/crash-<time>.log
(run again with --verbose to print it)`. `recovery.action` is one of retry,
fix_and_retry, do_first or ask_human; `side_effects` is one of none, partial,
complete or unknown, with a `reconcile` command when it is unknown. The member
names are examples: score the meaning, not the spelling.

A skill's result line with every item that applies to a usage error:

```
BLOCKED: no plan in docs/specs/, docs/plans/ or docs/designs/ (PLAN_MISSING). Fix: run /lilystack:plan-devex-review <path>.
```

## Standards

- **CLI Agent Spec** (cli-agent-spec.github.io): `retryable` and
  `side_effects` for each exit code map to recovery.
- **RFC 9457**: `type` maps to code and doc anchor, `detail` to what, and
  `instance` to the trace of a remote service.
- **Stripe**: `code` and `doc_url` map to code.
- **MCP tools**: an `isError: true` result that the model can read maps to
  channel.
- **clig.dev, "Errors"**: the actionable line where the reader looks, and
  debug detail for unexpected errors, map to fix and trace.

## Anti-patterns

- A "did you mean" in the middle of a chain. Put the fix on the first or the
  last line.
- `Error: operation failed` with exit code 0.
- A prompt that hangs when no terminal is attached.
- A stack trace that prints an API token.
