// The band's rows for a given width and row budget. Pure: register.ts turns rows into elements.
import type { SessionTask } from './status-file.ts'

export type BandState = {
  project: string | null
  tasks: SessionTask[]
  fileNext: string[]
  fileWaiting: string[]
  activity: string | null
  isWorking: boolean
  elapsedMs: number | null
  askOpen: boolean
  askedQuestion: boolean
  error: string | null
}

export type Row = { text: string; dim?: boolean; color?: 'green' | 'yellow' | 'red' | 'cyan' }

const SEP = ' · '
const GAP = '  '

export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

// Every piece of text is one line: newlines and runs of spaces collapse.
const flat = (text: string): string => text.replace(/\s+/g, ' ').trim()
const cut = (text: string, width: number): string => (text.length <= width ? text : text.slice(0, Math.max(0, width - 1)) + '…')
// A head cut to leave room for a tail that must stay whole.
const cutHead = (head: string, tail: string, width: number): string => cut(head, Math.max(2, width - tail.length)) + tail

// Join items with GAP while they fit; the rest becomes "+N".
function fit(items: string[], width: number): string {
  let out = ''
  for (let i = 0; i < items.length; i++) {
    const candidate = out ? out + GAP + items[i] : items[i]
    const tail = i + 1 < items.length ? GAP + '+' + (items.length - i - 1) : ''
    if (candidate.length + tail.length <= width) { out = candidate; continue }
    const rest = GAP + '+' + (items.length - i)
    return out ? out + rest : cut(items[i] + rest, width)
  }
  return out
}

export function bandRows(state: BandState, width: number, maxRows: number): Row[] {
  const live = state.tasks.filter((task) => task.status !== 'deleted')
  const steps = live.filter((task) => task.owner !== 'you')
  const owned = live.filter((task) => task.owner === 'you' && task.status !== 'completed')
  const fromFile = live.length === 0 && (state.fileNext.length > 0 || state.fileWaiting.length > 0)

  const tail: string[] = []
  if (steps.length) tail.push(`${steps.filter((t) => t.status === 'completed').length} of ${steps.length} done`)
  else if (fromFile) tail.push('last session')
  if (state.elapsedMs !== null) tail.push(formatElapsed(state.elapsedMs))
  const header: Row = { text: cutHead(flat(state.project ?? 'status'), tail.map((part) => SEP + part).join(''), width), color: 'cyan' }

  let checklist: Row | null = null
  if (steps.length) {
    const label = (task: SessionTask, glyph: string) => glyph + ' ' + flat((task.status === 'in_progress' && task.activeForm) || task.subject)
    const items = [
      ...steps.filter((t) => t.status === 'completed').map((t) => label(t, '✓')),
      ...steps.filter((t) => t.status === 'in_progress').map((t) => label(t, '▸')),
      ...steps.filter((t) => t.status === 'pending').map((t) => label(t, '○')),
    ]
    checklist = { text: fit(items, width) }
  } else if (fromFile && state.fileNext.length) {
    checklist = { text: fit(state.fileNext.map((entry) => '○ ' + flat(entry)), width), dim: true }
  }

  // The error row takes the now row's place, so the checklist and the flag stay visible.
  let middle: Row | null = null
  if (state.error) middle = { text: cut('status: ' + flat(state.error), width), color: 'red' }
  else if (state.activity !== null) middle = { text: cut('now: ' + flat(state.activity), width), dim: !state.isWorking }

  let flag: Row | null = null
  const prefix = '⚑ waiting on you: '
  if (owned.length) {
    flag = { text: cutHead(prefix + flat(owned[0].subject), owned.length > 1 ? ` +${owned.length - 1}` : '', width), color: 'yellow' }
  } else if (state.askOpen) {
    flag = { text: cut(prefix + 'a question is open', width), color: 'yellow' }
  } else if (state.askedQuestion) {
    flag = { text: cut(prefix + 'the last reply ended on a question', width), color: 'yellow' }
  } else if (fromFile && state.fileWaiting.length) {
    flag = { text: cutHead(prefix + flat(state.fileWaiting[0]), state.fileWaiting.length > 1 ? ` +${state.fileWaiting.length - 1}` : '', width), color: 'yellow', dim: true }
  }

  const body: Row[] = []
  if (checklist) body.push(checklist)
  if (middle) body.push(middle)
  if (flag) body.push(flag)
  // Drop the middle row first, then the checklist, until the budget fits; the header and the flag stay.
  const budget = Math.max(1, maxRows) - 1
  if (body.length > budget && middle) body.splice(body.indexOf(middle), 1)
  if (body.length > budget && checklist) body.splice(body.indexOf(checklist), 1)
  return [header, ...body]
}
