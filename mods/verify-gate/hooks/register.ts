// The verify-gate mod: an APPROVED stamp above the prompt when the checks pass on the
// committed and pushed tree, and a stop on PR merges until then.
// Every mods API call lives in this file; gate.ts is pure.
import { bandRows, checksIn, denyText, emptyState, isMergeCommand, noRepoText, parseConf, parseGitStatus, recordRun, report, verdict } from './gate.ts'
import type { GateState, GitFacts } from './gate.ts'
import type { EngineInterface, Register } from 'claude-code'

type $ = EngineInterface

const CONF = '.claude/verify-gate.conf'
const EDIT_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit', 'MultiEdit'])

// Session state. Module variables reset on reload and are rebuilt at session.start.
let state: GateState = emptyState()
let root: string | null = null
let cwd = ''
let base: string | null = null // the session folder that root and state belong to
let editsThisTurn = 0
let checksThisTurn = 0
let error: string | null = null

const message = (err: unknown): string => (err instanceof Error ? err.message : String(err))
const dirname = (path: string): string => path.replace(/\/[^/]*$/, '') || '/'

async function findRoot($: $, from: string): Promise<string | null> {
  let dir = from.replace(/\/+$/, '') || '/'
  for (;;) {
    if (await $.fs.exists(dir + '/.git')) return dir
    const up = dirname(dir)
    if (up === dir) return null // the top, also for a path such as C:\\proj
    dir = up
  }
}

async function git($: $, args: string[], env?: Record<string, string>): Promise<string | null> {
  const r = await $.process.run(['git', ...args], { cwd: root ?? cwd, env, timeoutMs: 20_000 })
  return r.exitCode === 0 ? String(r.stdout) : null
}

// The tree of the working copy as `git add -A && git commit` would make it, without a
// change to the real index: a copy of the index in .git takes the adds. Equal before and
// after the commit, so a check that passed before the commit still holds after it.
// Each call has its own copy, so two calls at once do not share one, and removes it after.
async function fingerprint($: $): Promise<string | null> {
  const gitDir = (await git($, ['rev-parse', '--absolute-git-dir']))?.trim()
  if (!gitDir) return null
  const tmp = `${gitDir}/verify-gate-${crypto.randomUUID()}.index`
  const env = { GIT_INDEX_FILE: tmp }
  try {
    const copied = (await $.fs.exists(gitDir + '/index')) && (await $.process.run(['cp', gitDir + '/index', tmp], { cwd: root ?? cwd })).exitCode === 0
    if (!copied && (await git($, ['read-tree', '--empty'], env)) === null) return null
    if ((await git($, ['add', '-A'], env)) === null) return null
    return (await git($, ['write-tree'], env))?.trim() || null
  } finally {
    await $.process.run(['rm', '-f', tmp], { cwd: root ?? cwd }).catch(() => undefined)
  }
}

async function refreshGit($: $): Promise<void> {
  if (root === null) { state.git = null; return }
  try {
    const status = await git($, ['status', '--porcelain=v1', '--branch', '--untracked-files=all'])
    if (status === null) { state.git = null; return }
    const facts: GitFacts = { ...parseGitStatus(status), fp: await fingerprint($) }
    state.git = facts
    error = null
  } catch (err) {
    state.git = null // unknown facts: a merge is stopped
    error = 'git: ' + message(err)
  }
}

async function loadConf($: $): Promise<void> {
  state.required = []
  state.confPath = null
  if (root === null) return
  try {
    const path = root + '/' + CONF
    if (await $.fs.exists(path)) {
      state.required = parseConf(await $.fs.read(path))
      state.confPath = CONF
    }
  } catch (err) {
    error = CONF + ' unreadable (' + message(err) + ')'
  }
}

// The session can move after session.start: the desktop app can start a session in a
// spare folder and then move it to the project. So the hooks read the folder again.
// A move starts over, because a check in one project says nothing about another.
async function settle($: $, at: string): Promise<void> {
  if (at === base) return
  base = at
  cwd = at
  state = emptyState()
  error = null
  root = await findRoot($, at)
  await loadConf($)
  await refreshGit($)
}

async function follow($: $): Promise<void> {
  try {
    await settle($, await $.session.root())
  } catch (err) {
    error = message(err)
  }
}

// The .catch of a merge hook: a fault in the gate stops the merge.
function stopped() {
  return { deny: 'verify-gate: the gate failed, so the merge is stopped.' }
}

async function gateMerge($: $, e: { tool: string }, next: (e: any) => Promise<any>) {
  await follow($)
  try {
    await refreshGit($)
  } catch {
    // the verdict below then uses the last facts
  }
  // With no git facts the verdict could not see an uncommitted or unpushed change.
  if (state.git === null) return { deny: noRepoText(cwd) }
  if (verdict(state).status !== 'approved') return { deny: denyText(state) }
  $.ui.toast('verify-gate: ✅ approved, the merge goes ahead')
  return next(e)
}

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    try {
      base = null
      await settle($, typeof e.cwd === 'string' ? e.cwd : '')
    } catch (err) {
      error = message(err)
    }
    try {
      await $.command.register({ name: 'gate', description: 'Show the verify-gate stamp, each check and the git state', immediate: true })
    } catch {
      // A taken name must not stop the session.
    }
    return next(e)
  })

  // A merge waits for the stamp. A check run records its result and the tree it ran on.
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const command = typeof e.command === 'string' ? e.command : ''
    if (isMergeCommand(command)) return gateMerge($, e, next)
    await follow($)
    const { counted } = checksIn(command, state.required)
    if (counted.length === 0 || e.run_in_background === true) return next(e)
    const r = await next(e)
    try {
      const ok = r.deny === undefined && r.isError !== true
      if (r.deny === undefined) {
        await refreshGit($)
        state = recordRun(state, counted, ok, await $.clock.now(), state.git?.fp ?? null)
        checksThisTurn++
      }
    } catch (err) {
      error = message(err)
    }
    $.ui.invalidate('ui.render')
    return r
  }).catch(($, e, next) =>
    // A fault in the gate stops a merge and lets every other command run.
    isMergeCommand(String(e.command ?? '')) ? { deny: 'verify-gate: the gate failed, so the merge is stopped.' } : next(e),
  )

  on('tool.call', { tool: 'mcp__github__merge_pull_request' }, async ($, e, next) => gateMerge($, e, next)).catch(stopped)
  on('tool.call', { tool: 'mcp__github__enable_pr_auto_merge' }, async ($, e, next) => gateMerge($, e, next)).catch(stopped)

  on('tool.call', async ($, e, next) => {
    if (!EDIT_TOOLS.has(e.tool)) return next(e)
    await follow($)
    const r = await next(e)
    try {
      if (r.deny === undefined && r.isError !== true) {
        const path = String('file_path' in e ? e.file_path : 'notebook_path' in e ? e.notebook_path : '')
        const short = root && path.startsWith(root + '/') ? path.slice(root.length + 1) : path
        if (short && !state.edited.includes(short)) state.edited.push(short)
        state.lastEditAt = await $.clock.now()
        editsThisTurn++
        if (short === CONF) await loadConf($)
      }
    } catch (err) {
      error = message(err)
    }
    $.ui.invalidate('ui.render')
    return r
  }).catch(($, e, next) => next(e))

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      editsThisTurn = 0
      checksThisTurn = 0
      await follow($)
      $.ui.invalidate('ui.render')
    }
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    await follow($)
    await refreshGit($)
    if (editsThisTurn > 0 && state.edited.length > 0) {
      $.ui.toast(`verify-gate: ${state.edited.length} file${state.edited.length === 1 ? '' : 's'} edited and no check ran after ${state.edited.length === 1 ? 'it' : 'them'}`)
    }
    $.ui.invalidate('ui.render')
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const theirs = await next(e)
    const { Box, Text } = $.ui.resolve(e)
    let rows
    try {
      rows = bandRows(verdict(state))
      if (error) rows.push({ text: 'verify-gate: ' + error, color: 'red' as const })
    } catch (err) {
      rows = [{ text: 'verify-gate: ' + message(err), color: 'red' as const }]
    }
    return Box({
      flexDirection: 'column',
      children: [...rows.map((row, i) => Text({ color: row.color, bold: row.bold, dimColor: row.dim, wrap: 'truncate', children: [row.text] })), theirs],
    })
  })

  on('command.run', { command: 'gate' }, async ($) => {
    await follow($)
    await refreshGit($)
    $.ui.invalidate('ui.render')
    return { text: report(state) }
  })
}
