// The identity adapters of modules' file types, loaded on Node.
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { IdentityAdapter } from '../modules/contract.ts'
import type { InstalledModule } from '../modules/registry.ts'

export interface IdentityFileType {
  id: string
  extensions: string[]
  identity: IdentityAdapter
}

export async function identityFileTypes(
  modules: InstalledModule[],
): Promise<IdentityFileType[]> {
  const types: IdentityFileType[] = []
  for (const { spec, dir } of modules)
    for (const type of spec.fileTypes ?? []) {
      const file = pathToFileURL(path.join(dir, type.identity))
      const { identity } = (await import(file.href)) as {
        identity: IdentityAdapter
      }
      types.push({ id: type.id, extensions: type.extensions, identity })
    }
  return types
}

/** The file type that claims a file, by its extension. */
export function fileTypeOf(types: IdentityFileType[], file: string) {
  const extension = path.extname(file).toLowerCase()
  return types.find((type) => type.extensions.includes(extension))
}
