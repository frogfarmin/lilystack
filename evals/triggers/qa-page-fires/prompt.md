---
name: qa-page-fires
description: The qa skill starts on a request to test a local web page
tags: [trigger, fires, qa]
runs: 2
max_turns: 4
allowed_tools: [Read, Glob, Grep, Skill]
---
Test the signup page of my local web app at http://localhost:3000/signup for bugs: empty fields, error messages, keyboard use and phone width. Report what breaks.
