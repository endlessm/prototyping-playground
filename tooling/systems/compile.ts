// Whether a component file compiles, asked of Vue's SFC compiler alone, so
// callers that only need the answer don't load the props tooling.
import { readFileSync } from 'node:fs'
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

/** Why the component file can't be read or compiled, or null. */
export function fileCompileProblem(file: string) {
  let source: string
  try {
    source = readFileSync(file, 'utf8')
  } catch (error) {
    return (error as Error).message
  }
  return compileProblem(file, source)
}
