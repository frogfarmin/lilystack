// The outbound-ledger mod: a read-only audit trail of what the session sends out.
// It never blocks or changes a call, and it makes no network call itself.
// Every mods API call lives in this file; classify.ts and ledger.ts are pure.
import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'
import type { Entry } from '../types'
import { classify } from './classify.ts'
import { append, header, listText, rowText, settle, statusText, visible } from './ledger.ts'

const PANE = 'outbound-ledger'
// Change the shape tag when Entry's fields change: it declines what an earlier version stored.
const entries = atom({ plugin: 'outbound-ledger', key: 'entries' } as const, [], { shape: 'entries-1' })
const sentOnly = atom({ plugin: 'outbound-ledger', key: 'sentOnly' } as const, false)

let seq = 0

const COLOR: Record<Entry['outcome'], 'red' | 'yellow' | undefined> = { ok: undefined, pending: undefined, error: 'red', denied: 'yellow' }

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    try {
      await $.command.register({ name: 'ledger', description: 'Show what this session sent out, and open the Outbound pane' })
    } catch {
      // A taken name must not stop the session.
    }
    return next(e)
  })

  on('command.run', { command: 'ledger' }, async ($) => {
    try {
      await $.ui.open({ id: PANE, title: 'Outbound' })
    } catch {
      // No pane on this surface: the text answer still works.
    }
    return { text: listText(await read($, entries)) }
  })

  // Every tool call: record the outward ones. The real result of next(e) always goes back.
  on('tool.call', async ($, e, next) => {
    let id: string | null = null
    try {
      const found = classify(e.tool, e as unknown as Record<string, unknown>)
      if (found !== null) {
        id = String(e.tool_use_id ?? `ledger-${++seq}`)
        const entry: Entry = { id, at: await $.clock.now(), tool: e.tool, ...found, outcome: 'pending', isAgent: e.agentId !== undefined }
        await update($, entries, (list) => append(list, entry))
      }
    } catch {
      id = null // the ledger failed; the call goes on unrecorded
    }
    if (id === null) return next(e)

    const r = await next(e)
    try {
      const outcome: Entry['outcome'] = r.deny !== undefined ? 'denied' : r.isError === true ? 'error' : 'ok'
      const settled = id
      await update($, entries, (list) => settle(list, settled, outcome))
      $.ui.status(statusText(await read($, entries)))
    } catch {
      // never break the call
    }
    return r
  }).catch(($, e, next) => next(e)) // a ledger failure never blocks the call

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const list = await read($, entries)
    const only = await read($, sentOnly)
    const room = Math.max(1, (e.props?.scroll?.bodyRows ?? 20) - 2)
    const rows = visible(list, only).slice(0, room)

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" gap={1}>
          <Text bold>{header(list)}</Text>
          <Button key="toggle" onPress={() => void update($, sentOnly, (v) => !v)}>
            {only ? 'Show all' : 'Sent only'}
          </Button>
          <Button key="clear" onPress={() => void update($, entries, () => []).then(() => $.ui.status(undefined))}>
            Clear
          </Button>
        </Box>
        {rows.length === 0 && <Text dimColor>Nothing went out yet.</Text>}
        {rows.map((row) => (
          <Text color={COLOR[row.outcome]} dimColor={row.outcome === 'pending' || row.kind === 'fetch'} wrap="truncate">
            {rowText(row)}
          </Text>
        ))}
      </Box>
    )
  })
}
