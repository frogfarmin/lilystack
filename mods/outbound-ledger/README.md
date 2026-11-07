# outbound-ledger

`outbound-ledger` is a Claude Code mod. It records each outward action of the
session in a pane. It is an audit trail for the times when you are not at the
screen.

- It records the calls of the main conversation and of subagents.
- It only records. It never blocks a call and never changes a call.
- It makes no network call itself, and it keeps nothing after the session.

This mod is not a part of the lilystack plugin. You install it by itself
(see [How to install](#how-to-install)).

## What it records

| Call | Sent (↗) | Fetched (↙) |
|---|---|---|
| Bash `git` | `push` | `fetch`, `pull`, `clone`, `ls-remote` |
| Bash `gh` | `pr create/merge/comment/review/edit/close/ready`, `issue create/comment/edit/close`, `release create`, `repo create`, `gh api` with a write method or fields | all other `gh` calls |
| Bash `curl`, `wget` | a write method, or data, a form or an upload | all other calls |
| Bash publish | `npm/pnpm/yarn publish`, `cargo publish`, `twine upload`, `gem push` | |
| Bash remote | `ssh`, `scp` and `rsync` to a `host:` | |
| Bash install | | `npm/pnpm/yarn/bun install` or `add`, `pip install`, `brew install` |
| WebSearch, WebFetch | WebSearch (the query goes out) | WebFetch |
| MCP tools | a tool name with a write word (create, send, push, merge and others), and no read word | a tool name with a read word (get, list, search, read and others), and all other MCP tools |
| Artifact tools | publish, delete, pin, unpin; data and comment writes | read, list, open, quickstart |

A Bash command with more than one outward part gets one row. A part that sends
has priority. The row tells how many more parts there are.

The tools of the three Lilystack mods (`outbound-ledger`, `verify-gate`,
`focus`) are not recorded.

## What a row shows

`14:02 ↗ git push origin main → git remote origin  ok`

- The time, the direction, the action and the target.
- The result: `pending`, `ok`, `error` (red) or `denied` (yellow).
- `(agent)` when a subagent made the call.

Before a row is kept, the mod masks tokens and secret values (GitHub tokens,
`sk-` keys, Slack tokens, AWS key IDs, `Bearer` and `Authorization` values, and
`token=`, `key=`, `password=`, `secret=` values). Then it cuts the text to 120
characters. The mod keeps the last 300 rows.

## How to use it

- Type `/ledger`. It opens the Outbound pane and also gives the list as text,
  for a surface that has no pane.
- The status line shows `↗ N sent · M fetched` after the first row.
- In the pane, **Sent only** hides the fetches. **Clear** removes all rows.

## How to install

The Lilystack marketplace lists this mod as `outbound-ledger`.

- **In the desktop app:** click **+** next to the prompt box, then
  **Plugins**. If the `lilystack` marketplace is not there, add the marketplace
  `frogfarmin/Lilystack`. Then add the plugin `outbound-ledger`.
- **In a terminal:**

  ```sh
  claude plugin install outbound-ledger@lilystack
  ```

- **For development:** add this folder to `CLAUDE_CODE_PLUGIN_DIRS`, or add
  your clone as a marketplace (`claude plugin marketplace add ~/Lilystack`).
  Then an edit takes effect after `/reload-plugins`.

## Files

| File | What it does |
|---|---|
| `hooks/register.tsx` | The hooks. All calls to the mods API are in this file. |
| `hooks/classify.ts` | Changes one tool call into one row, or into nothing. It also masks secrets. It has no side effects. |
| `hooks/ledger.ts` | The counts and the text of the rows. It has no side effects. |
| `types/index.d.ts` | The contract of the values in `$.state`. |
| `tests/` | The tests. Run them with `claude plugin test` from this folder. |

## Do a check of the mod

```sh
cd ~/Lilystack/mods/outbound-ledger
claude plugin validate .
claude plugin test
```

Tested with Claude Code 2.1.319.
