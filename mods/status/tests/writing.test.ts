import { expect, mock, test } from 'claude-code/testing'
import { SAMPLE, start, band } from './helpers.ts'

const turn = async ($, agentId?: string) => {
  await $.turn.start({ turnId: 't1', ...(agentId ? { agentId } : {}) })
  await $.turn.complete({ turnId: 't1', answer: 'Done.', durationMs: 5000, isAborted: false, usage: null, ...(agentId ? { agentId } : {}) })
}
const turnStubs = (on) => {
  on('turn.start', ($, e) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  on('ui.render', () => ({ type: 'Text', props: {}, children: [] }))
}

test('a main turn writes the file once per change, not per minute', async ($, on) => {
  const clock = mock.clock(on, { now: Date.UTC(2026, 10, 4, 9, 0) })
  const files = { '/Users/me/project/STATUS.md': SAMPLE }
  const writes: string[] = []
  on('fs.write', ($, e) => { writes.push(e.text); files[e.path] = e.text; return { value: undefined } })
  turnStubs(on)
  on('session.messages', () => ({ value: [{ role: 'assistant', text: 'Done.', toolUses: [] }] }))
  on('tool.call', ($, e) => e.tool === 'TaskList' ? { result: { tasks: [{ id: '1', subject: 'Deploy', status: 'pending', blockedBy: [] }] } } : { result: 'ok' })
  await start($, on, files, { clock: false })
  await turn($); await clock.advance(120_000); await turn($)
  expect(writes.length).toBe(1)
  expect(writes[0]).toContain('## Next\n- Deploy\n- Write the M4 memory tool tests')
  expect(writes[0]).toContain('Updated 2026-11-04 ')
})

test('no file and no tasks: nothing is written', async ($, on) => {
  const writes: string[] = []
  on('fs.write', ($, e) => { writes.push(e.text); return { value: undefined } })
  turnStubs(on)
  on('session.messages', () => ({ value: [] }))
  on('tool.call', () => ({ result: { tasks: [] } }))
  await start($, on, {})
  await turn($)
  expect(writes).toEqual([])
})

test('a subagent turn changes nothing', async ($, on) => {
  const writes: string[] = []
  on('fs.write', ($, e) => { writes.push(e.text); return { value: undefined } })
  turnStubs(on)
  on('session.messages', () => ({ value: [] }))
  on('tool.call', () => ({ result: { tasks: [] } }))
  await start($, on, { '/Users/me/project/STATUS.md': SAMPLE })
  await turn($, 'sub-1')
  expect(writes).toEqual([])
  const ui = await band($)
  expect(await ui.find({ type: 'Text', text: 'project · last session' })).toBeDefined()
  await ui.unmount()
})

test('a reply ending on a question raises the flag until the next turn starts', async ($, on) => {
  turnStubs(on)
  on('fs.write', () => ({ value: undefined }))
  on('session.messages', () => ({ value: [{ role: 'assistant', text: 'Which one?', toolUses: [] }] }))
  on('tool.call', () => ({ result: { tasks: [] } }))
  await start($, on, {})
  await turn($)
  let ui = await band($)
  expect(await ui.find({ type: 'Text', text: '⚑ waiting on you: the last reply ended on a question' })).toBeDefined()
  await ui.unmount()
  await $.turn.start({ turnId: 't2' })
  ui = await band($, { isWorking: true })
  expect(await ui.find({ type: 'Text', text: /^⚑/ })).toBeUndefined()
  await ui.unmount()
})

test('session.end writes without calling TaskList', async ($, on) => {
  const calls: string[] = []
  const writes: string[] = []
  on('fs.write', ($, e) => { writes.push(e.text); return { value: undefined } })
  on('tool.call', ($, e) => { calls.push(e.tool); return { result: { tasks: [{ id: '1', subject: 'Deploy', status: 'pending', blockedBy: [] }] } } })
  on('classic.SessionEnd', () => ({}))
  await start($, on, {})
  calls.length = 0
  await $.classic.SessionEnd({ reason: 'other' })
  expect(calls).toEqual([])
  expect(writes.length).toBe(1)
})

const listOf = (...subjects: string[]) => ({ result: { tasks: subjects.map((subject, i) => ({ id: String(i + 1), subject, status: 'pending', blockedBy: [] })) } })

test('the file is re-read before each write, so Notes edited on disk survive', async ($, on) => {
  const files = { '/Users/me/project/STATUS.md': SAMPLE }
  const writes: string[] = []
  on('fs.write', ($, e) => { writes.push(e.text); files[e.path] = e.text; return { value: undefined } })
  turnStubs(on)
  on('session.messages', () => ({ value: [] }))
  on('tool.call', ($, e) => e.tool === 'TaskList' ? listOf('Deploy') : { result: 'ok' })
  await start($, on, files)
  files['/Users/me/project/STATUS.md'] = SAMPLE.replace('Deploy only after the brief job runs at 07:00.', 'Edited by hand mid-session.')
  await turn($)
  expect(writes.length).toBe(1)
  expect(writes[0]).toContain('## Notes\nEdited by hand mid-session.\n')
  expect(writes[0]).toContain('- Deploy\n')
})

test('a read failure blocks the write and shows in the band', async ($, on) => {
  let reads = 0
  const writes: string[] = []
  on('fs.write', ($, e) => { writes.push(e.text); return { value: undefined } })
  turnStubs(on)
  on('session.messages', () => ({ value: [] }))
  on('tool.call', ($, e) => e.tool === 'TaskList' ? listOf('Deploy') : { result: 'ok' })
  on('session.start', () => ({ cwd: '/Users/me/project/src' }))
  on('command.register', () => ({ value: undefined }))
  on('fs.exists', () => ({ value: true }))
  on('fs.read', () => (++reads > 1 ? { deny: 'EACCES' } : { value: SAMPLE }))
  on('session.id', () => ({ value: 'abc' }))
  mock.clock(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/Users/me/project/src' })
  await turn($)
  expect(writes).toEqual([])
  const ui = await band($)
  expect(await ui.find({ type: 'Text', text: /^status: STATUS\.md unreadable/ })).toBeDefined()
  await ui.unmount()
})

test('no tasks: a STATUS.md in another format is left alone', async ($, on) => {
  const writes: string[] = []
  on('fs.write', ($, e) => { writes.push(e.text); return { value: undefined } })
  turnStubs(on)
  on('session.messages', () => ({ value: [] }))
  on('tool.call', () => ({ result: { tasks: [] } }))
  await start($, on, { '/Users/me/project/STATUS.md': 'just some words\n' })
  await turn($)
  expect(writes).toEqual([])
})

test('tasks with a file in another format: written under the folder name, the text kept as Notes', async ($, on) => {
  const writes: string[] = []
  on('fs.write', ($, e) => { writes.push(e.text); return { value: undefined } })
  turnStubs(on)
  on('session.messages', () => ({ value: [] }))
  on('tool.call', ($, e) => e.tool === 'TaskList' ? listOf('Deploy') : { result: 'ok' })
  await start($, on, { '/Users/me/project/STATUS.md': 'just some words\n' })
  await turn($)
  expect(writes[0]?.startsWith('# Status: project\n')).toBe(true)
  expect(writes[0]).toContain('## Notes\njust some words\n')
})

test('a task-tools error clears on the next successful refresh', async ($, on) => {
  let calls = 0
  on('ui.render', () => ({ type: 'Text', props: {}, children: [] }))
  on('fs.write', () => ({ value: undefined }))
  on('turn.start', ($, e) => ({ turnId: e.turnId }))
  on('tool.call', ($, e) => (e.tool === 'TaskList' && ++calls === 1) ? { deny: 'not available' } : listOf('Deploy'))
  await start($, on, {})
  let ui = await band($)
  expect(await ui.find({ type: 'Text', text: /^status: task tools off/ })).toBeDefined()
  await ui.unmount()
  await $.turn.start({ turnId: 't2' })
  ui = await band($, { isWorking: true })
  expect(await ui.find({ type: 'Text', text: /^status:/ })).toBeUndefined()
  await ui.unmount()
})
