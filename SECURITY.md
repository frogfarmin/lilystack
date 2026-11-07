# Security

Lilystack has safety hooks (careful, secrets, secure, freeze, test-first).
A way to get past a hook is a security problem. So is a skill that sends data
out without telling you.

## Report a problem

- Do not open a public issue.
- Use GitHub's private report: the **Security** tab of this repo, then
  **Report a vulnerability**.
- Tell which hook or skill, the exact tool call or command, and what happened.

## What the hooks do not promise

The hooks are a second line of defence. They read each tool call against a
list of patterns, so a new shape of command can pass. They fail open when
Claude Code cannot find them (see `docs/designs/lilystack.md`, section 9).
Keep your own permission rules in `settings.json`.
