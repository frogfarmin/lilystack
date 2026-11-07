---
name: plan-eng-review-fires
description: The plan-eng-review skill starts on a request that it is for
tags: [trigger, fires, plan-eng-review]
runs: 2
max_turns: 4
allowed_tools: [Read, Glob, Grep, Skill]
---
Do an engineering review of the plan in docs/plans/billing.md: lock the architecture, the data flow, the failure modes and the test matrix.
