import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

const T = Date.UTC(2026, 10, 7, 12, 0)
const ROOT = '/Users/me/project'
const KEY = 'list:' + ROOT

const PANE = {
  plugin: 'focus',
  component: 'Pane',
  requestId: 'focus',
  props: {
    title: 'Focus',
    isFocused: false,
    bodyColumns: 40,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 20 },
    view: {},
  },
} as const

const stored = {
  main: { id: 'f1', text: 'Pick the shortlist' },
  mainSince: T,
  after: [{ id: 'f2', text: 'Read the mods' }, { id: 'f3', text: 'Run the checks' }],
  done: [],
  nudgedFor: null,
  seq: 3,
}

// Stubs the world beneath the mod and starts the session. Answers the toasts and the store writes it records.
async function start($: Engine, on: On, entries: Record<string, unknown> = {}, at = { root: ROOT + '/src' }) {
  const clock = mock.clock(on, { now: T })
  const store: Record<string, unknown> = { ...entries }
  const toasts: string[] = []
  const writes: unknown[] = []
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.root', () => ({ value: at.root }))
  on('fs.exists', (_, e) => ({ value: e.path === ROOT + '/.git' }))
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('tool.register', (_, e) => ({ value: { tool: 'mcp__focus__' + e.name } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.toast', (_, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('ui.status', () => ({ value: undefined }))
  on('store.get', (_, e) => ({ value: store[e.key] }))
  on('store.set', (_, e) => {
    writes.push(e)
    store[e.key] = JSON.parse(JSON.stringify(e.value))
    return { value: undefined }
  })
  await $.session.start({ cwd: at.root, surface: 'desktop', isInteractive: true })
  return { clock, toasts, writes, store }
}

test('an open main action from before raises a toast at the start', async ($, on) => {
  const { toasts } = await start($, on, { [KEY]: stored })
  expect(toasts).toContain('Still open from last time: Pick the shortlist')
})

test('the set tool fills the list, and check by text checks an item off', async ($, on) => {
  await start($, on)
  const set = await $.tool.call({ tool: 'mcp__focus__set', main: 'Pick mods', after: ['Build the gate', 'Run checks'] })
  expect(String(set.result)).toContain('Main: Pick mods. 2 after.')
  const check = await $.tool.call({ tool: 'mcp__focus__check', item: 'gate' })
  expect(String(check.result)).toContain('Checked off: Build the gate.')
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: 'Pick mods' })).toBeDefined()
  expect(await ui.find({ key: 'after-f3' })).toBeDefined()
  expect(await ui.find({ key: 'done-f2' })).toBeDefined()
  await ui.unmount()
})

test('check "main" promotes the next task and toasts', async ($, on) => {
  const { toasts } = await start($, on, { [KEY]: stored })
  const r = await $.tool.call({ tool: 'mcp__focus__check', item: 'main' })
  expect(String(r.result)).toContain('Main now: Read the mods.')
  expect(toasts).toContain('✓ Done: Pick the shortlist. Next: Read the mods')
})

test('check with no match names the open tasks', async ($, on) => {
  await start($, on, { [KEY]: stored })
  const r = await $.tool.call({ tool: 'mcp__focus__check', item: 'deploy' })
  expect(String(r.result)).toContain('No open task matches "deploy"')
})

test('the pane draws the list on desktop and terminal', async ($, on) => {
  await start($, on, { [KEY]: stored })
  for (const surface of ['desktop', 'terminal'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect(await ui.find({ type: 'Text', text: '0 of 3 done' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '🎯 Main action' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'Pick the shortlist' })).toBeDefined()
    expect(await ui.find({ key: 'done-main' })).toBeDefined()
    expect(await ui.find({ key: 'after-f2' })).toBeDefined()
    await ui.unmount()
  }
})

test('a press on done-main promotes the next item and writes the store', async ($, on) => {
  const { writes } = await start($, on, { [KEY]: stored })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'done-main' })
  expect(await ui.find({ type: 'Text', text: 'Read the mods' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '1 of 3 done' })).toBeDefined()
  expect(await ui.find({ key: 'done-f1' })).toBeDefined()
  await ui.unmount()
  const last = writes.at(-1) as { key: string; value: { main: { text: string } } }
  expect(last.key).toBe(KEY)
  expect(last.value.main.text).toBe('Read the mods')
})

test('a press on a done item reopens it', async ($, on) => {
  await start($, on, { [KEY]: { ...stored, done: [{ id: 'f0', text: 'Old task', doneAt: T }] } })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'done-f0' })
  expect(await ui.find({ key: 'after-f0' })).toBeDefined()
  await ui.unmount()
})

test('the empty pane tells how to start', async ($, on) => {
  await start($, on)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /No main action yet/ })).toBeDefined()
  await ui.unmount()
})

test('a short pane drops the Done part first', async ($, on) => {
  await start($, on, { [KEY]: { ...stored, done: [{ id: 'f0', text: 'Old task', doneAt: T }] } })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop', props: { ...PANE.props, scroll: { offset: 0, bodyRows: 7 } } })
  expect(await ui.find({ key: 'after-f3' })).toBeDefined()
  expect(await ui.find({ key: 'done-f0' })).toBeUndefined()
  await ui.unmount()
})

test('a value an earlier version stored is declined', async ($, on) => {
  mock.clock(on, { now: T })
  on('state.get', () => ({ value: { value: { tasks: ['x'] }, version: 1 } }))
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /No main action yet/ })).toBeDefined()
  await ui.unmount()
})

test('the commands set, add, check and clear', async ($, on) => {
  await start($, on)
  const run = async (command: string, args = '') =>
    (await $.command.run({ command, args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } } as never))?.text
  expect((await run('main', 'Write the README'))).toBe('🎯 Main action: Write the README')
  expect((await run('then', 'Run the tests'))).toBe('Added after: Run the tests')
  expect((await run('done', ''))).toBe('✓ Done: Write the README. Next: Run the tests')
  expect((await run('focus-clear', ''))).toBe('The focus list is clear.')
  expect((await run('done', ''))).toBe('No main action is open.')
})

test('the nudge comes once, after 45 minutes open', async ($, on) => {
  const { clock, toasts } = await start($, on, { [KEY]: stored })
  await clock.advance(44 * 60_000)
  expect(toasts.filter((t) => t.startsWith('Still on:'))).toEqual([])
  await clock.advance(60_000)
  expect(toasts.filter((t) => t.startsWith('Still on:'))).toEqual(['Still on: Pick the shortlist? Press ✓ Done when it is done.'])
  await clock.advance(30 * 60_000)
  expect(toasts.filter((t) => t.startsWith('Still on:')).length).toBe(1)
})

// The desktop app can start a session in a spare folder, then move it to the project.
const SPARE = '/Users/me/.claude/spares/spare-x'

test('a session moved out of a spare folder saves under the project', async ($, on) => {
  const at = { root: SPARE }
  const { store } = await start($, on, {}, at)
  at.root = ROOT
  await $.tool.call({ tool: 'mcp__focus__set', main: 'Ship the fix' })
  expect((store[KEY] as { main: { text: string } }).main.text).toBe('Ship the fix')
  expect(store['list:' + SPARE]).toBeUndefined()
})

test('a session moved out of a spare folder loads the open list of the project', async ($, on) => {
  const at = { root: SPARE }
  const { toasts } = await start($, on, { [KEY]: stored }, at)
  expect(toasts).toEqual([])
  at.root = ROOT
  const check = await $.tool.call({ tool: 'mcp__focus__check', item: 'main' })
  expect(String(check.result)).toContain('Checked off: Pick the shortlist.')
  expect(toasts).toContain('Still open from last time: Pick the shortlist')
})
