---
name: build-near-miss
description: The build skill does not start on a request that only shares its words
tags: [trigger, near-miss, build]
runs: 2
max_turns: 4
allowed_tools: [Read, Glob, Grep, Skill]
---
Our webpack build takes four minutes on CI. What usually makes a production build that slow?
