// STATUS.md: parse the fixed grammar, merge a session's tasks into it, format it back.
// Pure functions only: register.ts owns every mods API call.

export type DoneEntry = { date: string; text: string } // date is '' for an undated line
export type StatusFile = {
  title: string
  // The first "# " line as the owner wrote it, and the lines under it (not the "Updated" line).
  heading?: string
  intro?: string[]
  next: string[]
  waiting: string[]
  done: DoneEntry[]
  // The other lines of the owned sections, verbatim: under the key of the entry above them,
  // or under '@next', '@waiting' or '@done' before the first entry of the section.
  notes?: Record<string, string[]>
  // Everything from the first heading after the owned sections to the end, verbatim. Holds "## Notes".
  rest: string
}

const OWNED: Record<string, 'next' | 'waiting' | 'done'> = { next: 'next', 'waiting on you': 'waiting', done: 'done' }
const NOTES = '## Notes\n'
const UPDATED = /^Updated .* by Claude Code\b/

// One entry line from any text: whitespace and newlines collapsed, a leading "- " dropped.
export function entryLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim().replace(/^- /, '').trim()
}

const trimBlank = (lines: string[]): string[] => {
  const out = [...lines]
  while (out.length && out[0].trim() === '') out.shift()
  while (out.length && out[out.length - 1].trim() === '') out.pop()
  return out
}

export function parseStatus(text: string): StatusFile {
  const norm = text.replace(/\r\n?/g, '\n')
  const lines = norm.split('\n')
  if (lines.length && lines[lines.length - 1] === '') lines.pop()
  const file: StatusFile = { title: '', heading: '', intro: [], next: [], waiting: [], done: [], notes: {}, rest: '' }
  const notes = file.notes!
  let section: 'head' | 'next' | 'waiting' | 'done' | 'rest' = 'head'
  let key = '' // where a non-entry line of an owned section goes
  let sawOwned = false
  const restLines: string[] = []
  const intro: string[] = []
  for (const line of lines) {
    if (section !== 'rest') {
      const heading = /^##\s+(.+?)\s*$/.exec(line)
      if (heading) {
        const owned = OWNED[heading[1].toLowerCase()]
        if (owned) { section = owned; key = '@' + owned; sawOwned = true; continue }
        section = 'rest'
      }
    }
    if (section === 'rest') { restLines.push(line); continue }
    if (section === 'head') {
      const title = /^#\s+(.+?)\s*$/.exec(line)
      if (title && !file.heading) {
        file.heading = line
        file.title = /^Status:\s*(.*)$/.exec(title[1])?.[1] ?? title[1]
      } else if (!UPDATED.test(line)) intro.push(line)
      continue
    }
    if (line.trim() === '') continue
    if (line.startsWith('- ')) {
      const entry = line.slice(2).trim()
      if (section === 'done') {
        const dated = /^(\d{4}-\d{2}-\d{2}): (.*)$/.exec(entry)
        file.done.push(dated ? { date: dated[1], text: dated[2] } : { date: '', text: entry })
        key = normalize(dated ? dated[2] : entry)
      } else {
        ;(section === 'next' ? file.next : file.waiting).push(entry)
        key = normalize(entry)
      }
      continue
    }
    ;(notes[key] ??= []).push(line)
  }
  file.intro = trimBlank(intro)
  if (!sawOwned) {
    file.rest = NOTES + (norm.endsWith('\n') || norm === '' ? norm : norm + '\n')
    return { ...file, heading: '', intro: [], title: /^#\s+Status:/.test(file.heading ?? '') ? file.title : '' }
  }
  let rest = restLines.length ? restLines.join('\n') + '\n' : ''
  if (!/^##\s+notes\s*$/im.test(rest)) rest = NOTES + rest
  file.rest = rest
  return file
}

export function formatStatus(file: StatusFile, updated: string, sessionId: string): string {
  // Each key's lines are written once, under the first entry that has the key.
  const written = new Set<string>()
  const notesOf = (key: string): string => {
    if (written.has(key)) return ''
    written.add(key)
    return (file.notes?.[key] ?? []).map((line) => line + '\n').join('')
  }
  const list = (section: string, items: { line: string; text: string }[]) =>
    notesOf('@' + section) + items.map((item) => `- ${item.line}\n` + notesOf(normalize(item.text))).join('')
  const plain = (items: string[]) => items.map((text) => ({ line: text, text }))
  const intro = file.intro?.length ? '\n' + file.intro.join('\n') + '\n' : ''
  return (
    `${file.heading || `# Status: ${file.title}`}\n` +
    `Updated ${updated} by Claude Code (session ${sessionId})\n${intro}\n` +
    `## Next\n${list('next', plain(file.next))}\n` +
    `## Waiting on you\n${list('waiting', plain(file.waiting))}\n` +
    `## Done\n${list('done', file.done.map((d) => ({ line: d.date ? `${d.date}: ${d.text}` : d.text, text: d.text })))}\n` +
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
  // An undated entry is never cut and goes after the dated ones.
  const done = [...completed, ...file.done]
    .filter((entry) => {
      const key = entry.date + '|' + normalize(entry.text)
      if (seen.has(key)) return false
      seen.add(key)
      return entry.date === '' || dayNumber(entry.date) >= cutoff
    })
    .sort((a, b) => (a.date === '' || b.date === '' ? Number(a.date === '') - Number(b.date === '') : dayNumber(b.date) - dayNumber(a.date)))
  return { ...file, next, waiting, done }
}
