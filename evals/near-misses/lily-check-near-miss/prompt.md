---
name: lily-check-near-miss
description: The lily-check skill does not start on a request that only shares its words
tags: [trigger, near-miss, lily-check]
runs: 2
max_turns: 4
allowed_tools: [Read, Glob, Grep, Skill]
---
Check whether this regex matches email addresses: ^\S+@\S+$
