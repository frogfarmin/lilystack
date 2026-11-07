// STATUS.md: parse the fixed grammar, merge a session's tasks into it, format it back.
// Pure functions only: register.ts owns every mods API call.

export type DoneEntry = { date: string; text: string }
export type StatusFile = {
  title: string
  next: string[]
  waiting: string[]
  done: DoneEntry[]
  // Everything from the first heading after the owned sections to the end, verbatim. Holds "## Notes".
  rest: string
}

const OWNED: Record<string, 'next' | 'waiting' | 'done'> = { next: 'next', 'waiting on you': 'waiting', done: 'done' }
const NOTES = '## Notes\n'

// One entry line from any text: whitespace and newlines collapsed, a leading "- " dropped.
export function entryLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim().replace(/^- /, '').trim()
}

export function parseStatus(text: string): StatusFile {
  const norm = text.replace(/\r\n?/g, '\n')
  const lines = norm.split('\n')
  if (lines.length && lines[lines.length - 1] === '') lines.pop()
  const file: StatusFile = { title: '', next: [], waiting: [], done: [], rest: '' }
  let section: 'head' | 'next' | 'waiting' | 'done' | 'rest' = 'head'
  let sawOwned = false
  const restLines: string[] = []
  for (const line of lines) {
    if (section !== 'rest') {
      const heading = /^##\s+(.+?)\s*$/.exec(line)
      if (heading) {
        const owned = OWNED[heading[1].toLowerCase()]
        if (owned) { section = owned; sawOwned = true; continue }
        section = 'rest'
      }
    }
    if (section === 'rest') { restLines.push(line); continue }
    if (section === 'head') {
      const title = /^#\s+Status:\s*(.+?)\s*$/.exec(line)
      if (title) file.title = title[1]
      continue
    }
    if (section === 'done') {
      const done = /^- (\d{4}-\d{2}-\d{2}): (.*)$/.exec(line)
      if (done) file.done.push({ date: done[1], text: done[2] })
      continue
    }
    if (line.startsWith('- ')) (section === 'next' ? file.next : file.waiting).push(line.slice(2).trim())
  }
  if (!sawOwned) {
    file.rest = NOTES + (norm.endsWith('\n') || norm === '' ? norm : norm + '\n')
    return file
  }
  let rest = restLines.length ? restLines.join('\n') + '\n' : ''
  if (!/^##\s+notes\s*$/im.test(rest)) rest = NOTES + rest
  file.rest = rest
  return file
}

export function formatStatus(file: StatusFile, updated: string, sessionId: string): string {
  const list = (items: string[]) => items.map((item) => `- ${item}\n`).join('')
  return (
    `# Status: ${file.title}\n` +
    `Updated ${updated} by Claude Code (session ${sessionId})\n\n` +
    `## Next\n${list(file.next)}\n` +
    `## Waiting on you\n${list(file.waiting)}\n` +
    `## Done\n${list(file.done.map((d) => `${d.date}: ${d.text}`))}\n` +
    file.rest
  )
}

export type SessionTask = {
  id: string
  subject: string
  activeForm?: string
  status: 'pending' | 'in_progress' | 'completed' | 'deleted'
  owner?: string
  // The day the task was first seen completed, YYYY-MM-DD.
  completedOn?: string
}

export const DONE_DAYS = 14

// Matching key: lower case, whitespace collapsed, leading "- " dropped.
export function normalize(text: string): string {
  return entryLine(text).toLowerCase()
}

const dayNumber = (date: string): number => Date.parse(date + 'T00:00:00Z') / 86_400_000

// Fold the session's tasks into the file: the session's open tasks first, then the file's
// entries no task matches; completed and deleted tasks remove the entries they match;
// Done is the union, deduped, newest first, cut at DONE_DAYS before today.
export function mergeStatus(file: StatusFile, tasks: SessionTask[], today: string): StatusFile {
  const matched = new Set(tasks.map((task) => normalize(task.subject)))
  const unmatched = (entries: string[]) => entries.filter((entry) => !matched.has(normalize(entry)))
  const open = tasks.filter((task) => task.status === 'pending' || task.status === 'in_progress')
  const isYou = (task: SessionTask) => task.owner === 'you'
  const next = [...open.filter((task) => !isYou(task)).map((task) => entryLine(task.subject)), ...unmatched(file.next)]
  const waiting = [...open.filter(isYou).map((task) => entryLine(task.subject)), ...unmatched(file.waiting)]

  // A completed task already in Done keeps the file's entry and date; only new completions get today's.
  const alreadyDone = new Set(file.done.map((entry) => normalize(entry.text)))
  const completed = tasks
    .filter((task) => task.status === 'completed' && !alreadyDone.has(normalize(task.subject)))
    .map((task) => ({ date: task.completedOn ?? today, text: entryLine(task.subject) }))
  const seen = new Set<string>()
  const cutoff = dayNumber(today) - DONE_DAYS
  const done = [...completed, ...file.done]
    .filter((entry) => {
      const key = entry.date + '|' + normalize(entry.text)
      if (seen.has(key)) return false
      seen.add(key)
      return dayNumber(entry.date) >= cutoff
    })
    .sort((a, b) => dayNumber(b.date) - dayNumber(a.date))
  return { title: file.title, next, waiting, done, rest: file.rest }
}
