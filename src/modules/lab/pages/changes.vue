<script setup lang="ts">
import LabChangesDiff from '../components/LabChangesDiff.vue'
import { useLabComponent } from '../composables/useLabComponent'
import { useVersionText } from '../composables/useVersionText'
import { usePrototypeArtifacts } from '../../../../app/composables/useManifest'
import { changesBetween, fileNameOf, unifiedPatch } from '../utils/changes'
import { labAddress } from '../utils/lab'
import {
  olderRevision,
  versionById,
  withoutStudioMarkers,
} from '../utils/versions'

// Changes: what a version changed in its app component, line by line,
// against the studio's copy of the original at the copy's revision. Copy
// changes gives a unified patch named for the file's path in the app's
// repository (`frontend/app/…`), ready for `git apply` there; Download file
// gives the whole version under the original's file name. Neither carries
// the studio's markers or Windows line endings. A version made before the
// copy was refreshed says so, since its changes then also undo what changed
// in the app meanwhile. Locally an unsaved draft counts, as on the stage.
const { system, component, data } = useLabComponent()
const { t } = useI18n()
const route = useRoute()
const studio = useStudioConfig()
const toast = useStudioToast()
const manifest = await useManifest()

const version = computed(() => {
  const found = versionById(manifest.value, String(route.params.version))
  return found?.system === system.value.id &&
    found.component === component.value.slug
    ? found
    : null
})
const original = computed(() => data.value?.original ?? null)
const artifacts = await usePrototypeArtifacts(
  () => version.value?.prototype ?? '',
)
const name = computed(
  () =>
    artifacts.value.find(({ id }) => id === version.value?.id)?.title ??
    version.value?.home.title ??
    '',
)
const { text, failed, loading } = await useVersionText(() => version.value)

// What the app's file would hold, and the path it has in the app.
const versionFile = computed(() =>
  text.value ? withoutStudioMarkers(text.value.text) : null,
)
const appPath = computed(() =>
  original.value ? (original.value.appPath ?? original.value.path) : '',
)
const fileName = computed(() =>
  original.value ? fileNameOf(original.value.path) : '',
)
const changes = computed(() =>
  original.value && versionFile.value !== null
    ? changesBetween(
        original.value.source.replace(/\r\n?/g, '\n'),
        versionFile.value,
      )
    : null,
)
const patch = computed(() =>
  changes.value ? unifiedPatch(changes.value, appPath.value) : '',
)
const older = computed(() =>
  version.value && original.value
    ? olderRevision(version.value, original.value.revision)
    : false,
)

const playground = computed(
  () =>
    `${labAddress(system.value.id, component.value.slug, 'playground')}${
      version.value ? `?version=${encodeURIComponent(version.value.id)}` : ''
    }`,
)

useHead({
  title: () =>
    [
      t('lab.changes.tab'),
      component.value.title,
      t('lab.title'),
      studio.name,
    ].join(' — '),
})

async function copy() {
  try {
    await navigator.clipboard.writeText(patch.value)
    toast.success(t('lab.changes.copied'))
  } catch {
    toast.error(t('lab.changes.copyFailed'), t('lab.changes.copyBlocked'))
  }
}

function download() {
  if (versionFile.value === null) return
  const href = URL.createObjectURL(
    new Blob([versionFile.value], { type: 'text/plain;charset=utf-8' }),
  )
  const link = document.createElement('a')
  link.href = href
  link.download = fileName.value
  document.body.append(link)
  link.click()
  link.remove()
  // The browser has started the download by the next task.
  setTimeout(() => URL.revokeObjectURL(href), 0)
}
</script>

<template>
  <p v-if="!original" class="text-sm text-muted">
    {{ t('lab.changes.noOriginal', { name: component.title }) }}
  </p>
  <div
    v-else-if="!version"
    role="alert"
    class="space-y-3 rounded-3xl border border-default p-4 text-sm"
  >
    <p class="text-default">{{ t('lab.changes.missing') }}</p>
    <UButton
      size="sm"
      color="neutral"
      variant="outline"
      icon="i-lucide-arrow-left"
      :label="t('lab.changes.openPlayground')"
      :to="playground"
    />
  </div>
  <div v-else class="space-y-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 space-y-1">
        <h2 class="text-lg font-semibold text-highlighted">
          {{ t('lab.changes.heading', { name }) }}
        </h2>
        <p class="truncate font-mono text-xs text-muted">
          {{
            t('lab.changes.compared', {
              path: appPath,
              revision: original.revision ?? '?',
            })
          }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <UButton
          size="sm"
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-left"
          :label="t('lab.changes.openPlayground')"
          :to="playground"
        />
        <UButton
          size="sm"
          color="neutral"
          variant="outline"
          icon="i-lucide-copy"
          :label="t('lab.changes.copy')"
          :disabled="!patch"
          @click="copy"
        />
        <UButton
          size="sm"
          icon="i-lucide-download"
          :label="t('lab.changes.download')"
          :disabled="versionFile === null"
          @click="download"
        />
      </div>
    </div>
    <UAlert
      v-if="older"
      color="warning"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      :title="t('lab.changes.olderTitle')"
      :description="
        t('lab.changes.older', {
          made: version.revision ?? '?',
          current: original.revision ?? '?',
        })
      "
    />
    <p v-if="failed" role="alert" class="text-sm text-muted">
      {{ t('lab.changes.failed') }}
    </p>
    <p v-else-if="!changes" role="status" class="text-sm text-muted">
      {{ loading ? t('lab.changes.loading') : '' }}
    </p>
    <template v-else>
      <p class="text-sm text-muted">
        <span class="text-success">{{
          t('lab.changes.added', changes.added)
        }}</span>
        ·
        <span class="text-error">{{
          t('lab.changes.removed', changes.removed)
        }}</span>
        <template v-if="text?.unsaved">
          · {{ t('lab.changes.unsaved') }}
        </template>
      </p>
      <p
        v-if="!changes.hunks.length"
        class="rounded-3xl border border-dashed border-default p-4 text-sm text-muted"
      >
        {{ t('lab.changes.none') }}
      </p>
      <LabChangesDiff
        v-else
        :hunks="changes.hunks"
        :label="t('lab.changes.label', { file: fileName })"
      />
    </template>
  </div>
</template>
