<script setup lang="ts">
import type { ManifestArtifact } from '../../../../app/composables/useManifest'
import { requestJson } from '../../../../app/utils/studioRequest'
import LabVersionCard from '../components/LabVersionCard.vue'
import { useLabComponent } from '../composables/useLabComponent'
import { useVersionCopy } from '../composables/useVersionCopy'
import { labAddress } from '../utils/lab'
import { versionArtifact, versionsOf, type LabVersion } from '../utils/versions'

// Versions: everyone's versions of an app component, from the manifest, each
// with its name, whose it is, when it last changed (locally) and a live
// preview, two columns when the bench is wide. Opening one shows it in the
// Playground. Locally, Save as my version copies someone else's into your
// own versions and opens it; Duplicate copies one of yours. A component
// that isn't the app's own (a Nuxt UI wrapper) has no versions.
const { system, component, data } = useLabComponent()
const { t } = useI18n()
const router = useRouter()
const manifest = await useManifest()
const { copy, copying } = useVersionCopy()
const local = import.meta.dev
const versionsUrl = `${useRuntimeConfig().app.baseURL}_studio/modules/lab/versions`

const versions = computed(() =>
  versionsOf(manifest.value, system.value.id, component.value.slug),
)
const revision = computed(() => data.value?.original?.revision ?? null)

// Each version's view (its name and file), from its prototype's list.
const artifacts = shallowRef<Record<string, ManifestArtifact | null>>({})
// When each file last changed, which only the dev server knows.
const dates = shallowRef<Record<string, string>>({})
watch(
  () =>
    [
      manifest.value.revision,
      versions.value.map(({ id }) => id).join(),
    ] as const,
  async () => {
    const list = versions.value
    const current = manifest.value
    const found = await Promise.all(
      list.map((version) =>
        versionArtifact(current, version).catch(() => null),
      ),
    )
    if (manifest.value !== current) return
    artifacts.value = Object.fromEntries(
      list.map((version, index) => [version.id, found[index] ?? null]),
    )
    if (!local || !list.length) return
    const read = await requestJson<{ dates: Record<string, string> }>(
      versionsUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dates',
          versions: list.map(({ prototype, id }) => ({
            prototype,
            artifact: id,
          })),
        }),
      },
    ).catch(() => null)
    if (read && manifest.value === current) dates.value = read.dates
  },
  { immediate: true },
)

// After a delete the keyboard goes to the card that took its place (the
// next, or the last when it was the last), or to Open Playground when none
// is left, once the list no longer shows it.
const list = useTemplateRef('list')
const emptyAction = useTemplateRef('emptyAction')
const ids = computed(() => versions.value.map(({ id }) => id))
// The list as it was before its last change, in case the deleted version
// left it before the card said so.
let before: string[] = []
const removing = shallowRef<{ id: string; index: number } | null>(null)
async function focusAt(index: number) {
  await nextTick()
  const cards = list.value?.querySelectorAll<HTMLElement>('[data-lab-version]')
  const card = cards?.[Math.min(index, cards.length - 1)]
  const target =
    card?.querySelector<HTMLElement>('h3 a') ??
    (emptyAction.value?.$el as HTMLElement | undefined)
  target?.focus()
}
function removed(version: LabVersion) {
  const index = ids.value.indexOf(version.id)
  if (index < 0) return focusAt(Math.max(0, before.indexOf(version.id)))
  removing.value = { id: version.id, index }
}
watch(ids, (now, old) => {
  before = old ?? []
  const gone = removing.value
  if (!gone || now.includes(gone.id)) return
  removing.value = null
  void focusAt(gone.index)
})

// Save as my version opens the copy; Duplicate stays on the list.
async function copied(version: LabVersion, mine: boolean) {
  const created = await copy(version)
  if (!created || mine) return
  await router.push(
    `${labAddress(system.value.id, component.value.slug, 'playground')}?version=${created.artifact}`,
  )
}
</script>

<template>
  <p v-if="!component.app" class="text-sm text-muted">
    {{ t('lab.versions.list.notApp', { name: component.title }) }}
  </p>
  <div
    v-else-if="!versions.length"
    class="rounded-3xl border border-dashed border-default p-6 text-sm text-muted"
  >
    <p class="text-default">
      {{ t('lab.versions.list.empty', { name: component.title }) }}
    </p>
    <p class="mt-1">
      {{
        t(
          local
            ? 'lab.versions.list.emptyHint'
            : 'lab.versions.list.emptyDeployed',
        )
      }}
    </p>
    <UButton
      v-if="local"
      ref="emptyAction"
      class="mt-3"
      size="sm"
      color="neutral"
      variant="outline"
      icon="i-lucide-flask-conical"
      :to="labAddress(system.id, component.slug, 'playground')"
      :label="t('lab.versions.list.openPlayground')"
    />
  </div>
  <div v-else class="@container">
    <p class="mb-4 text-sm text-muted">
      {{
        t(
          local ? 'lab.versions.list.intro' : 'lab.versions.list.introDeployed',
          { count: versions.length },
          versions.length,
        )
      }}
    </p>
    <div ref="list" class="grid grid-cols-1 gap-5 @3xl:grid-cols-2">
      <LabVersionCard
        v-for="version in versions"
        :key="version.id"
        :system-id="system.id"
        :slug="component.slug"
        :version="version"
        :artifact="artifacts[version.id]"
        :changed="dates[version.id]"
        :revision="revision"
        :copying="copying === version.id"
        @copy="(mine) => copied(version, mine)"
        @removed="removed(version)"
      />
    </div>
  </div>
</template>
