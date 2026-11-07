#!/bin/bash
# Rewritten from gstack freeze/bin/check-freeze.sh and freeze/bin/freeze-state.sh at 466689b (MIT,
# Copyright (c) 2026 Garry Tan); the Bash-write parser (2026-11-06) is new work.
# lilystack freeze: keep edits inside one directory.
#   freeze.sh                 the PreToolUse hook for Edit, Write, MultiEdit, NotebookEdit and Bash
#                             (payload on stdin)
#   freeze.sh set <dir>       freeze the project to <dir>; prints the absolute boundary
#   freeze.sh clear           lift the freeze; prints "unfrozen"
#   freeze.sh status          prints the boundary, or "no freeze"
# The boundary lives in ~/.lilystack/freeze/<key>, key = 16 hex of the sha-256 of the git toplevel
# (else the working directory), so two repos never share a freeze. The hook allows when no
# boundary file exists, so /lilystack:unfreeze leaves the registered hook harmless.
# A file tool outside the boundary is denied. A Bash command that writes a file outside it asks.
# jq missing, payload unreadable or lib-path.sh missing: one stderr line, exit 2 (blocked; fails closed).
set -u
die() { printf 'lilystack freeze: %s\n' "$1" >&2; exit "${2:-2}"; }
command -v jq >/dev/null 2>&1 || die "jq is missing (brew install jq); blocking edits until it is installed"
here=$(cd "$(dirname "$0")" && pwd)
[ -r "$here/lib-path.sh" ] || die "lib-path.sh is missing beside freeze.sh; blocking edits"
. "$here/lib-path.sh"   # resolve <path> <cwd>

# key_for <dir>: the project key for a directory
key_for() {
  local root
  root=$(git -C "$1" rev-parse --show-toplevel 2>/dev/null) || root=$(cd -P "$1" && pwd)
  printf '%s' "$root" | shasum -a 256 | cut -c1-16
}
state_dir="$HOME/.lilystack/freeze"

case "${1:-}" in
  set)
    [ -n "${2:-}" ] || die "usage: freeze.sh set <dir>" 1
    b=$(resolve "$2" "$PWD"); [ -d "$b" ] || die "$b is not a directory" 1
    mkdir -p "$state_dir" && printf '%s\n' "$b" > "$state_dir/$(key_for "$PWD")" && printf '%s\n' "$b"; exit 0 ;;
  clear)
    rm -f "$state_dir/$(key_for "$PWD")"; echo unfrozen; exit 0 ;;
  status)
    f="$state_dir/$(key_for "$PWD")"; { [ -r "$f" ] && head -n1 "$f"; } || echo "no freeze"; exit 0 ;;
  "") ;;
  *) die "unknown command $1" 1 ;;
esac

# --- Bash: the files a command writes. A heuristic, not a parser: words are split with quotes,
# backslashes and comments honoured, heredoc bodies dropped and $HOME expanded; a word holding any
# other $ expansion is marked unknown (a leading \001) and never resolved.
D=$'\001'; O=$'\002'; TAB=$'\t'; NL=$'\n'   # D marks an unknown word, O an operator
# strip_heredocs <cmd>: print the command without the body lines of its heredocs
strip_heredocs() {
  local line t delim="" re='(^|[^<])<<-?[[:space:]]*\\?["'\'']?([A-Za-z_][A-Za-z0-9_]*)'
  while IFS= read -r line || [ -n "$line" ]; do
    if [ -n "$delim" ]; then
      t=$line; while [ "${t#"$TAB"}" != "$t" ]; do t=${t#"$TAB"}; done
      [ "$t" = "$delim" ] && delim=""
      continue
    fi
    printf '%s\n' "$line"
    # look for << only outside quotes and comments: `echo "a<<EOF"` starts no heredoc
    # a quoted delimiter (<<'EOF', <<"EOF") loses its quotes first, so that the next step keeps it
    t=$(printf '%s\n' "$line" | sed -E "s/<<(-?)[[:space:]]*\\\\?[\"']([A-Za-z_][A-Za-z0-9_]*)[\"']/<<\\1\\2/g; s/'[^']*'//g; s/\"([^\"\\\\]|\\\\.)*\"//g; s/(^|[[:space:]])#.*$//")
    if [[ $t =~ $re ]]; then delim=${BASH_REMATCH[2]}; fi
  done <<< "$1"
}
# words <cmd>: split into W, one shell word or operator per element (operators: ; ;; & && | || |& ( )
# and the redirections > >> >| &> &>> >& < << <<< <&, each with a leading \002, so an escaped \; stays a
# word); a digit word just before > or < is dropped as an fd number. Characters are read through a
# 256-byte window (win, starting at ws), because ${s:i:1} copies the whole string each time.
w=""; have=0; dyn=0; W=()
flush() { if [ $have = 1 ]; then if [ $dyn = 1 ]; then W+=("$D$w"); else W+=("$w"); fi; fi; w=""; have=0; dyn=0; }
op() { flush; W+=("$O$1"); }
words() {
  local s=$1 n=${#1} i=0 ws=0 win=${1:0:256} j c x depth bt=0
  W=(); w=""; have=0; dyn=0
  while [ $i -lt $n ]; do
    j=$((i - ws)); if [ $j -ge 192 ]; then ws=$i; win=${s:i:256}; j=0; fi
    c=${win:j:1}; x=${win:j+1:1}
    case "$c" in
      ' '|"$TAB") flush ;;
      "$NL") op ';' ;;
      \\) i=$((i + 1)); [ "$x" = "$NL" ] || { w="$w$x"; have=1; } ;;
      \') x=${s:i+1}; x=${x%%\'*}; w="$w$x"; have=1; i=$((i + ${#x} + 1)) ;;
      \") have=1; i=$((i + 1))
          while [ $i -lt $n ]; do
            j=$((i - ws)); if [ $j -ge 192 ]; then ws=$i; win=${s:i:256}; j=0; fi
            c=${win:j:1}; x=${win:j+1:1}
            case "$c" in
              \") break ;;
              \\) case "$x" in \"|\\|\$|\`) w="$w$x"; i=$((i + 1)) ;; "$NL") i=$((i + 1)) ;; *) w="$w\\" ;; esac ;;
              \$) if [ "${win:j:7}" = '${HOME}' ]; then w="$w$HOME"; i=$((i + 6))
                  elif [ "${win:j:5}" = '$HOME' ] && [[ ! ${win:j+5:1} =~ [A-Za-z0-9_] ]]; then w="$w$HOME"; i=$((i + 4))
                  else dyn=1; w="$w\$"
                    if [ "$x" = '(' ]; then depth=0   # skip the substitution: its text is not a path
                      while [ $i -lt $n ]; do
                        j=$((i - ws)); if [ $j -ge 192 ]; then ws=$i; win=${s:i:256}; j=0; fi
                        case "${win:j:1}" in '(') depth=$((depth + 1)) ;; ')') depth=$((depth - 1)); [ $depth = 0 ] && break ;; esac
                        i=$((i + 1))
                      done
                    fi
                  fi ;;
              \`) dyn=1; w="$w\`"; x=${s:i+1}; x=${x%%\`*}; i=$((i + ${#x} + 1)) ;;   # skip `...`: not a path
              *) x=${win:j}; x=${x%%[\"\\\$\`]*}; [ -n "$x" ] || x=$c   # a run of plain text; always move on
                 w="$w$x"; i=$((i + ${#x} - 1)) ;;
            esac
            i=$((i + 1))
          done ;;
      \$) if [ "$x" = '(' ]; then op '('; i=$((i + 1))
          elif [ "${win:j:7}" = '${HOME}' ]; then w="$w$HOME"; have=1; i=$((i + 6))
          elif [ "${win:j:5}" = '$HOME' ] && [[ ! ${win:j+5:1} =~ [A-Za-z0-9_] ]]; then w="$w$HOME"; have=1; i=$((i + 4))
          else w="$w\$"; have=1; dyn=1; fi ;;
      \`) if [ $bt = 0 ]; then op '('; bt=1; else op ')'; bt=0; fi ;;
      \#) if [ $have = 0 ]; then x=${s:i}; x=${x%%"$NL"*}; i=$((i + ${#x} - 1)); else w="$w#"; fi ;;
      ';') if [ "$x" = ';' ]; then op ';;'; i=$((i + 1)); else op ';'; fi ;;
      '&') case "$x" in
             '&') op '&&'; i=$((i + 1)) ;;
             '>') if [ "${win:j+2:1}" = '>' ]; then op '&>>'; i=$((i + 2)); else op '&>'; i=$((i + 1)); fi ;;
             *) op '&' ;;
           esac ;;
      '|') case "$x" in '|') op '||'; i=$((i + 1)) ;; '&') op '|&'; i=$((i + 1)) ;; *) op '|' ;; esac ;;
      '('|')') op "$c" ;;
      '>'|'<')
        if [ $have = 1 ] && [ $dyn = 0 ] && [[ $w =~ ^[0-9]+$ ]]; then w=""; have=0; fi
        case "$c$x" in
          '>>'|'>|'|'>&'|'<&'|'<>') op "$c$x"; i=$((i + 1)) ;;
          '>('|'<(') op '('; i=$((i + 1)) ;;
          '<<') if [ "${win:j+2:1}" = '<' ]; then op '<<<'; i=$((i + 2)); else op '<<'; i=$((i + 1)); fi ;;
          *) op "$c" ;;
        esac ;;
      *) x=${win:j}; x=${x%%[[:space:]\\\'\"\$\`\;\&\|\(\)\<\>]*}; [ -n "$x" ] || x=$c   # a run of plain text
         w="$w$x"; have=1; i=$((i + ${#x} - 1)) ;;
    esac
    i=$((i + 1))
  done
  flush
}
# note <word>: record a written path with the current base; unknown words, find's {} and the
# standard streams are skipped
TB=(); TP=(); base=""; PD=(); SS=()   # PD: the pushd stack; SS: base at each open subshell
note() {
  case "$1" in ''|"$D"*|-|'{}'|/dev/null|/dev/stdout|/dev/stderr|/dev/tty|/dev/fd/*) return ;; esac
  TB+=("$base"); TP+=("$1")
}
# analyze <word>...: note the files one simple command writes, and follow cd
analyze() {
  local cmd a ops=() inplace=0 script=0 td=0 endopts=0 sub=()
  while [ $# -gt 0 ]; do   # skip assignments and wrapper commands with their options
    case "$1" in
      sudo|doas|command|builtin|exec|nohup|time|nice|env|xargs|timeout|gtimeout|watch|stdbuf|caffeinate|then|do|else|if|while|until|'!'|'{')
        cmd=$1; shift
        while [ $# -gt 0 ]; do
          case "$cmd:$1" in
            sudo:-[ugCDhpRTU]|nice:-n|env:-[uCSP]|xargs:-[InPLdEsa]|timeout:-[sk]|gtimeout:-[sk]|watch:-[nd]|stdbuf:-[ioe]|caffeinate:-[tw]) shift; [ $# -gt 0 ] && shift ;;
            *:-*) shift ;;
            env:[A-Za-z_]*=*) shift ;;
            *) break ;;
          esac
        done
        case "$cmd" in timeout|gtimeout) [ $# -gt 0 ] && shift ;; esac ;;   # the duration
      [A-Za-z_]*=*) a=${1%%=*}; case "$a" in *[!A-Za-z0-9_]*) break ;; esac; shift ;;
      *) break ;;
    esac
  done
  [ $# -gt 0 ] || return 0
  cmd=${1##*/}; shift
  case "$cmd" in
    popd) if [ ${#PD[@]} -gt 0 ]; then base=${PD[$((${#PD[@]} - 1))]}; unset "PD[$((${#PD[@]} - 1))]"; fi ;;
    cd|pushd)
      [ "$cmd" = pushd ] && PD+=("$base")
      while [ $# -gt 0 ] && [ "${1#-}" != "$1" ] && [ "$1" != - ]; do shift; done
      if [ $# = 0 ]; then base=$HOME
      elif [ "$1" = - ]; then :
      elif [ "${1#"$D"}" != "$1" ]; then base=""
      else case "$1" in /*|"~"|"~/"*) base=$(resolve "$1" /) ;; *) [ -n "$base" ] && base=$(resolve "$1" "$base") ;; esac
      fi ;;
    tee)
      while [ $# -gt 0 ]; do
        a=$1; shift
        if [ $endopts = 0 ] && [ "$a" = -- ]; then endopts=1; continue; fi
        if [ $endopts = 0 ] && [ "${a#-}" != "$a" ] && [ "$a" != - ]; then continue; fi
        note "$a"
      done ;;
    sed|gsed|perl)
      while [ $# -gt 0 ]; do
        a=$1; shift
        if [ $endopts = 1 ] || [ "${a#-}" = "$a" ] || [ "$a" = - ]; then ops+=("$a"); continue; fi
        if [ "$a" = -- ]; then endopts=1
        elif [ "$cmd" = perl ]; then
          if [[ $a =~ ^-[0-9lnpaswWXtTc]*i ]]; then inplace=1
          elif [[ $a =~ ^-[0-9lnpaswWXtTc]*[eE]$ ]]; then script=1; [ $# -gt 0 ] && shift
          elif [[ $a =~ ^-[0-9lnpaswWXtTc]*[eE]. ]]; then script=1; fi
        else
          case "$a" in
            --in-place*) inplace=1 ;;
            --expression=*|--file=*) script=1 ;;
            --expression|--file) script=1; [ $# -gt 0 ] && shift ;;
            --*) ;;
            *) if [[ $a =~ ^-[nrEsuz]*i ]]; then
                 inplace=1; [ "$a" = -i ] && [ $# -gt 0 ] && [ -z "$1" ] && shift   # BSD sed -i ''
               elif [[ $a =~ ^-[a-zA-Z]*[ef]$ ]]; then script=1; [ $# -gt 0 ] && shift
               elif [[ $a =~ ^-[a-zA-Z]*[ef]. ]]; then script=1
               elif [ "$a" = -l ]; then [ $# -gt 0 ] && shift; fi ;;
          esac
        fi
      done
      if [ $inplace = 1 ] && [ ${#ops[@]} -gt 0 ]; then
        [ $script = 0 ] && ops=("${ops[@]:1}")
        if [ ${#ops[@]} -gt 0 ]; then for a in "${ops[@]}"; do note "$a"; done; fi
      fi ;;
    cp|mv|install|ln|gcp|gmv|ginstall|gln)
      while [ $# -gt 0 ]; do
        a=$1; shift
        if [ $endopts = 1 ] || [ "${a#-}" = "$a" ]; then ops+=("$a"); continue; fi
        case "$a" in
          --) endopts=1 ;;
          -t|--target-directory) [ $# -gt 0 ] && { note "$1"; td=1; shift; } ;;
          --target-directory=*) note "${a#*=}"; td=1 ;;
          -t*) note "${a#-t}"; td=1 ;;
          -S|--suffix|-m|--mode|-o|--owner|-g|--group) [ $# -gt 0 ] && shift ;;
        esac
      done
      if [ ${#ops[@]} -gt 0 ]; then
        [ $td = 0 ] && [ ${#ops[@]} -ge 2 ] && note "${ops[$((${#ops[@]} - 1))]}"
        # mv also changes each source's folder: the file leaves it
        case "$cmd" in mv|gmv) for a in "${ops[@]}"; do note "$a"; done ;; esac
      fi ;;
    dd) while [ $# -gt 0 ]; do case "$1" in of=*) note "${1#of=}" ;; esac; shift; done ;;
    find)
      while [ $# -gt 0 ]; do
        case "$1" in
          -exec|-execdir|-ok|-okdir)
            shift; sub=()
            while [ $# -gt 0 ] && [ "$1" != ';' ] && [ "$1" != '+' ]; do sub+=("$1"); shift; done
            [ ${#sub[@]} -gt 0 ] && analyze "${sub[@]}" ;;
        esac
        [ $# -gt 0 ] && shift
      done ;;
  esac
  return 0
}
# bash_writes <cmd> <cwd>: fill TB and TP with every path the command writes
bash_writes() {
  local k cw=() expect=""
  base=$2; TB=(); TP=(); PD=(); SS=()
  words "$(strip_heredocs "$1")"
  W+=("$O;")   # ends the last command
  for k in "${W[@]}"; do
    if [ -n "$expect" ]; then   # the word after a redirection
      case "$expect:$k" in
        *:"$O"*) ;;
        out:*) note "$k" ;;
        dup:*[!0-9-]*) note "$k" ;;
      esac
      expect=""; continue
    fi
    case "$k" in
      "$O>"|"$O>>"|"$O>|"|"$O&>"|"$O&>>"|"$O<>") expect=out ;;
      "$O>&") expect=dup ;;
      "$O<"|"$O<<"|"$O<<<"|"$O<&") expect=in ;;
      "$O(") if [ ${#cw[@]} -gt 0 ]; then analyze "${cw[@]}"; fi; cw=(); SS+=("$base") ;;
      "$O)") if [ ${#cw[@]} -gt 0 ]; then analyze "${cw[@]}"; fi; cw=()
             if [ ${#SS[@]} -gt 0 ]; then base=${SS[$((${#SS[@]} - 1))]}; unset "SS[$((${#SS[@]} - 1))]"; fi ;;
      "$O"*) if [ ${#cw[@]} -gt 0 ]; then analyze "${cw[@]}"; fi; cw=() ;;
      *) cw+=("$k") ;;
    esac
  done
}

payload=$(cat)
printf '%s' "$payload" | jq -e . >/dev/null 2>&1 || die "could not read the hook payload; blocking the edit"
tool=$(printf '%s' "$payload" | jq -r '.tool_name // empty')
case "$tool" in Edit|Write|MultiEdit|NotebookEdit|Bash) ;; *) exit 0 ;; esac
cwd=$(printf '%s' "$payload" | jq -r '.cwd // empty'); [ -n "$cwd" ] || cwd=$PWD

if [ "$tool" = Bash ]; then
  cmd=$(printf '%s' "$payload" | jq -r '.tool_input.command // empty')
  [ -n "$cmd" ] || exit 0
  f="$state_dir/$(key_for "$cwd")"; [ -r "$f" ] || exit 0
  b=$(head -n1 "$f")
  export LC_ALL=C   # byte-wise indexing: faster, and the same bytes come back out
  bash_writes "$cmd" "$cwd"
  i=0; seen=$NL
  while [ $i -lt ${#TP[@]} ]; do
    p=${TP[$i]}; pb=${TB[$i]}; i=$((i + 1))
    case "$seen" in *"$NL$pb$TAB$p$NL"*) continue ;; esac   # resolve each path once
    seen="$seen$pb$TAB$p$NL"
    case "$p" in /*|"~"|"~/"*) ;; *) [ -n "$pb" ] || continue ;; esac
    target=$(resolve "$p" "${pb:-/}")
    [ "$target" = "$b" ] && continue
    case "$target" in "$b"/*) continue ;; esac
    jq -cn --arg r "lilystack freeze: this command writes $target, outside $b; approve it, or run /lilystack:unfreeze to lift the boundary" \
      '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"ask",permissionDecisionReason:$r}}'
    exit 0
  done
  exit 0
fi

path=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // .tool_input.notebook_path // empty')
[ -n "$path" ] || exit 0
f="$state_dir/$(key_for "$cwd")"; [ -r "$f" ] || exit 0
b=$(head -n1 "$f")
target=$(resolve "$path" "$cwd")
[ "$target" = "$b" ] && exit 0
case "$target" in "$b"/*) exit 0 ;; esac
jq -cn --arg r "lilystack freeze: $target is outside $b; run /lilystack:unfreeze to lift it" \
  '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
exit 0
