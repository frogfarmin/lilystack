---
name: verify-fires
description: The verify skill starts on a request that it is for
tags: [trigger, fires, verify]
runs: 2
max_turns: 4
allowed_tools: [Read, Glob, Grep, Skill]
---
Run this repo's checks and the tests that cover my change, and keep fixing until everything is green.
