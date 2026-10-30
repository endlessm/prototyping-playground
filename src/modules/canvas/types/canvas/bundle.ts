// Every canvas's text by its permanent ID, for the deployed site, which has
// no file service to read them from. Runs on Node.
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  directories,
  PROTOTYPES_FOLDER,
  treeFiles,
} from '../../../../../tooling/manifest/build.ts'
import { identity } from './identity.ts'

export function canvasFiles(
  root: string,
  // The browser scenarios point the studio at fixture content.
  folder = process.env.STUDIO_PROTOTYPES || PROTOTYPES_FOLDER,
) {
  const base = path.resolve(root, folder)
  const files: Record<string, string> = {}
  for (const contributor of directories(base))
    for (const name of directories(path.join(base, contributor))) {
      const dir = path.join(base, contributor, name)
      if (!existsSync(path.join(dir, 'meta.json'))) continue
      for (const file of treeFiles(dir)) {
        if (path.extname(file).toLowerCase() !== '.excalidraw') continue
        const text = readFileSync(path.join(dir, file), 'utf8')
        let id: string | null = null
        try {
          id = identity.read(text)
        } catch {
          // The build's identity audit names it.
        }
        if (id) files[id] = text
      }
    }
  return files
}
