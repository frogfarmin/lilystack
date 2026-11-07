<!-- Lilystack. Rewritten from gstack codex/SKILL.md.tmpl and codex/sections/review-mode.md.tmpl, codex/sections/challenge-mode.md.tmpl, codex/sections/consult-mode.md.tmpl at 466689b (MIT, Copyright (c) 2026 Garry Tan). -->

# second-opinion: the tools

## Read the help first

Run `<tool> --help` before you build a command. For Codex, also run
`codex exec --help`, and `codex review --help` for its own review. Use only
the flags that the help shows. Do not guess a flag. A CLI changes its flags
between versions, so the commands below are typical shapes, not fixed text.

## The command for each tool

Each command runs from the project root and reads the prompt on stdin. Put
the exact command in the question of Step 5.

**codex** (OpenAI):

```bash
codex exec --sandbox read-only --ephemeral -C "<root>" -o "$SO/out.txt" - < "$SO/prompt.txt" 2> "$SO/err.txt"; echo "exit $?"
```

`-` reads the prompt from stdin. `-o` keeps only the final answer.
`--ephemeral` keeps no session on disk.

**gemini** (Google):

```bash
gemini -p "Do the task in the input." --approval-mode default < "$SO/prompt.txt" > "$SO/out.txt" 2> "$SO/err.txt"; echo "exit $?"
```

`-p` runs it with no prompt screen. The input on stdin goes with the prompt.

**claude** (Anthropic, the same provider as this session):

```bash
claude -p --model <other model> --tools "" --no-session-persistence < "$SO/prompt.txt" > "$SO/out.txt" 2> "$SO/err.txt"; echo "exit $?"
```

Use a model alias that `claude --help` names, other than the model of this
session. `--tools ""` turns off all tools, so the payload is all that it sees.

**A model.** Use the default model of the tool unless the owner names one.
Pass the name with the flag that the help shows. On Codex 0.147,
`codex review` refused `-m`, and `-c model="<name>"` worked for both
`codex review` and `codex exec`; check this in the help. When the model is
not available (an HTTP 400 or 404 that names the model), report it and ask
for another. Never put another model in its place in silence.

## Reach: what the tool can read

- **codex.** It runs commands in its sandbox. In read-only mode it can still
  read files on this machine, and what it reads goes to OpenAI. Write
  `Reach: can also read files on this machine (read-only)`.
- **gemini.** It has file tools. If the help shows a way to limit them, use
  it. If not, write the same Reach line as for codex.
- **claude** with `--tools ""`. Write `Reach: payload only`.

The rule in the prompt not to read agent folders is a request, not a fence.
When the tool keeps read access, look for secret files in the checkout that
it could read, ignored files too:

```bash
{ git ls-files; git ls-files --others --exclude-standard; git ls-files --others --ignored --exclude-standard --directory; } | grep -i -E '(^|/)\.env(\.[^/]*)?/?$|(^|/)\.envrc$|\.(pem|key|p12|pfx|ppk|kdbx|jks|keystore|tfvars)$|(^|/)(id_(rsa|dsa|ecdsa|ed25519)|\.netrc|\.npmrc|\.pypirc|\.pgpass|\.git-credentials|terraform\.tfstate)$|(^|/)(secrets?|credentials?|service[-_]?account[^/]*)\.(json|ya?ml|toml|ini|txt)$' | grep -v -i -E '\.env\.(example|sample|template|dist)$'
```

Name each hit in the question, and recommend a payload-only run (claude with
`--tools ""`) or cancel.

Never turn on auto-approval or a bypass to get a run through: no `--yolo`, no
`--dangerously-bypass-approvals-and-sandbox`, no `bypassPermissions`, no
full-access sandbox. Never change the config of the tool.

## Codex's own review

`codex review --base <base>` takes no prompt. The CLI refuses a prompt
together with a scope flag (`--base`, `--commit`, `--uncommitted`). A prompt
with no scope flag reviews only the uncommitted tree, and a confident review
of the wrong changes comes back. The scope flag is the only thing that sets
the scope.

It also builds its own diff, which can differ from the payload that you
scanned. For example, it can leave out untracked files, and then it does not
cover the whole branch: say so in the report. Use it only when the owner asks
for Codex's own review. Set its sandbox with `-c sandbox_mode="read-only"`
when `codex review --help` shows no sandbox flag. Otherwise use `codex exec`
with the payload.

## Run

Set the Bash timeout to 600000 (ten minutes). If the call ends at the
timeout, the run is incomplete: suggest a narrower scope. If stderr shows a
token count (Codex prints `tokens used`), put it in the report.

## When a run is incomplete

The run is incomplete, not clean, when:

- the exit code is not zero, or the Bash call timed out;
- `out.txt` is empty;
- stderr shows an auth, quota or model error;
- the answer says that it could not read the diff, or that the sandbox
  stopped its commands.

Report the first lines of `err.txt`. Retry only for a cause that you found
and can fix. An auth error needs the owner: tell them the login command of
the tool (for example `codex login`) and let them run it. After an auth or
quota error, do not move to another tool on your own; ask (an idea from Trail
of Bits' skills). If the output shows that the tool read the agent folders
that the prompt excluded, say so and offer a retry.
