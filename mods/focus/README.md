# focus

`focus` is a Claude Code mod. It keeps one list for each project:

- **one main action**: the next thing to do;
- **the tasks after it**: six at most;
- **what is done**.

The list shows in a **Focus** pane in the workspace. You check off a task in
the pane. Then the next task becomes the main action.

This mod is not a part of the lilystack plugin. You install it by itself
(see [How to install](#how-to-install)).

## Why

The old status mod showed all tasks in one band. It had no main action. This
mod uses the shape "one main action, then a few tasks after". One task at a
time is easier to start and to finish.

## How you use it

| You do this | This occurs |
|---|---|
| Press **✓ Done** (or `d` while the pane has the focus) | The main action goes to Done. The first task after it becomes the main action. A toast tells you the next task. |
| Press **☐ a task** (or `1` to `6`) | That task goes to Done. |
| Press **☑ a done task** | It opens again: as the main action if there is none, else at the top of the list. |
| `/main <task>` | Sets a new main action. The old main action moves to the top of the list. |
| `/main` | Opens the Focus pane. |
| `/then <task>` | Adds a task after the main action. |
| `/done` | Checks off the main action. |
| `/focus-clear` | Clears the list. Claude Code has its own `/focus` command, so this mod cannot use that name. |

The status line shows `🎯 <main action> · N after`.

## What Claude does with it

- The mod gives Claude two tools: `mcp__focus__set` and `mcp__focus__check`.
- When Claude gives you one main action and the tasks after it, Claude calls
  `set`. The pane then shows them.
- When you say that a task is done, or Claude sees that it is done, Claude
  calls `check`.
- The mod adds a short section to the system prompt. The section holds the
  list and tells Claude to follow up on an open main action.

## Accountability

- At the start of a session, a toast tells you the main action that is still
  open from before.
- When the main action is open for 45 minutes, a toast asks if you are still
  on it. It asks one time for each main action.

## What it can reach

- It reads the folders above the session folder, to find the `.git` folder.
- It keeps the list in the store of the mod, under `list:<project root>`.
- It makes no network calls and starts no processes.

## How to install

The Lilystack marketplace lists this mod as `focus`.

- **In the desktop app:** click **+** next to the prompt box, then
  **Plugins**. If the `lilystack` marketplace is not there, add the marketplace
  `frogfarmin/Lilystack`. Then add the plugin `focus`.
- **In a terminal:**

  ```sh
  claude plugin install focus@lilystack
  ```

- **For development:** add this folder to `CLAUDE_CODE_PLUGIN_DIRS`, or add
  your clone as a marketplace (`claude plugin marketplace add ~/Lilystack`).
  Then an edit takes effect after `/reload-plugins`.

## Files

| File | What it does |
|---|---|
| `hooks/register.tsx` | The hooks, the tools, the commands and the pane. All calls to the mods API are in this file. |
| `hooks/list.ts` | The list operations, the prompt text and the status text. It has no side effects. |
| `hooks/hooks.json` | The module list. It names `register.tsx` as the module of the mod. |
| `types/index.d.ts` | The state contract: the list that the pane draws. |
| `tests/` | The tests. Run them with `claude plugin test` from this folder. They do not need a session. |
| `tsconfig.json` | It extends `.claude-plugin/types/tsconfig.json`, so that an editor can do a type check of the hooks. |

## Do a check of the mod

```sh
cd ~/Lilystack/mods/focus
claude plugin validate .      # the events that it hooks and the calls that it makes
claude plugin test            # all tests
```

Tested with Claude Code 2.1.319.
