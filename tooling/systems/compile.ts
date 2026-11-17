// Whether a component file compiles, asked of Vue's SFC compiler alone, so
// callers that only need the answer don't load the props tooling.
import { readFileSync, statSync } from 'node:fs'
import { compileScript, parse } from 'vue/compiler-sfc'

/** Why the component file's source can't be compiled, or null. */
export function compileProblem(file: string, source: string) {
  const { descriptor, errors } = parse(source, { filename: file })
  const first = errors[0]
  if (first) return first.message
  try {
    if (descriptor.script || descriptor.scriptSetup)
      compileScript(descriptor, { id: 'props' })
    return null
  } catch (error) {
    return (error as Error).message
  }
}

// Each file's last answer, kept while its time and size stay the same: the
// list of preview views asks about every component file each time it's read.
const answers = new Map<string, { version: string; problem: string | null }>()

/** Why the component file can't be read or compiled, or null. */
export function fileCompileProblem(file: string) {
  let source: string
  let version: string
  try {
    const { mtimeMs, size } = statSync(file)
    version = `${mtimeMs}:${size}`
    const known = answers.get(file)
    if (known?.version === version) return known.problem
    source = readFileSync(file, 'utf8')
  } catch (error) {
    answers.delete(file)
    return (error as Error).message
  }
  const problem = compileProblem(file, source)
  answers.set(file, { version, problem })
  return problem
}
