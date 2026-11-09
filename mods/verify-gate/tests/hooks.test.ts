import { expect, mock, test } from 'claude-code/testing'

const ROOT = '/Users/me/project'
const CONF = 'zsh tests/a.zsh\nzsh tests/b.zsh\n'

const BAND = {
  plugin: 'verify-gate',
  component: 'AbovePrompt',
  requestId: 'above-prompt',
  viewport: { columns: 100, rows: 30 },
  props: { hasSurvey: false, isWorking: false, maxRows: 6, bodyColumns: 80, scroll: { offset: 0, bodyRows: 6 }, view: {} },
} as const

// A fake repo: `git status` reads `git.status`, the fingerprint reads `git.tree`.
const setup = async ($, on, git: { status: string; tree: string }, tool: (e) => unknown, at = { root: ROOT }) => {
  mock.clock(on)
  on('session.start', () => ({ cwd: at.root }))
  on('session.root', () => ({ value: at.root }))
  on('command.register', () => ({ value: undefined }))
  on('fs.exists', ($, e) => ({ value: [ROOT + '/.git', ROOT + '/.claude/verify-gate.conf', ROOT + '/.git/index'].includes(e.path) }))
  on('fs.read', () => ({ value: CONF }))
  on('process.run', ($, e) => {
    const argv: string[] = e.argv
    const out = (stdout: string) => ({ value: { exitCode: 0, stdout, stderr: '' } })
    if (argv[0] === 'cp') return out('')
    if (argv[1] === 'status') return out(git.status)
    if (argv[1] === 'rev-parse') return out(ROOT + '/.git\n')
    if (argv[1] === 'write-tree') return out(git.tree + '\n')
    return out('')
  })
  on('ui.render', () => ({ type: 'Text', props: {}, children: [] }))
  on('ui.toast', () => ({ value: undefined }))
  on('tool.call', ($, e) => tool(e))
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: at.root })
}

const stampText = async ($) => {
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const row = await ui.find({ type: 'Text', text: /APPROVED|verify-gate/ })
  await ui.unmount()
  return row?.text
}

test('both checks pass on a clean pushed tree: APPROVED, and gh pr merge goes ahead', async ($, on) => {
  const git = { status: '## f...origin/f\n', tree: 't1' }
  const ran: string[] = []
  await setup($, on, git, (e) => { ran.push(e.command ?? e.tool); return { result: { stdout: 'ok' } } })
  await $.tool.call({ tool: 'Bash', command: 'zsh tests/a.zsh && zsh tests/b.zsh' })
  expect(await stampText($)).toBe('✅ APPROVED · 2/2 checks pass · committed · pushed · clear to merge')
  const merged = await $.tool.call({ tool: 'Bash', command: 'gh pr merge 7 --squash' })
  expect(merged.deny).toBeUndefined()
  expect(ran).toContain('gh pr merge 7 --squash')
})

test('a failed check: NOT APPROVED, and the merge is stopped before it runs', async ($, on) => {
  const git = { status: '## f...origin/f\n', tree: 't1' }
  const ran: string[] = []
  await setup($, on, git, (e) => {
    ran.push(e.command ?? e.tool)
    return e.command === 'zsh tests/b.zsh' ? { result: { stdout: 'fail' }, isError: true } : { result: { stdout: 'ok' } }
  })
  await $.tool.call({ tool: 'Bash', command: 'zsh tests/a.zsh' })
  await $.tool.call({ tool: 'Bash', command: 'zsh tests/b.zsh' })
  expect(await stampText($)).toBe('⛔ NOT APPROVED · 1 check failed')
  const merged = await $.tool.call({ tool: 'mcp__github__merge_pull_request', owner: 'o', repo: 'r', pullNumber: 7 })
  expect(String(merged.deny ?? merged.text)).toContain('verify-gate: merge stopped')
  expect(ran).not.toContain('mcp__github__merge_pull_request')
})

test('an edit after the checks makes the stamp stale', async ($, on) => {
  const git = { status: '## f...origin/f\n', tree: 't1' }
  await setup($, on, git, () => ({ result: { stdout: 'ok' } }))
  await $.tool.call({ tool: 'Bash', command: 'zsh tests/a.zsh && zsh tests/b.zsh' })
  git.status = '## f...origin/f\n M src/x.ts\n'
  git.tree = 't2'
  await $.tool.call({ tool: 'Edit', file_path: ROOT + '/src/x.ts', old_string: 'a', new_string: 'b' })
  await $.tool.call({ tool: 'Bash', command: 'git status' })
  expect(await stampText($)).toBe('⛔ NOT APPROVED · 2 of 2 checks to run · 1 file edited since the checks')
})

// The desktop app can start a session in a spare folder, then move it to the project.
const SPARE = '/Users/me/.claude/spares/spare-x'

test('a session moved out of a spare folder reads the conf and the git state of the project', async ($, on) => {
  const git = { status: '## f...origin/f\n?? stray.txt\n', tree: 't1' }
  const at = { root: SPARE }
  const ran: string[] = []
  await setup($, on, git, (e) => { ran.push(e.command ?? e.tool); return { result: { stdout: 'ok' } } }, at)
  at.root = ROOT
  await $.tool.call({ tool: 'Bash', command: 'zsh tests/a.zsh' })
  expect(await stampText($)).toContain('1 of 2 checks to run')
  await $.tool.call({ tool: 'Bash', command: 'zsh tests/b.zsh' })
  const merged = await $.tool.call({ tool: 'Bash', command: 'gh pr merge 7 --squash' })
  expect(String(merged.deny ?? merged.text)).toContain('1 file not committed')
  expect(ran).not.toContain('gh pr merge 7 --squash')
})

test('a check from before the move does not count in the new project', async ($, on) => {
  const git = { status: '## f...origin/f\n', tree: 't1' }
  const at = { root: SPARE }
  await setup($, on, git, () => ({ result: { stdout: 'ok' } }), at)
  await $.tool.call({ tool: 'Bash', command: 'zsh tests/a.zsh' })
  at.root = ROOT
  await $.tool.call({ tool: 'Bash', command: 'zsh tests/b.zsh' })
  expect(await stampText($)).toContain('1 of 2 checks to run')
})

test('with no git repo a merge is stopped, even after a check passes', async ($, on) => {
  const ran: string[] = []
  await setup($, on, { status: '', tree: '' }, (e) => { ran.push(e.command ?? e.tool); return { result: { stdout: 'ok' } } }, { root: SPARE })
  await $.tool.call({ tool: 'Bash', command: 'zsh tests/a.zsh' })
  const merged = await $.tool.call({ tool: 'Bash', command: 'gh pr merge 7 --squash' })
  expect(String(merged.deny ?? merged.text)).toContain('cannot read a git repo')
  expect(ran).not.toContain('gh pr merge 7 --squash')
})
