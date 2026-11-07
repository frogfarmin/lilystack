// The type contract of the outbound-ledger mod: the values it keeps in $.state.
export type Kind = 'send' | 'fetch'
export type Outcome = 'pending' | 'ok' | 'error' | 'denied'
export type Entry = {
  id: string
  at: number
  tool: string
  kind: Kind
  target: string
  what: string
  outcome: Outcome
  isAgent: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'outbound-ledger': {
      entries: Shaped<Entry[]>
      sentOnly: boolean
    }
  }
}
