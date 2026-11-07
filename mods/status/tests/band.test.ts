import { expect, test } from 'claude-code/testing'
import { bandRows, formatElapsed } from '../hooks/band.ts'
import type { BandState } from '../hooks/band.ts'
import type { SessionTask } from '../hooks/status-file.ts'

const task = (subject: string, status: SessionTask['status'], extra: Partial<SessionTask> = {}): SessionTask => ({ id: subject, subject, status, ...extra })
const idle = (over: Partial<BandState> = {}): BandState => ({ project: 'project', tasks: [], fileNext: [], fileWaiting: [], activity: null, isWorking: false, elapsedMs: null, askOpen: false, askedQuestion: false, error: null, ...over })

test('elapsed formats', async () => {
  expect(formatElapsed(58_000)).toBe('58s'); expect(formatElapsed(252_000)).toBe('4m 12s'); expect(formatElapsed(3_720_000)).toBe('1h 02m')
})
test('no list and no file: the header alone', async () => {
  expect(bandRows(idle(), 80, 4).map(r => r.text)).toEqual(['project'])
})
test('no list and a file: last session rows, dimmed', async () => {
  const rows = bandRows(idle({ fileNext: ['Deploy'], fileWaiting: ['Approve section 3'] }), 80, 4)
  expect(rows.map(r => r.text)).toEqual(['project · last session', '○ Deploy', '⚑ waiting on you: Approve section 3'])
  expect(rows[1].dim).toBe(true)
})
test('a list with one step in progress', async () => {
  const s = idle({ tasks: [task('Read the plan', 'completed'), task('Write tests', 'in_progress', { activeForm: 'Writing tests' }), task('Deploy', 'pending')], activity: 'bun test', isWorking: true, elapsedMs: 252_000 })
  expect(bandRows(s, 80, 4).map(r => r.text)).toEqual(['project · 1 of 3 done · 4m 12s', '✓ Read the plan  ▸ Writing tests  ○ Deploy', 'now: bun test'])
})
test('the three waiting cases raise the flag', async () => {
  expect(bandRows(idle({ tasks: [task('Pick colours', 'pending', { owner: 'you' })] }), 80, 4).at(-1)?.text).toBe('⚑ waiting on you: Pick colours')
  expect(bandRows(idle({ askOpen: true }), 80, 4).at(-1)?.text).toBe('⚑ waiting on you: a question is open')
  expect(bandRows(idle({ askedQuestion: true }), 80, 4).at(-1)?.text).toBe('⚑ waiting on you: the last reply ended on a question')
})
test('owned steps stay out of the checklist and +N counts the rest', async () => {
  const s = idle({ tasks: [task('One', 'pending'), task('Two', 'pending'), task('Ask', 'pending', { owner: 'you' }), task('Three long subject here', 'pending')] })
  const rows = bandRows(s, 24, 4)
  expect(rows[1].text).toBe('○ One  ○ Two  +1')
  expect(rows[1].text.length <= 24).toBe(true)
})
test('30 columns still draws header and flag', async () => {
  const s = idle({ tasks: [task('A very long subject that will not fit', 'pending', { owner: 'you' })], activity: 'x', elapsedMs: 1000 })
  const rows = bandRows(s, 30, 4)
  expect(rows[0].text.length <= 30 && rows.at(-1)!.text.length <= 30).toBe(true)
  expect(rows.at(-1)!.text.startsWith('⚑')).toBe(true)
})
test('maxRows 2 drops now first, then the checklist', async () => {
  const s = idle({ tasks: [task('A', 'in_progress')], activity: 'x', askOpen: true })
  expect(bandRows(s, 80, 2).map(r => r.text[0])).toEqual(['p', '⚑'])
  expect(bandRows(s, 80, 3).map(r => r.text[0])).toEqual(['p', '▸', '⚑'])
})
test('an error row takes the now row\'s place and keeps the checklist and the flag', async () => {
  const s = idle({ tasks: [task('A', 'in_progress')], activity: 'x', askOpen: true, error: 'STATUS.md unreadable (EACCES)' })
  expect(bandRows(s, 80, 4).map(r => r.text)).toEqual(['project · 0 of 1 done', '▸ A', 'status: STATUS.md unreadable (EACCES)', '⚑ waiting on you: a question is open'])
})
test('the flag keeps +N when it is cut', async () => {
  const s = idle({ tasks: [task('Ask me something rather long', 'pending', { owner: 'you' }), task('And another', 'pending', { owner: 'you' })] })
  const row = bandRows(s, 30, 4).at(-1)!.text
  expect(row.length <= 30 && row.startsWith('⚑ waiting on you: ') && row.endsWith(' +1')).toBe(true)
})
test('the header keeps the count and the time when the project name is long', async () => {
  const s = idle({ project: 'A'.repeat(40), tasks: [task('One', 'pending'), task('Two', 'pending'), task('Three', 'pending')], elapsedMs: 1000 })
  const row = bandRows(s, 30, 4)[0].text
  expect(row.length <= 30 && row.endsWith('0 of 3 done · 1s')).toBe(true)
})
test('newlines in subjects, active forms and the activity are flattened', async () => {
  const s = idle({ tasks: [task('Fix\nthe thing', 'in_progress', { activeForm: 'Fixing\n  it' })], activity: 'cd x &&\n  make', isWorking: true })
  const rows = bandRows(s, 80, 4).map(r => r.text)
  expect(rows.some(r => r.includes('\n'))).toBe(false)
  expect(rows).toContain('▸ Fixing it')
  expect(rows).toContain('now: cd x && make')
})
