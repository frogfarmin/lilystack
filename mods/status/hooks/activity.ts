// One short line for what a tool call is doing, for the band's "now:" row. Pure.

const TASK_TOOLS = new Set(['TaskCreate', 'TaskUpdate', 'TaskGet', 'TaskList'])

const flat = (text: string): string => text.replace(/\s+/g, ' ').trim()
const basename = (path: unknown): string => String(path ?? '').split('/').pop() ?? ''

export function activityText(e: { tool: string } & Record<string, unknown>): string | null {
  if (TASK_TOOLS.has(e.tool)) return null
  switch (e.tool) {
    case 'Bash': {
      const description = typeof e.description === 'string' ? flat(e.description) : ''
      return description || flat(String(e.command ?? '')).slice(0, 60)
    }
    case 'Read': return 'reading ' + basename(e.file_path)
    case 'Edit': return 'editing ' + basename(e.file_path)
    case 'Write': return 'writing ' + basename(e.file_path)
    case 'NotebookEdit': return 'editing ' + basename(e.notebook_path)
    case 'Agent': return 'agent: ' + String(e.description ?? '')
    case 'Skill': return 'skill ' + String(e.skill ?? '')
    case 'WebFetch': {
      try { return 'fetching ' + new URL(String(e.url)).host } catch { return e.tool }
    }
    case 'WebSearch': return 'searching: ' + String(e.query ?? '')
    default: return e.tool
  }
}
