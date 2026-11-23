import type { SourceFile } from '../../../../app/components/source/sourceAccess'
import type { ComponentPageData } from '../../systems/composables/useSystemCatalog'
import type { PlaygroundCode } from './usePlaygroundDraft'

// An app component's original beside the stage: the copied app file as its
// page data carries it, read-only, with the line saying how to change it. It
// has the shape the editor takes a draft in, so a version's draft can take
// its place. Typing changes nothing: the editor doesn't accept input.
export function useOriginalSource(
  original: () => ComponentPageData['original'],
): PlaygroundCode {
  const { t } = useI18n()
  const file = computed<SourceFile | undefined>(() => {
    const found = original()
    return found
      ? {
          path: found.file,
          content: found.source,
          version: found.revision ?? '',
          editable: false,
          reason: t('lab.original.readOnly'),
        }
      : undefined
  })
  const code = ref('')
  watch(
    () => original()?.source,
    (source) => (code.value = source ?? ''),
    { immediate: true },
  )
  const no = computed(() => false)
  const nothing = async () => {}
  return {
    file,
    code,
    failure: computed(() => undefined),
    saving: no,
    conflict: no,
    editable: no,
    unsaved: no,
    save: nothing,
    discard: nothing,
    keepMine: nothing,
    fileName: () => original()?.path.split('/').at(-1) ?? '',
  }
}
