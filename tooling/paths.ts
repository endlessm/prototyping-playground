// Paths as the tooling compares and writes them on every computer.
import path from 'node:path'

/** A path with `/` between its parts, as manifests and imports write it. */
export const posix = (file: string) => file.split(path.sep).join('/')

/** Whether `file` is `dir` or inside it. */
export const within = (file: string, dir: string) => {
  const relative = path.relative(dir, file)
  return (
    relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
  )
}
