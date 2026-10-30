// The Context & Skills browser's build data, which the studio keeps whatever
// modules are on (`studio/guidance` and `studio/guidance-documents`): the
// catalog of owners and documents, and the documents' text, fetched when a
// document first opens. Both refresh while the dev server runs when guidance
// files change.
import type { ModuleBuildData } from '../modules/contract.ts'
import { guidanceCatalog, guidanceDocuments } from './catalog.ts'
import { guidanceSources, platformFolder } from './sources.ts'

const modulesFolder = () => process.env.STUDIO_MODULES || 'src/modules'

const watch = () => [
  `${platformFolder()}/**/*.md`,
  `${modulesFolder()}/*/*.md`,
  `${modulesFolder()}/*/context/**`,
  `${modulesFolder()}/*/skills/**`,
]

export const guidanceData: Record<string, ModuleBuildData> = {
  guidance: {
    watch: watch(),
    load: async ({ root, dev }) =>
      guidanceCatalog(root, await guidanceSources(root, { dev })),
  },
  'guidance-documents': {
    watch: watch(),
    load: async ({ root, dev }) =>
      guidanceDocuments(
        root,
        guidanceCatalog(root, await guidanceSources(root, { dev })),
      ),
  },
}
