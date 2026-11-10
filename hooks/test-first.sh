#!/bin/bash
# Rewritten from tdd-guard src/hooks/fileTypeDetection.ts and docs/enforcement.md at ffb7026 (MIT,
# Copyright (c) 2025 Nizar Selander); the gate is a check of git state, with no model call.
# lilystack test-first: a PreToolUse hook for Edit, Write and MultiEdit. When the target is a source file
# (by extension) and not a test file, and git status shows no added, modified, renamed or untracked test
# file in that file's working tree, it answers ask: write the failing test first. Outside git, and for
# any other file or tool: no output, exit 0. No state, no network, no test run. jq missing, payload
# unreadable or of the wrong shape, or lib-path.sh missing: one stderr line, exit 2 (the edit is
# blocked; the hook fails closed).
set -u
die() { printf 'lilystack test-first: %s\n' "$1" >&2; exit 2; }
command -v jq >/dev/null 2>&1 || die "jq is missing (brew install jq); blocking edits until it is installed"
here=$(cd "$(dirname "$0")" && pwd)
[ -r "$here/lib-path.sh" ] || die "lib-path.sh is missing beside test-first.sh; blocking the edit"
. "$here/lib-path.sh"   # resolve
payload=$(cat)
# the shape: an object; tool_input an object; each field read below a string
printf '%s' "$payload" | jq -e 'type == "object" and ((.tool_input // {}) | type) == "object"
  and all(.tool_name, .cwd, (.tool_input | .file_path); . == null or type == "string")' \
  >/dev/null 2>&1 || die "could not read the hook payload, or it has the wrong shape; blocking the edit"
j() { printf '%s' "$payload" | jq -r "$1"; }
bad="could not read the hook payload; blocking the edit"
tool=$(j '.tool_name // empty') || die "$bad"
case "$tool" in Edit|Write|MultiEdit) ;; *) exit 0 ;; esac
path=$(j '.tool_input.file_path // empty') || die "$bad"; [ -n "$path" ] || exit 0
cwd=$(j '.cwd // empty') || die "$bad"; [ -n "$cwd" ] || cwd=$PWD

# File shapes, after tdd-guard's fileTypeDetection.ts. A test file matches test_re by its path inside
# the repo; a source file has one of the src_re extensions.
test_re='\.(test|spec)\.|(^|/)(tests?|__tests__|spec)/|_test\.(go|py)$|(^|/)test_[^/]+\.py$|_spec\.rb$|Tests?\.(php|swift|kt|java)$'
src_re='\.(ts|tsx|js|jsx|mjs|cjs|py|go|rb|rs|swift|php|kt|java|sh|zsh)$'
printf '%s\n' "$path" | grep -qE -- "$src_re" || exit 0

abs=$(resolve "$path" "$cwd")
dir=$(dirname "$abs"); while [ ! -d "$dir" ]; do dir=$(dirname "$dir"); done
top=$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null) || exit 0
top=$(resolve "$top" /)
rel=${abs#"$top"/}
printf '%s\n' "$rel" | grep -qE -- "$test_re" && exit 0

# porcelain -z: "XY path" per entry, no quoting; a rename adds the old path as a bare entry
git -C "$top" status --porcelain -z --untracked-files=all 2>/dev/null | tr '\0' '\n' \
  | grep -E '^([AMRC?].|.[AMRC?]) ' | cut -c4- | grep -qE -- "$test_re" && exit 0
jq -cn --arg r "lilystack test-first: No test file has changed in this working tree yet. Write the failing test first, or approve to skip." \
  '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"ask",permissionDecisionReason:$r}}'
exit 0
