---
name: secure
description: Warn, without blocking, when an edit adds a risky sink such as eval, shell=True, innerHTML, pickle or TLS checks turned off
disable-model-invocation: true
hooks:
  PreToolUse:
    - matcher: "Edit|Write|MultiEdit|NotebookEdit"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/hooks/secure.sh"
          statusMessage: "lilystack secure: checking the new code"
---
<!-- Lilystack. Rewritten from claude-plugins-official plugins/security-guidance/hooks/patterns.py and plugins/security-guidance/hooks/security_reminder_hook.py at a1ecfbc (Apache-2.0, Copyright Anthropic, PBC; changed). -->

# secure: a reminder when new code adds a risky sink

Secure mode is now on for the rest of this session. Every Edit, Write,
MultiEdit and NotebookEdit is checked before it runs by `hooks/secure.sh`
against the rules in `hooks/secure-patterns.txt`. Tell the user that, in one
line. It never blocks: a match adds a note to the conversation and the edit
goes through the normal permission flow.

**What it watches**, in the new text only:

- **Command injection:** `child_process.exec` and `execSync` (JS), `os.system`
  (Python), `subprocess` with `shell=True`, Go `exec.Command("sh", ...)`.
- **Code from strings:** `eval(` (not `model.eval()`, not in docs) and
  `new Function(` (JS).
- **XSS sinks** (JS and TS): `innerHTML`, `outerHTML`, `insertAdjacentHTML`,
  `document.write`, `dangerouslySetInnerHTML`.
- **Unsafe loading:** pickle and its kin (cPickle, cloudpickle, dill, marshal,
  shelve, joblib, `pandas.read_pickle`, `numpy.load` with `allow_pickle=True`),
  `yaml.load` without a safe loader, `torch.load` without
  `weights_only=True`, the standard-library XML parsers.
- **Crypto and transport:** TLS verification turned off, AES in ECB mode,
  Node's `crypto.createCipher`.
- **Supply chain:** a remote `<script src>` with no `integrity`, and untrusted
  event text inside `${{ }}` in a GitHub Actions workflow.

A rule that also matches the old text is skipped, so a sink that was there
before the edit does not warn again: for Edit and MultiEdit the old text is
`old_string`, for Write and NotebookEdit it is the file on disk.

**When a note arrives,** read it and act on it before you go on. Either change
the code to the safe form the note names, or, if the sink is safe or needed
here, add a short comment in the code that says why. Do not reword the code
only to dodge the pattern.

## Limits

- It is text matching on single lines, not analysis. A call split over
  several lines, or a sink reached through an alias, can slip past; a safe
  use can still warn.
- It sees the file tools only. Code written through the shell (`sed -i`, a
  heredoc) is not checked.
- It does not judge where the input comes from. `/lilystack:review` looks at
  the whole diff later.
- Missing jq blocks every edit with a message naming the fix, rather than
  letting edits through.

To change a rule, edit a line of `hooks/secure-patterns.txt`;
`tests/test-hooks.zsh` pins each rule with a hit and a pre-existing case, plus
the near misses (`model.eval()`, `yaml.safe_load`, `re.exec`). The hook stays registered until this session ends.
