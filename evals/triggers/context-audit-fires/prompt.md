---
name: context-audit-fires
description: The context-audit skill starts on a request that it is for
tags: [trigger, fires, context-audit]
runs: 2
max_turns: 4
allowed_tools: [Read, Glob, Grep, Skill]
---
Is our CLAUDE.md still accurate? Grade it against the code and tell me what is stale.
