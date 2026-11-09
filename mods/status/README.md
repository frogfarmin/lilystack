# status

`status` is a Claude Code mod. It does two things:

1. It keeps the `STATUS.md` file of a project correct. It writes the Next,
   Waiting on you and Done lists from the task list of Claude Code.
2. It shows a band above the prompt. The band shows the checklist, the
   current work of Claude, and the items that wait for you.

This mod is not a part of the lilystack plugin. It loads only where
`CLAUDE_CODE_PLUGIN_DIRS` names this folder.

## What it keeps in STATUS.md

The mod owns three sections: `## Next`, `## Waiting on you` and `## Done`. It
writes their entries again from the task list. It does not remove your text:

- It keeps the title line as you wrote it, and the paragraph under it. It
  writes its own `Updated` line under the title.
- It keeps a line in an owned section that is not an entry, for example
  prose or an indented sub-item. The line stays under the entry above it. When
  the task of that entry completes, the line moves with the entry to Done.
  When the task is deleted, its lines go with it.
- It keeps a Done line with no date (`- Set up the repo`). The 14-day cut
  does not remove it. It goes after the dated lines.
- It keeps all text after the owned sections, `## Notes` too.

## How it loads

It loads on the main Mac only, in the author's setup. To use it yourself, add this folder to `CLAUDE_CODE_PLUGIN_DIRS`.

- `~/.zshrc.local` on the main Mac adds `$HOME/Lilystack/mods/status` to
  `CLAUDE_CODE_PLUGIN_DIRS`. This file is outside the two repos:

  ```sh
  export CLAUDE_CODE_PLUGIN_DIRS="$HOME/Lilystack/mods/status${CLAUDE_CODE_PLUGIN_DIRS:+:$CLAUDE_CODE_PLUGIN_DIRS}"
  ```

- The second Mac has no such line. For this reason, the mod does not load there.
- `/plugin` shows the mod as `status@inline`.
- The variable works only where Claude Code starts from a zsh that reads
  `~/.zshrc`. The desktop app does not read zsh files, so the mod does not
  load there.

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
