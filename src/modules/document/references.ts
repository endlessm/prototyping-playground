import { markdownReferences } from '../../../tooling/files/reference-syntax.ts'
import type { ReferenceAdapter } from '../../../tooling/files/references.ts'

// A document's links and embeds name files relative to it.
export const references: ReferenceAdapter[] = [
  {
    extensions: ['.md'],
    move: (source, _file, context) => markdownReferences(source, context.link),
  },
]
