---
name: security-audit-fires
description: The security-audit skill starts on a request that it is for
tags: [trigger, fires, security-audit]
runs: 2
max_turns: 4
allowed_tools: [Read, Glob, Grep, Skill]
---
Do a full security audit of this whole repository: secrets in the git history, dependencies, CI workflows and auth.
