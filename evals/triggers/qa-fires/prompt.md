---
name: qa-fires
description: The qa skill starts on a request that it is for
tags: [trigger, fires, qa]
runs: 2
max_turns: 4
allowed_tools: [Read, Glob, Grep, Skill]
---
Probe the command-line tool in this repo for bugs: bad input, missing flags, exit codes. Report what breaks.
