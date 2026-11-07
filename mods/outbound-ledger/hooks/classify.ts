// Pure: turns one tool call into one ledger line, or null when nothing goes out.
// No side effects and no $ calls; register.tsx owns those.

export type Kind = 'send' | 'fetch'
export type Outward = { kind: Kind; target: string; what: string }

// The Lilystack mods' own tools are not outward actions.
const OWN_SERVERS = new Set(['outbound-ledger', 'verify-gate', 'focus'])

// An MCP tool name in words: `pull_request_read` -> pull, request, read; `createEvent` -> create, event.
const nameWords = (name: string): string[] => name.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase().split(/[_\-\s]+/).filter(Boolean)

// A read word wins: `pull_request_read`, `list_labels` and `get_label` only fetch.
const READ_WORDS = new Set(['get', 'list', 'search', 'read', 'describe', 'query', 'fetch', 'check', 'analyze', 'preview', 'diff', 'scan', 'view', 'find', 'show', 'whoami', 'ping', 'details', 'status', 'lookup'])
const WRITE_WORDS = new Set(['create', 'update', 'delete', 'send', 'push', 'merge', 'publish', 'write', 'add', 'post', 'reply', 'forward', 'trash', 'untrash', 'remove', 'set', 'upload', 'register', 'deploy', 'transfer', 'buy', 'renew', 'label', 'unlabel', 'mark', 'unmark', 'submit', 'revert', 'resolve', 'unresolve', 'enable', 'disable', 'trigger', 'fork', 'archive', 'rename', 'edit', 'apply', 'top', 'share', 'revoke', 'rotate', 'restore', 'reset', 'move', 'copy', 'batch', 'fire', 'request', 'save', 'generate', 'import', 'spawn', 'respond', 'configure', 'connect', 'disconnect', 'cancel', 'confirm', 'retry', 'rollback', 'reissue', 'reorder', 'make', 'build', 'install', 'switch', 'dismiss', 'append', 'insert', 'clear'])

export function isWriteName(name: string): boolean {
  const w = nameWords(name)
  if (w.some((x) => READ_WORDS.has(x))) return false
  return w.some((x) => WRITE_WORDS.has(x))
}

const MAX = 120

// Masks tokens and secret values, then cuts the text to 120 characters.
export function redact(text: string): string {
  let out = String(text)
    .replace(/\b(gh[pousr]_[A-Za-z0-9]{8,}|github_pat_[A-Za-z0-9_]{8,})/g, '***')
    .replace(/\bsk-[A-Za-z0-9_-]{8,}/g, 'sk-***')
    .replace(/\bxox[abpr]-[A-Za-z0-9-]{6,}/g, 'xox-***')
    .replace(/\bAKIA[0-9A-Z]{12,}/g, 'AKIA***')
    .replace(/(Authorization:\s*)(Bearer\s+|Basic\s+|token\s+)?[^\s'"]+/gi, '$1***')
    .replace(/\bBearer\s+[^\s'"]+/gi, 'Bearer ***')
    .replace(/\b(token|key|password|secret|api_key|apikey|access_token)=([^\s&'"]+)/gi, '$1=***')
  if (out.length > MAX) out = out.slice(0, MAX - 1) + '…'
  return out
}

// Words of one shell segment, quotes removed. Good enough for a label; not a shell parser.
function words(segment: string): string[] {
  const out: string[] = []
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(segment)) !== null) out.push(m[1] ?? m[2] ?? m[3] ?? '')
  // Drop env assignments and wrappers in front of the command.
  while (out.length > 0 && (/^[A-Za-z_][A-Za-z0-9_]*=/.test(out[0] ?? '') || out[0] === 'sudo' || out[0] === 'env' || out[0] === 'command')) out.shift()
  return out
}

export function segments(command: string): string[] {
  return command
    .split(/&&|\|\||;|\||\n/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function hostOf(url: string): string | null {
  const m = /^https?:\/\/([^/?#:@]+@)?([^/?#:]+)/i.exec(url)
  return m && m[2] ? m[2].toLowerCase() : null
}

const firstUrl = (w: string[]): string | undefined => w.find((x) => /^https?:\/\//i.test(x))

const GH_WRITE: Record<string, RegExp> = {
  pr: /^(create|merge|comment|review|edit|close|ready|reopen)$/,
  issue: /^(create|comment|edit|close|reopen|delete|transfer)$/,
  release: /^(create|edit|delete|upload)$/,
  repo: /^(create|fork|delete|edit|rename|archive)$/,
  gist: /^(create|edit|delete)$/,
  label: /^(create|edit|delete)$/,
  secret: /^(set|delete)$/,
  variable: /^(set|delete)$/,
  workflow: /^(run|enable|disable)$/,
  run: /^(rerun|cancel|delete)$/,
}

function bashSegment(w: string[]): Outward | null {
  const [cmd, sub, third] = w
  if (!cmd) return null
  const what = w.join(' ')

  if (cmd === 'git') {
    // Skip global options such as -C dir.
    let i = 1
    while (i < w.length && (w[i] ?? '').startsWith('-')) i += w[i] === '-C' || w[i] === '-c' ? 2 : 1
    const verb = w[i]
    if (verb === 'push') {
      const rest = w.slice(i + 1).filter((x) => !x.startsWith('-'))
      return { kind: 'send', target: 'git remote ' + (rest[0] ?? 'default'), what }
    }
    if (verb === 'fetch' || verb === 'pull' || verb === 'clone' || verb === 'ls-remote') {
      const rest = w.slice(i + 1).filter((x) => !x.startsWith('-'))
      const url = rest.find((x) => /^https?:\/\//.test(x))
      return { kind: 'fetch', target: url ? (hostOf(url) ?? url) : 'git remote ' + (rest[0] ?? 'default'), what }
    }
    return null
  }

  if (cmd === 'gh') {
    if (sub === 'api') {
      const methodAt = w.findIndex((x) => x === '-X' || x === '--method')
      const method = methodAt >= 0 ? (w[methodAt + 1] ?? '').toUpperCase() : ''
      const inline = w.find((x) => /^--method=/.test(x))?.split('=')[1]?.toUpperCase() ?? ''
      const hasFields = w.some((x) => /^(-f|-F|--field|--raw-field|--input)$/.test(x) || /^--(raw-)?field=/.test(x))
      const writes = /^(POST|PUT|PATCH|DELETE)$/.test(method || inline) || (hasFields && method !== 'GET' && inline !== 'GET')
      return { kind: writes ? 'send' : 'fetch', target: 'github', what }
    }
    const rule = sub ? GH_WRITE[sub] : undefined
    return { kind: rule && third && rule.test(third) ? 'send' : 'fetch', target: 'github', what }
  }

  if (cmd === 'curl' || cmd === 'wget') {
    const url = firstUrl(w)
    const target = (url && hostOf(url)) ?? 'unknown host'
    const methodAt = w.findIndex((x) => x === '-X' || x === '--request')
    const method = methodAt >= 0 ? (w[methodAt + 1] ?? '').toUpperCase() : ''
    const sends =
      /^(POST|PUT|PATCH|DELETE)$/.test(method) ||
      w.some((x) => /^(-d|-F|-T|--form|--upload-file|--post-data|--post-file|--method=(POST|PUT|PATCH|DELETE))$/i.test(x) || /^--data/.test(x) || /^-d./.test(x))
    return { kind: sends ? 'send' : 'fetch', target, what }
  }

  if ((cmd === 'npm' || cmd === 'pnpm' || cmd === 'yarn') && sub === 'publish') return { kind: 'send', target: 'npm registry', what }
  if (cmd === 'cargo' && sub === 'publish') return { kind: 'send', target: 'crates.io', what }
  if (cmd === 'twine' && sub === 'upload') return { kind: 'send', target: 'PyPI', what }
  if (cmd === 'gem' && sub === 'push') return { kind: 'send', target: 'RubyGems', what }

  if (cmd === 'ssh') {
    const host = w.slice(1).find((x) => !x.startsWith('-'))
    return host ? { kind: 'send', target: host.replace(/^[^@]*@/, ''), what } : null
  }
  if (cmd === 'scp' || cmd === 'rsync') {
    const remote = w.slice(1).find((x) => !x.startsWith('-') && /^[^/\s]+:/.test(x) && !/^https?:/.test(x))
    return remote ? { kind: 'send', target: (remote.split(':')[0] ?? remote).replace(/^[^@]*@/, ''), what } : null
  }

  if ((cmd === 'npm' || cmd === 'pnpm' || cmd === 'yarn' || cmd === 'bun') && (sub === 'install' || sub === 'i' || sub === 'add' || sub === 'ci'))
    return { kind: 'fetch', target: 'npm registry', what }
  if ((cmd === 'pip' || cmd === 'pip3' || cmd === 'uv') && (sub === 'install' || (sub === 'pip' && third === 'install'))) return { kind: 'fetch', target: 'PyPI', what }
  if (cmd === 'brew' && sub === 'install') return { kind: 'fetch', target: 'Homebrew', what }
  return null
}

// One Bash command can hold several outward segments: the one that sends wins, then the first.
function bash(command: string): Outward | null {
  const found = segments(command).map((s) => bashSegment(words(s))).filter((x): x is Outward => x !== null)
  const chosen = found.find((x) => x.kind === 'send') ?? found[0]
  if (chosen === undefined) return null
  return found.length > 1 ? { ...chosen, what: chosen.what + ` (+${found.length - 1} more)` } : chosen
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '')

export function classify(tool: string, input: Record<string, unknown>): Outward | null {
  let out: Outward | null = null
  if (tool === 'Bash') out = bash(str(input.command))
  else if (tool === 'WebFetch') {
    const url = str(input.url)
    out = { kind: 'fetch', target: hostOf(url) ?? 'web', what: url }
  } else if (tool === 'WebSearch') out = { kind: 'send', target: 'web search', what: str(input.query) }
  else if (tool.startsWith('mcp__')) {
    const [, server = '', name = ''] = tool.split('__')
    if (OWN_SERVERS.has(server)) return null
    out = { kind: isWriteName(name) ? 'send' : 'fetch', target: server, what: name }
  } else if (tool === 'Artifact') {
    const action = str(input.action) || 'publish'
    const sends = ['publish', 'delete', 'pin', 'unpin'].includes(action)
    const subject = str(input.url) || str(input.file_path) || str(input.intent)
    out = { kind: sends ? 'send' : 'fetch', target: 'claude.ai', what: ('artifact ' + action + ' ' + subject).trim() }
  } else if (tool === 'ArtifactData') {
    const action = str(input.action)
    out = { kind: ['set', 'update', 'delete', 'batch'].includes(action) ? 'send' : 'fetch', target: 'claude.ai', what: ('artifact data ' + action + ' ' + str(input.collection)).trim() }
  } else if (tool === 'ArtifactComments') {
    const action = str(input.action)
    out = { kind: ['create', 'reply'].includes(action) ? 'send' : 'fetch', target: 'claude.ai', what: ('artifact comments ' + action).trim() }
  }
  return out === null ? null : { kind: out.kind, target: redact(out.target), what: redact(out.what) }
}
