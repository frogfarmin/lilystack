import { expect, test } from 'claude-code/testing'

test('the mod loads and registers /now', async ($, on) => {
  const registered: string[] = []
  on('session.start', () => ({ cwd: '/work' }))
  on('command.register', ($, e) => { registered.push(e.name); return { value: undefined } })
  on('fs.exists', () => ({ value: false }))
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  expect(registered).toEqual(['now'])
})
