// The focus mod's state contract: the list that the pane draws.
// hooks/list.ts imports these types; this file stays self-contained.

export type Item = { id: string; text: string; doneAt?: number }

export type FocusList = {
  main: Item | null
  mainSince: number | null
  after: Item[]
  done: Item[] // newest first
  nudgedFor: string | null
  seq: number // the counter behind the ids
}

declare module 'claude-code' {
  interface PluginState {
    focus: { list: Shaped<FocusList> }
  }
}
