// The status mod: keeps STATUS.md true and draws the checklist above the prompt.
// Every mods API call lives in this file; the helpers beside it are pure.
import { parseStatus, mergeStatus, formatStatus } from './status-file.ts'
import type { SessionTask, StatusFile } from './status-file.ts'
import { activityText } from './activity.ts'
import { bandRows } from './band.ts'
import type { BandState } from './band.ts'

// Session state. Module variables reset on reload and are rebuilt at session.start.
let root: string | null = null
let file: StatusFile | null = null          // the file as last read or written
let tasks = new Map<string, SessionTask>()
let activity: string | null = null
let turnStartedAt: number | null = null
let lastTurnMs: number | null = null
let askOpen = false
let askedQuestion = false
let taskErr: string | null = null           // the last failed TaskList call; cleared by the next success
let fileErr: string | null = null           // the last failed read or write; cleared by the next success
let sessionId = ''
let startCwd = ''

const message = (err: unknown): string => (err instanceof Error ? err.message : String(err))
const dirname = (path: string): string => path.replace(/\/[^/]*$/, '') || '/'
const basename = (path: string): string => path.split('/').filter(Boolean).pop() ?? path
const fileBody = (text: string): string => text.split('\n').filter((line) => !line.startsWith('Updated ')).join('\n')

// Local-time stamps for the file: YYYY-MM-DD and HH:MM.
function stamp(ms: number): { date: string; time: string } {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` }
}

// A tool result as plain data: unwraps { result }, parses a JSON string.
function resultData(r: unknown): any {
  let raw: unknown = r && typeof r === 'object' && 'result' in (r as object) ? (r as { result: unknown }).result : r
  if (typeof raw === 'string') { try { raw = JSON.parse(raw) } catch { return null } }
  return raw
}

// The nearest ancestor of cwd (cwd included) that holds .git, or null.
async function findRoot($, cwd: string): Promise<string | null> {
  let dir = cwd.replace(/\/+$/, '') || '/'
  for (;;) {
    if (await $.fs.exists(dir + '/.git')) return dir
    const up = dirname(dir)
    if (up === dir) return null // the top, also for a path such as C:\\proj
    dir = up
  }
}

// Read STATUS.md from disk: the parsed file and its text, or nulls when there is none. Throws on a failed read.
async function readFile($): Promise<{ parsed: StatusFile | null; text: string | null }> {
  if (root === null) return { parsed: null, text: null }
  const path = root + '/STATUS.md'
  if (!(await $.fs.exists(path))) return { parsed: null, text: null }
  const text = await $.fs.read(path)
  return { parsed: parseStatus(text), text }
}

async function loadFile($): Promise<void> {
  try {
    file = (await readFile($)).parsed
    fileErr = null
  } catch (err) {
    file = null
    fileErr = 'STATUS.md unreadable (' + message(err) + ')'
  }
}

// Active forms and subjects seen in TaskCreate/TaskUpdate inputs, which TaskList does not return.
const forms = new Map<string, { activeForm?: string; subject?: string }>()

const taskIdOf = (e: Record<string, unknown>): string | undefined => {
  const id = e.taskId ?? e.id ?? e.task_id
  return id === undefined ? undefined : String(id)
}
const activeFormOf = (e: Record<string, unknown>): string | undefined => {
  const form = e.activeForm ?? e.active_form
  return typeof form === 'string' ? form : undefined
}

// The message for a failed TaskList call: the tools are off on newer models unless opted in.
const taskError = (err: unknown): string =>
  /not available|no such tool|unknown tool|TaskList/i.test(message(err)) ? 'task tools off, set CLAUDE_CODE_ENABLE_TODO_TOOLS=1' : message(err)

// Ask TaskList for the snapshot and fold it into `tasks`, keeping what the list lacks.
async function refreshTasks($): Promise<void> {
  try {
    const answer = await $.tool.call({ tool: 'TaskList' })
    // A refused call resolves with { deny }; treat it as the tools being off.
    if (answer && typeof answer === 'object' && 'deny' in answer) throw new Error('TaskList refused: ' + String((answer as { deny: unknown }).deny))
    const data = resultData(answer)
    const listed: any[] = Array.isArray(data?.tasks) ? data.tasks : []
    const seen = new Set<string>()
    for (const row of listed) {
      const id = String(row.id)
      seen.add(id)
      const prev = tasks.get(id)
      const remembered = forms.get(id)
      const task: SessionTask = {
        id,
        subject: String(row.subject ?? remembered?.subject ?? prev?.subject ?? ''),
        status: row.status ?? prev?.status ?? 'pending',
        activeForm: remembered?.activeForm ?? prev?.activeForm,
        owner: typeof row.owner === 'string' && row.owner ? row.owner : undefined,
        completedOn: prev?.completedOn,
      }
      if (task.status === 'completed' && !task.completedOn) task.completedOn = stamp(await $.clock.now()).date
      tasks.set(id, task)
    }
    for (const [id, task] of tasks) if (!seen.has(id) && task.status !== 'deleted') tasks.delete(id)
    taskErr = null
  } catch (err) {
    taskErr = taskError(err)
  }
}

// Regenerate the owned sections from the session's tasks over the file as it is on disk now,
// and write STATUS.md when its body changed. No tasks, no write: a visited repo is left alone.
async function writeFile($): Promise<void> {
  if (root === null || tasks.size === 0) return
  let current: StatusFile
  let currentText: string | null
  try {
    const read = await readFile($)
    current = read.parsed ?? { title: '', next: [], waiting: [], done: [], rest: '## Notes\n' }
    currentText = read.text
  } catch (err) {
    fileErr = 'STATUS.md unreadable (' + message(err) + ')'
    return
  }
  if (!current.title) current.title = basename(root)
  const now = stamp(await $.clock.now())
  const merged = mergeStatus(current, [...tasks.values()], now.date)
  const text = formatStatus(merged, `${now.date} ${now.time}`, sessionId.slice(0, 8))
  try {
    if (currentText === null || fileBody(text) !== fileBody(currentText)) await $.fs.write(root + '/STATUS.md', text)
    file = merged
    fileErr = null
  } catch (err) {
    fileErr = 'STATUS.md not written (' + message(err) + ')'
  }
}

async function afterTaskChange($): Promise<void> {
  await refreshTasks($)
  await writeFile($)
  $.ui.invalidate('ui.render')
}

function bandState(isWorking: boolean, now: number | null): BandState {
  return {
    project: file?.title || (root !== null ? basename(root) : null),
    tasks: [...tasks.values()],
    fileNext: file?.next ?? [],
    fileWaiting: file?.waiting ?? [],
    activity,
    isWorking,
    elapsedMs: turnStartedAt !== null && now !== null ? now - turnStartedAt : lastTurnMs,
    askOpen,
    askedQuestion,
    error: taskErr ?? fileErr,
  }
}

export function register(on) {
  on('session.start', async ($, e, next) => {
    try {
      startCwd = typeof e.cwd === 'string' ? e.cwd : ''
      root = await findRoot($, startCwd)
      sessionId = String(await $.session.id())
      await loadFile($)
      await refreshTasks($)
    } catch (err) {
      fileErr = message(err)
    }
    try {
      // The timer only redraws the elapsed time while a turn runs; without a clock the band still works.
      $.clock.every(1000, () => {
        if (turnStartedAt !== null) $.ui.invalidate('ui.render')
      })
    } catch {
      // no clock: no ticking
    }
    try {
      await $.command.register({ name: 'now', description: "Show this project's STATUS.md", immediate: true })
    } catch {
      // A taken name must not stop the session.
    }
    return next(e)
  })

  on('tool.call', { tool: 'TaskCreate' }, async ($, e, next) => {
    // Local to this call: two creates in one message must not swap their forms.
    const pending = { subject: typeof e.subject === 'string' ? e.subject : undefined, activeForm: activeFormOf(e) }
    const r = await next(e)
    const id = resultData(r)?.task?.id
    if (id !== undefined) forms.set(String(id), pending)
    await afterTaskChange($)
    return r
  })

  on('tool.call', { tool: 'TaskUpdate' }, async ($, e, next) => {
    const id = taskIdOf(e)
    if (id !== undefined) {
      const form = forms.get(id) ?? {}
      const activeForm = activeFormOf(e)
      if (activeForm) form.activeForm = activeForm
      if (typeof e.subject === 'string') form.subject = e.subject
      forms.set(id, form)
    }
    const r = await next(e)
    if (id !== undefined && e.status === 'deleted') {
      const prev = tasks.get(id)
      tasks.set(id, { id, subject: prev?.subject ?? forms.get(id)?.subject ?? '', status: 'deleted', activeForm: prev?.activeForm })
    }
    await afterTaskChange($)
    return r
  })

  // Every other main-conversation tool call: the activity line, and the open-question flag.
  on('tool.call', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    const text = activityText(e as { tool: string } & Record<string, unknown>)
    if (text !== null) activity = text
    const asking = e.tool === 'AskUserQuestion'
    if (asking) askOpen = true
    $.ui.invalidate('ui.render')
    try {
      return await next(e)
    } finally {
      if (asking) { askOpen = false; $.ui.invalidate('ui.render') }
    }
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    try {
      turnStartedAt = await $.clock.now()
    } catch {
      turnStartedAt = null
    }
    askedQuestion = false
    await refreshTasks($)
    $.ui.invalidate('ui.render')
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    try {
      const now = await $.clock.now()
      if (turnStartedAt !== null) lastTurnMs = now - turnStartedAt
      turnStartedAt = null
      const messages = await $.session.messages()
      const last = [...messages].reverse().find((m) => m.role === 'assistant')
      askedQuestion = Boolean(last && typeof last.text === 'string' && last.text.trimEnd().endsWith('?'))
    } catch (err) {
      fileErr = message(err)
    }
    await writeFile($)
    $.ui.invalidate('ui.render')
    return next(e)
  })

  // Both fire at the end of a session; the second write is a no-op because the body is unchanged.
  on('session.end', async ($, e, next) => {
    await writeFile($)
    return next(e)
  })
  on('classic.SessionEnd', async ($, e, next) => {
    await writeFile($)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const theirs = await next(e)
    let rows
    try {
      const now = turnStartedAt !== null ? await $.clock.now() : null
      rows = bandRows(bandState(Boolean(e.props?.isWorking), now), e.props?.bodyColumns ?? 80, Math.min(4, e.props?.maxRows ?? 4))
    } catch (err) {
      rows = [{ text: 'status: ' + message(err), color: 'red' as const }]
    }
    const { Box, Text } = $.ui.resolve(e)
    return Box({
      flexDirection: 'column',
      borderStyle: 'quote',
      children: [...rows.map((row, i) => Text({ key: 'row-' + i, color: row.color, dimColor: row.dim, wrap: 'truncate', children: [row.text] })), theirs],
    })
  })

  on('command.run', { command: 'now' }, async ($) => {
    if (root === null) return { text: `No project root (no .git above ${startCwd})` }
    try {
      const read = await readFile($)
      if (read.text !== null) return { text: read.text }
    } catch (err) {
      return { text: 'STATUS.md unreadable (' + message(err) + ')' }
    }
    return { text: `No STATUS.md in ${root}` }
  })
}
