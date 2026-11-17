// A system component's Breakdown and a new experiment of it start from the
// same source, so every piece the original's Breakdown shows is a tag of the
// new experiment's file under the same node ID, and Save as experiment can
// write each knob change. Checked on all of the real Endless Studios
// components; the sidebar, which only renders a copied app component, starts
// from that app component's own template and script.
import path from 'node:path'
import { beforeAll, describe, expect, test } from 'vitest'
import {
  readBreakdown,
  type BreakdownNode,
} from '../../tooling/systems/breakdown'
import { componentPages, systemCatalog } from '../../tooling/systems/catalog'
import type { InstalledSystem } from '../../tooling/systems/registry'
import { loadSystems } from '../../tooling/systems/registry'
import { startSource } from '../../tooling/systems/start-source'
import { readFileSync } from 'node:fs'

const ENDLESS = '8x5spen6xtvp96a9'
const root = process.cwd()
const prototypes = path.join(root, 'src/prototypes')
let system: InstalledSystem

beforeAll(async () => {
  const { systems } = await loadSystems(root, { systems: ['endless-studios'] })
  system = systems.find(({ id }) => id === ENDLESS)!
})

const ids = (node: BreakdownNode): string[] => [
  node.id,
  ...node.children.flatMap(ids),
]

function experimentOf(slug: string) {
  const component = systemCatalog(system, root).components.find(
    (each) => each.slug === slug,
  )!
  const read = (file: string | null) =>
    file
      ? {
          file: path.resolve(root, file),
          source: readFileSync(path.resolve(root, file), 'utf8'),
        }
      : null
  const target = path.join(prototypes, 'ben', `${slug}-experiments`, 'One.vue')
  const source = startSource({
    component: read(component.source)!,
    examples: read(component.examplesFile),
    target,
    system,
  })
  return { target, source }
}

describe('a component’s Breakdown and its new experiments', () => {
  test('[LAB-42] hold the same pieces, for every Endless Studios component', async () => {
    const pages = await componentPages([system], root)
    const components = systemCatalog(system, root).components.filter(
      ({ source }) => source,
    )
    expect(components).toHaveLength(36)
    const differing: string[] = []
    for (const { slug } of components) {
      const original = pages[`${ENDLESS}/${slug}`]!.breakdown!
      expect(original.error, slug).toBeNull()
      const { target, source } = experimentOf(slug)
      const experiment = readBreakdown({
        file: target,
        text: source,
        system,
        root,
        name: 'One',
        follow: [system.dir, prototypes],
      })
      expect(experiment.error, slug).toBeNull()
      const want = ids(original.tree!)
      const got = ids(experiment.tree!)
      if (JSON.stringify(want) !== JSON.stringify(got)) differing.push(slug)
    }
    expect(differing).toEqual([])
  })

  test('[LAB-42] the input’s Breakdown starts from its Default example, the field around the input', async () => {
    const pages = await componentPages([system], root)
    const tree = pages[`${ENDLESS}/input`]!.breakdown!.tree!
    expect(ids(tree)).toEqual(
      expect.arrayContaining([
        'root>UFormField',
        'root>UFormField/UInput',
        'root>UFormField/UInput#base',
      ]),
    )
    expect(ids(tree)).not.toContain('root>UInput')
  })

  test('[LAB-42] the sidebar starts from the app’s own sidebar, its pieces in the file', async () => {
    const { source } = experimentOf('studio-sidebar')
    expect(source).toContain('<USidebar')
    expect(source).not.toContain('<StudioSidebar')
    expect(source).not.toContain('StudioSidebar.vue')
    // Its imports still reach the app's files through `~/`.
    expect(source).toContain("from '~/components/Notifications/index.vue'")
    // The wrapper's markup, styles and desktop layout come along; what
    // reads its props doesn't.
    expect(source).toContain('class="studio-sidebar-page"')
    expect(source).toContain('<style scoped>')
    expect(source).toContain('window.matchMedia = ')
    expect(source).not.toContain('props.user')
    expect(source).not.toContain('defineProps')

    const pages = await componentPages([system], root)
    const tree = pages[`${ENDLESS}/studio-sidebar`]!.breakdown!.tree!
    expect(ids(tree)).toContain('root>USidebar')
    expect(ids(tree).some((id) => id.startsWith('root>StudioSidebar'))).toBe(
      false,
    )
  })
})
