import { execFileSync } from 'node:child_process'
import path from 'node:path'

export function git(root: string, ...args: string[]) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  })
}

export function changedFiles(root: string, before?: string, after?: string) {
  return git(
    root,
    'diff',
    '--name-only',
    '--no-renames',
    '-z',
    '--diff-filter=ACDMR',
    ...(before && after ? [before, after] : ['--cached']),
  )
    .split('\0')
    .filter(Boolean)
}

export function contentAt(root: string, file: string, ref?: string): string {
  try {
    return git(root, 'show', `${ref ?? ''}:${file}`)
  } catch {
    return ''
  }
}

export function assetProblems(root: string, files: string[], after?: string) {
  const allowFile = contentAt(root, '.studio/asset-allowlist.json', after)
  const allow: Record<string, string> = allowFile ? JSON.parse(allowFile) : {}
  return files.flatMap((file) => {
    try {
      git(root, 'cat-file', '-e', `${after ?? ''}:${file}`)
    } catch {
      return []
    }
    const size = Number(
      git(root, 'cat-file', '-s', `${after ?? ''}:${file}`).trim(),
    )
    if (
      size <= 750 * 1024 ||
      (typeof allow[file] === 'string' && allow[file]!.trim())
    )
      return []
    return [
      `${file}: ${(size / 1024).toFixed(1)} KB exceeds 750 KB. Resize or convert images to WebP; unavoidable files need a reason in .studio/asset-allowlist.json.`,
    ]
  })
}

interface Profile {
  studioId: string
  email: string
  emails?: string[]
  github?: string
}

export function scopeReport(
  root: string,
  files: string[],
  before = 'HEAD',
  after?: string,
) {
  const config = JSON.parse(
    contentAt(root, 'studio.config.json', before) || '{}',
  )
  const profiles: Record<string, Profile> = {}
  for (const file of git(
    root,
    'ls-tree',
    '-r',
    '--name-only',
    before,
    '--',
    'contributors',
  )
    .trim()
    .split('\n')
    .filter((file) => file.endsWith('.json'))) {
    const source = contentAt(root, file, before)
    if (source) profiles[path.basename(file, '.json')] = JSON.parse(source)
  }
  const actor = process.env.GITHUB_ACTOR?.toLowerCase()
  let email = ''
  try {
    email = git(root, 'config', 'user.email').trim().toLowerCase()
  } catch {
    /* Unregistered identity. */
  }
  const keys = Object.keys(profiles).filter((key) =>
    actor
      ? profiles[key]!.github?.toLowerCase() === actor
      : [profiles[key]!.email, ...(profiles[key]!.emails ?? [])].some(
          (value) => value.toLowerCase() === email,
        ),
  )
  const key = keys.length === 1 ? keys[0]! : null
  const id = key ? profiles[key]!.studioId : null
  const admin = id && (config.admins ?? []).includes(id)
  const outside: string[] = []
  const lines = files.map((file) => {
    let allowed = Boolean(admin)
    const prototype = /^src\/prototypes\/([^/]+)\//.exec(file)
    if (prototype) allowed ||= prototype[1] === key
    if (file === `contributors/${key}.json`) allowed = true
    const system = /^src\/systems\/([^/]+)\//.exec(file)
    if (system && id) {
      const declaration = contentAt(
        root,
        `src/systems/${system[1]}/system.ts`,
        before,
      )
      const systemId = /studioId:\s*['"]([^'"]+)/.exec(declaration)?.[1]
      if (systemId)
        allowed ||= (config.systemMaintainers?.[systemId] ?? []).includes(id)
    }
    if (!allowed) outside.push(file)
    return `${allowed ? 'inside' : 'outside'} scope: ${file}`
  })
  const identity: string[] = []
  // The complete after-side tree catches duplicates outside the changed set.
  const all = after
    ? git(root, 'ls-tree', '-r', '--name-only', after).trim().split('\n')
    : git(root, 'ls-files', '-z').split('\0')
  const ids = new Map<string, string>()
  const markers = (source: string) =>
    [
      ...source.matchAll(
        /(?:@studio-(?:id|state)\s+|["']?studioId["']?\s*:\s*["'])([0-9a-z]{16})/g,
      ),
    ].map((match) => match[1]!)
  for (const file of all.filter(
    (file) =>
      /^(src\/prototypes\/|src\/systems\/[^/]+\/system\.ts$|contributors\/)/.test(
        file,
      ) && /\.(vue|md|json|ts|mmd)$/.test(file),
  )) {
    const current = contentAt(root, file, after)
    for (const id of markers(current)) {
      const previous = ids.get(id)
      if (previous)
        identity.push(
          `${file}: permanent ID ${id} is duplicated in ${previous}. Remove the copied ID and run yarn studio identify.`,
        )
      ids.set(id, file)
    }
    if (files.includes(file) && current)
      for (const id of markers(contentAt(root, file, before)))
        if (!markers(current).includes(id))
          identity.push(
            `${file}: permanent ID ${id} was removed or changed. Restore the original marker.`,
          )
  }
  return { outside, identity, lines }
}
