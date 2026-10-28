// What the commands need to know about the registered design systems: each
// one's permanent studio ID and whether it is active, read from its
// declaration as text, without running it.
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

export interface SystemFacts {
  key: string
  studioId: string | null
  status: 'active' | 'archived'
  /** Its guidance entry, when it has one. */
  entry: string | null
}

export function readSystem(root: string, key: string): SystemFacts {
  const folder = `src/systems/${key}`
  const file = path.join(root, folder, 'system.ts')
  const source = existsSync(file) ? readFileSync(file, 'utf8') : ''
  const field = (name: string) =>
    source.match(new RegExp(`\\b${name}:\\s*["']([^"']+)["']`))?.[1] ?? null
  const entry = `${folder}/AGENTS.md`
  return {
    key,
    studioId: field('studioId'),
    status: field('status') === 'archived' ? 'archived' : 'active',
    entry: existsSync(path.join(root, entry)) ? entry : null,
  }
}

/** The systems studio.config.json registers, in its order. */
export function registeredSystems(root: string, keys: unknown) {
  return (Array.isArray(keys) ? keys : [])
    .filter((key): key is string => typeof key === 'string')
    .map((key) => readSystem(root, key))
}
