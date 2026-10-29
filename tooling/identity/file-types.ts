// The identity adapters of modules' file types, loaded on Node.
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { FidelityAdapter, IdentityAdapter } from '../modules/contract.ts'
import type { InstalledModule } from '../modules/registry.ts'

export interface IdentityFileType {
  id: string
  extensions: string[]
  identity: IdentityAdapter
  /** The problems of one file's source, as sentences. */
  check?: (source: string) => string[]
  fidelity?: FidelityAdapter
}

async function exported<T>(
  dir: string,
  file: string | undefined,
  name: string,
) {
  if (!file) return undefined
  const module = await import(pathToFileURL(path.join(dir, file)).href)
  return module[name] as T
}

export async function identityFileTypes(
  modules: InstalledModule[],
): Promise<IdentityFileType[]> {
  const types: IdentityFileType[] = []
  for (const { spec, dir } of modules)
    for (const type of spec.fileTypes ?? [])
      types.push({
        id: type.id,
        extensions: type.extensions,
        identity: (await exported<IdentityAdapter>(
          dir,
          type.identity,
          'identity',
        ))!,
        check: await exported(dir, type.check, 'check'),
        fidelity: await exported(dir, type.fidelity, 'fidelity'),
      })
  return types
}

/** The file type that claims a file, by its extension. */
export function fileTypeOf(types: IdentityFileType[], file: string) {
  const extension = path.extname(file).toLowerCase()
  return types.find((type) => type.extensions.includes(extension))
}
