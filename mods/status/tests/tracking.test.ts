import { expect, test } from 'claude-code/testing'
import { start, band } from './helpers.ts'

test('TaskCreate and TaskUpdate keep the active form and refresh from TaskList', async ($, on) => {
  let list = { tasks: [] as any[] }
  on('ui.render', () => ({ type: 'Text', props: {}, children: [] }))
  on('fs.write', () => ({ value: undefined }))
  on('tool.call', ($, e) => {
    if (e.tool === 'TaskList') return { result: JSON.stringify(list) }
    if (e.tool === 'TaskCreate') { list = { tasks: [{ id: '1', subject: e.subject, status: 'pending', blockedBy: [] }] }; return { result: { task: { id: '1', subject: e.subject } } } }
    if (e.tool === 'TaskUpdate') { list.tasks[0].status = e.status; return { result: 'ok' } }
    return { result: 'ok' }
  })
  await start($, on, {})
  await $.tool.call({ tool: 'TaskCreate', subject: 'Write tests', description: 'd', activeForm: 'Writing tests' })
  await $.tool.call({ tool: 'TaskUpdate', taskId: '1', status: 'in_progress' })
  const ui = await band($, { isWorking: true })
  expect(await ui.find({ type: 'Text', text: 'project · 0 of 1 done' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '▸ Writing tests' })).toBeDefined()
  await ui.unmount()
})

test('activity follows the last main-conversation tool call and ignores task tools and subagents', async ($, on) => {
  on('ui.render', () => ({ type: 'Text', props: {}, children: [] }))
  on('tool.call', () => ({ result: 'ok' }))
  await start($, on, {})
  await $.tool.call({ tool: 'Bash', command: 'ls', description: 'List files' })
  await $.tool.call({ tool: 'TaskList' })
  await $.tool.call({ tool: 'Read', file_path: '/x/y.ts', agentId: 'sub-1' })
  const ui = await band($)
  expect(await ui.find({ type: 'Text', text: 'now: List files' })).toBeDefined()
  await ui.unmount()
})

test('the flag is down again once AskUserQuestion has been answered', async ($, on) => {
  on('ui.render', () => ({ type: 'Text', props: {}, children: [] }))
  on('tool.call', () => ({ result: { answers: {} } }))
  await start($, on, {})
  await $.tool.call({ tool: 'AskUserQuestion', questions: [{ question: 'Which?', options: [] }] })
  const ui = await band($)
  expect(await ui.find({ type: 'Text', text: /^⚑/ })).toBeUndefined()
  await ui.unmount()
})

test('two TaskCreate calls at once keep their own active forms', async ($, on) => {
  const ids: Record<string, string> = { 'Write tests': '1', 'Deploy': '2' }
  on('ui.render', () => ({ type: 'Text', props: {}, children: [] }))
  on('fs.write', () => ({ value: undefined }))
  on('tool.call', ($, e) => {
    if (e.tool === 'TaskList') return { result: { tasks: Object.entries(ids).map(([subject, id]) => ({ id, subject, status: 'in_progress', blockedBy: [] })) } }
    if (e.tool === 'TaskCreate') return { result: { task: { id: ids[e.subject as string], subject: e.subject } } }
    return { result: 'ok' }
  })
  await start($, on, {})
  await Promise.all([
    $.tool.call({ tool: 'TaskCreate', subject: 'Write tests', description: 'd', activeForm: 'Writing tests' }),
    $.tool.call({ tool: 'TaskCreate', subject: 'Deploy', description: 'd', activeForm: 'Deploying' }),
  ])
  const ui = await band($, { isWorking: true })
  expect(await ui.find({ type: 'Text', text: '▸ Writing tests  ▸ Deploying' })).toBeDefined()
  await ui.unmount()
})
