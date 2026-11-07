---
name: autoplan-fires
description: The autoplan skill starts on a request that it is for
tags: [trigger, fires, autoplan]
runs: 2
max_turns: 4
allowed_tools: [Read, Glob, Grep, Skill]
---
Run all the plan reviews on docs/plans/billing.md in one go: scope, design, developer experience and engineering, and only ask me what you cannot decide.
