import { expect, test } from 'claude-code/testing'
import { SAMPLE, start } from './helpers.ts'

test('/now prints the file at the git root', async ($, on) => {
  on('tool.call', () => ({ result: { tasks: [] } }))
  await start($, on, { '/Users/me/project/STATUS.md': SAMPLE })
  const a = await $.command.run({ command: 'now', args: '' })
  expect(a.text).toBe(SAMPLE)
})

test('/now says when there is no file', async ($, on) => {
  on('tool.call', () => ({ result: { tasks: [] } }))
  await start($, on, {})
  const a = await $.command.run({ command: 'now', args: '' })
  expect(a.text).toBe('No STATUS.md in /Users/me/project')
})

test('no git root: /now says so and nothing is read', async ($, on) => {
  const reads: string[] = []
  on('session.start', () => ({ cwd: '/tmp/x' }))
  on('command.register', () => ({ value: undefined }))
  on('fs.exists', () => ({ value: false }))
  on('fs.read', ($, e) => { reads.push(e.path); return { value: '' } })
  on('session.id', () => ({ value: 'abc' }))
  on('tool.call', () => ({ result: { tasks: [] } }))
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/tmp/x' })
  expect((await $.command.run({ command: 'now', args: '' })).text).toBe('No project root (no .git above /tmp/x)')
  expect(reads).toEqual([])
})

test('a folder with no slash (C:\\proj) ends the search for .git', async ($, on) => {
  on('session.start', () => ({ cwd: 'C:\\proj' }))
  on('command.register', () => ({ value: undefined }))
  on('fs.exists', () => ({ value: false }))
  on('fs.read', () => ({ value: '' }))
  on('session.id', () => ({ value: 'abc' }))
  on('tool.call', () => ({ result: { tasks: [] } }))
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: 'C:\\proj' })
  expect((await $.command.run({ command: 'now', args: '' })).text).toBe('No project root (no .git above C:\\proj)')
})
