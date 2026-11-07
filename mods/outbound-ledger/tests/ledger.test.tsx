import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'outbound-ledger',
  component: 'Pane',
  requestId: 'outbound-ledger',
  props: { title: 'Outbound', isFocused: false, bodyColumns: 80, placement: 'dock', scroll: { offset: 0, bodyRows: 20 }, view: {} },
} as const

const setup = async ($: any, on: any, answer: (e: any) => unknown = () => ({ result: { stdout: 'pushed' } })) => {
  on('command.register', () => ({ value: { command: 'ledger' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.status', () => ({ value: undefined }))
  on('clock.now', () => ({ value: Date.UTC(2026, 10, 7, 14, 2) }))
  on('session.start', (_: unknown, e: any) => ({ cwd: e.cwd }))
  on('tool.call', (_: unknown, e: any) => answer(e))
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
}

test('a git push is recorded ok and the engine result comes back unchanged', async ($, on) => {
  await setup($, on)
  const r = await $.tool.call({ tool: 'Bash', command: 'git push origin main' })
  expect(r.result).toEqual({ stdout: 'pushed' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /git push origin main → git remote origin {2}ok$/ }))).toBeDefined()
  expect((await ui.find({ type: 'Text', text: '1 sent · 0 fetched' }))).toBeDefined()
  await ui.unmount()
})

test('a local command is not recorded', async ($, on) => {
  await setup($, on)
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await ui.find({ type: 'Text', text: 'Nothing went out yet.' }))).toBeDefined()
  await ui.unmount()
})

test('a denied call is recorded denied', async ($, on) => {
  await setup($, on, (e) => (e.tool === 'WebFetch' ? { deny: 'no' } : { result: {} }))
  await $.tool.call({ tool: 'WebFetch', url: 'https://example.com/x', prompt: 'p' }).catch(() => undefined)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /https:\/\/example.com\/x → example.com {2}denied$/ }))).toBeDefined()
  await ui.unmount()
})

test('the pane draws on desktop and terminal, and Sent only hides fetches', async ($, on) => {
  await setup($, on)
  await $.tool.call({ tool: 'WebSearch', query: 'mods', mode: 'standard' })
  await $.tool.call({ tool: 'WebFetch', url: 'https://example.com/', prompt: 'p' })
  for (const surface of ['desktop', 'terminal'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect(await ui.find({ type: 'Text', text: '1 sent · 1 fetched' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /example.com\/ → example.com/ })).toBeDefined()
    await ui.unmount()
  }
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'toggle' })
  expect(await ui.find({ type: 'Text', text: /example.com\/ → example.com/ })).toBe(undefined)
  expect(await ui.find({ type: 'Text', text: /mods → web search/ })).toBeDefined()
  await ui.press({ key: 'clear' })
  expect(await ui.find({ type: 'Text', text: 'Nothing went out yet.' })).toBeDefined()
  await ui.unmount()
})

test('/ledger answers with a text list', async ($, on) => {
  await setup($, on)
  await $.tool.call({ tool: 'Bash', command: 'gh pr create --draft' })
  const r = await $.command.run({ command: 'ledger', args: '' } as any)
  expect(r.text).toMatch(/^1 sent · 0 fetched\n\d\d:\d\d ↗ gh pr create --draft → github {2}ok$/)
})
