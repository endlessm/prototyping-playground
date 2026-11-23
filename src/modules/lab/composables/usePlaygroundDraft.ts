import type { SourceFile } from '../../../../app/components/source/sourceAccess'
import {
  requestJson,
  StudioRequestError,
} from '../../../../app/utils/studioRequest'

// The Playground's draft of its component file, while the studio runs
// locally. Edits, typed or made with a class dial, go to the draft through
// the file service, a moment after the last one; the Playground's stage
// renders the draft and nothing else does. Save writes it over the file, over
// the version read, then drops the draft; Discard drops it. The service
// decides who may write (an Admin or the system's maintainer); anyone else
// reads the file, with the reason. A draft left from before opens again.
export function usePlaygroundDraft(
  systemId: () => string,
  /** Inside the system's folder. */
  path: () => string,
) {
  const { t } = useI18n()
  const toast = useStudioToast()
  const base = useRuntimeConfig().app.baseURL
  const sourceUrl = `${base}_studio/files/system-source`
  const draftUrl = `${base}_studio/files/system-draft`
  const address = () => ({ system: systemId(), path: path() })

  /** The file as last read or saved. */
  const file = shallowRef<SourceFile>()
  const code = ref('')
  const failure = ref<string>()
  const saving = ref(false)
  /** The file changed on disk while there was a draft. */
  const conflict = ref(false)
  const editable = computed(() => Boolean(file.value?.editable))
  /** The text differs from the saved file. */
  const unsaved = computed(
    () => Boolean(file.value) && code.value !== file.value!.content,
  )

  const readFile = () =>
    requestJson<SourceFile>(`${sourceUrl}?${new URLSearchParams(address())}`)

  async function load() {
    failure.value = undefined
    file.value = undefined
    if (!systemId() || !path()) return
    try {
      const [read, { draft }] = await Promise.all([
        readFile(),
        requestJson<{ draft: string | null }>(
          `${draftUrl}?${new URLSearchParams(address())}`,
        ),
      ])
      file.value = read
      written = draft ?? read.content
      code.value = written
      conflict.value = false
    } catch (error) {
      failure.value = (error as Error).message
    }
  }

  // The text the draft holds, so the same text isn't written twice.
  let written = ''
  let timer: ReturnType<typeof setTimeout> | undefined
  let writing: Promise<unknown> = Promise.resolve()
  function writeDraft() {
    clearTimeout(timer)
    timer = undefined
    if (!editable.value || code.value === written) return writing
    const content = code.value
    written = content
    writing = writing
      .then(() =>
        requestJson(draftUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...address(), content }),
        }),
      )
      .catch((error: Error) => {
        written = ''
        toast.error(t('lab.editor.draftFailed'), error.message)
      })
    return writing
  }
  const DRAFT_MS = 250
  watch(code, () => {
    if (!file.value || !editable.value) return
    clearTimeout(timer)
    timer = setTimeout(writeDraft, DRAFT_MS)
  })

  async function dropDraft() {
    await requestJson(`${draftUrl}?${new URLSearchParams(address())}`, {
      method: 'DELETE',
    })
  }

  async function save() {
    const current = file.value
    if (!current || !editable.value || !unsaved.value || saving.value) return
    saving.value = true
    const content = code.value
    try {
      await writeDraft()
      const { version } = await requestJson<{ version: string }>(sourceUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...address(), content, base: current.version }),
      })
      file.value = { ...current, content, version }
      await dropDraft()
      written = content
      conflict.value = false
      toast.success(t('lab.editor.saved', { file: fileName() }))
    } catch (error) {
      if (error instanceof StudioRequestError && error.code === 'changed')
        conflict.value = true
      else toast.error(t('lab.editor.saveFailed'), (error as Error).message)
    } finally {
      saving.value = false
    }
  }

  async function discard() {
    const current = file.value
    if (!current) return
    clearTimeout(timer)
    try {
      await writing
      await dropDraft()
      // The file as it is on disk now, which may have moved on.
      const read = await readFile()
      file.value = read
      written = read.content
      code.value = read.content
      conflict.value = false
    } catch (error) {
      toast.error(t('lab.editor.discardFailed'), (error as Error).message)
    }
  }

  // The file changed on disk: a clean editor takes it, one with a draft says
  // so, as Save would then refuse.
  async function changedOnDisk() {
    if (saving.value || !file.value) return
    const read = await readFile().catch(() => undefined)
    if (!read || read.version === file.value.version) {
      if (read) file.value = { ...read, content: file.value.content }
      return
    }
    if (unsaved.value) conflict.value = true
    else {
      file.value = read
      written = read.content
      code.value = read.content
    }
  }
  /** Keeps the draft and saves over the file as it is on disk now. */
  async function keepMine() {
    const read = await readFile().catch(() => undefined)
    if (!read || !file.value) return
    file.value = { ...read, content: file.value.content }
    conflict.value = false
  }

  const fileName = () => path().split('/').at(-1) ?? path()

  if (import.meta.hot) {
    const hot = import.meta.hot
    const heard = ({ files }: { files: string[] }) => {
      if (file.value && files.includes(file.value.path)) void changedOnDisk()
    }
    hot.on('studio:source', heard)
    onBeforeUnmount(() => hot.off('studio:source', heard))
  }
  onBeforeUnmount(() => {
    // A last edit still waiting reaches the draft, so it isn't lost.
    if (timer) void writeDraft()
  })

  watch(() => [systemId(), path()], load, { immediate: true })

  return {
    file,
    code,
    failure,
    saving,
    conflict,
    editable,
    unsaved,
    save,
    discard,
    keepMine,
    fileName,
  }
}

export type PlaygroundDraft = ReturnType<typeof usePlaygroundDraft>
