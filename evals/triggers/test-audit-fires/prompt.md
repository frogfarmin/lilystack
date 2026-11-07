---
name: test-audit-fires
description: The test-audit skill starts on a request that it is for
tags: [trigger, fires, test-audit]
runs: 2
max_turns: 4
allowed_tools: [Read, Glob, Grep, Skill]
---
Our test suite is slow and full of tests that never catch anything. Find the tests that add no value and could be retired.
