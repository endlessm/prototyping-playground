<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import type { ManifestPrototype } from '../../../../app/composables/useManifest'
import type { ManifestSystem } from '../../../../tooling/manifest/build'

// "Rebuild needed": a copy made for another system keeps its old one until
// an agent rebuilds it. "System deleted": its system is gone, so its views
// can't render until an agent rebuilds them with another system. Locally,
// the instructions to give the agent can be copied.
const props = defineProps<{ prototype: ManifestPrototype }>()
const { t } = useI18n()
const toast = useStudioToast()
const manifest = await useManifest()
const { copy } = useClipboard({ legacy: true })
const local = import.meta.dev

const request = computed(() => props.prototype.rebuild)
const missing = computed(() => props.prototype.systemMissing)
const systemOf = (id: string | null): ManifestSystem | null | undefined =>
  id === null ? null : manifest.value.systems.find((system) => system.id === id)
const labelOf = (id: string | null) => {
  const system = systemOf(id)
  if (system === null) return t('prototypes.organize.duplicateDialog.noSystem')
  return system?.label ?? id!
}

/** What to paste into a coding agent to rebuild a deleted system's prototype. */
const deletedInstructions = () =>
  `Rebuild the prototype at ${props.prototype.folder} with an active system I select. Its ${missing.value!.label} system was deleted. Read the repository AGENTS.md and the build-prototype skill first, and run yarn studio context ${props.prototype.folder} --json. Preserve independent documents, diagrams and canvas scenes unless their content needs revision. Migrate the system-dependent views and the meta.json systemId together. Remove systemMissing from meta.json only after the build passes and the views are reviewed.`

/** What to paste into a coding agent to rebuild the copy. */
function instructions() {
  if (missing.value) return deletedInstructions()
  const { folder, systemId } = props.prototype
  const { targetSystemId, sourcePrototypeId } = request.value!
  const target = systemOf(targetSystemId)
  const source = manifest.value.prototypes.find(
    ({ id }) => id === sourcePrototypeId,
  )
  return [
    `Rebuild the prototype at ${folder} using ${labelOf(targetSystemId)}${target ? ` (${JSON.stringify(target.key)})` : ''}.`,
    `Read the repository AGENTS.md and the build-prototype skill first, and run yarn studio context ${folder} --json. This is a separate exploration copied from ${source?.folder ?? 'another prototype'} (prototype ID ${sourcePrototypeId}); preserve the original and work only in the copy.`,
    `The copy is currently assigned to ${labelOf(systemId)}. Its requested target is recorded in meta.json as rebuild.targetSystemId; this has not converted its code.`,
    target
      ? `Read src/systems/${target.key}/AGENTS.md and the relevant system guidance. Reconstruct the copy with its components and styles.`
      : 'Use local components and CSS, without importing a shared system library or theme.',
    `Preserve independent documents, diagrams and canvas scenes unless their content needs revision. Migrate the system-dependent views and the meta.json systemId together to ${JSON.stringify(targetSystemId)}. Preserve intent, flows and behavior, and explain differences that cannot translate. Verify the build and review the rendered views. Remove the rebuild field only when the migration is complete.`,
  ].join('\n')
}

async function copyInstructions() {
  try {
    await copy(instructions())
    toast.success(t('prototypes.organize.rebuild.copied'))
  } catch {
    toast.error(t('prototypes.organize.rebuild.failed'))
  }
}
</script>

<template>
  <div
    v-if="missing"
    role="note"
    :aria-label="t('prototypes.organize.rebuild.deletedTitle')"
    class="rounded-md border border-default bg-elevated/50 p-2.5 text-xs"
  >
    <p class="font-medium text-highlighted">
      {{ t('prototypes.organize.rebuild.deletedTitle') }}
    </p>
    <p class="mt-1 text-muted">
      {{
        t('prototypes.organize.rebuild.deletedDescription', {
          system: missing.label,
        })
      }}
    </p>
    <UButton
      v-if="local"
      size="xs"
      color="neutral"
      variant="outline"
      class="mt-2"
      :label="t('prototypes.organize.rebuild.copy')"
      @click="copyInstructions"
    />
  </div>
  <div
    v-else-if="request"
    role="note"
    :aria-label="t('prototypes.organize.rebuild.title')"
    class="rounded-md border border-default bg-elevated/50 p-2.5 text-xs"
  >
    <p class="font-medium text-highlighted">
      {{ t('prototypes.organize.rebuild.title') }}
    </p>
    <p class="mt-1 text-muted">
      {{
        t('prototypes.organize.rebuild.description', {
          target: labelOf(request.targetSystemId),
        })
      }}
    </p>
    <UButton
      v-if="local"
      size="xs"
      color="neutral"
      variant="outline"
      class="mt-2"
      :label="t('prototypes.organize.rebuild.copy')"
      @click="copyInstructions"
    />
  </div>
</template>
