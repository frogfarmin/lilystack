// The focus mod: one main action and the few tasks after it, in a pane where
// the owner checks them off. Every mods API call lives in this file; list.ts is pure.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderChildren } from 'claude-code'
import type { FocusList, Item } from '../types'
import {
  addAfter, checkAfter, checkByText, checkMain, clear, empty, fromStore, nudgeDue,
  isFull, progress, promptText, reopen, setList, setMain, statusText, MAX_AFTER,
} from './list.ts'

const FULL = 'The list is full: six tasks after the main action. Check one off first.'

const PANE = 'focus'
const TITLE = 'Focus'
const SET_TOOL = 'mcp__focus__set'
const CHECK_TOOL = 'mcp__focus__check'

// Change the tag when FocusList changes: it declines what an earlier version stored.
const listAtom = atom({ plugin: 'focus', key: 'list' } as const, empty(), { shape: 'focus-list-1' })

// Module state. It resets on a reload and is rebuilt at session.start.
let storeKey = 'list:'
let base: string | null = null // the session folder that storeKey belongs to

const message = (err: unknown): string => (err instanceof Error ? err.message : String(err))
const dirname = (path: string): string => path.replace(/\/[^/]*$/, '') || '/'

// The nearest ancestor of cwd (cwd included) that holds .git, else cwd itself.
async function findRoot($: EngineInterface, cwd: string): Promise<string> {
  const start = cwd.replace(/\/+$/, '') || '/'
  let dir = start
  for (;;) {
    if (await $.fs.exists(dir + '/.git')) return dir
    const up = dirname(dir)
    if (up === dir) return start // the top, also for a path such as C:\\proj
    dir = up
  }
}

// Load the list of the project that holds this folder, unless it is the one already loaded.
async function settle($: EngineInterface, at: string): Promise<void> {
  if (at === base) return
  base = at
  const key = 'list:' + (await findRoot($, at))
  if (key === storeKey) return
  storeKey = key
  const list = fromStore(await $.store.get(storeKey))
  await update($, listAtom, () => list)
  $.ui.status(statusText(list))
  if (list.main) $.ui.toast(`Still open from last time: ${list.main.text}`)
}

// The session can move after session.start: the desktop app can start a session in a
// spare folder and then move it to the project. So the hooks read the folder again.
async function follow($: EngineInterface): Promise<void> {
  try {
    await settle($, await $.session.root())
  } catch {
    // the list of the last known project stays
  }
}

// Apply one op to the list: the state, the store and the status line. The op runs
// inside update, on the value it writes over, so two changes at once both land.
async function change($: EngineInterface, op: (list: FocusList, now: number) => FocusList): Promise<{ before: FocusList; after: FocusList }> {
  await follow($)
  const now = await $.clock.now()
  let before = empty()
  const after = await update($, listAtom, (list) => {
    before = list
    return op(list, now)
  })
  try {
    await $.store.set(storeKey, after)
  } catch (err) {
    $.ui.toast('focus: list not saved (' + message(err) + ')')
  }
  $.ui.status(statusText(after))
  return { before, after }
}

// The toast after the main action is checked off.
function doneToast($: EngineInterface, before: FocusList, after: FocusList): void {
  if (!before.main || before.main.id === after.main?.id) return
  $.ui.toast(after.main ? `✓ Done: ${before.main.text}. Next: ${after.main.text}` : `✓ Done: ${before.main.text}. All done 🎉`)
}

async function doCheckMain($: EngineInterface): Promise<void> {
  const { before, after } = await change($, checkMain)
  doneToast($, before, after)
}

async function doCheckAfter($: EngineInterface, id: string): Promise<void> {
  await change($, (list, now) => checkAfter(list, id, now))
}

async function doReopen($: EngineInterface, id: string): Promise<void> {
  const { after } = await change($, (list, now) => reopen(list, id, now))
  if (after.done.some((one) => one.id === id)) $.ui.toast(FULL)
}

const openPane = ($: EngineInterface) => $.ui.open({ id: PANE, title: TITLE })

const tryRegister = async (fn: () => Promise<unknown>): Promise<void> => {
  try {
    await fn()
  } catch {
    // A taken name must not stop the session.
  }
}

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    try {
      base = null
      storeKey = 'list:'
      await settle($, typeof e.cwd === 'string' ? e.cwd : '/')
    } catch (err) {
      $.ui.toast('focus: list not loaded (' + message(err) + ')')
    }
    await tryRegister(() => $.tool.register({
      name: 'set',
      description:
        "Sets the owner's focus list: one main action and the few tasks after it (at most " + MAX_AFTER + "). " +
        "Call it each time you give the owner one main action and the subtasks after it, so that the owner's Focus pane shows them. " +
        'It replaces the open list; done items stay.',
      inputSchema: {
        type: 'object',
        properties: {
          main: { type: 'string', description: 'The one main action, short and concrete.' },
          after: { type: 'array', items: { type: 'string' }, maxItems: MAX_AFTER, description: 'The tasks to do after the main action, in order.' },
        },
        required: ['main'],
      },
      isDeferred: false,
    }))
    await tryRegister(() => $.tool.register({
      name: 'check',
      description:
        "Checks off one task on the owner's focus list. Call it when the owner says a task is done, or when you see it done. " +
        'Checking off the main action makes the next task the main action.',
      inputSchema: {
        type: 'object',
        properties: { item: { type: 'string', description: 'The text of the task (a unique part is enough), or "main" for the main action.' } },
        required: ['item'],
      },
      isDeferred: false,
    }))
    await tryRegister(() => $.command.register({ name: 'main', description: 'Set the main action, or open the Focus pane', argumentHint: '[task]' }))
    await tryRegister(() => $.command.register({ name: 'then', description: 'Add a task after the main action', argumentHint: '<task>' }))
    await tryRegister(() => $.command.register({ name: 'done', description: 'Check off the main action' }))
    await tryRegister(() => $.command.register({ name: 'focus-clear', description: 'Clear the focus list' }))
    try {
      // The accountability nudge: once per main action, after 45 minutes open.
      $.clock.every(60_000, async () => {
        try {
          const now = await $.clock.now()
          const list = await read($, listAtom)
          if (!nudgeDue(list, now) || !list.main) return
          const main = list.main
          await change($, (l) => ({ ...l, nudgedFor: main.id }))
          $.ui.toast(`Still on: ${main.text}? Press ✓ Done when it is done.`)
        } catch {
          // a failed tick waits for the next one
        }
      })
    } catch {
      // no clock: no nudge
    }
    void openPane($)
    return started
  })

  on('tool.call', { tool: SET_TOOL }, async ($, e) => {
    const main = typeof e.main === 'string' ? e.main : ''
    const after = Array.isArray(e.after) ? e.after.filter((x): x is string => typeof x === 'string') : []
    const { after: list } = await change($, (l, now) => setList(l, main, after, now))
    void openPane($)
    if (!list.main) return { result: 'The focus list is empty now: no main action was given.' }
    const dropped = Math.max(0, after.filter((x) => x.trim()).length - list.after.length)
    return { result: `Focus set. Main: ${list.main.text}. ${list.after.length} after.` + (dropped ? ` ${dropped} dropped (at most ${MAX_AFTER} after).` : '') }
  }).catch(($, e, next) => (next.called ? next(e) : { deny: 'focus: the list tool failed.' }))

  on('tool.call', { tool: CHECK_TOOL }, async ($, e) => {
    const text = typeof e.item === 'string' ? e.item : ''
    let checked: Item | null = null
    const { before, after } = await change($, (l, now) => {
      const r = checkByText(l, text, now)
      checked = r.checked
      return r.list
    })
    if (!checked) return { result: `No open task matches "${text}". Open: ${[before.main, ...before.after].filter(Boolean).map((i) => (i as Item).text).join('; ') || 'none'}.` }
    doneToast($, before, after)
    return { result: `Checked off: ${(checked as Item).text}.` + (after.main ? ` Main now: ${after.main.text}.` : ' The list is done.') }
  }).catch(($, e, next) => (next.called ? next(e) : { deny: 'focus: the list tool failed.' }))

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) await follow($)
    return next(e)
  })

  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)
    if (!e.tools.includes(SET_TOOL)) return composed
    try {
      await follow($)
      const list = await read($, listAtom)
      const text = promptText(list, await $.clock.now())
      return { ...composed, sections: [...composed.sections, { id: 'focus:list', text, scope: 'session' as const }] }
    } catch {
      return composed
    }
  })

  on('command.run', { command: 'main' }, async ($, e) => {
    const text = e.args.trim()
    if (!text) {
      await openPane($)
      return { text: 'Focus pane opened.' }
    }
    const { before, after } = await change($, (l, now) => setMain(l, text, now))
    if (after.seq === before.seq && isFull(before)) return { text: FULL }
    return { text: `🎯 Main action: ${after.main?.text}` }
  }).catch(() => ({ text: 'focus: the command failed.' }))

  on('command.run', { command: 'then' }, async ($, e) => {
    const text = e.args.trim()
    if (!text) return { text: 'Type a task after /then.' }
    const { before, after } = await change($, (l, now) => addAfter(l, text, now))
    if (after.seq === before.seq && isFull(before)) return { text: FULL }
    return { text: after.main?.text === text ? `🎯 Main action: ${text}` : `Added after: ${text}` }
  }).catch(() => ({ text: 'focus: the command failed.' }))

  on('command.run', { command: 'done' }, async ($) => {
    await follow($)
    const before = await read($, listAtom)
    if (!before.main) return { text: 'No main action is open.' }
    await doCheckMain($)
    const after = await read($, listAtom)
    return { text: `✓ Done: ${before.main.text}.` + (after.main ? ` Next: ${after.main.text}` : ' All done 🎉') }
  }).catch(() => ({ text: 'focus: the command failed.' }))

  on('command.run', { command: 'focus-clear' }, async ($) => {
    await change($, (l) => clear(l))
    return { text: 'The focus list is clear.' }
  }).catch(() => ({ text: 'focus: the command failed.' }))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const list = await read($, listAtom)
    const now = await $.clock.now()
    const room = Math.max(4, e.props?.scroll?.bodyRows ?? 24)

    if (!list.main && list.after.length === 0 && list.done.length === 0) {
      return (
        <Box flexDirection="column">
          <Text dimColor>No main action yet. Ask Claude for one, or type /main &lt;task&gt;.</Text>
        </Box>
      )
    }

    const p = progress(list, now)
    const rows: RenderChildren[] = [<Text key="progress" dimColor>{`${p.done} of ${p.total} done`}</Text>]
    let used = 1
    if (list.main) {
      rows.push(<Text key="main-label" color="cyan">🎯 Main action</Text>)
      rows.push(<Text key="main-text" bold wrap="wrap">{list.main.text}</Text>)
      rows.push(<Button key="done-main" variant="primary" hotkey="d" autoFocus onPress={() => doCheckMain($)}>✓ Done</Button>)
      used += 3
    } else {
      rows.push(<Text key="main-none" dimColor>No main action yet. Ask Claude for one, or type /main &lt;task&gt;.</Text>)
      used += 1
    }
    if (list.after.length > 0 && used < room) {
      rows.push(<Text key="then-label" color="cyan">Then</Text>)
      used += 1
      list.after.forEach((item, i) => {
        if (used >= room) return
        rows.push(
          <Button key={'after-' + item.id} hotkey={i < 9 ? String(i + 1) : undefined} plain onPress={() => doCheckAfter($, item.id)}>
            {'☐ ' + item.text}
          </Button>,
        )
        used += 1
      })
    }
    const doneRows = list.done.slice(0, 5)
    // The Done part goes first when room is short: it shows only when all of it fits.
    if (doneRows.length > 0 && used + 1 + doneRows.length <= room) {
      rows.push(<Text key="done-label" dimColor>Done</Text>)
      for (const item of doneRows) {
        rows.push(
          <Button key={'done-' + item.id} plain dimColor onPress={() => doReopen($, item.id)}>
            {'☑ ' + item.text}
          </Button>,
        )
      }
    }
    return <Box flexDirection="column">{rows}</Box>
  })
}
