import { existsSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { InstalledModule } from '../modules/registry.ts'

/** Module-owned content validation, shared by CLI and strict build. */
export async function moduleChecks(root: string, modules: InstalledModule[]) {
  const problems: string[] = []
  for (const { dir, folder } of modules) {
    const file = path.join(dir, 'check.ts')
    if (!existsSync(file)) continue
    try {
      const { check } = await import(pathToFileURL(file).href)
      if (typeof check !== 'function')
        throw new Error('export a check function')
      const result = await check({
        root,
        dir,
        enabled: modules.map(({ spec }) => spec.id),
      })
      if (
        !Array.isArray(result) ||
        result.some((value) => typeof value !== 'string')
      )
        throw new Error('check must return a list of problem strings')
      problems.push(
        ...result.map((problem: string) => `${folder}/check.ts: ${problem}`),
      )
    } catch (error) {
      problems.push(
        `${folder}/check.ts: ${String(error)}. Fix the module check.`,
      )
    }
  }
  return problems
}
