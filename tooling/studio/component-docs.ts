// yarn component-docs <system> [component] [--yes]: adds the examples file
// and page a component is missing (or every component of the system), from
// templates, moving a flat component into a folder of its own first. Without
// --yes it says what it would do. Files that exist are never touched.
import path from 'node:path'
import { CONFIG_FILE, readConfig } from '../modules/registry.ts'
import {
  applyScaffold,
  planScaffold,
  ScaffoldError,
  scaffoldTargets,
  type ScaffoldStep,
} from '../systems/scaffold.ts'
import { loadSystems } from '../systems/registry.ts'
import { NOTHING_CHANGED, Refusal, say, type Flags } from './output.ts'

const USAGE =
  'Usage: yarn component-docs <system> [component] [--yes] (for example: yarn component-docs endless-studios button)'

const describe = (step: ScaffoldStep) =>
  step.kind === 'move'
    ? `Move ${step.from} to ${step.file}`
    : `Create ${step.file}`

// Each component file's required props, for the starter example. Without
// Vue's component metadata tooling the example starts without them.
async function requiredProps(root: string, steps: ScaffoldStep[]) {
  const sources = new Set<string>()
  for (const step of steps)
    if (
      step.kind === 'move' &&
      step.from!.endsWith('.vue') &&
      !step.from!.endsWith('.examples.vue')
    )
      sources.add(step.from!)
    else if (step.file.endsWith('.examples.vue'))
      sources.add(step.file.replace(/\.examples\.vue$/, '.vue'))
  const required: Record<string, { name: string; type: string }[]> = {}
  try {
    const { componentProps } = await import('../systems/props.ts')
    const absolute = [...sources].map((file) => path.join(root, file))
    const found = await componentProps(absolute)
    for (const file of sources) {
      const result = found[path.join(root, file)]
      if (result && !('error' in result))
        required[file] = result.props
          .filter((prop) => prop.required)
          .map(({ name, type }) => ({ name, type }))
    }
  } catch {
    // Not installed: the starter example has no props.
  }
  return required
}

export async function componentDocs(
  root: string,
  args: string[],
  flags: Flags,
) {
  const [key, only] = args
  if (!key) throw new Refusal(USAGE)
  const config = readConfig(path.join(root, CONFIG_FILE))
  const { systems } = await loadSystems(root, config)
  const system = systems.find((entry) => entry.key === key || entry.id === key)
  if (!system)
    throw new Refusal(
      `"${key}" isn't a system. The systems are: ${systems.map((entry) => entry.key).join(', ') || 'none'}.`,
    )
  let steps: ScaffoldStep[]
  try {
    steps = planScaffold(system, root, scaffoldTargets(system, only))
  } catch (error) {
    if (error instanceof ScaffoldError) throw new Refusal(error.message)
    throw error
  }
  if (!steps.length) {
    say(
      'Nothing to add: every component already has its examples and page, in a folder of its own.',
    )
    return
  }
  if (!flags.yes) {
    say('This would:')
    for (const step of steps) say(`  ${describe(step)}`)
    say(NOTHING_CHANGED)
    return
  }
  const done = applyScaffold(root, steps, await requiredProps(root, steps))
  for (const step of done)
    say(
      step.kind === 'move'
        ? `Moved ${step.from} to ${step.file}`
        : `Created ${step.file}`,
    )
  say(
    'Fill in each description, "When to use" and example, then check the page in the studio.',
  )
}
