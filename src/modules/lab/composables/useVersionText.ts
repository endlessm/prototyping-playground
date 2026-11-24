import type { Ref } from 'vue'
import type { SourceFile } from '../../../../app/components/source/sourceAccess'
import { useManifest } from '../../../../app/composables/useManifest'
import type { ComponentPropsDoc } from '../../../../tooling/systems/props'
import {
  versionArtifact,
  versionText,
  type LabVersion,
  type VersionText,
} from '../utils/versions'
import type { PlaygroundCode } from './playgroundCode'
import type { VersionAddress } from './useVersionDraft'

export type { VersionText } from '../utils/versions'

// Both read a version's text through `versionText` in `utils/versions.ts`,
// the one reader, so the Playground and Changes see the same text locally
// and on the deployed site.

/**
 * A version's text for its Changes, read again when the version or the
 * manifest changes. Locally it includes the Playground's unsaved draft (what
 * the stage shows) and says so; reading never writes.
 */
export async function useVersionText(
  version: () => LabVersion | null,
): Promise<{
  text: Readonly<Ref<VersionText | null>>
  failed: Readonly<Ref<boolean>>
  loading: Readonly<Ref<boolean>>
}> {
  const base = useRuntimeConfig().app.baseURL
  const manifest = await useManifest()
  const text = shallowRef<VersionText | null>(null)
  const failed = ref(false)
  const loading = ref(false)
  let reads = 0
  // Another version starts blank; the same one read again (the manifest
  // moved on, as after a save) keeps its text on screen meanwhile.
  watch(
    [() => version()?.id, () => manifest.value.revision],
    async ([id], previous) => {
      const read = ++reads
      if (id !== previous?.[0]) {
        text.value = null
        failed.value = false
      }
      const current = version()
      if (!current) return
      loading.value = true
      try {
        const found = await versionText(manifest.value, current, {
          base,
          draft: true,
        })
        if (read === reads) {
          text.value = found
          failed.value = false
        }
      } catch {
        if (read === reads) failed.value = true
      } finally {
        if (read === reads) loading.value = false
      }
    },
    { immediate: true },
  )
  return { text, failed, loading }
}

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
        file.value = {
          path: artifact ? `${artifact.path}.vue` : at.artifact,
          content: text,
          version: '',
          editable: false,
          reason: t('lab.versions.readOnlyDeployed'),
        }
        code.value = text
      } catch (error) {
        if (read === reads) failure.value = (error as Error).message
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
