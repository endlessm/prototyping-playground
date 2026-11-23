import type { Ref } from 'vue'
import type { SourceFile } from '../../../../app/components/source/sourceAccess'
import type { ComponentPropsDoc } from '../../../../tooling/systems/props'
import {
  requestJson,
  StudioRequestError,
} from '../../../../app/utils/studioRequest'
import type { PlaygroundCode } from './usePlaygroundDraft'

/** Which version: its prototype's and its view's permanent IDs. */
export interface VersionAddress {
  prototype: string
  artifact: string
}

// A version's code beside the stage, while the studio runs locally: the
// view's file through the file service, edited in a draft the Lab's server
// handler keeps (`server/versions.ts`), which only the version's stage
// renders. As the Playground's draft does: edits reach the draft a moment
// after the last one; Save writes over the file as read, with the file
// service's permission messages, then drops the draft; Discard drops it. A
// draft left from before opens again. Someone else's version is read-only,
// with the reason. The version's own props (`props`) are read again after
// each change, so props it adds reach the dials.
export function useVersionDraft(
  address: () => VersionAddress | null,
): PlaygroundCode & {
  props: Readonly<Ref<ComponentPropsDoc | null>>
} {
  const { t } = useI18n()
  const toast = useStudioToast()
  const base = useRuntimeConfig().app.baseURL
  const sourceUrl = `${base}_studio/files/source`
  const versionsUrl = `${base}_studio/modules/lab/versions`

  const file = shallowRef<SourceFile>()
  const code = ref('')
  const failure = ref<string>()
  const saving = ref(false)
  const conflict = ref(false)
  const props = shallowRef<ComponentPropsDoc | null>(null)
  const editable = computed(() => Boolean(file.value?.editable))
  const unsaved = computed(
    () => Boolean(file.value) && code.value !== file.value!.content,
  )

  const ask = <T>(action: string, extra: Record<string, unknown> = {}) =>
    requestJson<T>(versionsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...address(), ...extra }),
    })
  const readFile = () => {
    const at = address()!
    return requestJson<SourceFile>(
      `${sourceUrl}?${new URLSearchParams({ prototype: at.prototype, artifact: at.artifact })}`,
    )
  }

  let propsTimer: ReturnType<typeof setTimeout> | undefined
  const PROPS_MS = 600
  function readProps() {
    clearTimeout(propsTimer)
    propsTimer = setTimeout(async () => {
      if (!address()) return
      const read = await ask<{ props?: ComponentPropsDoc }>('props').catch(
        () => undefined,
      )
      // A version that doesn't compile keeps the props it had.
      if (read?.props) props.value = read.props
    }, PROPS_MS)
  }

  let written = ''
  async function load() {
    failure.value = undefined
    file.value = undefined
    props.value = null
    if (!address()) return
    try {
      const [read, { draft }] = await Promise.all([
        readFile(),
        ask<{ draft: string | null }>('read-draft'),
      ])
      file.value = read
      written = draft ?? read.content
      code.value = written
      conflict.value = false
      readProps()
    } catch (error) {
      failure.value = (error as Error).message
    }
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  let writing: Promise<unknown> = Promise.resolve()
  function writeDraft() {
    clearTimeout(timer)
    timer = undefined
    if (!editable.value || code.value === written) return writing
    const content = code.value
    written = content
    writing = writing
      .then(() => ask('write-draft', { content }))
      .then(readProps)
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

  const fileName = () => file.value?.path.split('/').at(-1) ?? ''

  async function save() {
    const current = file.value
    const at = address()
    if (!current || !at || !editable.value || !unsaved.value || saving.value)
      return
    saving.value = true
    const content = code.value
    try {
      await writeDraft()
      const { version } = await requestJson<{ version: string }>(sourceUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...at, content, base: current.version }),
      })
      file.value = { ...current, content, version }
      await ask('discard-draft')
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
    if (!file.value) return
    clearTimeout(timer)
    try {
      await writing
      await ask('discard-draft')
      // The file as it is on disk now, which may have moved on.
      const read = await readFile()
      file.value = read
      written = read.content
      code.value = read.content
      conflict.value = false
      readProps()
    } catch (error) {
      toast.error(t('lab.editor.discardFailed'), (error as Error).message)
    }
  }

  /** Keeps the draft and saves over the file as it is on disk now. */
  async function keepMine() {
    const read = await readFile().catch(() => undefined)
    if (!read || !file.value) return
    file.value = { ...read, content: file.value.content }
    conflict.value = false
  }

  onBeforeUnmount(() => {
    clearTimeout(propsTimer)
    // A last edit still waiting reaches the draft, so it isn't lost.
    if (timer) void writeDraft()
  })

  watch(
    () => {
      const at = address()
      return at ? `${at.prototype}/${at.artifact}` : ''
    },
    load,
    { immediate: true },
  )

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
    props,
  }
}
