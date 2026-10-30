// The names a system's stand-ins module exports, which the preview build
// auto-imports into views and copied app source. The module is the only
// list: adding a stand-in is its file plus one export line there.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { standInNames } from '../../tooling/preview/stand-ins'

let dir: string
beforeEach(() => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'stand-ins-'))
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

test('[SY-194] reads every name the stand-ins module exports, and nothing else', () => {
  const file = path.join(dir, 'shims.ts')
  writeFileSync(
    file,
    `// Stand-ins: export { notThis } from 'a comment'
import { helper } from './helper'
export { navigateTo, useRouter, useRoute } from '../runtime/navigation';
export {
  useNuxtApp,
  useState as useSharedState,
} from '../runtime/nuxt-app'
export type { Shape } from './types'
export { type Other, useStore } from '../runtime/store'
export function useThing() { return helper }
export const useOther = () => 1, useThird = 2
export async function useLater() {}
`,
  )
  expect(standInNames(file).sort()).toEqual(
    [
      'navigateTo',
      'useRouter',
      'useRoute',
      'useNuxtApp',
      'useSharedState',
      'useStore',
      'useThing',
      'useOther',
      'useThird',
      'useLater',
    ].sort(),
  )
})
