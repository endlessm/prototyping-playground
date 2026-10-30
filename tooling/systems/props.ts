// A Vue component's props, read from its code for the component page's
// props table: `defineProps` with its defaults and doc comments, through Vue's
// component metadata tooling (vue-component-meta, which runs TypeScript). One
// checker reads every file asked for, so a system's components cost one
// TypeScript program. Loaded on demand: the `studio` command never needs it.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { compileScript, parse } from 'vue/compiler-sfc'
import { createCheckerByJson } from 'vue-component-meta'

export interface PropDoc {
  name: string
  type: string
  required: boolean
  default: string | null
  description: string
}

export interface ComponentPropsDoc {
  name: string
  props: PropDoc[]
  /** It passes native attributes on to the element it renders. */
  native: boolean
}

export type PropsResult = ComponentPropsDoc | { error: string }

// Vue's types from the studio's own install, so a component outside the
// checkout (or in a system without its own Vue) still has its macros.
const VUE = path.dirname(
  createRequire(import.meta.url).resolve('vue/package.json'),
)

// Why the file can't be read as a component, or null. The metadata tooling
// reads a broken file as one without props, so the compiler says first.
function compileProblem(file: string, source: string) {
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

/** Each file's props, or why they couldn't be read; by absolute path. */
export async function componentProps(files: string[]) {
  const found: Record<string, PropsResult> = {}
  const readable: string[] = []
  for (const file of files) {
    let source: string
    try {
      source = readFileSync(file, 'utf8')
    } catch (error) {
      found[file] = {
        error: `${path.basename(file)}: ${(error as Error).message}`,
      }
      continue
    }
    const problem = compileProblem(file, source)
    if (problem) found[file] = { error: `${path.basename(file)}: ${problem}` }
    else readable.push(file)
  }
  if (!readable.length) return found
  const checker = createCheckerByJson(
    path.dirname(readable[0]!),
    {
      include: readable,
      compilerOptions: {
        strict: true,
        skipLibCheck: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        target: 'esnext',
        jsx: 'preserve',
        // The props' own types are enough; leaving out every installed
        // package's types makes this seconds faster.
        types: [],
        lib: ['esnext', 'dom'],
        paths: { vue: [VUE] },
      },
    },
    { forceUseTs: true, printer: { newLine: 1 } },
  )
  for (const file of readable) {
    try {
      const meta = checker.getComponentMeta(file)
      found[file] = {
        name: path.basename(file, '.vue'),
        native: !/inheritAttrs\s*:\s*false/.test(readFileSync(file, 'utf8')),
        props: meta.props
          .filter((prop) => !prop.global)
          .map((prop) => ({
            name: prop.name,
            // Optional props are typed `… | undefined`, which says nothing
            // the table doesn't.
            type: prop.required
              ? prop.type
              : prop.type.replace(/ \| undefined$/, ''),
            required: prop.required,
            default: prop.default ?? null,
            description: prop.description,
          })),
      }
    } catch (error) {
      found[file] = {
        error: `${path.basename(file)}: ${(error as Error).message}`,
      }
    }
  }
  return found
}
