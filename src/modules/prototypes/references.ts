import {
  cssReferences,
  moveCode,
  moveVue,
} from '../../../tooling/files/reference-syntax.ts'
import type { ReferenceAdapter } from '../../../tooling/files/references.ts'

// Where views and the code and styles beside them name other files: imports,
// navigation paths (`flows/Details`), `src` and `href`, CSS imports and
// URLs. Helpers (`_` names) count too.
export const references: ReferenceAdapter[] = [
  { extensions: ['.vue'], move: moveVue },
  {
    extensions: ['.ts', '.js', '.mts', '.mjs', '.cts', '.cjs', '.tsx', '.jsx'],
    move: moveCode,
  },
  {
    extensions: ['.css'],
    move: (source, _file, context) =>
      cssReferences(source, context.relativeTarget),
  },
]
