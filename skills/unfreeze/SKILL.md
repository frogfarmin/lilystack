---
name: unfreeze
description: Lift the freeze boundary so edits may touch any directory again
disable-model-invocation: true
---
<!-- Lilystack. Rewritten from gstack unfreeze/SKILL.md.tmpl and freeze/bin/freeze-state.sh at 466689b (MIT, Copyright (c) 2026 Garry Tan). -->

# unfreeze: lift the boundary

```bash
bash "${CLAUDE_PLUGIN_ROOT}/hooks/freeze.sh" clear
```

It prints `unfrozen`. Tell the user edits and shell writes may touch any
directory again. If a freeze hook was registered earlier in this session it
stays registered and now allows everything, because no boundary file exists;
`/lilystack:freeze` sets a new one. Careful, secrets and secure, if on, are
unaffected.
