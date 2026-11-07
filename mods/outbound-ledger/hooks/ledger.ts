// Pure: the ledger's counts and text. No side effects.
import type { Entry } from '../types'

export const LIMIT = 300

export function hhmm(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function counts(entries: readonly Entry[]): { sent: number; fetched: number } {
  let sent = 0
  let fetched = 0
  for (const e of entries) e.kind === 'send' ? sent++ : fetched++
  return { sent, fetched }
}

export const header = (entries: readonly Entry[]): string => {
  const c = counts(entries)
  return `${c.sent} sent · ${c.fetched} fetched`
}

export const statusText = (entries: readonly Entry[]): string | undefined => {
  if (entries.length === 0) return undefined
  const c = counts(entries)
  return `↗ ${c.sent} sent · ${c.fetched} fetched`
}

export function rowText(e: Entry): string {
  const arrow = e.kind === 'send' ? '↗' : '↙'
  return `${hhmm(e.at)} ${arrow} ${e.what} → ${e.target}  ${e.outcome}${e.isAgent ? '  (agent)' : ''}`
}

// Newest first, filtered.
export function visible(entries: readonly Entry[], sentOnly: boolean): Entry[] {
  return [...entries].reverse().filter((e) => !sentOnly || e.kind === 'send')
}

// The text answer of /ledger: works on a surface with no pane.
export function listText(entries: readonly Entry[], max = 50): string {
  if (entries.length === 0) return 'Nothing went out yet.'
  const rows = visible(entries, false).slice(0, max).map(rowText)
  const more = entries.length > max ? `\n… ${entries.length - max} older` : ''
  return header(entries) + '\n' + rows.join('\n') + more
}

export const append = (list: readonly Entry[], entry: Entry): Entry[] => [...list, entry].slice(-LIMIT)

export const settle = (list: readonly Entry[], id: string, outcome: Entry['outcome']): Entry[] =>
  list.map((e) => (e.id === id ? { ...e, outcome } : e))
