// The rules of the gate. No side effects: register.ts feeds it facts and draws what it returns.

export type CheckRun = { command: string; ok: boolean; at: number; fp: string | null }

export type GitFacts = {
  branch: string | null
  hasUpstream: boolean
  ahead: number
  dirty: number            // changed or untracked paths
  fp: string | null        // the tree of the working copy, untracked files included
}

export type GateState = {
  required: string[]       // from the project conf; empty means "any known check"
  confPath: string | null  // where `required` came from, for the report
  runs: Record<string, CheckRun>  // by required check, or by the command itself when `required` is empty
  lastFailed: string | null       // the last check command that failed, until a later pass of it
  lastEditAt: number | null
  edited: string[]         // files edited by Edit, Write or NotebookEdit since the last passing check
  git: GitFacts | null     // null outside a git repo
}

export type Verdict = {
  status: 'idle' | 'approved' | 'blocked'
  reasons: string[]
  next: string | null
  passed: number
  total: number
}

export const emptyState = (): GateState => ({ required: [], confPath: null, runs: {}, lastFailed: null, lastEditAt: null, edited: [], git: null })

const squash = (s: string): string => s.trim().replace(/\s+/g, ' ')

// The conf: one required check per line, as a command prefix. `#` starts a comment.
export function parseConf(text: string): string[] {
  return text.split('\n').map((line) => squash(line.replace(/#.*$/, ''))).filter(Boolean)
}

export type Segment = { text: string; isPiped: boolean }
type Part = { text: string; after: string[] } // a simple command and every operator after it

// The operators: && || |& | ; newline, and & that sends to the background (not >&, &> or 2>&1).
const OPERATOR = /(&&|\|\||\|&|\||;|\n|(?<![<>&])&(?![>&]))/

function parts(command: string): Part[] {
  const pieces = command.split(OPERATOR) // odd indexes are the operators
  const out: Part[] = []
  for (let i = 0; i < pieces.length; i += 2) {
    const text = squash(pieces[i].replace(/^[\s(]+|[\s)]+$/g, '').replace(/^(\w+=\S*\s+)+/, ''))
    if (text) out.push({ text, after: pieces.filter((_, j) => j > i && j % 2 === 1) })
  }
  return out
}

// The simple commands of a shell line. A segment that feeds a pipe is marked.
export function segments(command: string): Segment[] {
  return parts(command).map(({ text, after }) => ({ text, isPiped: after[0] === '|' || after[0] === '|&' }))
}

const KNOWN: RegExp[] = [
  /^(npm|pnpm|yarn|bun) (run )?(test|lint|check|typecheck|verify)\b/,
  /^bun test\b/,
  /^(pytest|python3? -m pytest|tox|ruff|mypy|tsc|eslint|vitest|jest)\b/,
  /^cargo (test|clippy|check)\b/,
  /^go (test|vet)\b/,
  /^make (test|check|lint)\b/,
  /^(zsh|bash|sh) tests?\//,
  /^claude plugin (validate|test)\b/,
]

// Which check a segment is: a required prefix, or with no conf any known check command.
export function checkOf(segment: string, required: string[]): string | null {
  const text = squash(segment)
  if (required.length > 0) return required.find((r) => text === r || text.startsWith(r + ' ')) ?? null
  return KNOWN.some((re) => re.test(text)) ? text : null
}

// The checks a Bash command runs. A check counts only when every operator after it
// is &&: a pipe, ||, ;, a newline or & hides its exit code. Those are `hidden`.
export function checksIn(command: string, required: string[]): { counted: string[]; hidden: string[] } {
  const counted: string[] = []
  const hidden: string[] = []
  for (const p of parts(command)) {
    const check = checkOf(p.text, required)
    if (check === null) continue
    ;(p.after.every((op) => op === '&&') ? counted : hidden).push(check)
  }
  return { counted, hidden }
}

// The state after a run of `checks`. A failure stays until that same check passes.
export function recordRun(s: GateState, checks: string[], ok: boolean, at: number, fp: string | null): GateState {
  const runs = { ...s.runs }
  for (const check of checks) runs[check] = { command: check, ok, at, fp }
  const lastFailed = ok ? (Object.values(runs).find((r) => !r.ok)?.command ?? null) : checks[0]
  return { ...s, runs, lastFailed, edited: ok ? [] : s.edited }
}

// Words that run the next command: env, command, sudo, nohup, exec, time, timeout N.
const PREFIX = /^(?:["'(]+|\w+=\S*\s+|env(?:\s+-\S+)*\s+|command\s+|sudo(?:\s+-\S+)*\s+|nohup\s+|exec\s+|time\s+|timeout(?:\s+-\S+)*\s+\S+\s+)/
const GH_MERGE = /^gh\s+(?:(?:-R|--repo)(?:\s+|=)\S+\s+)*pr\s+merge\b/
const GH_API_MERGE = /^gh\s+api\b.*\bpulls\/[^/\s]+\/merge\b/
const SHELL_C = /\b(?:bash|sh|zsh)\s+(?:-\w+\s+)*-\w*c\w*\s+(?:"([^"]*)"|'([^']*)')/g

function unwrap(text: string): string {
  for (let prev = ''; prev !== text; ) { prev = text; text = text.replace(PREFIX, '') }
  return text
}

// A PR merge: gh pr merge or gh api .../pulls/N/merge, also behind a prefix, gh -R, or sh -c "...".
export function isMergeCommand(command: string): boolean {
  for (const m of command.matchAll(SHELL_C)) if (isMergeCommand(m[1] ?? m[2])) return true
  return parts(command).some((p) => { const t = unwrap(p.text); return GH_MERGE.test(t) || GH_API_MERGE.test(t) })
}

// `git status --porcelain=v1 --branch`: the branch line, then one line per path.
export function parseGitStatus(text: string): Omit<GitFacts, 'fp'> {
  const lines = text.split('\n').filter(Boolean)
  const head = lines[0]?.startsWith('## ') ? lines.shift()!.slice(3) : ''
  const branch = head ? head.replace(/^No commits yet on /, '').split('...')[0].split(' ')[0] || null : null
  const ahead = Number(/\[.*ahead (\d+)/.exec(head)?.[1] ?? 0)
  return { branch, hasUpstream: head.includes('...'), ahead, dirty: lines.length }
}

const plural = (n: number, one: string, many = one + 's'): string => `${n} ${n === 1 ? one : many}`

// The decision. Approved means: every check passed after the last edit, on the tree
// as it is now, and the tree is committed and pushed.
export function verdict(s: GateState): Verdict {
  const reasons: string[] = []
  let next: string | null = null
  const fp = s.git?.fp ?? null
  const fresh = (run: CheckRun | undefined): boolean =>
    run !== undefined && run.ok && (s.lastEditAt === null || run.at > s.lastEditAt) && (fp === null || run.fp === fp)

  let passed: number
  let total: number
  if (s.required.length > 0) {
    total = s.required.length
    const missing = s.required.filter((r) => !fresh(s.runs[r]))
    passed = total - missing.length
    const failed = s.required.filter((r) => s.runs[r] && !s.runs[r].ok)
    if (failed.length > 0) reasons.push(plural(failed.length, 'check') + ' failed')
    if (missing.length > failed.length) reasons.push(`${missing.length - failed.length} of ${total} checks to run`)
    if (missing.length > 0) next = (failed[0] ?? missing.find((r) => !failed.includes(r)))!
  } else {
    const runs = Object.values(s.runs)
    total = Math.max(1, runs.length)
    passed = runs.filter(fresh).length
    if (s.lastFailed !== null) { reasons.push('a check failed'); next = s.lastFailed }
    else if (passed === 0) { reasons.push(runs.length === 0 ? 'no check ran' : 'checks are stale'); next = runs[0]?.command ?? 'run the tests of the project' }
  }

  if (s.edited.length > 0) reasons.push(plural(s.edited.length, 'file') + ' edited since the checks')
  else if (passed < total && s.lastEditAt !== null && reasons.length === 0) reasons.push('edited since the checks')

  if (s.git !== null) {
    if (s.git.dirty > 0) { reasons.push(plural(s.git.dirty, 'file') + ' not committed'); next ??= 'commit the changes' }
    else if (!s.git.hasUpstream) { reasons.push('branch not pushed'); next ??= 'git push -u origin ' + (s.git.branch ?? '<branch>') }
    else if (s.git.ahead > 0) { reasons.push(plural(s.git.ahead, 'commit') + ' not pushed'); next ??= 'git push' }
  }

  const nothingYet = Object.keys(s.runs).length === 0 && s.lastEditAt === null && (s.git === null || s.git.dirty === 0)
  if (nothingYet) return { status: 'idle', reasons: [], next: null, passed: 0, total: s.required.length }
  return { status: reasons.length === 0 ? 'approved' : 'blocked', reasons, next, passed, total }
}

export type Row = { text: string; color?: 'green' | 'red' | 'yellow'; bold?: boolean; dim?: boolean }

export function bandRows(v: Verdict): Row[] {
  if (v.status === 'idle') return [{ text: '○ verify-gate · no changes or checks yet', dim: true }]
  if (v.status === 'approved') {
    return [{ text: `✅ APPROVED · ${v.passed}/${v.total} checks pass · committed · pushed · clear to merge`, color: 'green', bold: true }]
  }
  const onlyGit = v.reasons.every((r) => /not committed|not pushed/.test(r))
  const rows: Row[] = [{ text: '⛔ NOT APPROVED · ' + v.reasons.join(' · '), color: onlyGit ? 'yellow' : 'red', bold: true }]
  if (v.next) rows.push({ text: 'next: ' + v.next, dim: true })
  return rows
}

const hhmm = (ms: number): string => {
  const d = new Date(ms)
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}

// The text of /gate: the stamp, each check, the tree.
export function report(s: GateState): string {
  const v = verdict(s)
  const stamp = v.status === 'approved' ? '✅ APPROVED: clear to merge' : v.status === 'idle' ? '○ No changes or checks yet' : '⛔ NOT APPROVED: ' + v.reasons.join(', ')
  const lines = ['verify-gate: ' + stamp, '']
  const source = s.confPath ? `required by ${s.confPath}` : 'no conf: any known test or lint command counts'
  lines.push(`Checks (${source}):`)
  const keys = s.required.length > 0 ? s.required : Object.keys(s.runs)
  if (keys.length === 0) lines.push('  ○ none ran yet')
  for (const k of keys) {
    const run = s.runs[k]
    const stale = run && run.ok && s.lastEditAt !== null && run.at <= s.lastEditAt
    lines.push(!run ? `  ○ ${k}  not run` : !run.ok ? `  ✗ ${k}  failed ${hhmm(run.at)}` : stale ? `  ◌ ${k}  passed ${hhmm(run.at)}, stale` : `  ✓ ${k}  passed ${hhmm(run.at)}`)
  }
  if (s.edited.length > 0) lines.push('', 'Edited since the checks: ' + s.edited.join(', '))
  if (s.git) {
    lines.push('', `Branch: ${s.git.branch ?? '?'}`, `Tree: ${s.git.dirty === 0 ? 'clean' : plural(s.git.dirty, 'file') + ' not committed'}`)
    lines.push(`Push: ${!s.git.hasUpstream ? 'no upstream' : s.git.ahead === 0 ? 'up to date' : plural(s.git.ahead, 'commit') + ' not pushed'}`)
  } else lines.push('', 'Not a git repo: the gate uses the checks only.')
  lines.push('', 'A check followed by |, ||, ;, a new line or & does not count: that hides its exit code.')
  return lines.join('\n')
}

export function denyText(s: GateState): string {
  const v = verdict(s)
  return `verify-gate: merge stopped, the gate is not approved (${v.reasons.join(', ') || 'no checks ran'}).` + (v.next ? ` Next: ${v.next}.` : '') + ' Type /gate for the details.'
}

// The deny text when the gate has no git facts: it cannot tell what is committed or pushed.
export const noRepoText = (folder: string): string =>
  `verify-gate: merge stopped, the gate cannot read a git repo at ${folder || 'the session folder'}. Move the session into the repo with /cd, then run the checks there.`
