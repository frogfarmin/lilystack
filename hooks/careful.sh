#!/bin/bash
# Rewritten from gstack careful/bin/check-careful.sh at 466689b (MIT, Copyright (c) 2026 Garry Tan).
# lilystack careful: a PreToolUse hook for Bash commands. Reads the hook payload on stdin and answers
# deny or ask (hookSpecificOutput with permissionDecision) when the command matches a row of
# careful-patterns.txt beside this script. The first matching row wins.
# No match: no output, exit 0. jq missing, payload unreadable or rules missing: one stderr line, exit 2
# (the tool call is blocked; the hook fails closed).
set -u
die() { printf 'lilystack careful: %s\n' "$1" >&2; exit 2; }
command -v jq >/dev/null 2>&1 || die "jq is missing (brew install jq); blocking commands until it is installed"
payload=$(cat)
printf '%s' "$payload" | jq -e . >/dev/null 2>&1 || die "could not read the hook payload; blocking the command"
cmd=$(printf '%s' "$payload" | jq -r '.tool_input.command // empty')
[ -z "$cmd" ] && exit 0
rules="$(cd "$(dirname "$0")" && pwd)/careful-patterns.txt"
[ -r "$rules" ] || die "careful-patterns.txt is missing beside careful.sh; blocking the command"

# Load the rows, then test every regex in one grep; most commands match none and stop there.
tiers=(); names=(); reasons=(); regexes=(); unlesses=(); args=()
while IFS=$'\t' read -r tier name reason regex unless; do
  case "$tier" in ''|'#'*) continue ;; esac
  tiers+=("$tier"); names+=("$name"); reasons+=("$reason"); regexes+=("$regex"); unlesses+=("${unless:-}")
  args+=(-e "$regex")
done < "$rules"
[ ${#args[@]} -gt 0 ] || exit 0
printf '%s\n' "$cmd" | grep -qiE "${args[@]}" || exit 0

# One line for each part of a command list (split at ; && || and newlines, not at a pipe), so that
# the unless-regex of a row clears only the part it is in: in `npm publish --dry-run && npm publish`
# the second part still matches.
NL=$'\n'
segs=${cmd//&&/$NL}; segs=${segs//||/$NL}; segs=${segs//;/$NL}
# hit: a part matches row $i's regex and not its unless-regex
hit() {
  local m
  m=$(printf '%s\n' "$segs" | grep -iE -- "${regexes[$i]}") || return 1
  [ -z "${unlesses[$i]}" ] || printf '%s\n' "$m" | grep -qviE -- "${unlesses[$i]}"
}
i=0
while [ $i -lt ${#tiers[@]} ]; do
  if hit; then
    jq -cn --arg d "${tiers[$i]}" --arg r "lilystack careful: ${names[$i]}. ${reasons[$i]}" \
      '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:$d,permissionDecisionReason:$r}}'
    exit 0
  fi
  i=$((i + 1))
done
exit 0
