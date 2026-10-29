// File types' own checks: what each type says is wrong with its files, such
// as a canvas holding an image. The build stops on any problem.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { BuiltManifest } from '../manifest/build.ts'
import type { FileCheck } from '../modules/contract.ts'
import type { InstalledModule } from '../modules/registry.ts'

/** Each file type's check, by the type's ID. */
export async function fileTypeChecks(modules: InstalledModule[]) {
  const checks: Record<string, FileCheck> = {}
  for (const { spec, dir } of modules)
    for (const type of spec.fileTypes ?? [])
      if (type.check) {
        const file = pathToFileURL(path.join(dir, type.check))
        checks[type.id] = (
          (await import(file.href)) as { check: FileCheck }
        ).check
      }
  return checks
}

/** Every problem in the manifest's artifacts, as "<file>: <problem>". */
export function fileProblems(
  root: string,
  built: BuiltManifest,
  checks: Record<string, FileCheck>,
) {
  const problems: string[] = []
  for (const [prototypeId, artifacts] of Object.entries(built.artifacts))
    for (const { file, type, unavailable } of artifacts) {
      const check = checks[type]
      if (!check || unavailable) continue
      const source = readFileSync(path.resolve(root, file), 'utf8')
      for (const problem of check(source, { prototypeId }))
        problems.push(`${file}: ${problem}`)
    }
  return problems
}
