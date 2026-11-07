#!/bin/bash
# lilystack secrets: a PreToolUse hook for Read, Edit, Write, MultiEdit, NotebookEdit, Grep and Bash.
# Reads the hook payload on stdin and answers deny or ask (hookSpecificOutput with permissionDecision)
# when a path, command or written text matches a row of secrets-patterns.txt beside this script; the
# first matching row wins. Another tool, or no match: no output, exit 0. jq missing, payload
# unreadable, or a file beside this script missing: one stderr line, exit 2 (the call is blocked; the
# hook fails closed). Nothing is logged or stored.
set -u
die() { printf 'lilystack secrets: %s\n' "$1" >&2; exit 2; }
command -v jq >/dev/null 2>&1 || die "jq is missing (brew install jq); blocking file and shell tools until it is installed"
here=$(cd "$(dirname "$0")" && pwd)
[ -r "$here/lib-path.sh" ] || die "lib-path.sh is missing beside secrets.sh; blocking the call"
. "$here/lib-path.sh"   # resolve, absolute
payload=$(cat)
printf '%s' "$payload" | jq -e . >/dev/null 2>&1 || die "could not read the hook payload; blocking the call"
rules="$here/secrets-patterns.txt"
[ -r "$rules" ] || die "secrets-patterns.txt is missing beside secrets.sh; blocking the call"

j() { printf '%s' "$payload" | jq -r "$1"; }
tool=$(j '.tool_name // empty')
case "$tool" in Read|Grep|Bash) writes=0 ;; Edit|Write|MultiEdit|NotebookEdit) writes=1 ;; *) exit 0 ;; esac
cwd=$(j '.cwd // empty'); [ -n "$cwd" ] || cwd=$PWD
cmd=""; text=""; cands=""
if [ "$tool" = Bash ]; then
  cmd=$(j '.tool_input.command // empty'); text=$cmd
else
  text=$(j '[.tool_input.content, .tool_input.new_string, (.tool_input.edits[]?.new_string), .tool_input.new_source]
            | map(select(type == "string")) | join("\n")')
  # each path three ways: as given, absolute against cwd with ~ expanded, and symlink-resolved
  while IFS= read -r p; do
    [ -n "$p" ] || continue
    cands="$cands$p"$'\n'"$(absolute "$p" "$cwd")"$'\n'"$(resolve "$p" "$cwd")"$'\n'
  done <<EOF
$(j '[.tool_input.file_path, .tool_input.notebook_path, (if .tool_name == "Grep" then .tool_input.path else empty end)]
     | map(select(type == "string" and . != "")) | .[]')
EOF
fi

# Load the rows, then test every regex in one grep; most calls match none and stop there.
tiers=(); scopes=(); names=(); reasons=(); regexes=(); unlesses=(); args=()
while IFS=$'\t' read -r tier scope name reason regex unless; do
  case "$tier" in ''|'#'*) continue ;; esac
  tiers+=("$tier"); scopes+=("$scope"); names+=("$name"); reasons+=("$reason")
  regexes+=("$regex"); unlesses+=("${unless:-}"); args+=(-e "$regex")
done < "$rules"
[ ${#args[@]} -gt 0 ] || exit 0
printf '%s\n' "$cands" "$text" | grep -qiE "${args[@]}" || exit 0

# matches <subject>: a line of the subject matches row $i's regex and not its unless-regex, so a
# safe name on one line (.env.example) does not clear a live one on another (.env)
matches() {
  local m
  m=$(printf '%s\n' "$1" | grep -iE -- "${regexes[$i]}") || return 1
  [ -z "${unlesses[$i]}" ] || printf '%s\n' "$m" | grep -qviE -- "${unlesses[$i]}"
}
# the command split at ; && || and newlines, one part for each line (not at a pipe)
NL=$'\n'
segs=${cmd//&&/$NL}; segs=${segs//||/$NL}; segs=${segs//;/$NL}
answer() {
  jq -cn --arg d "${tiers[$i]}" --arg r "lilystack secrets: ${names[$i]}. ${reasons[$i]}" \
    '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:$d,permissionDecisionReason:$r}}'
  exit 0
}
i=0
while [ $i -lt ${#tiers[@]} ]; do
  case "${scopes[$i]}" in
    path|write)
      if [ "${scopes[$i]}" = path ] || [ $writes = 1 ]; then
        while IFS= read -r c; do [ -n "$c" ] && matches "$c" && answer; done <<EOF
$cands
EOF
      fi ;;
    bash) [ -n "$cmd" ] && matches "$segs" && answer ;;
    text) [ -n "$text" ] && matches "$text" && answer ;;
  esac
  i=$((i + 1))
done
exit 0
