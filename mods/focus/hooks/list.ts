// The focus list: one main action, the few tasks after it, and what is done.
// Pure: every op returns a new list and has no side effects.

import type { FocusList, Item } from '../types'

export type { FocusList, Item }

export const MAX_AFTER = 6
export const KEEP_DONE = 20
export const NUDGE_MS = 45 * 60_000

// True when the tasks after the main action are at MAX_AFTER: an op that adds one refuses.
export const isFull = (list: FocusList): boolean => list.main !== null && list.after.length >= MAX_AFTER

export const empty = (): FocusList => ({ main: null, mainSince: null, after: [], done: [], nudgedFor: null, seq: 0 })

const clean = (text: string): string => String(text ?? '').replace(/\s+/g, ' ').trim()

// A new item with the next id of the list.
function mint(list: FocusList, text: string): { list: FocusList; item: Item } {
  const seq = list.seq + 1
  return { list: { ...list, seq }, item: { id: 'f' + seq, text } }
}

const keepDone = (done: Item[]): Item[] => done.slice(0, KEEP_DONE)

export function setList(list: FocusList, main: string, after: readonly string[], now: number): FocusList {
  let next: FocusList = { ...list, main: null, mainSince: null, after: [], nudgedFor: null }
  const mainText = clean(main)
  const rest = (after ?? []).map(clean).filter(Boolean)
  const all = mainText ? [mainText, ...rest] : rest
  if (all.length === 0) return next
  const m = mint(next, all[0] ?? '')
  next = { ...m.list, main: m.item, mainSince: now }
  for (const text of all.slice(1, 1 + MAX_AFTER)) {
    const a = mint(next, text)
    next = { ...a.list, after: [...a.list.after, a.item] }
  }
  return next
}

export function checkMain(list: FocusList, now: number): FocusList {
  if (list.main === null) return list
  const [first, ...rest] = list.after
  return {
    ...list,
    main: first ?? null,
    mainSince: first ? now : null,
    after: rest,
    done: keepDone([{ ...list.main, doneAt: now }, ...list.done]),
    nudgedFor: null,
  }
}

export function checkAfter(list: FocusList, id: string, now: number): FocusList {
  const item = list.after.find((one) => one.id === id)
  if (!item) return list
  return { ...list, after: list.after.filter((one) => one.id !== id), done: keepDone([{ ...item, doneAt: now }, ...list.done]) }
}

export function reopen(list: FocusList, id: string, now: number): FocusList {
  const item = list.done.find((one) => one.id === id)
  if (!item || isFull(list)) return list
  const back: Item = { id: item.id, text: item.text }
  const done = list.done.filter((one) => one.id !== id)
  if (list.main === null) return { ...list, main: back, mainSince: now, done, nudgedFor: null }
  return { ...list, after: [back, ...list.after], done }
}

export function addAfter(list: FocusList, text: string, now: number): FocusList {
  const t = clean(text)
  if (!t || isFull(list)) return list
  const m = mint(list, t)
  if (m.list.main === null) return { ...m.list, main: m.item, mainSince: now, nudgedFor: null }
  return { ...m.list, after: [...m.list.after, m.item] }
}

export function setMain(list: FocusList, text: string, now: number): FocusList {
  const t = clean(text)
  if (!t || isFull(list)) return list // the old main action needs a place in after
  const m = mint(list, t)
  const after = m.list.main ? [m.list.main, ...m.list.after] : m.list.after
  return { ...m.list, main: m.item, mainSince: now, after, nudgedFor: null }
}

export const clear = (list: FocusList): FocusList => ({ ...empty(), seq: list.seq })

// 'main' names the main action; else exact text first, then a substring, case-insensitive.
export function findByText(list: FocusList, text: string): { item: Item; where: 'main' | 'after' } | null {
  const q = clean(text).toLowerCase()
  if (!q) return null
  if (q === 'main') return list.main ? { item: list.main, where: 'main' } : null
  const open: { item: Item; where: 'main' | 'after' }[] = [
    ...(list.main ? [{ item: list.main, where: 'main' as const }] : []),
    ...list.after.map((item) => ({ item, where: 'after' as const })),
  ]
  return open.find((one) => one.item.text.toLowerCase() === q) ?? open.find((one) => one.item.text.toLowerCase().includes(q)) ?? null
}

// Check off an item by its text or 'main'. Answers the new list and what was checked.
export function checkByText(list: FocusList, text: string, now: number): { list: FocusList; checked: Item | null } {
  const found = findByText(list, text)
  if (!found) return { list, checked: null }
  return { list: found.where === 'main' ? checkMain(list, now) : checkAfter(list, found.item.id, now), checked: found.item }
}

const minutes = (ms: number): number => Math.max(0, Math.floor(ms / 60_000))

export const INSTRUCTION =
  'When you give the owner one main action and the tasks after it, call mcp__focus__set. When a task is done, call mcp__focus__check. If the main action is still open, follow up on it.'

export function promptText(list: FocusList, now: number): string {
  const lines = ["The owner's focus list (from the focus mod):"]
  if (list.main === null && list.after.length === 0) {
    lines.push('No focus list yet.')
  } else {
    if (list.main) lines.push(`Main: ${list.main.text} (open ${minutes(now - (list.mainSince ?? now))} min)`)
    if (list.after.length > 0) {
      lines.push('After:')
      list.after.forEach((item, i) => lines.push(`${i + 1}. ${item.text}`))
    }
  }
  if (list.done.length > 0) lines.push('Done lately: ' + list.done.slice(0, 3).map((item) => item.text).join('; '))
  lines.push(INSTRUCTION)
  return lines.join('\n')
}

export function statusText(list: FocusList): string | undefined {
  if (list.main === null) return undefined
  return `🎯 ${list.main.text} · ${list.after.length} after`
}

const dayOf = (ms: number): string => {
  const d = new Date(ms)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

// "N of M done": done today against done today plus what is open.
export function progress(list: FocusList, now: number): { done: number; total: number } {
  const today = dayOf(now)
  const done = list.done.filter((item) => item.doneAt !== undefined && dayOf(item.doneAt) === today).length
  return { done, total: done + (list.main ? 1 : 0) + list.after.length }
}

// The nudge is due once per main action, after it has been open NUDGE_MS.
export function nudgeDue(list: FocusList, now: number): boolean {
  return list.main !== null && list.mainSince !== null && now - list.mainSince >= NUDGE_MS && list.nudgedFor !== list.main.id
}

// A stored value of an unknown shape becomes an empty list, never a crash.
export function fromStore(value: unknown): FocusList {
  if (!value || typeof value !== 'object') return empty()
  const v = value as Partial<FocusList>
  const isItem = (x: unknown): x is Item => !!x && typeof x === 'object' && typeof (x as Item).id === 'string' && typeof (x as Item).text === 'string'
  if (!Array.isArray(v.after) || !Array.isArray(v.done)) return empty()
  const main = isItem(v.main) ? v.main : null
  const after = v.after.filter(isItem)
  const done = v.done.filter(isItem)
  // The counter never falls below an id in use, so that a new id is never a copy.
  const used = [main, ...after, ...done].map((item) => Number(item?.id.replace(/^f/, '')) || 0)
  return {
    main,
    mainSince: typeof v.mainSince === 'number' ? v.mainSince : null,
    after,
    done,
    nudgedFor: typeof v.nudgedFor === 'string' ? v.nudgedFor : null,
    seq: Math.max(typeof v.seq === 'number' ? v.seq : 0, ...used),
  }
}
