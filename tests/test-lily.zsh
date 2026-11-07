#!/usr/bin/env zsh
# Tests for bin/lily (Lilystack). Every case builds a fresh fixture (temp HOME + Lilypad root)
# and runs lily against it. Prints PASS/FAIL per check and a summary; exits 1 on any FAIL.
set -u
T=${0:A:h}
LILY=$T/../bin/lily
pass=0; fail=0; out=""; rc=0; tmp=""; tmps=()

assert() {
  local name=$1; shift
  if eval "$@" >/dev/null 2>&1; then (( pass++ )); print "PASS  $name"
  else (( fail++ )); print "FAIL  $name"; fi
}
has_line()  { grep -qE "^$1 +$2\$" <<< "$out" }
backup_of() { print -- $LILYPAD_BACKUP/*/${1#/} }
fixture() {
  tmp=$(mktemp -d); tmps+=($tmp)
  export HOME=$tmp/home LILYPAD_ROOT=$tmp/lily LILYPAD_BACKUP=$tmp/backup LILYPAD_SWEEP=$tmp/sweep
  mkdir -p $HOME $LILYPAD_ROOT/shell/completions $LILYPAD_ROOT/skills/one
  print "root zshrc" > $LILYPAD_ROOT/shell/zshrc
  touch $LILYPAD_ROOT/shell/completions/_a $LILYPAD_ROOT/skills/.gitkeep $LILYPAD_ROOT/skills/one/SKILL.md
  printf '%s\n' '# fixture' \
    'shell/zshrc        ~/.zshrc' \
    $'shell/completions\t~/.zsh/completions' \
    'skills/*           ~/.claude/skills/' \
    'nothere/file       ~/.nothere' > $LILYPAD_ROOT/links.conf
}

# --- check on a fresh HOME ---
fixture; out=$($LILY check); rc=$?
assert "check: file target missing"     'has_line missing $HOME/.zshrc'
assert "check: dir target missing (tab row)" 'has_line missing $HOME/.zsh/completions'
assert "check: per-child expands"       'has_line missing $HOME/.claude/skills/one'
assert "check: .gitkeep not expanded"   '! grep -q gitkeep <<< $out'
assert "check: absent source"           'has_line absent $HOME/.nothere'
assert "check: exit 1 when not ok"      '(( rc == 1 ))'

# --- each status ---
fixture
ln -s $LILYPAD_ROOT/shell/zshrc $HOME/.zshrc
mkdir -p $HOME/.zsh $HOME/.claude/skills; print x > $HOME/.zsh/completions
ln -s /etc/hosts $HOME/.claude/skills/one
out=$($LILY check); rc=$?
assert "check: ok"                      'has_line ok $HOME/.zshrc'
assert "check: file"                    'has_line file $HOME/.zsh/completions'
assert "check: wrong-link"              'has_line wrong-link $HOME/.claude/skills/one'
assert "check: exit 1 with file present" '(( rc == 1 ))'

# --- Review Focus 5: equivalent relative link is ok ---
fixture; ln -s ../lily/shell/zshrc $HOME/.zshrc; out=$($LILY check)
assert "check: relative link to source is ok" 'has_line ok $HOME/.zshrc'

# --- Review Focus 4: with LILYPAD_ROOT unset the root defaults to $HOME/Lilypad (not the script's own
# repo), run from / as a bare "lily" found on PATH through a symlink; the asserted row exists only in the fixture manifest ---
fixture; mkdir -p $tmp/pathbin; ln -s $LILY $tmp/pathbin/lily; ln -s $LILYPAD_ROOT $HOME/Lilypad
out=$(cd / && env -u LILYPAD_ROOT PATH=$tmp/pathbin:$PATH lily check)
assert "check: default root is \$HOME/Lilypad, found via PATH symlink from another cwd" 'has_line absent $HOME/.nothere'
fixture; out=$(cd / && env -u LILYPAD_ROOT $LILY check 2>&1); rc=$?
assert "check: no \$HOME/Lilypad and no override aborts with exit 2" '(( rc == 2 )) && [[ $out == *"no manifest at $HOME/Lilypad/links.conf"* ]]'

# --- Review Focus 1: trailing slash on a plain target ---
fixture; print 'shell/zshrc  ~/.zshrc2/' >> $LILYPAD_ROOT/links.conf; out=$($LILY check)
assert "check: trailing slash stripped"  'has_line missing $HOME/.zshrc2'
assert "check: no slash-terminated target" '! grep -q "/$" <<< $out'

# --- malformed lines (Review Focus 3 included) ---
fixture; print 'a b c' >> $LILYPAD_ROOT/links.conf; out=$($LILY check 2>&1); rc=$?
assert "parse: three fields aborts"     '(( rc == 2 )) && [[ $out == *"links.conf:6:"* ]]'
fixture; print '/abs/path ~/.x' >> $LILYPAD_ROOT/links.conf; out=$($LILY check 2>&1); rc=$?
assert "parse: absolute source aborts"  '(( rc == 2 )) && [[ $out == *"links.conf:6:"* ]]'
fixture; out=$($LILY 2>&1); rc=$?
assert "usage: no command exits 2"      '(( rc == 2 ))'

# --- link ---
fixture; $LILY link >/dev/null; out=$($LILY check); rc=$?
assert "link: file target linked"       '[[ $(readlink $HOME/.zshrc) == $LILYPAD_ROOT/shell/zshrc ]]'
assert "link: parent dirs created"      '[[ -L $HOME/.zsh/completions ]]'
assert "link: per-child linked"         '[[ $(readlink $HOME/.claude/skills/one) == $LILYPAD_ROOT/skills/one ]]'
assert "link: .gitkeep not linked"      '[[ ! -e $HOME/.claude/skills/.gitkeep ]]'
assert "link: absent source skipped"    '[[ ! -e $HOME/.nothere && ! -L $HOME/.nothere ]]'
assert "link: check exits 0 after"      '(( rc == 0 ))'
assert "link: links are absolute"       '[[ $(readlink $HOME/.zshrc) == /* ]]'

fixture; $LILY link >/dev/null; before=$(ls -la $HOME/.zshrc); $LILY link >/dev/null
assert "link: second run changes nothing" '[[ $(ls -la $HOME/.zshrc) == $before && ! -e $LILYPAD_BACKUP ]]'

fixture; print old > $HOME/.zshrc; out=$($LILY link)
assert "link: real file moved to backup" '[[ -L $HOME/.zshrc && $(cat $(backup_of $HOME/.zshrc)) == old ]]'
assert "link: backup reported"          '[[ $out == *"backup $HOME/.zshrc"* ]]'

fixture; ln -s /etc/hosts $HOME/.zshrc; $LILY link >/dev/null
assert "link: wrong link replaced"      '[[ $(readlink $HOME/.zshrc) == $LILYPAD_ROOT/shell/zshrc ]]'
assert "link: wrong link kept as link in backup" '[[ -L $(backup_of $HOME/.zshrc) ]]'

fixture; mkdir -p $HOME/.claude/skills/synced; $LILY link >/dev/null
assert "link: per-child leaves other entries" '[[ -d $HOME/.claude/skills/synced && ! -L $HOME/.claude/skills ]]'

fixture; out=$($LILY link --dry-run)
assert "link: dry-run creates nothing"  '[[ ! -e $HOME/.zshrc && ! -L $HOME/.zshrc ]]'
assert "link: dry-run prints actions"   '[[ $out == *"link $HOME/.zshrc"* ]]'

# --- adopt ---
fixture; rm $LILYPAD_ROOT/shell/zshrc; print mine > $HOME/.zshrc; $LILY adopt $HOME/.zshrc >/dev/null; rc=$?
assert "adopt: moves file into Lilypad"  '[[ $(cat $LILYPAD_ROOT/shell/zshrc) == mine ]]'
assert "adopt: links it back"            '[[ $(readlink $HOME/.zshrc) == $LILYPAD_ROOT/shell/zshrc ]]'
assert "adopt: exit 0"                   '(( rc == 0 ))'

fixture; rm -r $LILYPAD_ROOT/shell/completions; mkdir -p $HOME/.zsh/completions; touch $HOME/.zsh/completions/_b
$LILY adopt $HOME/.zsh/completions >/dev/null
assert "adopt: moves a directory"        '[[ -f $LILYPAD_ROOT/shell/completions/_b && -L $HOME/.zsh/completions ]]'

fixture; print "root zshrc" > $HOME/.zshrc; $LILY adopt $HOME/.zshrc >/dev/null; rc=$?
assert "adopt: identical target backed up and linked" '(( rc == 0 )) && [[ -L $HOME/.zshrc && -f $(backup_of $HOME/.zshrc) ]]'

fixture; print different > $HOME/.zshrc; out=$($LILY adopt $HOME/.zshrc 2>&1); rc=$?
assert "adopt: differing source refuses" '(( rc == 1 ))'
assert "adopt: shows a diff"             '[[ $out == *"root zshrc"* && $out == *different* ]]'
assert "adopt: leaves both files alone"  '[[ ! -L $HOME/.zshrc && $(cat $LILYPAD_ROOT/shell/zshrc) == "root zshrc" ]]'

fixture; out=$($LILY adopt $HOME/.unknown 2>&1); rc=$?
assert "adopt: unknown target errors"    '(( rc == 1 )) && [[ $out == *"not in links.conf"* ]]'

fixture; rm $LILYPAD_ROOT/shell/zshrc; print a > $HOME/.zshrc; mkdir -p $HOME/.zsh; print b > $HOME/.zsh/completions
rm -r $LILYPAD_ROOT/shell/completions; $LILY adopt >/dev/null
assert "adopt: no args adopts every real file" '[[ -L $HOME/.zshrc && -L $HOME/.zsh/completions ]]'

fixture; out=$($LILY adopt '~/.zshrc' 2>&1); rc=$?
assert "adopt: tilde argument accepted"  '(( rc == 0 ))'

# --- overlapping targets are refused before anything changes ---
fixture; print 'shell/completions/_a  ~/.zsh/completions/_a' >> $LILYPAD_ROOT/links.conf; out=$($LILY link 2>&1); rc=$?
assert "parse: target inside an earlier target aborts" '(( rc == 2 )) && [[ $out == *"links.conf:6:"* ]]'
assert "parse: overlap abort changes nothing"          '[[ ! -e $HOME/.zshrc && ! -L $HOME/.zshrc ]]'

# --- a target that already reaches the source through a linked parent is ok and never moved ---
fixture; ln -s $LILYPAD_ROOT/shell $HOME/.shell-link; print 'shell/zshrc  ~/.shell-link/zshrc' >> $LILYPAD_ROOT/links.conf
out=$($LILY check); $LILY link >/dev/null
assert "check: target resolving to source via linked parent is ok" 'has_line ok $HOME/.shell-link/zshrc'
assert "link: source reached via linked parent left alone" '[[ -f $LILYPAD_ROOT/shell/zshrc && ! -L $LILYPAD_ROOT/shell/zshrc && ! -e $LILYPAD_BACKUP ]]'

# --- strict arguments: a misspelt safety flag must not run for real ---
fixture; out=$($LILY link --dryrun 2>&1); rc=$?
assert "link: unknown flag exits 2"        '(( rc == 2 ))'
assert "link: unknown flag changes nothing" '[[ ! -e $HOME/.zshrc && ! -L $HOME/.zshrc ]]'
fixture; out=$($LILY check bogus 2>&1); rc=$?
assert "check: extra argument exits 2"     '(( rc == 2 ))'

# --- deferred review minors: target strictness, backup collisions, per-child dirs, dangling sources ---
fixture; print 'shell/zshrc  relative/target' >> $LILYPAD_ROOT/links.conf; out=$($LILY check 2>&1); rc=$?
assert "parse: relative target aborts"     '(( rc == 2 )) && [[ $out == *"links.conf:6:"* ]]'
fixture; print 'shell/zshrc  ~' >> $LILYPAD_ROOT/links.conf; out=$($LILY check 2>&1); rc=$?
assert "parse: bare ~ target aborts"       '(( rc == 2 )) && [[ $out == *"links.conf:6:"* ]]'

fixture; print one > $HOME/.zshrc; $LILY link >/dev/null; rm $HOME/.zshrc; print two > $HOME/.zshrc; $LILY link >/dev/null
assert "link: back-to-back backups both kept" '[[ $(find $LILYPAD_BACKUP -name .zshrc -type f | wc -l | tr -d " ") == 2 ]]'

fixture; print 'nodir/*  ~/.claude/nodir/' >> $LILYPAD_ROOT/links.conf; out=$($LILY check); $LILY link >/dev/null
assert "check: per-child row with no directory reports absent" 'grep -qF "absent     $HOME/.claude/nodir/*" <<< $out'
assert "link: per-child row with no directory creates nothing" '[[ ! -e $HOME/.claude/nodir ]]'

fixture; ln -s /nonexistent $LILYPAD_ROOT/dangling; print 'dangling  ~/.dangling' >> $LILYPAD_ROOT/links.conf; out=$($LILY check); $LILY link >/dev/null
assert "check: dangling source is absent"  'has_line absent $HOME/.dangling'
assert "link: dangling source not linked"  '[[ ! -e $HOME/.dangling && ! -L $HOME/.dangling ]]'

# --- lint: read-only bloat report over a git fixture ---
lint_fixture() {
  fixture
  print 'Shell area.' > $LILYPAD_ROOT/shell/README.md
  print 'Skills area.' > $LILYPAD_ROOT/skills/README.md
  git -C $LILYPAD_ROOT init -q && git -C $LILYPAD_ROOT add -A
}
lint_fixture; out=$($LILY lint); rc=$?
assert "lint: clean repo prints clean, exit 0" '(( rc == 0 )) && [[ $out == clean ]]'

lint_fixture; print x > $LILYPAD_ROOT/shell/new; out=$($LILY lint); rc=$?
assert "lint: untracked file reported, exit 1" 'has_line untracked shell/new && (( rc == 1 ))'

lint_fixture; print .DS_Store > $LILYPAD_ROOT/.gitignore; git -C $LILYPAD_ROOT add .gitignore
touch $LILYPAD_ROOT/shell/.DS_Store; out=$($LILY lint)
assert "lint: ignored files not reported"   '[[ $out == clean ]]'

lint_fixture; print x > $LILYPAD_ROOT/shell/stray; git -C $LILYPAD_ROOT add -A; out=$($LILY lint)
assert "lint: unmapped, unnamed file is orphan" 'has_line orphan shell/stray'
print 'Also holds `stray`.' >> $LILYPAD_ROOT/shell/README.md; out=$($LILY lint)
assert "lint: named in its area README is not orphan" '[[ $out == clean ]]'
lint_fixture; print x > $LILYPAD_ROOT/shell/stray; print 'See `shell/stray`.' > $LILYPAD_ROOT/README.md
git -C $LILYPAD_ROOT add -A; out=$($LILY lint)
assert "lint: named by repo path in another README is not orphan" '[[ $out == clean ]]'

lint_fixture; mkdir $LILYPAD_ROOT/ideas; print '# ideas <!-- lily:hub -->' > $LILYPAD_ROOT/ideas/README.md
print x > $LILYPAD_ROOT/ideas/new-game.md; git -C $LILYPAD_ROOT add -A; out=$($LILY lint)
assert "lint: file in a lily:hub folder is not orphan" '[[ $out == clean ]]'
print '# ideas' > $LILYPAD_ROOT/ideas/README.md; git -C $LILYPAD_ROOT add -A; out=$($LILY lint)
assert "lint: same folder without the marker is orphan" 'has_line orphan ideas/new-game.md'

lint_fixture; rm $LILYPAD_ROOT/shell/README.md; git -C $LILYPAD_ROOT add -A; out=$($LILY lint)
assert "lint: mapped area without README"   'has_line no-readme shell/'

lint_fixture
print 'Uses `shell/zshrc`, `~/.x/y.md`, `Support/z`, and `shell/gone.md`.' > $LILYPAD_ROOT/shell/README.md
git -C $LILYPAD_ROOT add -A; out=$($LILY lint)
assert "lint: missing repo path in README is dead-ref" 'has_line dead-ref "shell/README.md: shell/gone.md"'
assert "lint: system paths and existing paths not dead-ref" '(( $(grep -c "^dead-ref" <<< $out) == 1 ))'

lint_fixture; head -c 200000 /dev/zero > $LILYPAD_ROOT/shell/big; git -C $LILYPAD_ROOT add -A; out=$($LILY lint)
assert "lint: file over 100 KB is large"     'grep -qE "^large +shell/big \(195 KB\)" <<< $out'

fixture; out=$($LILY lint 2>&1); rc=$?
assert "lint: outside a git repo exits 2"    '(( rc == 2 )) && [[ $out == *"git repository"* ]]'

# --- sweep: move repo paths to the dated sweep folder, never delete ---
swept() { print -- $LILYPAD_SWEEP/lilypad-sweep-*/$1 }
lint_fixture; print x > $LILYPAD_ROOT/shell/stray; git -C $LILYPAD_ROOT add -A
out=$($LILY sweep shell/stray); rc=$?
assert "sweep: tracked file moved to dated folder" '(( rc == 0 )) && [[ ! -e $LILYPAD_ROOT/shell/stray && $(cat $(swept shell/stray)) == x ]]'
assert "sweep: removal staged"                     '[[ -z $(git -C $LILYPAD_ROOT ls-files shell/stray) ]]'

lint_fixture; print y > $LILYPAD_ROOT/shell/new; out=$($LILY sweep $LILYPAD_ROOT/shell/new 2>&1); rc=$?
assert "sweep: untracked file by absolute path"    '(( rc == 0 )) && [[ -f $(swept shell/new) ]]'

lint_fixture; print x > $LILYPAD_ROOT/shell/stray; out=$($LILY sweep shell/stray shell/zshrc 2>&1); rc=$?
assert "sweep: mapped source refused"              '(( rc == 1 )) && [[ $out == *"refuse shell/zshrc"* ]]'
assert "sweep: one refusal moves nothing"          '[[ -f $LILYPAD_ROOT/shell/stray && ! -e $LILYPAD_SWEEP ]]'
out=$($LILY sweep shell 2>&1); rc=$?
assert "sweep: folder holding a source refused"    '(( rc == 1 )) && [[ -f $LILYPAD_ROOT/shell/zshrc ]]'
out=$($LILY sweep ../home 2>&1); rc=$?
assert "sweep: path outside the root refused"      '(( rc == 1 )) && [[ -d $HOME ]]'

lint_fixture; $LILY sweep shell/completions/_a >/dev/null
assert "sweep: emptied mapped folder gets .gitkeep" '[[ -f $LILYPAD_ROOT/shell/completions/.gitkeep && -n $(git -C $LILYPAD_ROOT ls-files shell/completions/.gitkeep) ]]'
lint_fixture; mkdir $LILYPAD_ROOT/notes; print n > $LILYPAD_ROOT/notes/a.md; git -C $LILYPAD_ROOT add -A
$LILY sweep notes/a.md >/dev/null
assert "sweep: emptied unmapped folder removed"    '[[ ! -e $LILYPAD_ROOT/notes ]]'

lint_fixture; print 1 > $LILYPAD_ROOT/shell/stray; $LILY sweep shell/stray >/dev/null; print 2 > $LILYPAD_ROOT/shell/stray
out=$($LILY sweep shell/stray 2>&1); rc=$?
assert "sweep: existing destination never overwritten" '(( rc == 1 )) && [[ $(cat $(swept shell/stray)) == 1 && -f $LILYPAD_ROOT/shell/stray ]]'

lint_fixture; print x > $LILYPAD_ROOT/shell/stray; out=$($LILY sweep --dry-run shell/stray)
assert "sweep: dry-run moves nothing"              '[[ -f $LILYPAD_ROOT/shell/stray && ! -e $LILYPAD_SWEEP && $out == "would sweep shell/stray"* ]]'
lint_fixture; $LILY sweep >/dev/null 2>&1; rc=$?
assert "sweep: no path exits 2"                    '(( rc == 2 ))'

# --- pull: fast-forward Lilystack then Lilypad; throwaway repos with a bare origin, no network ---
# make_repo <name>: bare origin $tmp/origin-<name>.git, a working clone at $tmp/<name>, one commit pushed
# from it; a second clone $tmp/up-<name> stands in for "the owner pushed from the other Mac".
make_repo() {
  git init -q --bare -b main $tmp/origin-$1.git
  git clone -q $tmp/origin-$1.git $tmp/$1 2>/dev/null
  git -C $tmp/$1 -c user.name=t -c user.email=t@t commit -q --allow-empty -m one
  git -C $tmp/$1 push -q origin HEAD:main 2>/dev/null; git -C $tmp/$1 branch -q -u origin/main 2>/dev/null
  git clone -q $tmp/origin-$1.git $tmp/up-$1 2>/dev/null
}
push_more() { git -C $tmp/up-$1 -c user.name=t -c user.email=t@t commit -q --allow-empty -m "$2"; git -C $tmp/up-$1 push -q origin HEAD:main 2>/dev/null }
# pull_fixture: a copy of lily inside a fake Lilystack clone, so its own repo root is $tmp/stack
pull_fixture() {
  fixture; make_repo pad; make_repo stack
  export LILYPAD_ROOT=$tmp/pad
  mkdir -p $tmp/stack/bin; cp $LILY $tmp/stack/bin/lily; PULL=$tmp/stack/bin/lily
}
pull_fixture; push_more pad two; push_more stack two
out=$($PULL pull 2>&1); rc=$?
assert "pull: exit 0 when both fast-forward"     '(( rc == 0 ))'
assert "pull: Lilypad advanced"                  '[[ $(git -C $tmp/pad log --format=%s -1) == two ]]'
assert "pull: Lilystack (the script repo) advanced" '[[ $(git -C $tmp/stack log --format=%s -1) == two ]]'
assert "pull: reports each repo"                 '[[ $out == *"ok   Lilystack: "*"->"* && $out == *"ok   Lilypad: "*"->"* ]]'
assert "pull: Lilystack is pulled before Lilypad" '[[ ${out[(i)Lilystack]} -lt ${out[(i)Lilypad]} ]]'

pull_fixture; out=$($PULL pull 2>&1); rc=$?
assert "pull: nothing new is ok, exit 0"         '(( rc == 0 )) && [[ $out == *"Lilystack: up to date"* && $out == *"Lilypad: up to date"* ]]'

pull_fixture; push_more pad two; push_more stack two
git -C $tmp/pad -c user.name=t -c user.email=t@t commit -q --allow-empty -m local
out=$($PULL pull 2>&1); rc=$?
assert "pull: diverged Lilypad fails, exit 1"    '(( rc == 1 )) && [[ $out == *"fail Lilypad"* ]]'
assert "pull: diverged repo left alone"          '[[ $(git -C $tmp/pad log --format=%s -1) == local ]]'
assert "pull: the other repo is still pulled"    '[[ $(git -C $tmp/stack log --format=%s -1) == two && $out == *"ok   Lilystack"* ]]'

pull_fixture; rm -rf $tmp/pad/.git; out=$($PULL pull 2>&1); rc=$?
assert "pull: a non-git Lilypad is reported, exit 1" '(( rc == 1 )) && [[ $out == *"fail Lilypad: "*"not a git repository"* ]]'

pull_fixture; out=$($PULL pull extra 2>&1); rc=$?
assert "pull: extra argument exits 2"            '(( rc == 2 ))'

pull_fixture; push_more pad two; out=$($PULL check 2>&1)
assert "pull: other subcommands never pull"      '[[ $(git -C $tmp/pad log --format=%s -1) == one ]]'

print "$pass passed, $fail failed"
rm -rf $tmps
exit $(( fail > 0 ))
