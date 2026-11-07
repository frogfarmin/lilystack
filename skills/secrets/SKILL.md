---
name: secrets
description: Keep keys, credential files and .env secrets out of reads, edits and shell commands for the rest of this session
disable-model-invocation: true
hooks:
  PreToolUse:
    - matcher: "Read|Edit|Write|MultiEdit|NotebookEdit|Grep|Bash"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/hooks/secrets.sh"
          statusMessage: "lilystack secrets: checking the target"
---
<!-- Lilystack. Original. A secrets guard in the shape of careful: a rules file, deny and ask tiers, fails closed, no state. -->

# secrets: keys and credentials stay out of the transcript

Secrets mode is now on for the rest of this session. Every Read, Edit, Write,
MultiEdit, NotebookEdit, Grep and Bash call is checked before it runs by
`hooks/secrets.sh` against the rules in `hooks/secrets-patterns.txt`. Tell the
user that, in one line, and what it means:

**Blocked outright (deny):**

- reading, searching or copying a private key (`~/.ssh/id_*`, `*_rsa`,
  `.pem` or `.key` in `~/.ssh`, `.p12`, `.pfx`, `.ppk`, `.kdbx`, `~/.gnupg`);
- cloud and cluster credentials (`~/.aws/credentials`, gcloud and Azure
  tokens, `~/.kube/config`, `~/.docker/config.json`);
- token and password files (`.netrc`, `.git-credentials`, `.pgpass`,
  `.pypirc`, the gh and Claude credential files, keychains, `pass`);
- browser cookies and saved logins;
- any write inside `~/.ssh`, by a file tool or by the shell.

**Asks first:**

- `.env`, `.env.*` and `.envrc` files (not `.env.example` and its kin), by a
  file tool or in a command;
- files that look like secrets or state: `secrets.yaml`,
  `credentials.json`, service-account files, `.pem`, `.key`, `.tfvars`,
  `terraform.tfstate`, `.npmrc`;
- a dump of the whole environment (`env`, `printenv`, `export -p`, `set`);
- a secret printed from a store (`security find-generic-password -w`, `op
  read`, `vault read`, AWS and Google secret managers, `gh auth token`,
  `kubectl get secret -o`);
- text that looks like a live key or token, written to a file or put in a
  command: private-key blocks and AWS, GitHub, Anthropic, Stripe, Slack,
  Google and npm token shapes.

Public keys, `known_hosts`, `~/.ssh/config` (read only), `ssh -i` and
`ssh-keygen -y` pass.

Each path is checked as given, made absolute against the working directory
with `~` expanded, and with symlinks resolved, so a link to a key is caught.
Nothing is logged or stored. If jq or a rules file is missing, every checked
call is blocked with a message naming the fix.

When the hook blocks or questions a call, never work around it. Work from
`.env.example`, ask the user for the variable names (never the values), or
ask the user to run the step themselves.

It is a guardrail, not a boundary. A path built at runtime
(`cat ~/.ss''h/id_rsa`) slips past, and Grep with no path can still read a
`.env` that is not gitignored. Claude Code's permission rules are the
stronger layer: suggest, once and without making the change, that the owner
add `permissions.deny` rules such as `Read(./.env)` and `Read(~/.ssh/**)` in
Lilypad.

The idea of a `.env` guard is from disler's claude-code-hooks-mastery; this
version is new work that fails closed and keeps no log. To change a rule,
edit a line of `hooks/secrets-patterns.txt`; `tests/test-hooks.zsh` pins the
behaviour. The hook stays registered until this session ends.
