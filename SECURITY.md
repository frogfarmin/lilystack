# Security

Lilystack has safety hooks (careful, secrets, secure, freeze, test-first).
A way to get past a hook is a security problem. So is a skill that sends data
out without telling you, or a skill that tells Claude to run a command that
you did not ask for.

## Supported versions

Only the latest commit on `main` gets fixes. Pull before you report.

## Report a problem

- Do not open a public issue.
- Use GitHub's private report: the **Security** tab of this repo, then
  **Report a vulnerability**.
- Tell which hook or skill, the exact tool call or command, and what happened.
- Do not put a real key, token or personal data in the report. Use a fake
  value with the same shape.
- This is a one-person project. Expect a first answer in about 7 days.

## In scope

- A bypass of a hook: a tool call that a hook must deny or ask about, but
  that it allows.
- A skill or agent that sends data out, writes outside its project, or runs a
  command without the approval that `AGENTS.md` requires.
- A change to `bin/lily` that can delete data or move it out of its root.

## What the hooks do not promise

The hooks are a second line of defence. They read each tool call against a
list of patterns, so a new shape of command can pass. They fail open when
Claude Code cannot find them (see `docs/designs/lilystack.md`, section 9).
Keep your own permission rules in `settings.json`.

## Before you install

Lilystack runs bash hooks on your tool calls. Read the hooks in `hooks/` and
pin a commit that you have read. A pull request from a stranger is not
reviewed until the owner reads every line of it.
