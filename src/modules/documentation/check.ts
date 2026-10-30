import path from 'node:path'
import { manualChapters } from './manual.ts'

// The module's content check (`studio check` and the strict build): Manual
// chapters whose metadata the Manual can't read.
export function check({ dir, enabled }: { dir: string; enabled: string[] }) {
  return manualChapters(path.join(dir, 'pages'), 'pages', enabled).problems
}
