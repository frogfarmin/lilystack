import { expect, test } from 'claude-code/testing'
import { parseStatus, formatStatus, entryLine, mergeStatus } from '../hooks/status-file.ts'
import type { SessionTask } from '../hooks/status-file.ts'
import { SAMPLE } from './helpers.ts'

test('parse reads every owned section and keeps the rest verbatim', async () => {
  const f = parseStatus(SAMPLE)
  expect(f.title).toBe('project')
  expect(f.next).toEqual(['Write the M4 memory tool tests', 'Deploy to the server'])
  expect(f.waiting).toEqual(['Approve docs/designs/m4-memory.md section 3'])
  expect(f.done).toEqual([{ date: '2026-11-03', text: 'Drafted the M4 memory design' }])
  expect(f.rest).toBe('## Notes\nDeploy only after the brief job runs at 07:00.\n')
})

test('format round-trips the sample byte for byte', async () => {
  expect(formatStatus(parseStatus(SAMPLE), '2026-11-03 14:12', '01LwwLJi')).toBe(SAMPLE)
})

test('headings match case-insensitively and CRLF and a missing final newline are tolerated', async () => {
  const f = parseStatus(SAMPLE.replace('## Next', '## next ').replace(/\n/g, '\r\n').trimEnd())
  expect(f.next.length).toBe(2)
  expect(f.rest.endsWith('07:00.\n')).toBe(true)
})

test('a trailing custom section after Notes survives', async () => {
  const f = parseStatus(SAMPLE + '\n## Links\n- https://example.com\n')
  expect(f.rest).toContain('## Links')
})

test('a file with no headings becomes Notes', async () => {
  const f = parseStatus('just some words\n')
  expect(f.next).toEqual([])
  expect(f.rest).toBe('## Notes\njust some words\n')
})

const fmt = (text: string) => formatStatus(parseStatus(text), '2026-11-03 14:12', '01LwwLJi')

test('non-entry lines inside an owned section are kept on rewrite', async () => {
  const text = SAMPLE.replace('## Next\n', '## Next\nstray prose\n')
  expect(fmt(text)).toBe(text)
})

test('indented and prose lines under an entry stay under it', async () => {
  const text = SAMPLE.replace('- Deploy to the server\n', '- Deploy to the server\n  - ssh in first\n  then run make deploy\n')
    .replace('- Approve docs/designs/m4-memory.md section 3\n', '- Approve docs/designs/m4-memory.md section 3\nSee the open question.\n')
    .replace('- 2026-11-03: Drafted the M4 memory design\n', '- 2026-11-03: Drafted the M4 memory design\n  (with the old notes)\n')
  expect(fmt(text)).toBe(text)
})

test('an undated Done line is kept, by parse, format and merge', async () => {
  const text = SAMPLE.replace('## Done\n', '## Done\n- Set up the repo\n')
  const f = parseStatus(text)
  expect(f.done).toEqual([{ date: '', text: 'Set up the repo' }, { date: '2026-11-03', text: 'Drafted the M4 memory design' }])
  expect(fmt(text)).toBe(text)
  const m = mergeStatus(f, [t({ subject: 'New thing', status: 'completed', completedOn: '2026-12-30' })], '2026-12-30')
  expect(m.done).toEqual([{ date: '2026-12-30', text: 'New thing' }, { date: '', text: 'Set up the repo' }])
})

test('the original title line and the paragraph under it are kept', async () => {
  const text = '# My project\nA paragraph about it.\nIt has two lines.\n\n## Next\n- One\n\n## Notes\nx\n'
  const once = fmt(text)
  expect(once).toBe('# My project\nUpdated 2026-11-03 14:12 by Claude Code (session 01LwwLJi)\n\nA paragraph about it.\nIt has two lines.\n\n## Next\n- One\n\n## Waiting on you\n\n## Done\n\n## Notes\nx\n')
  expect(fmt(once)).toBe(once)
  expect(parseStatus(text).title).toBe('My project')
})

test('a paragraph under a Status title round-trips', async () => {
  const text = SAMPLE.replace('(session 01LwwLJi)\n', '(session 01LwwLJi)\n\nThe brief job and the M4 memory work.\n')
  expect(fmt(text)).toBe(text)
})

test('lines under an entry follow it to Done when its task completes', async () => {
  const text = SAMPLE.replace('- Deploy to the server\n', '- Deploy to the server\n  - ssh in first\n')
  const m = mergeStatus(parseStatus(text), [t({ subject: 'Deploy to the server', status: 'completed', completedOn: '2026-11-04' })], '2026-11-04')
  const out = formatStatus(m, '2026-11-04 09:00', '01LwwLJi')
  expect(out).toContain('## Done\n- 2026-11-04: Deploy to the server\n  - ssh in first\n- 2026-11-03')
  expect(out.match(/ssh in first/g)?.length).toBe(1)
})

test('entryLine flattens a subject', async () => {
  expect(entryLine('- fix\n  the   thing ')).toBe('fix the thing')
})

const base = () => parseStatus(SAMPLE)
const t = (p: Partial<SessionTask> & { subject: string }): SessionTask => ({ id: p.subject, status: 'pending', ...p })

test('next is the session list first, then unmatched file entries', async () => {
  const m = mergeStatus(base(), [t({ subject: 'Run bun test', status: 'in_progress' })], '2026-11-04')
  expect(m.next).toEqual(['Run bun test', 'Write the M4 memory tool tests', 'Deploy to the server'])
})

test('a completed or deleted task removes the file entry it matches', async () => {
  const m = mergeStatus(base(), [
    t({ subject: 'write the M4 memory tool tests', status: 'completed', completedOn: '2026-11-04' }),
    t({ subject: 'Deploy to the server', status: 'deleted' }),
  ], '2026-11-04')
  expect(m.next).toEqual([])
  expect(m.done[0]).toEqual({ date: '2026-11-04', text: 'write the M4 memory tool tests' })
})

test('tasks owned by you go to waiting, not next', async () => {
  const m = mergeStatus(base(), [t({ subject: 'Pick the band colours', owner: 'you' })], '2026-11-04')
  expect(m.waiting).toEqual(['Pick the band colours', 'Approve docs/designs/m4-memory.md section 3'])
  expect(m.next).toEqual(['Write the M4 memory tool tests', 'Deploy to the server'])
})

test('done unions, dedupes, keeps 14 days, newest first', async () => {
  const f = base(); f.done.push({ date: '2026-10-20', text: 'Old' }, { date: '2026-11-03', text: 'Drafted the M4 memory design' })
  const m = mergeStatus(f, [t({ subject: 'Drafted the M4 memory design', status: 'completed', completedOn: '2026-11-03' })], '2026-11-04')
  expect(m.done).toEqual([{ date: '2026-11-03', text: 'Drafted the M4 memory design' }])
})

test('with no tasks the file is unchanged', async () => {
  expect(mergeStatus(base(), [], '2026-11-04')).toEqual(base())
})

test('subjects are flattened to one entry line', async () => {
  const m = mergeStatus(base(), [t({ subject: '- Fix\nthe   thing' })], '2026-11-04')
  expect(m.next[0]).toBe('Fix the thing')
})

test('a completed task that matches a Done entry keeps that entry\'s date', async () => {
  const f = base(); f.done.push({ date: '2026-11-01', text: 'Ship it' })
  const m = mergeStatus(f, [t({ subject: 'Ship it', status: 'completed', completedOn: '2026-11-03' })], '2026-11-03')
  expect(m.done.filter(d => d.text === 'Ship it')).toEqual([{ date: '2026-11-01', text: 'Ship it' }])
})
