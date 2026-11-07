#!/usr/bin/env zsh
# Lint for Lilystack's skills: every <dir>/*/SKILL.md against the diet rules in AGENTS.md, plus the
# plugin agents beside <dir> (<dir>/../agents).
#   zsh tests/lint-skills.zsh [skills-dir]      default: the repo's skills/
# Prints `clean` and exits 0, or one `<rule>  <path>` line per finding and exits 1.
# Rules: no-frontmatter | no-name | no-description | no-provenance |
#        no-disable (a named skill, or a skill with a hooks: key other than investigate) |
#        gstack-ref | too-long (more than 500 lines) | dead-section |
#        agent-tools (an agent in <dir>/../agents with no explicit tools list)
# The provenance comment is the first line after the frontmatter. It is one of:
#   <!-- Lilystack. Rewritten from <project> <paths> at <commit> (<license>, <copyright>). -->
#   <!-- Lilystack. Original. ... -->
# A rewrite names the upstream project, its paths and a 7-to-40-digit commit. Token scans skip
# lines that are a whole HTML comment, so the comment may name an upstream path such as
# openclaw/skills/gstack-openclaw-retro.
set -u
dir=${1:-${0:A:h}/../skills}
findings=0
finding() { print -- "$1  $2"; (( findings++ )) }
for f in $dir/*/SKILL.md(N); do
  name=${f:h:t}
  lines=("${(@f)$(<$f)}")
  body_start=1
  if [[ ${lines[1]:-} != '---' ]]; then
    finding no-frontmatter $f
  else
    fm_end=0
    for (( i=2; i<=${#lines}; i++ )); do [[ ${lines[i]} == '---' ]] && { fm_end=$i; break }; done
    if (( fm_end == 0 )); then
      finding no-frontmatter $f
    else
      fm=("${(@)lines[2,fm_end-1]}")
      print -rl -- $fm | grep -qE '^name:[[:space:]]*[^[:space:]]' || finding no-name $f
      print -rl -- $fm | grep -qE '^description:[[:space:]]*[^[:space:]]' || finding no-description $f
      # ship and the named skills, and each skill that registers a hook, set the flag. investigate is
      # the one exception: its freeze hook does nothing until the owner sets a boundary.
      needs=0
      case $name in ship|careful|freeze|guard|unfreeze|lily-sweep|second-opinion|secrets|secure|test-first) needs=1 ;; esac
      print -rl -- $fm | grep -qE '^hooks:' && [[ $name != investigate ]] && needs=1
      (( needs )) && { print -rl -- $fm | grep -qE '^disable-model-invocation:[[:space:]]*true' || finding no-disable $f }
      body_start=$(( fm_end + 1 ))
      grep -qE '^<!-- Lilystack\. (Rewritten from [A-Za-z0-9._-]+ .+ at [0-9a-f]{7,40}[ ,;)].*|Original\..*)-->$' <<< "${lines[body_start]:-}" || finding no-provenance $f
    fi
  fi
  scan=$(print -rl -- "${(@)lines[body_start,-1]}" | grep -v -E '^[[:space:]]*<!--.*-->[[:space:]]*$')
  grep -qE '~/\.claude/skills/gstack|gstack-|GSTACK_' <<< "$scan" && finding gstack-ref $f
  (( ${#lines} > 500 )) && finding too-long $f
  for sec in ${(f)"$(grep -oE 'sections/[A-Za-z0-9._-]+\.md' <<< "$scan" | sort -u)"}; do
    [[ -n $sec && ! -f $f:h/$sec ]] && finding dead-section $f
  done
done
root=${dir:h}
for a in $root/agents/*.md(N); do
  alines=("${(@f)$(<$a)}")
  afm=()
  if [[ ${alines[1]:-} == '---' ]]; then
    for (( i=2; i<=${#alines}; i++ )); do [[ ${alines[i]} == '---' ]] && break; afm+=("${alines[i]}"); done
  fi
  print -rl -- $afm | grep -qE '^tools:[[:space:]]*[^[:space:]]' || finding agent-tools $a
done
(( findings == 0 )) && print clean
exit $(( findings > 0 ))
