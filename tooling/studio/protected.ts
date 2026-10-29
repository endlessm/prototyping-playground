// Places no command deletes, whatever a module declares or a flag says: the
// source root and the folders that hold modules, prototypes and systems.
// Deletions stay inside src/, and leave no empty folders behind.
import { existsSync, readdirSync, rmdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { Refusal } from './output.ts'

const PROTECTED = new Set([
  'src',
  'src/modules',
  'src/prototypes',
  'src/systems',
])

/** The absolute path of a folder a command may delete, or a refusal. */
export function removable(root: string, relative: string) {
  const clean = path.posix
    .normalize(relative.replaceAll('\\', '/'))
    .replace(/\/+$/, '')
  if (
    !clean ||
    clean.startsWith('..') ||
    path.posix.isAbsolute(clean) ||
    !clean.startsWith('src/') ||
    PROTECTED.has(clean)
  )
    throw new Refusal(
      `Refusing to delete ${relative}: commands delete only folders inside src/, never ${[...PROTECTED].join(', ')} themselves.`,
    )
  return path.join(root, clean)
}

/** Deletes a removable folder, then any parents it left empty. */
export function removeFolder(root: string, relative: string) {
  const absolute = removable(root, relative)
  rmSync(absolute, { recursive: true, force: true })
  const src = path.join(root, 'src')
  for (
    let dir = path.dirname(absolute);
    dir.startsWith(src + path.sep) &&
    !PROTECTED.has(path.relative(root, dir).split(path.sep).join('/'));
    dir = path.dirname(dir)
  ) {
    if (existsSync(dir) && !readdirSync(dir).length) rmdirSync(dir)
    else break
  }
}
