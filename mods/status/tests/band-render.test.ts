import { expect, test } from 'claude-code/testing'
import { SAMPLE, start, band } from './helpers.ts'

test("idle with a file draws last-session rows and keeps the other mods' band", async ($, on) => {
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['drawn by Claude Code'] }))
  on('tool.call', () => ({ result: { tasks: [] } }))
  await start($, on, { '/Users/me/project/STATUS.md': SAMPLE })
  const ui = await band($)
  expect(await ui.find({ type: 'Text', text: 'project · last session' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^○ Write the M4/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^⚑ waiting on you: Approve/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'drawn by Claude Code' })).toBeDefined()
  await ui.unmount()
})

test('working with a list draws the checklist and the now line', async ($, on) => {
  on('ui.render', () => ({ type: 'Text', props: {}, children: [] }))
  on('fs.write', () => ({ value: undefined }))
  on('tool.call', ($, e) => e.tool === 'TaskList' ? { result: { tasks: [{ id: '1', subject: 'Deploy', status: 'in_progress', blockedBy: [] }] } } : { result: 'ok' })
  await start($, on, {})
  await $.tool.call({ tool: 'TaskUpdate', taskId: '1', status: 'in_progress', activeForm: 'Deploying' })
  await $.tool.call({ tool: 'Bash', command: 'x', description: 'Pull on the server' })
  const ui = await band($, { isWorking: true })
  expect(await ui.find({ type: 'Text', text: '▸ Deploying' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'now: Pull on the server' })).toBeDefined()
  await ui.unmount()
})

test('task tools off: one red row names the setting', async ($, on) => {
  on('ui.render', () => ({ type: 'Text', props: {}, children: [] }))
  on('tool.call', () => ({ deny: 'TaskList is not available' }))
  await start($, on, {})
  const ui = await band($)
  expect(await ui.find({ type: 'Text', text: 'status: task tools off, set CLAUDE_CODE_ENABLE_TODO_TOOLS=1' })).toBeDefined()
  await ui.unmount()
})
