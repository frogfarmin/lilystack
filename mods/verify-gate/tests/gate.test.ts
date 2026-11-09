import { expect, test } from 'claude-code/testing'
import { bandRows, checksIn, emptyState, isMergeCommand, parseConf, parseGitStatus, recordRun, report, segments, verdict } from '../hooks/gate.ts'
import type { GateState } from '../hooks/gate.ts'

const FIVE = ['zsh tests/lint-skills.zsh', 'zsh tests/test-lint.zsh', 'zsh tests/test-hooks.zsh', 'zsh tests/test-lily.zsh', 'claude plugin validate .']
const clean = { branch: 'feature', hasUpstream: true, ahead: 0, dirty: 0, fp: 'tree1' }
const s = (over: Partial<GateState> = {}): GateState => ({ ...emptyState(), required: FIVE, confPath: '.claude/verify-gate.conf', git: clean, ...over })
const allPass = (at = 10, fp = 'tree1') => Object.fromEntries(FIVE.map((c) => [c, { command: c, ok: true, at, fp }]))

test('the conf drops comments and blank lines', async () => {
  expect(parseConf('# head\nzsh tests/a.zsh  # why\n\n  claude   plugin validate .\n')).toEqual(['zsh tests/a.zsh', 'claude plugin validate .'])
})

test('segments split chains, strip subshells and env, and mark pipes', async () => {
  expect(segments('(cd mods/status && claude plugin test) ; FOO=1 zsh tests/x.zsh | tail -3')).toEqual([
    { text: 'cd mods/status', isPiped: false },
    { text: 'claude plugin test', isPiped: false },
    { text: 'zsh tests/x.zsh', isPiped: true },
    { text: 'tail -3', isPiped: false },
  ])
})

test('checks: required prefixes, known commands, and pipes that never count', async () => {
  expect(checksIn('zsh tests/lint-skills.zsh && zsh tests/test-hooks.zsh', FIVE).counted).toEqual(['zsh tests/lint-skills.zsh', 'zsh tests/test-hooks.zsh'])
  expect(checksIn('zsh tests/lint-skills.zsh-old', FIVE).counted).toEqual([])
  expect(checksIn('zsh tests/test-lily.zsh | tail', FIVE)).toEqual({ counted: [], hidden: ['zsh tests/test-lily.zsh'] })
  expect(checksIn('npm run test -- --watch=false', []).counted).toEqual(['npm run test -- --watch=false'])
  expect(checksIn('cargo test && ls', []).counted).toEqual(['cargo test'])
  expect(checksIn('npm install', []).counted).toEqual([])
})

test('only gh pr merge is a merge; a local git merge is not', async () => {
  expect(isMergeCommand('gh pr merge 12 --squash')).toBe(true)
  expect(isMergeCommand('git fetch && gh pr merge --auto')).toBe(true)
  expect(isMergeCommand('git merge origin/main')).toBe(false)
  expect(isMergeCommand('gh pr view 12')).toBe(false)
})

test('git status: branch, upstream, ahead and dirty paths', async () => {
  expect(parseGitStatus('## feature...origin/feature [ahead 2]\n M a.ts\n?? b.ts\n')).toEqual({ branch: 'feature', hasUpstream: true, ahead: 2, dirty: 2 })
  expect(parseGitStatus('## feature\n')).toEqual({ branch: 'feature', hasUpstream: false, ahead: 0, dirty: 0 })
  expect(parseGitStatus('## No commits yet on main\n')).toEqual({ branch: 'main', hasUpstream: false, ahead: 0, dirty: 0 })
})

test('idle: no runs, no edits, a clean tree', async () => {
  expect(verdict(s()).status).toBe('idle')
  expect(bandRows(verdict(s()))[0].dim).toBe(true)
})

test('approved: all five pass on this tree, committed and pushed', async () => {
  const v = verdict(s({ runs: allPass() }))
  expect(v.status).toBe('approved')
  expect(bandRows(v)[0]).toEqual({ text: '✅ APPROVED · 5/5 checks pass · committed · pushed · clear to merge', color: 'green', bold: true })
})

test('blocked: a check to run, then the next one names it', async () => {
  const runs = allPass()
  delete runs['zsh tests/test-lily.zsh']
  const v = verdict(s({ runs }))
  expect(v.status).toBe('blocked')
  expect(v.reasons).toEqual(['1 of 5 checks to run'])
  expect(bandRows(v).map((r) => r.text)).toEqual(['⛔ NOT APPROVED · 1 of 5 checks to run', 'next: zsh tests/test-lily.zsh'])
})

test('blocked: a failed check comes first', async () => {
  const runs = allPass()
  runs['zsh tests/test-hooks.zsh'] = { command: 'zsh tests/test-hooks.zsh', ok: false, at: 10, fp: 'tree1' }
  const v = verdict(s({ runs }))
  expect(v.reasons).toEqual(['1 check failed'])
  expect(v.next).toBe('zsh tests/test-hooks.zsh')
})

test('blocked: an edit after the checks makes every check stale', async () => {
  const v = verdict(s({ runs: allPass(10), lastEditAt: 20, edited: ['a.ts'] }))
  expect(v.reasons).toEqual(['5 of 5 checks to run', '1 file edited since the checks'])
})

test('blocked: a change of the tree by Bash makes the checks stale', async () => {
  const v = verdict(s({ runs: allPass(10, 'tree0') }))
  expect(v.status).toBe('blocked')
  expect(v.passed).toBe(0)
})

test('a commit after the checks keeps the stamp: the tree is the same', async () => {
  // fp is the tree of the working copy, so it is equal before and after the commit
  expect(verdict(s({ runs: allPass(10, 'tree1'), git: { ...clean, ahead: 0 } })).status).toBe('approved')
})

test('git blocks: uncommitted, then unpushed, then no upstream; the band is yellow', async () => {
  const runs = allPass()
  const dirty = verdict(s({ runs, git: { ...clean, dirty: 3 } }))
  expect(dirty.reasons).toEqual(['3 files not committed'])
  expect(dirty.next).toBe('commit the changes')
  expect(bandRows(dirty)[0].color).toBe('yellow')
  expect(verdict(s({ runs, git: { ...clean, ahead: 2 } })).reasons).toEqual(['2 commits not pushed'])
  expect(verdict(s({ runs, git: { ...clean, hasUpstream: false } })).next).toBe('git push -u origin feature')
})

test('no conf: one fresh pass of any known check is enough', async () => {
  const st = s({ required: [], confPath: null, runs: { 'bun test': { command: 'bun test', ok: true, at: 5, fp: 'tree1' } } })
  expect(verdict(st).status).toBe('approved')
  expect(verdict({ ...st, lastFailed: 'bun test' }).reasons).toEqual(['a check failed'])
  expect(verdict({ ...st, runs: {}, lastEditAt: 3, edited: ['x'] }).reasons).toEqual(['no check ran', '1 file edited since the checks'])
})

test('outside git: the checks alone decide', async () => {
  expect(verdict(s({ git: null, runs: allPass(10, null as unknown as string) })).status).toBe('approved')
})

test('the report lists each check and the tree', async () => {
  const runs = allPass()
  delete runs['claude plugin validate .']
  const text = report(s({ runs, git: { ...clean, dirty: 1 } }))
  expect(text).toContain('verify-gate: ⛔ NOT APPROVED: 1 of 5 checks to run, 1 file not committed')
  expect(text).toContain('○ claude plugin validate .  not run')
  expect(text).toContain('Tree: 1 file not committed')
})

test('a check counts only when every operator after it is &&', async () => {
  expect(checksIn('zsh tests/lint-skills.zsh || true', FIVE).counted).toEqual([])
  expect(checksIn('zsh tests/lint-skills.zsh ; echo done', FIVE).counted).toEqual([])
  expect(checksIn('zsh tests/lint-skills.zsh\necho done', FIVE).counted).toEqual([])
  expect(checksIn('zsh tests/lint-skills.zsh &', FIVE).counted).toEqual([])
  expect(checksIn('zsh tests/lint-skills.zsh & zsh tests/test-lint.zsh', FIVE).counted).toEqual(['zsh tests/test-lint.zsh'])
  expect(checksIn('zsh tests/lint-skills.zsh && zsh tests/test-lint.zsh || echo no', FIVE).counted).toEqual([])
  expect(checksIn('(zsh tests/lint-skills.zsh) ; ls', FIVE).counted).toEqual([])
  expect(checksIn('echo go ; zsh tests/lint-skills.zsh', FIVE).counted).toEqual(['zsh tests/lint-skills.zsh'])
  expect(checksIn('zsh tests/lint-skills.zsh 2>&1 && zsh tests/test-lint.zsh >/dev/null 2>&1', FIVE).counted).toEqual(['zsh tests/lint-skills.zsh', 'zsh tests/test-lint.zsh'])
  expect(checksIn('zsh tests/lint-skills.zsh || true', FIVE).hidden).toEqual(['zsh tests/lint-skills.zsh'])
})

test('a failure stays until that same check passes', async () => {
  let st = emptyState()
  st = recordRun(st, ['bun test'], false, 1, null)
  expect(st.lastFailed).toBe('bun test')
  st = recordRun(st, ['tsc'], true, 2, null)
  expect(st.lastFailed).toBe('bun test')
  expect(verdict({ ...st, git: null }).reasons).toEqual(['a check failed'])
  st = recordRun(st, ['bun test'], true, 3, null)
  expect(st.lastFailed).toBe(null)
  expect(verdict({ ...st, git: null }).status).toBe('approved')
})

test('a merge hides behind no prefix, flag, api call or shell wrapper', async () => {
  for (const c of [
    'env gh pr merge 1',
    'env GH_TOKEN=x gh pr merge 1',
    'command gh pr merge 1',
    'sudo gh pr merge 1',
    'nohup gh pr merge 1',
    'timeout 30 gh pr merge 1',
    'gh -R o/r pr merge 1',
    'gh --repo o/r pr merge 1',
    'gh --repo=o/r pr merge 1',
    'gh api -X PUT repos/o/r/pulls/7/merge',
    'gh api --method PUT /repos/{owner}/{repo}/pulls/7/merge -f merge_method=squash',
    'bash -c "gh pr merge 1"',
    "sh -c 'git fetch && gh pr merge 1'",
    'zsh -lc "env gh pr merge 1"',
  ]) expect([c, isMergeCommand(c)]).toEqual([c, true])
  for (const c of ['gh pr view 1', 'gh api repos/o/r/pulls/7', 'bash -c "gh pr view 1"', 'git merge main', 'env FOO=1 ls']) {
    expect([c, isMergeCommand(c)]).toEqual([c, false])
  }
})

test('a check with no tree is stale when the tree now is known', async () => {
  expect(verdict(s({ runs: allPass(10, null as unknown as string) })).status).toBe('blocked')
})
