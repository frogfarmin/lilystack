#!/bin/bash
# Rewritten from claude-plugins-official plugins/security-guidance/hooks/security_reminder_hook.py at
# a1ecfbc (Apache-2.0, Copyright Anthropic, PBC; changed): bash and ERE, and a stateless pre-existing filter.
# lilystack secure: a warn-only PreToolUse hook for Edit, Write, MultiEdit and NotebookEdit. Reads the
# hook payload on stdin. When the new text adds a risky sink listed in secure-patterns.txt beside this
# script, it answers with additionalContext naming each rule and its fix, and no permission decision,
# so the normal permission flow runs. A rule that also matches the old text (Edit and MultiEdit
# old_string; for Write and NotebookEdit, the file already on disk) is skipped. No match or another
# tool: no output, exit 0. jq missing, payload unreadable or rules missing: one stderr line, exit 2
# (the edit is blocked; the hook fails closed). Nothing is logged or stored.
set -u
die() { printf 'lilystack secure: %s\n' "$1" >&2; exit 2; }
command -v jq >/dev/null 2>&1 || die "jq is missing (brew install jq); blocking edits until it is installed"
payload=$(cat)
printf '%s' "$payload" | jq -e . >/dev/null 2>&1 || die "could not read the hook payload; blocking the edit"
here=$(cd "$(dirname "$0")" && pwd)
rules="$here/secure-patterns.txt"
[ -r "$rules" ] || die "secure-patterns.txt is missing beside secure.sh; blocking the edit"
[ -r "$here/lib-path.sh" ] || die "lib-path.sh is missing beside secure.sh; blocking the edit"
. "$here/lib-path.sh"   # absolute

j() { printf '%s' "$payload" | jq -r "$1"; }
tool=$(j '.tool_name // empty')
case "$tool" in Edit|Write|MultiEdit|NotebookEdit) ;; *) exit 0 ;; esac
path=$(j '.tool_input.file_path // .tool_input.notebook_path // empty')
cwd=$(j '.cwd // empty'); [ -n "$cwd" ] || cwd=$PWD
old=""
case "$tool" in
  Edit) new=$(j '.tool_input.new_string // empty'); old=$(j '.tool_input.old_string // empty') ;;
  MultiEdit)
    new=$(j '[.tool_input.edits[]? | .new_string // empty] | join("\n")')
    old=$(j '[.tool_input.edits[]? | .old_string // empty] | join("\n")') ;;
  *)
    [ "$(j '.tool_input.edit_mode // empty')" = delete ] && exit 0
    new=$(j '.tool_input.content // .tool_input.new_source // empty')
    f=$(absolute "$path" "$cwd")
    if [ -n "$path" ] && [ -f "$f" ] && [ -r "$f" ]; then old=$(cat -- "$f" 2>/dev/null); fi ;;
esac
[ -n "$new" ] || exit 0

# Load the rows, then test every regex on the new text in one grep; most edits match none.
names=(); gates=(); reasons=(); regexes=(); unlesses=(); args=()
while IFS=$'\t' read -r tier name gate reason regex unless; do
  [ "$tier" = warn ] || continue
  names+=("$name"); gates+=("$gate"); reasons+=("$reason"); regexes+=("$regex"); unlesses+=("${unless:-}")
  args+=(-e "$regex")
done < "$rules"
[ ${#args[@]} -gt 0 ] || exit 0
printf '%s\n' "$new" | grep -qE "${args[@]}" || exit 0

# has <text>: a line of <text> matches row $i's regex and not its unless-regex
has() {
  local m
  m=$(printf '%s\n' "$1" | grep -E -- "${regexes[$i]}") || return 1
  [ -z "${unlesses[$i]}" ] || printf '%s\n' "$m" | grep -qvE -- "${unlesses[$i]}"
}
nl=$'\n'; hits=""; i=0
while [ $i -lt ${#names[@]} ]; do
  gate=${gates[$i]}; i_ok=1
  case "$gate" in
    '*') ;;
    '!'*) printf '%s\n' "$path" | grep -qiE -- "${gate#!}" && i_ok=0 ;;
    *) printf '%s\n' "$path" | grep -qiE -- "$gate" || i_ok=0 ;;
  esac
  if [ $i_ok = 1 ] && has "$new" && ! { [ -n "$old" ] && has "$old"; }; then
    hits="$hits${hits:+$nl}lilystack secure: ${names[$i]}. ${reasons[$i]}"
  fi
  i=$((i + 1))
done
[ -n "$hits" ] || exit 0
jq -cn --arg c "$hits" '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:$c}}'
exit 0
