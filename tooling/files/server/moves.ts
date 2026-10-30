// The dev server's watcher of renames and moves made outside the studio
// (`../watch-moves.ts`), a Nitro plugin that runs only while the dev server
// does (`../nuxt-module.ts`). It watches the prototypes folder and repairs
// references in the prototypes you may change; the file tree route tells it
// when the studio moved something itself (`settleMoves`).
import { watch } from 'node:fs'
import path from 'node:path'
import { defineNitroPlugin, useRuntimeConfig } from 'nitropack/runtime'
import { fileAccess } from '../source.ts'
import { watchMoves } from '../watch-moves.ts'
import type { FileServiceConfig } from '../nuxt-module.ts'
import { loadFileTypes, loadReferences, remembered } from './common.ts'

const SETTLE_MS = 100

let watcher: ReturnType<typeof watchMoves> | undefined

/** After the studio's own move: what is on disk now is how things are. */
export const settleMoves = () => watcher?.capture()

export default defineNitroPlugin(async (nitro) => {
  const config = useRuntimeConfig().studioFiles as FileServiceConfig
  const access = fileAccess({
    ...config,
    fileTypes: await loadFileTypes(config),
    identify: remembered(config.root),
  })
  const moves = watchMoves({
    scopes: () =>
      [...access.prototypes()]
        .filter(
          ({ contributor, meta }) => !access.refusalFor(contributor, meta),
        )
        .map(({ dir }) => dir),
    references: () => loadReferences(config),
    onRepair: (dir, relinked) =>
      console.info(
        `[studio] ${access.display(dir)}: references updated in ${relinked.join(', ')} after a move.`,
      ),
    onError: (dir, error) =>
      console.warn(
        `[studio] ${access.display(dir)}: references couldn’t be updated after a move. ${error.message}`,
      ),
  })
  watcher = moves
  moves.capture()
  let timer: ReturnType<typeof setTimeout> | undefined
  // Files and folders coming and going ("rename" events) may be a move;
  // edits aren't. A move of many files settles into one look.
  const folder = path.resolve(config.root, config.prototypesFolder)
  const watching = watch(folder, { recursive: true }, (event) => {
    if (event !== 'rename') return
    clearTimeout(timer)
    timer = setTimeout(() => void moves.flush(), SETTLE_MS)
  })
  nitro.hooks.hook('close', () => {
    clearTimeout(timer)
    watching.close()
    if (watcher === moves) watcher = undefined
  })
})
