#!/bin/bash
# Rewritten from gstack careful/bin/check-careful.sh at 466689b (MIT, Copyright (c) 2026 Garry Tan).
# lilystack careful: a PreToolUse hook for Bash commands. Reads the hook payload on stdin and answers
# deny or ask (hookSpecificOutput with permissionDecision) when the command matches a row of
# careful-patterns.txt beside this script. The first matching row wins.
# No match: no output, exit 0. jq missing, payload unreadable or of the wrong shape (not an object,
# tool_input not an object, command not a string) or rules missing: one stderr line, exit 2 (the tool
# call is blocked; the hook fails closed).
set -u
die() { printf 'lilystack careful: %s\n' "$1" >&2; exit 2; }
command -v jq >/dev/null 2>&1 || die "jq is missing (brew install jq); blocking commands until it is installed"
payload=$(cat)
# one jq call checks the shape (an object, tool_input an object, command a string) and reads the command
cmd=$(printf '%s' "$payload" | jq -er 'if type == "object" and ((.tool_input // {}) | type) == "object"
    and ((.tool_input.command // "") | type) == "string" then .tool_input.command // "" else error("bad shape") end' 2>/dev/null) \
  || die "could not read the hook payload; blocking the command"
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
# stages: the parts again, also split at an unquoted | and with an unquoted comment (# at the start
# of a word) cut off; made once, for the rows with an unless-regex, so that `npm publish # --dry-run`
# and `npm publish | grep -- --dry-run` do not satisfy it
stages=""; have_stages=0
make_stages() {
  [ $have_stages = 1 ] && return
  have_stages=1
  stages=$(printf '%s\n' "$segs" | awk '{
    out = ""; q = ""; prev = " "
    for (k = 1; k <= length($0); k++) {
      c = substr($0, k, 1)
      if (q == "") {
        if (c == "\\") { out = out c substr($0, k + 1, 1); k++; prev = "x"; continue }
        if (c == "#" && (prev == " " || prev == "\t")) break
        if (c == "|") { print out; out = ""; prev = " "; continue }
        if (c == "\047" || c == "\"") q = c
      } else if (c == q) q = ""
      else if (q == "\"" && c == "\\") { out = out c substr($0, k + 1, 1); k++; continue }
      out = out c; prev = c
    }
    print out
  }')
}
# hit: a part matches row $i's regex and not its unless-regex; with an unless-regex, a pipe stage
# without its comment must match the regex and not the unless-regex
hit() {
  local m
  if [ -z "${unlesses[$i]}" ]; then printf '%s\n' "$segs" | grep -qiE -- "${regexes[$i]}"; return; fi
  make_stages
  m=$(printf '%s\n' "$stages" | grep -iE -- "${regexes[$i]}") || return 1
  printf '%s\n' "$m" | grep -qviE -- "${unlesses[$i]}"
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
