#!/usr/bin/env zsh
# Tests for tests/lint-skills.zsh. Every case builds a fixture skills folder in a
# temp dir and runs the lint on it. Prints PASS/FAIL per check and a summary; exits 1 on any FAIL.
set -u
T=${0:A:h}
LINT=$T/lint-skills.zsh
pass=0; fail=0; out=""; rc=0; SK=""; tmps=()

assert() {
  local name=$1; shift
  if eval "$@" >/dev/null 2>&1; then (( pass++ )); print "PASS  $name"
  else (( fail++ )); print "FAIL  $name"; fi
}
has_line() { grep -qE "^$1 +$2\$" <<< "$out" }
fixture() { local tmp=$(mktemp -d); tmps+=($tmp); SK=$tmp/skills; mkdir -p $SK }
skill() { mkdir -p $SK/$1; print -r -- "$2" > $SK/$1/SKILL.md }   # skill <name> <content>
run() { out=$(zsh $LINT $SK 2>&1); rc=$? }

FM=$'---\nname: NAME\ndescription: A skill that does one thing\n---'
PROV='<!-- Lilystack. Rewritten from gstack NAME/SKILL.md.tmpl at 466689b (MIT, Copyright (c) 2026 Garry Tan). -->'
good() { print -r -- "${FM//NAME/$1}"$'\n'"${PROV//NAME/$1}"$'\n'"${2:-Do the thing.}" }

# --- an empty folder and a good skill ---
fixture; run
assert "empty folder is clean"            '[[ $out == clean ]] && (( rc == 0 ))'
fixture; skill good "$(good good $'Read `sections/one.md` first.\nThen set aside the rest.')"
mkdir -p $SK/good/sections; touch $SK/good/sections/one.md
run
assert "good skill is clean"              '[[ $out == clean ]] && (( rc == 0 ))'
assert "prose 'set aside' is not browser" '! grep -q browser <<< $out'
fixture; skill orig "${FM//NAME/orig}"$'\n<!-- Lilystack. Original. Not from gstack. -->\nDo the thing.'
run
assert "original provenance is clean"     '[[ $out == clean ]] && (( rc == 0 ))'
fixture
skill other "${FM//NAME/other}"$'\n<!-- Lilystack. Rewritten from superpowers skills/tdd/SKILL.md at 22f0b46 (MIT, Copyright (c) 2025 Jesse Vincent). -->\nDo the thing.'
skill two "${FM//NAME/two}"$'\n<!-- Lilystack. Rewritten from gstack spec/SKILL.md.tmpl at 466689b (MIT, Copyright (c) 2026 Garry Tan) and spec-kit templates/commands/specify.md at d649834 (MIT, Copyright GitHub, Inc.). -->\nDo the thing.'
run
assert "another upstream's provenance is clean" '[[ $out == clean ]] && (( rc == 0 ))'

# --- one fixture per rule ---
fixture
skill nofm $'name: nofm\ndescription: x\n'"$PROV"
skill noname $'---\ndescription: x\n---\n'"$PROV"
skill nodesc $'---\nname: nodesc\n---\n'"$PROV"
skill noprov "${FM//NAME/noprov}"$'\nBody first, no comment.'
skill nopin "${FM//NAME/nopin}"$'\n<!-- Lilystack. Rewritten from superpowers skills/tdd/SKILL.md (MIT). -->\nNo commit named.'
skill noclose "${FM//NAME/noclose}"$'\n<!-- Lilystack. Rewritten from superpowers skills/tdd/SKILL.md at 22f0b46 (MIT).\nComment not closed on the line.'
skill gs1 "$(good gs1 'Run ~/.claude/skills/gstack/bin/x')"
skill gs2 "$(good gs2 'Run gstack-skill-start')"
skill gs3 "$(good gs3 'GSTACK_STATE_ROOT=1')"
skill long "$(good long "$(repeat 500 print x)")"
skill fine "$(good fine "$(repeat 440 print x)")"
skill net "$(good net $'Research with gh api and curl https://example.com when the task needs it.\nUse mcp__claude-in-chrome__navigate to test the page.')"
skill dead "$(good dead 'Read sections/missing.md now')"
skill deadesc "$(good deadesc $'Run tr \'\\n\' \'\\0\' first.\nRead sections/missing.md now')"
skill ship "${FM//NAME/ship}"$'\n'"${PROV//NAME/ship}"$'\nShip it.'
skill careful "${FM//NAME/careful}"$'\n'"${PROV//NAME/careful}"$'\nBe careful.'
skill secrets "${FM//NAME/secrets}"$'\n<!-- Lilystack. Original. A hook skill. -->\nKeep keys private.'
skill second-opinion "${FM//NAME/second-opinion}"$'\n<!-- Lilystack. Original. Asks another model. -->\nAsk first.'
skill hooked $'---\nname: hooked\ndescription: x\nhooks:\n  PreToolUse: []\n---\n<!-- Lilystack. Original. A hook. -->\nHook.'
skill investigate $'---\nname: investigate\ndescription: x\nhooks:\n  PreToolUse: []\n---\n<!-- Lilystack. Original. The exception. -->\nFreeze on request.'
run
assert "exit 1 with findings"             '(( rc == 1 ))'
assert "no-frontmatter"                   'has_line no-frontmatter $SK/nofm/SKILL.md'
assert "no-name"                          'has_line no-name $SK/noname/SKILL.md'
assert "no-description"                   'has_line no-description $SK/nodesc/SKILL.md'
assert "no-provenance"                    'has_line no-provenance $SK/noprov/SKILL.md'
assert "no-provenance: no commit"         'has_line no-provenance $SK/nopin/SKILL.md'
assert "no-provenance: comment not closed" 'has_line no-provenance $SK/noclose/SKILL.md'
assert "gstack-ref: skills path"          'has_line gstack-ref $SK/gs1/SKILL.md'
assert "gstack-ref: helper name"          'has_line gstack-ref $SK/gs2/SKILL.md'
assert "gstack-ref: GSTACK_ variable"     'has_line gstack-ref $SK/gs3/SKILL.md'
assert "too-long over 500 lines"          'has_line too-long $SK/long/SKILL.md'
assert "445 lines is not too long"        '! grep -q "$SK/fine/" <<< $out'
assert "network and browser text is allowed" '! grep -q "$SK/net/" <<< $out'
assert "dead-section"                     'has_line dead-section $SK/dead/SKILL.md'
assert "dead-section after a NUL escape"   'has_line dead-section $SK/deadesc/SKILL.md'
assert "no-disable: ship"                 'has_line no-disable $SK/ship/SKILL.md'
assert "no-disable: careful"              'has_line no-disable $SK/careful/SKILL.md'
assert "no-disable: secrets"              'has_line no-disable $SK/secrets/SKILL.md'
assert "no-disable: second-opinion"       'has_line no-disable $SK/second-opinion/SKILL.md'
assert "no-disable: any skill with hooks:" 'has_line no-disable $SK/hooked/SKILL.md'
assert "investigate may keep its hook"    '! grep -q "$SK/investigate/" <<< $out'
assert "good skill not listed"            '! grep -q "$SK/good/" <<< $out'

# --- the disable flag satisfies no-disable; a comment-only gstack- token is fine ---
fixture
skill ship $'---\nname: ship\ndescription: x\ndisable-model-invocation: true\n---\n'"${PROV//NAME/ship}"$'\nShip it.'
skill gscomment "${FM//NAME/gscomment}"$'\n<!-- Lilystack. Rewritten from gstack gscomment/SKILL.md.tmpl and openclaw/skills/gstack-openclaw-office-hours/SKILL.md at 466689b (MIT, Copyright (c) 2026 Garry Tan). -->\nNamed only in the comment above.'
run
assert "ship with the flag is clean"      '[[ $out == clean ]] && (( rc == 0 ))'
assert "gstack- only in the comment is fine" '! grep -q gscomment <<< $out'

# --- plugin agents beside the skills folder ---
fixture
R=${SK:h}
mkdir -p $R/agents
print -r -- $'---\nname: lens\ndescription: A read-only lens\ntools: Read, Grep, Glob\nmodel: inherit\n---\nRead only.' > $R/agents/lens.md
print -r -- $'---\nname: list\ndescription: A writer\ntools: [Read, Edit, Bash]\nmodel: sonnet\n---\nEdits.' > $R/agents/list.md
run
assert "agents with a tools list are clean" '[[ $out == clean ]] && (( rc == 0 ))'
print -r -- $'---\nname: all\ndescription: Every tool\n---\nAnything.' > $R/agents/all.md
print -r -- $'---\nname: empty\ndescription: Empty list\ntools:\n---\nNothing.' > $R/agents/empty.md
run
assert "agent-tools: no tools list"       'has_line agent-tools $R/agents/all.md'
assert "agent-tools: an empty tools line" 'has_line agent-tools $R/agents/empty.md'
assert "agents with a list not listed"    '! grep -qE "agents/(lens|list)\.md" <<< $out'

for t in $tmps; do rm -rf $t; done
print "$pass passed, $fail failed"
(( fail == 0 ))
