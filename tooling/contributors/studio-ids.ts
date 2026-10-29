// Permanent studio IDs: 16 lowercase Crockford base32 characters from ten
// random bytes. Nothing about them changes when a thing is renamed or moved.
import { randomBytes } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz'
const ID_IN_TEXT = /"studioId"\s*:\s*"([0-9a-z]{16})"|studioId:\s*["']([0-9a-z]{16})["']/g

export function newStudioId(taken: ReadonlySet<string> = new Set()) {
  for (;;) {
    const bytes = randomBytes(10)
    let bits = 0
    let value = 0
    let id = ''
    for (const byte of bytes) {
      value = (value << 8) | byte
      bits += 8
      while (bits >= 5) {
        id += ALPHABET[(value >>> (bits - 5)) & 31]
        bits -= 5
      }
    }
    if (!taken.has(id)) return id
  }
}

function idsIn(file: string) {
  if (!existsSync(file)) return []
  return [...readFileSync(file, 'utf8').matchAll(ID_IN_TEXT)].map(
    (match) => match[1] ?? match[2]!,
  )
}

const folders = (dir: string) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(dir, entry.name))
    : []

/** The IDs contributors, prototypes and systems already use. */
export function studioIdsInUse(root: string) {
  const ids = new Set<string>()
  const contributors = path.join(root, 'contributors')
  const files = [
    ...(existsSync(contributors)
      ? readdirSync(contributors)
          .filter((name) => name.endsWith('.json'))
          .map((name) => path.join(contributors, name))
      : []),
    ...folders(path.join(root, 'src/prototypes'))
      .flatMap(folders)
      .map((folder) => path.join(folder, 'meta.json')),
    ...folders(path.join(root, 'src/systems')).map((folder) =>
      path.join(folder, 'system.ts'),
    ),
  ]
  for (const file of files) for (const id of idsIn(file)) ids.add(id)
  return ids
}
