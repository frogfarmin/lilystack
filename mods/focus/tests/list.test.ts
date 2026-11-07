import { expect, test } from 'claude-code/testing'
import {
  addAfter, checkAfter, checkByText, checkMain, clear, empty, findByText, fromStore,
  nudgeDue, progress, promptText, reopen, setList, setMain, statusText, NUDGE_MS,
} from '../hooks/list.ts'

const T = Date.UTC(2026, 10, 7, 12, 0)
const base = () => setList(empty(), 'Pick the shortlist', ['Read the mods', 'Build verify-gate', 'Run the checks'], T)
const texts = (items: { text: string }[]) => items.map((i) => i.text)

test('setList sets the main action and the tasks after it, trimmed, empties dropped', async () => {
  const l = setList(empty(), '  Ship it ', ['a', '  ', ' b  c '], T)
  expect(l.main?.text).toBe('Ship it')
  expect(l.mainSince).toBe(T)
  expect(texts(l.after)).toEqual(['a', 'b c'])
  expect([l.main?.id, ...l.after.map((i) => i.id)]).toEqual(['f1', 'f2', 'f3'])
})

test('setList keeps at most 6 after', async () => {
  const l = setList(empty(), 'm', ['1', '2', '3', '4', '5', '6', '7', '8'], T)
  expect(l.after.length).toBe(6)
  expect(l.after.at(-1)?.text).toBe('6')
})

test('setList with no main promotes the first after item; nothing gives an empty list', async () => {
  expect(setList(empty(), '', ['x', 'y'], T).main?.text).toBe('x')
  expect(setList(base(), '', [], T).main).toBe(null)
})

test('setList replaces the open list and keeps done items', async () => {
  const l = setList(checkMain(base(), T + 1), 'New', [], T + 2)
  expect(l.main?.text).toBe('New')
  expect(l.after).toEqual([])
  expect(texts(l.done)).toEqual(['Pick the shortlist'])
})

test('checkMain moves the main action to done and promotes the next item', async () => {
  const l = checkMain(base(), T + 5)
  expect(l.main?.text).toBe('Read the mods')
  expect(l.mainSince).toBe(T + 5)
  expect(texts(l.after)).toEqual(['Build verify-gate', 'Run the checks'])
  expect(l.done[0]).toEqual({ id: 'f1', text: 'Pick the shortlist', doneAt: T + 5 })
})

test('checkMain on the last item empties the main action', async () => {
  const l = checkMain(setList(empty(), 'only', [], T), T + 1)
  expect(l.main).toBe(null)
  expect(l.mainSince).toBe(null)
  expect(checkMain(l, T + 2)).toBe(l)
})

test('checkAfter checks one item off', async () => {
  const l = checkAfter(base(), 'f3', T + 1)
  expect(texts(l.after)).toEqual(['Read the mods', 'Run the checks'])
  expect(l.done[0]?.text).toBe('Build verify-gate')
  expect(checkAfter(l, 'nope', T)).toBe(l)
})

test('reopen goes to the top of after while a main is open', async () => {
  const l = reopen(checkAfter(base(), 'f3', T), 'f3', T + 1)
  expect(texts(l.after)).toEqual(['Build verify-gate', 'Read the mods', 'Run the checks'])
  expect(l.done).toEqual([])
  expect(l.after[0]?.doneAt).toBe(undefined)
})

test('reopen becomes the main action when there is none', async () => {
  const done = checkMain(setList(empty(), 'only', [], T), T + 1)
  const l = reopen(done, 'f1', T + 2)
  expect(l.main).toEqual({ id: 'f1', text: 'only' })
  expect(l.mainSince).toBe(T + 2)
})

test('addAfter appends, or sets the main action when there is none', async () => {
  expect(texts(addAfter(base(), 'Tidy up', T).after).at(-1)).toBe('Tidy up')
  const l = addAfter(empty(), 'First', T)
  expect(l.main?.text).toBe('First')
  expect(addAfter(l, '   ', T)).toBe(l)
})

test('setMain moves the old main action to the top of after', async () => {
  const l = setMain(base(), 'Urgent fix', T + 1)
  expect(l.main?.text).toBe('Urgent fix')
  expect(texts(l.after).slice(0, 2)).toEqual(['Pick the shortlist', 'Read the mods'])
  expect(l.main?.id).toBe('f5')
})

test('clear empties the list and keeps the counter', async () => {
  const l = clear(base())
  expect(l.main).toBe(null)
  expect(l.after).toEqual([])
  expect(l.seq).toBe(4)
})

test('findByText: "main", exact first, then a substring, case-insensitive', async () => {
  const l = setList(empty(), 'Run tests', ['run', 'Deploy'], T)
  expect(findByText(l, 'main')?.where).toBe('main')
  expect(findByText(l, 'RUN')?.item.id).toBe('f2')
  expect(findByText(l, 'deplo')?.item.text).toBe('Deploy')
  expect(findByText(l, 'nothing')).toBe(null)
  expect(findByText(l, '  ')).toBe(null)
})

test('checkByText checks the main action or an after item', async () => {
  const a = checkByText(base(), 'main', T)
  expect(a.checked?.text).toBe('Pick the shortlist')
  expect(a.list.main?.text).toBe('Read the mods')
  const b = checkByText(base(), 'verify', T)
  expect(b.checked?.text).toBe('Build verify-gate')
  expect(checkByText(base(), 'xyz', T).checked).toBe(null)
})

test('promptText for an empty list', async () => {
  const text = promptText(empty(), T)
  expect(text).toContain('No focus list yet.')
  expect(text).toContain('call mcp__focus__set')
})

test('promptText for a full list', async () => {
  const l = checkAfter(base(), 'f4', T)
  const text = promptText(l, T + 40 * 60_000)
  expect(text).toContain('Main: Pick the shortlist (open 40 min)')
  expect(text).toContain('1. Read the mods\n2. Build verify-gate')
  expect(text).toContain('Done lately: Run the checks')
  expect(text).toContain('If the main action is still open, follow up on it.')
})

test('statusText', async () => {
  expect(statusText(empty())).toBe(undefined)
  expect(statusText(base())).toBe('🎯 Pick the shortlist · 3 after')
})

test('progress counts done today against what is open', async () => {
  const l = checkAfter(checkMain(base(), T), 'f4', T)
  expect(progress(l, T)).toEqual({ done: 2, total: 4 })
  expect(progress(l, T + 2 * 86_400_000)).toEqual({ done: 0, total: 2 })
})

test('nudgeDue once per main action after 45 minutes', async () => {
  const l = base()
  expect(nudgeDue(l, T + NUDGE_MS - 1)).toBe(false)
  expect(nudgeDue(l, T + NUDGE_MS)).toBe(true)
  expect(nudgeDue({ ...l, nudgedFor: 'f1' }, T + NUDGE_MS)).toBe(false)
})

test('fromStore declines junk and keeps the counter above every id', async () => {
  expect(fromStore(null)).toEqual(empty())
  expect(fromStore({ after: 'x' })).toEqual(empty())
  const l = fromStore({ main: { id: 'f9', text: 'm' }, after: [{ id: 'f2', text: 'a' }, 3], done: [], seq: 1 })
  expect(l.seq).toBe(9)
  expect(l.after.length).toBe(1)
})
