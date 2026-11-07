import { expect, test } from 'claude-code/testing'
import { activityText } from '../hooks/activity.ts'

test('one line per tool', async () => {
  expect(activityText({ tool: 'Bash', command: 'ls', description: 'List files' })).toBe('List files')
  expect(activityText({ tool: 'Bash', command: 'x'.repeat(80) })).toBe('x'.repeat(60))
  expect(activityText({ tool: 'Read', file_path: '/a/b/lily' })).toBe('reading lily')
  expect(activityText({ tool: 'Edit', file_path: '/a/b/c.ts' })).toBe('editing c.ts')
  expect(activityText({ tool: 'Write', file_path: '/a/b/c.ts' })).toBe('writing c.ts')
  expect(activityText({ tool: 'NotebookEdit', notebook_path: '/n.ipynb' })).toBe('editing n.ipynb')
  expect(activityText({ tool: 'Agent', description: 'Test the skill' })).toBe('agent: Test the skill')
  expect(activityText({ tool: 'Skill', skill: 'lily-check' })).toBe('skill lily-check')
  expect(activityText({ tool: 'WebFetch', url: 'https://code.claude.com/docs/x' })).toBe('fetching code.claude.com')
  expect(activityText({ tool: 'WebSearch', query: 'mods api' })).toBe('searching: mods api')
  expect(activityText({ tool: 'Glob', pattern: '*' })).toBe('Glob')
  expect(activityText({ tool: 'TaskUpdate', taskId: '1' })).toBe(null)
  expect(activityText({ tool: 'Bash', command: 'cd x &&\n  make' })).toBe('cd x && make')
})
