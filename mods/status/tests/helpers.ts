import { mock } from 'claude-code/testing'

// Shared test fixtures. SAMPLE is the spec's example STATUS.md, byte for byte.
export const SAMPLE = `# Status: project
Updated 2026-11-03 14:12 by Claude Code (session 01LwwLJi)

## Next
- Write the M4 memory tool tests
- Deploy to the server

## Waiting on you
- Approve docs/designs/m4-memory.md section 3

## Done
- 2026-11-03: Drafted the M4 memory design

## Notes
Deploy only after the brief job runs at 07:00.
`

// Stubs the session's surroundings and fires session.start. Registers no tool.call stub:
// each test registers its own before calling start, because the kit takes one stub per name.
export const start = async ($, on, files: Record<string, string>, opts: { clock?: boolean } = {}) => {
  if (opts.clock !== false) mock.clock(on)
  on('session.start', () => ({ cwd: '/Users/me/project/src' }))
  on('command.register', () => ({ value: undefined }))
  on('fs.exists', ($, e) => ({ value: e.path in files || e.path === '/Users/me/project/.git' }))
  on('fs.read', ($, e) => ({ value: files[e.path] ?? '' }))
  on('session.id', () => ({ value: '01LwwLJis3enSFi1TqKizn7D' }))
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/Users/me/project/src' })
}

// What Claude Code passes to a ui.render hook for the band above the prompt.
export const BAND = {
  plugin: 'status',
  component: 'AbovePrompt',
  requestId: 'above-prompt',
  viewport: { columns: 100, rows: 30 },
  props: { hasSurvey: false, isWorking: false, maxRows: 6, bodyColumns: 80, scroll: { offset: 0, bodyRows: 6 }, view: {} },
} as const

export const band = ($, props: Partial<typeof BAND.props> = {}) => $.ui.mount({ ...BAND, surface: 'terminal', props: { ...BAND.props, ...props } })
