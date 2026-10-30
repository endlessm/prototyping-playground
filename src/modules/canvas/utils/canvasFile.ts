// A canvas's file while it's open: saves edits, and takes in changes made to
// the file from outside (an agent editing it, the command line, another
// tab). The file is the source of truth. Framework-neutral: the canvas page
// (`useCanvasFile`) connects it to the editor, the file service, the dev
// server's change notices, toasts and leaving.
//
// Saving goes through the same file service as the Source view: each save
// names the version of the file it builds on, and is refused if the file
// has changed since. The newer file is then merged in and the union saved.
//   - An edit saves after a quiet moment, or every few seconds during a
//     long run of edits.
//   - One save at a time. A failed save tries again, waiting longer each
//     time.
//   - The scene Excalidraw hands back right after loading is the file
//     itself, not an edit, and so is a change taken in from the file: both
//     are recognized by their scene version.
import {
  parseCanvas,
  type ParsedCanvas,
  type Stored,
} from '../types/canvas/format'

export const SAVE_DEBOUNCE_MS = 1200
export const SAVE_MAX_WAIT_MS = 5000
const MAX_CONFLICTS = 3
const RETRY_BASE_MS = 2000
const RETRY_MAX_MS = 30_000
const PERSIST_WAIT_MS = 5000

export type SaveState = 'saved' | 'unsaved' | 'saving' | 'failed'

/** What the editor holds: every element (deleted ones too) and its view state. */
export interface CanvasSnapshot {
  elements: readonly Stored[]
  appState: { viewBackgroundColor?: string; gridSize?: number | null }
}

export interface CanvasFileText {
  content: string
  version: string
}

export interface CanvasFileOptions {
  /** The file as loaded, and the scene version Excalidraw starts with. */
  initial: CanvasFileText & { sceneVersion: number }
  /** Whether you may save it now. */
  editable: () => boolean
  /** The file's text for a snapshot, keeping the canvas's permanent ID. */
  serialize: (snapshot: CanvasSnapshot, studioId: string | null) => string
  read: () => Promise<CanvasFileText>
  /** Saves over version `base`; rejects with `code: 'changed'` if it moved on. */
  write: (content: string, base: string) => Promise<{ version: string }>
  /**
   * Puts a newer file into the editor, outside its undo history. With
   * `lastIds` (the ids in the file as last known) it is merged with the
   * unsaved edits; without, it replaces the scene. Null if the editor has
   * closed meanwhile.
   */
  take: (
    file: ParsedCanvas,
    lastIds: ReadonlySet<string> | null,
  ) => {
    needsWriteBack: boolean
    sceneVersion: number
    snapshot: CanvasSnapshot
  } | null
  onState: (state: SaveState) => void
  /** `keepsChanging` pauses saving until Retry; `retrying` tries again by itself. */
  notify: (notice: 'keepsChanging' | 'retrying') => void
}

const liveIds = (elements: readonly Stored[]) =>
  new Set(
    elements
      .filter((element) => !element.isDeleted)
      .map((element) => element.id as string),
  )

export function createCanvasFile(options: CanvasFileOptions) {
  // The file as this canvas last read or wrote it.
  let disk = {
    content: options.initial.content,
    version: options.initial.version,
    ids: liveIds(parseCanvas(options.initial.content).elements),
  }
  // The scene version already saved, or taken from the file.
  let known = options.initial.sceneVersion
  let latest: CanvasSnapshot | null = null
  let dirty = false
  let saving = false
  let paused = false
  // The text being written, to recognize this canvas's own save coming back.
  let inflight: string | null = null
  // When the first unsaved edit of the current run happened.
  let burst = 0
  let conflicts = 0
  let failures = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let state: SaveState = 'saved'

  const setState = (next: SaveState) => {
    if (next === state) return
    state = next
    options.onState(next)
  }

  function schedule(delay?: number) {
    clearTimeout(timer)
    const wait =
      delay ??
      Math.max(
        0,
        Math.min(SAVE_DEBOUNCE_MS, SAVE_MAX_WAIT_MS - (Date.now() - burst)),
      )
    timer = setTimeout(() => void save(), wait)
  }

  // Takes a newer version of the file into the scene: merged with unsaved
  // edits, or replacing the scene when there are none.
  function takeFile(next: CanvasFileText) {
    let parsed: ParsedCanvas
    try {
      parsed = parseCanvas(next.content)
    } catch {
      // Half written, or not a canvas: wait for the next change.
      return false
    }
    const taken = options.take(parsed, dirty || saving ? disk.ids : null)
    if (!taken) return false
    disk = {
      content: next.content,
      version: next.version,
      ids: liveIds(parsed.elements),
    }
    known = taken.sceneVersion
    latest = taken.snapshot
    if (taken.needsWriteBack) {
      dirty = true
      if (!paused) {
        setState('unsaved')
        schedule()
      }
    }
    return true
  }

  async function save() {
    clearTimeout(timer)
    const snapshot = latest
    if (saving || !dirty || !options.editable() || !snapshot) return
    const content = options.serialize(
      snapshot,
      parseCanvas(disk.content).studioId,
    )
    if (content === disk.content) {
      dirty = false
      burst = 0
      setState('saved')
      return
    }
    saving = true
    // An edit during the save sets it again.
    dirty = false
    burst = 0
    inflight = content
    setState('saving')
    let retryIn: number | null = null
    try {
      const { version } = await options.write(content, disk.version)
      disk = { content, version, ids: liveIds(snapshot.elements) }
      conflicts = 0
      failures = 0
      paused = false
      setState(dirty ? 'unsaved' : 'saved')
    } catch (error) {
      dirty = true
      setState('failed')
      if ((error as { code?: unknown }).code === 'changed') {
        // The file changed since it was read: merge the newer one in, then
        // save the union.
        if (++conflicts <= MAX_CONFLICTS) {
          const next = await options.read().catch(() => null)
          if (next) takeFile(next)
          retryIn = 300 + Math.random() * 300
        } else {
          paused = true
          options.notify('keepsChanging')
        }
      } else {
        if (++failures === 1) options.notify('retrying')
        retryIn = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** (failures - 1))
      }
    } finally {
      saving = false
      inflight = null
    }
    if (retryIn !== null) schedule(retryIn)
    else if (dirty && !paused) schedule()
  }

  return {
    state: () => state,
    /** Whether anything is unsaved or being saved. */
    pending: () => dirty || saving,

    /**
     * Excalidraw's change, which also reports selection and camera changes:
     * only a new scene version is an edit.
     */
    changed(snapshot: CanvasSnapshot, sceneVersion: number) {
      latest = snapshot
      if (!options.editable() || sceneVersion === known) return
      known = sceneVersion
      dirty = true
      setState(state === 'failed' ? 'failed' : 'unsaved')
      if (!burst) burst = Date.now()
      if (!paused) schedule()
    },

    /** The file changed on disk. This canvas's own saves come back here too. */
    async fileChanged() {
      const next = await options.read().catch(() => null)
      if (!next || next.version === disk.version || next.content === inflight)
        return
      takeFile(next)
    },

    /** Saves what's unsaved now; true once nothing is left. */
    async persist() {
      const deadline = Date.now() + PERSIST_WAIT_MS
      while (Date.now() < deadline) {
        if (!dirty && !saving) return true
        if (paused) return false
        if (options.editable() && !saving) {
          await save()
          if (dirty) return false
        } else await new Promise((resolve) => setTimeout(resolve, 100))
      }
      return false
    },

    /** Resumes a paused or failed save now. */
    retry() {
      paused = false
      conflicts = 0
      void save()
    },

    /** Leaving without saving: drops the unsaved edits. */
    discard() {
      dirty = false
      paused = true
      clearTimeout(timer)
    },

    /** Hiding the tab or leaving: saves what's unsaved right away. */
    flush() {
      if (dirty && !saving && !paused) void save()
    },

    dispose() {
      clearTimeout(timer)
    },
  }
}

export type CanvasFile = ReturnType<typeof createCanvasFile>
