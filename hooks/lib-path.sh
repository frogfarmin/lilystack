# lilystack lib-path: path helpers sourced by freeze.sh, secrets.sh, secure.sh and test-first.sh (bash 3.2 safe).
#
# resolve <path> <cwd>: print the absolute path, with ~ expanded, . and .. collapsed, and symlinks
# resolved at any depth. The deepest existing ancestor is resolved with cd -P; the part below it,
# which may not exist yet, is walked one name at a time, and a symlink met there (a dangling one
# too) is followed to its target. After 40 links it stops following, so a link loop ends.
resolve() {
  local p=$1 base=$2 depth=${3:-0} dir rest="" full part target
  case "$p" in "~") p=$HOME ;; "~/"*) p="$HOME/${p#\~/}" ;; esac
  case "$p" in /*) ;; *) p="$base/$p" ;; esac
  dir=$p
  while [ ! -d "$dir" ]; do rest="/$(basename "$dir")$rest"; dir=$(dirname "$dir"); done
  full=$(cd -P "$dir" 2>/dev/null && pwd) || full=$dir
  rest=${rest#/}
  while [ -n "$rest" ]; do
    case "$rest" in */*) part=${rest%%/*}; rest=${rest#*/} ;; *) part=$rest; rest="" ;; esac
    case "$part" in ''|.) continue ;; ..) full=$(dirname "$full"); continue ;; esac
    full="${full%/}/$part"
    if [ -L "$full" ] && [ "$depth" -lt 40 ]; then
      target=$(readlink "$full")
      case "$target" in /*) ;; *) target="$(dirname "$full")/$target" ;; esac
      resolve "$target${rest:+/$rest}" "$base" $((depth + 1)); return
    fi
  done
  printf '%s' "$full"
}

# absolute <path> <cwd>: ~ expanded and made absolute against <cwd>, with no other change.
absolute() {
  local p=$1
  case "$p" in "~") p=$HOME ;; "~/"*) p="$HOME/${p#\~/}" ;; esac
  case "$p" in /*) printf '%s' "$p" ;; *) printf '%s' "${2%/}/$p" ;; esac
}
