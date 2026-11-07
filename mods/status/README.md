# status

`status` is a Claude Code mod. It does two things:

1. It keeps the `STATUS.md` file of a project correct. It writes the Next,
   Waiting on you and Done lists from the task list of Claude Code.
2. It shows a band above the prompt. The band shows the checklist, the
   current work of Claude, and the items that wait for you.

This mod is not a part of the lilystack plugin. It loads only where
`CLAUDE_CODE_PLUGIN_DIRS` names this folder.

## How it loads

It loads on the main Mac only, in the author's setup. To use it yourself, add this folder to `CLAUDE_CODE_PLUGIN_DIRS`.

- `~/.zshrc.local` on the main Mac adds `$HOME/Lilystack/mods/status` to
  `CLAUDE_CODE_PLUGIN_DIRS`. This file is outside the two repos.
- Lilypad's `shell/zshrc` sets the first part of that variable, for Lilystack.
- The second Mac has no such line. For this reason, the mod does not load there.
- `/plugin` shows the mod as `status@inline`.

The exact line is in Lilypad's `Claude/README.md`, in the section "Status mod".

## Files

| File | What it does |
|---|---|
| `hooks/register.ts` | The hooks. All calls to the mods API are in this file. |
| `hooks/status-file.ts` | Reads, merges and writes `STATUS.md`. It has no side effects. |
| `hooks/activity.ts` | Changes one tool call into one line of text. It has no side effects. |
| `hooks/band.ts` | Makes the rows of the band for a given width and number of rows. It has no side effects. |
| `tests/` | The tests. Run them with `claude plugin test` from this folder. They do not need a session. |
| `hooks/hooks.json` | The module list. It names `register.ts` as the module of the mod. |
| `tsconfig.json` | In git. It extends `.claude-plugin/types/tsconfig.json`, so that an editor can do a type check of the hooks. |
| `.claude-plugin/types/` | Claude Code writes these types when the mod first loads in a session. They tell the events and the API of this build. They are not in git. |

## History

The mod was in Lilypad as `Claude/mods/status` before it moved here. Lilypad's
git history keeps its old commits and its design (`Claude/plans/`, removed on
2026-11-03).

## Do a check of the mod

```sh
cd ~/Lilystack/mods/status
claude plugin validate .      # the events that it hooks and the calls that it makes
claude plugin test            # all tests
```

Tested with Claude Code 2.1.317.
