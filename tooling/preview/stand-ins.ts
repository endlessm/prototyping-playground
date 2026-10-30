// A system's stand-ins module (`app.standIns` in its `system.ts`) re-exports
// the names Nuxt auto-imports in the app. Its exports are the auto-import
// list, so registering a stand-in is one export line there. Read as text:
// importing it on Node would load the system's runtime.
import { readFileSync } from 'node:fs'

const comments = /\/\*[\s\S]*?\*\/|\/\/[^\n]*/g

/** The value names a module exports, in order; type-only exports are left out. */
export function standInNames(file: string): string[] {
  const source = readFileSync(file, 'utf8').replace(comments, '')
  const names: string[] = []
  for (const [, type, list] of source.matchAll(
    /\bexport\s+(type\s+)?\{([^}]*)\}/g,
  )) {
    if (type) continue
    for (const entry of list!.split(',')) {
      const words = entry.trim().split(/\s+/)
      if (!words[0] || words[0] === 'type') continue
      names.push(words.at(-1)!)
    }
  }
  for (const [, name] of source.matchAll(
    /\bexport\s+(?:async\s+)?function\s*\*?\s*([\w$]+)/g,
  ))
    names.push(name!)
  for (const [, declarations] of source.matchAll(
    /\bexport\s+(?:const|let|var)\s+([^\n;]*)/g,
  ))
    for (const [, name] of declarations!.matchAll(/(?:^|,)\s*([\w$]+)\s*=/g))
      names.push(name!)
  return names
}
