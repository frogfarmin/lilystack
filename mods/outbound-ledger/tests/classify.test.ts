import { expect, test } from 'claude-code/testing'
import { classify, isWriteName, redact } from '../hooks/classify.ts'

const bash = (command: string) => classify('Bash', { command })

test('git push sends, git fetch fetches, git status is nothing', async () => {
  expect(bash('git push -u origin main')).toEqual({ kind: 'send', target: 'git remote origin', what: 'git push -u origin main' })
  expect(bash('git push')?.target).toBe('git remote default')
  expect(bash('git fetch origin main')?.kind).toBe('fetch')
  expect(bash('git clone https://github.com/a/b')?.target).toBe('github.com')
  expect(bash('git status')).toBe(null)
})

test('a chained command: the push wins over the local test', async () => {
  expect(bash('npm test && git push origin x')).toEqual({ kind: 'send', target: 'git remote origin', what: 'git push origin x' })
  expect(bash('git fetch && git push origin x')?.what).toBe('git push origin x (+1 more)')
})

test('gh: writes send, reads fetch', async () => {
  expect(bash('gh pr create --draft --title t')?.kind).toBe('send')
  expect(bash('gh pr merge 3 --squash')?.kind).toBe('send')
  expect(bash('gh issue comment 4 -b hi')?.kind).toBe('send')
  expect(bash('gh pr view 3')?.kind).toBe('fetch')
  expect(bash('gh api -X POST repos/a/b/issues')?.kind).toBe('send')
  expect(bash('gh api repos/a/b/issues -f title=x')?.kind).toBe('send')
  expect(bash("gh api -X GET search/code -f q='x'")?.kind).toBe('fetch')
  expect(bash('gh api repos/a/b')?.target).toBe('github')
})

test('curl and wget', async () => {
  expect(bash('curl -sS https://api.example.com/v1/x')).toEqual({ kind: 'fetch', target: 'api.example.com', what: 'curl -sS https://api.example.com/v1/x' })
  expect(bash('curl -X POST https://hooks.example.com/a')?.kind).toBe('send')
  expect(bash("curl -d '{}' https://a.example.com")?.kind).toBe('send')
  expect(bash('curl --data-binary @f https://a.example.com')?.kind).toBe('send')
  expect(bash('wget https://dl.example.com/f.tgz')?.kind).toBe('fetch')
})

test('publish, ssh, scp, rsync and installs', async () => {
  expect(bash('npm publish')).toEqual({ kind: 'send', target: 'npm registry', what: 'npm publish' })
  expect(bash('cargo publish')?.target).toBe('crates.io')
  expect(bash('twine upload dist/*')?.target).toBe('PyPI')
  expect(bash('gem push x.gem')?.target).toBe('RubyGems')
  expect(bash('ssh me@box.local uptime')?.target).toBe('box.local')
  expect(bash('scp f.txt me@srv:/tmp/')?.target).toBe('srv')
  expect(bash('rsync -a dist/ srv:/var/www')?.target).toBe('srv')
  expect(bash('rsync -a a/ b/')).toBe(null)
  expect(bash('npm install')).toEqual({ kind: 'fetch', target: 'npm registry', what: 'npm install' })
  expect(bash('pip install requests')?.target).toBe('PyPI')
  expect(bash('brew install jq')?.target).toBe('Homebrew')
  expect(bash('ls -la')).toBe(null)
})

test('web, MCP and Artifact tools', async () => {
  expect(classify('WebFetch', { url: 'https://docs.example.com/a?b=1', prompt: 'p' })).toEqual({ kind: 'fetch', target: 'docs.example.com', what: 'https://docs.example.com/a?b=1' })
  expect(classify('WebSearch', { query: 'claude mods' })).toEqual({ kind: 'send', target: 'web search', what: 'claude mods' })
  expect(classify('mcp__github__create_pull_request', {})).toEqual({ kind: 'send', target: 'github', what: 'create_pull_request' })
  expect(classify('mcp__github__get_file_contents', {})?.kind).toBe('fetch')
  expect(classify('mcp__Gmail__send_message', {})?.kind).toBe('send')
  expect(classify('mcp__focus__set', {})).toBe(null)
  expect(classify('mcp__verify-gate__x', {})).toBe(null)
  expect(classify('Artifact', { file_path: 'a.html' })).toEqual({ kind: 'send', target: 'claude.ai', what: 'artifact publish a.html' })
  expect(classify('Artifact', { action: 'read', url: 'u' })?.kind).toBe('fetch')
  expect(classify('ArtifactData', { action: 'batch', collection: 'rows' })?.kind).toBe('send')
  expect(classify('ArtifactComments', { action: 'reply' })?.kind).toBe('send')
  expect(classify('Read', { file_path: 'x' })).toBe(null)
})

test('redact masks tokens and secret values, and cuts long text', async () => {
  expect(redact('git push https://ghp_abcdefghij1234@github.com/a/b')).toBe('git push https://***@github.com/a/b')
  expect(redact('github_pat_11AAAAAAAA_bbbb')).toBe('***')
  expect(redact('curl -H "Authorization: Bearer abc.def" https://x')).toBe(`curl -H "Authorization: ***" https://x`)
  expect(redact('Bearer xyz123')).toBe('Bearer ***')
  expect(redact('key sk-ant-api03-abcdefgh')).toBe('key sk-***')
  expect(redact('xoxb-1234-5678-abc')).toBe('xox-***')
  expect(redact('AKIAABCDEFGHIJKLMNOP')).toBe('AKIA***')
  expect(redact('https://a.com/?token=s3cr3t&x=1 password=hunter2')).toBe('https://a.com/?token=***&x=1 password=***')
  const long = redact('x'.repeat(200))
  expect(long.length).toBe(120)
  expect(long.endsWith('…')).toBe(true)
  expect(classify('Bash', { command: 'curl https://a.com/?api_key=zzz' })?.what).toBe('curl https://a.com/?api_key=***')
})

test('MCP names: a read word wins, a write word sends, parts of words do not count', async () => {
  for (const name of ['pull_request_read', 'list_pull_requests', 'get_label', 'list_labels', 'get_file_contents', 'search_threads', 'check_domain'])
    expect(isWriteName(name)).toBe(false)
  for (const name of ['pull_request_review_write', 'issue_write', 'create_or_update_file', 'merge_pull_request', 'send_message', 'request_copilot_review', 'save_to_library', 'createEvent'])
    expect(isWriteName(name)).toBe(true)
  expect(isWriteName('mock_call')).toBe(false)
})

test('redact masks URL userinfo, -u user:pass, secret headers, _key= params and JSON secrets', async () => {
  expect(redact('git clone https://me:hunter2@git.example.com/a')).toBe('git clone https://***@git.example.com/a')
  expect(redact('curl -u me:hunter2 https://x')).toBe('curl -u *** https://x')
  expect(redact("curl --user 'me:hunter2' https://x")).toBe('curl --user *** https://x')
  expect(redact('curl --user=me:hunter2 https://x')).toBe('curl --user=*** https://x')
  expect(redact('git push -u origin main')).toBe('git push -u origin main')
  expect(redact('curl -H "X-Api-Key: abc123" https://x')).toBe('curl -H "X-Api-Key: ***" https://x')
  expect(redact("curl -H 'X-Auth-Token: abc123' -H 'X-Client-Secret:zz' https://x")).toBe("curl -H 'X-Auth-Token: ***' -H 'X-Client-Secret:***' https://x")
  expect(redact('curl -H "authorization: Basic dXNlcjpwYXNz" https://x')).toBe('curl -H "authorization: ***" https://x')
  expect(redact('curl -d client_secret=abc -d private_key=def https://x')).toBe('curl -d client_secret=*** -d private_key=*** https://x')
  expect(redact('X_API_KEY=abc curl https://x')).toBe('X_API_KEY=*** curl https://x')
  expect(redact('monkey=banana')).toBe('monkey=banana')
  expect(redact(`curl -d '{"password": "hunter2", "api_key":"k1", "token" : "t1", "client_secret": "s1", "name": "a"}' https://x`)).toBe(
    `curl -d '{"password": "***", "api_key":"***", "token" : "***", "client_secret": "***", "name": "a"}' https://x`,
  )
})

test('the target of a URL with user:pass is the host, and the userinfo is masked', async () => {
  expect(bash('curl https://me:hunter2@api.example.com/v1')).toEqual({ kind: 'fetch', target: 'api.example.com', what: 'curl https://***@api.example.com/v1' })
  expect(bash('git clone https://me:tok@git.example.com/a/b')?.target).toBe('git.example.com')
  expect(classify('WebFetch', { url: 'https://u:p@docs.example.com/a' })).toEqual({ kind: 'fetch', target: 'docs.example.com', what: 'https://***@docs.example.com/a' })
})

test('curl sends with -XPOST, --request=POST, --json, -d and --data*', async () => {
  for (const c of [
    'curl -XPOST https://a.example.com',
    'curl -Xput https://a.example.com',
    'curl --request=POST https://a.example.com',
    'curl --request PATCH https://a.example.com',
    `curl --json '{"a":1}' https://a.example.com`,
    'curl -d x=1 https://a.example.com',
    'curl -dx=1 https://a.example.com',
    'curl --data-urlencode x=1 https://a.example.com',
    'curl --data=x https://a.example.com',
  ]) expect([c, bash(c)?.kind]).toEqual([c, 'send'])
  expect(bash('curl -XGET https://a.example.com')?.kind).toBe('fetch')
  expect(bash('curl --request=GET https://a.example.com')?.kind).toBe('fetch')
})

test('timeout N, nohup and time in front of a command are skipped', async () => {
  expect(bash('timeout 30 git push origin main')?.target).toBe('git remote origin')
  expect(bash('timeout -s KILL 5m curl -X POST https://a.example.com')?.kind).toBe('send')
  expect(bash('nohup curl https://a.example.com')?.target).toBe('a.example.com')
  expect(bash('time npm publish')?.target).toBe('npm registry')
  expect(bash('sudo env FOO=1 nohup timeout 10 gh pr merge 3')?.kind).toBe('send')
})
