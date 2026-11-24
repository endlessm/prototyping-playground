import type { Ref } from 'vue'
import type { SourceFile } from '../../../../app/components/source/sourceAccess'
import { useManifest } from '../../../../app/composables/useManifest'
import type { ComponentPropsDoc } from '../../../../tooling/systems/props'
import {
  versionArtifact,
  versionText,
  VersionReadError,
  withoutStudioMarkers,
} from '../utils/versions'
import type { PlaygroundCode } from './playgroundCode'
import type { VersionAddress } from './useVersionDraft'

// A version's code beside the stage on the deployed site: the text the build
// shipped for it, read-only, with the line saying why. It has the shape the
// editor takes a draft in, as the original's does. The version's own props
// aren't known there, so its dials are the frame's.
export function useVersionCode(
  address: () => VersionAddress | null,
): PlaygroundCode & {
  props: Readonly<Ref<ComponentPropsDoc | null>>
} {
  const { t } = useI18n()
  const base = useRuntimeConfig().app.baseURL
  const manifest = useManifest()
  const file = shallowRef<SourceFile>()
  const code = ref('')
  const failure = ref<string>()
  let reads = 0

  watch(
    () => {
      const at = address()
      return at ? `${at.prototype}/${at.artifact}` : ''
    },
    async () => {
      const at = address()
      const read = ++reads
      file.value = undefined
      failure.value = undefined
      if (!at) return
      try {
        const current = (await manifest).value
        const version = { prototype: at.prototype, id: at.artifact }
        const [{ text }, artifact] = await Promise.all([
          versionText(current, version, { base }),
          versionArtifact(current, version),
        ])
        if (read !== reads) return
        // Without the studio's markers, as the editor shows it locally.
        const content = withoutStudioMarkers(text)
        file.value = {
          path: artifact ? `${artifact.path}.vue` : at.artifact,
          content,
          version: '',
          editable: false,
          reason: t('lab.versions.readOnlyDeployed'),
        }
        code.value = content
      } catch (error) {
        if (read === reads)
          failure.value =
            error instanceof VersionReadError
              ? t(`lab.versions.errors.${error.problem}`)
              : (error as Error).message
      }
    },
    { immediate: true },
  )

  const no = computed(() => false)
  const nothing = async () => {}
  return {
    file,
    code,
    failure,
    saving: no,
    conflict: no,
    editable: no,
    unsaved: no,
    save: nothing,
    discard: nothing,
    keepMine: nothing,
    fileName: () => file.value?.path.split('/').at(-1) ?? '',
    props: shallowRef(null),
  }
}
