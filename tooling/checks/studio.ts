import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  loadRegistry,
  pageAddresses,
  preferenceProblems,
} from '../modules/registry.ts'
import { readContributors } from '../contributors/profiles.ts'
import { adminProblems } from '../contributors/roles.ts'
import { loadSystems } from '../systems/registry.ts'
import { buildManifest, directories, treeFiles } from '../manifest/build.ts'
import { identityFileTypes } from '../identity/file-types.ts'
import { moduleChecks } from './module-checks.ts'

export async function studioProblems(root: string): Promise<string[]> {
  const problems: string[] = []
  try {
    const registry = await loadRegistry(root)
    const { config, modules, enabled } = registry
    const { contributors, problems: profiles } = readContributors(root)
    problems.push(...profiles, ...adminProblems(config, contributors))
    if ('usage' in config)
      problems.push(
        'studio.config.json: remove usage; this studio is always in team use.',
      )
    for (const [id, on] of Object.entries(config.modules ?? {})) {
      const module = modules.find(({ spec }) => spec.id === id)
      if (typeof on !== 'boolean')
        problems.push(
          `studio.config.json: modules.${id} must be true or false.`,
        )
      if (module?.spec.required && !on)
        problems.push(`studio.config.json: ${id} is required; set it to true.`)
    }
    const systems = await loadSystems(root, config)
    problems.push(...systems.problems)
    const registered = new Set(
      Object.values(contributors).map(({ studioId }) => studioId),
    )
    const grants = config.systemMaintainers
    if (
      grants !== undefined &&
      (!grants || typeof grants !== 'object' || Array.isArray(grants))
    )
      problems.push(
        'studio.config.json: systemMaintainers must map system IDs to registered contributor IDs.',
      )
    else
      for (const [system, ids] of Object.entries(grants ?? {}))
        if (
          !systems.systems.some(({ id }) => id === system) ||
          !Array.isArray(ids) ||
          ids.some((id) => !registered.has(id))
        )
          problems.push(
            `studio.config.json: systemMaintainers.${system} must name a registered system and registered contributor IDs. Correct the grant.`,
          )
    for (const system of systems.systems)
      for (const file of [
        system.spec.app.factory.from,
        ...(system.spec.app.stylesheet ? [system.spec.app.stylesheet] : []),
      ])
        if (!existsSync(path.join(system.dir, file)))
          problems.push(
            `${system.folder}/${file}: declared system file is missing. Restore it or correct system.ts.`,
          )
    if (
      !systems.systems.some(
        ({ id, spec }) =>
          id === config.defaultSystem && spec.status === 'active',
      )
    )
      problems.push(
        'studio.config.json: choose an active registered defaultSystem.',
      )
    const addresses = pageAddresses(root, modules)
    for (const key of directories(path.join(root, 'src/prototypes')))
      if (addresses.has(key))
        problems.push(
          `src/prototypes/${key}: folder collides with a page address. Rename the contributor folder.`,
        )
    for (const [key, profile] of Object.entries(contributors)) {
      if (addresses.has(key))
        problems.push(
          `contributors/${key}.json: key collides with a page address. Rename the profile and prototype folder.`,
        )
      for (const { spec } of enabled)
        if (spec.preferences)
          problems.push(
            ...preferenceProblems(
              profile.preferences[spec.id],
              spec.preferences,
            ).map(
              (problem) =>
                `contributors/${key}.json: preferences.${spec.id} ${problem}. Run yarn studio preferences.`,
            ),
          )
    }
    const pages = new Set<string>()
    for (const { spec, dir, folder } of modules) {
      for (const page of spec.pages ?? []) {
        if (pages.has(page.path))
          problems.push(
            `${folder}/module.ts: duplicate page ${page.path}. Choose a unique address.`,
          )
        pages.add(page.path)
      }
      for (const file of [
        ...(spec.pages ?? []).map(({ file }) => file),
        ...(spec.fileTypes ?? []).flatMap((type) => [
          type.page,
          type.identity,
          ...(type.check ? [type.check] : []),
        ]),
      ])
        if (!existsSync(path.join(dir, file)))
          problems.push(
            `${folder}/${file}: declared file is missing. Restore it or correct module.ts.`,
          )
    }
    problems.push(...(await moduleChecks(root, enabled)))
    const types = await identityFileTypes(enabled)
    const built = buildManifest({
      root,
      systems: systems.systems,
      fileTypes: types,
    })
    problems.push(...built.problems)
    for (const prototype of built.manifest.prototypes) {
      const { sourceProblems } = await import('./imports.ts')
      const dir = path.join(root, prototype.folder)
      for (const file of treeFiles(dir, '', true))
        if (/\.(vue|css|[cm]?[jt]s)$/.test(file)) {
          const absolute = path.join(dir, file)
          problems.push(
            ...sourceProblems(readFileSync(absolute, 'utf8'), absolute, {
              root,
              prototypesDir: path.join(root, 'src/prototypes'),
              system:
                systems.systems.find(({ id }) => id === prototype.systemId) ??
                null,
              modules: enabled
                .filter(({ spec }) => spec.library)
                .map(({ spec, dir }) => ({
                  id: spec.id,
                  dir,
                  library: spec.library!,
                })),
            }),
          )
        }
    }
  } catch (error) {
    problems.push(
      `${String(error)} Fix the declaration or configuration and run yarn studio check again.`,
    )
  }
  return problems
}
