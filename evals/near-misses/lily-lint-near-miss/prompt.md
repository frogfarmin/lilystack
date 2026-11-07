---
name: lily-lint-near-miss
description: The lily-lint skill does not start on a request that only shares its words
tags: [trigger, near-miss, lily-lint]
runs: 2
max_turns: 4
allowed_tools: [Read, Glob, Grep, Skill]
---
Lint this JavaScript and tell me what is wrong: var x = 1; if (x = 2) { console.log(x) }
