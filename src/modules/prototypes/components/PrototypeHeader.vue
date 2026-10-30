<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import {
  refreshManifest,
  type ManifestPrototype,
} from '../../../../app/composables/useManifest'
import { useShowAllFiles } from '../../../../app/composables/useFileTree'
import { usePrototypeActions } from '../composables/usePrototypeActions'
import PrototypeRebuildNotice from './PrototypeRebuildNotice.vue'

// The top of a prototype's navigation: its title, its system (linking to the
// system's page), whether it waits for a rebuild or is archived, and its
// "…" menu, also on right-click anywhere here while the studio runs
// locally. Its owner or an Admin renames it by double-clicking the title:
// Enter or leaving the field saves, Escape cancels.
const props = defineProps<{ prototype: ManifestPrototype }>()
const { t } = useI18n()
const toast = useStudioToast()
const base = useRuntimeConfig().app.baseURL
const { systemOf } = await useSystems()
const { groups, editable } = usePrototypeActions(() => props.prototype)
const showAll = useShowAllFiles()
const local = import.meta.dev

const archived = computed(() => props.prototype.status === 'archived')
const system = computed(() => systemOf(props.prototype.systemId))

// Not `...(import.meta.dev ? … : [])`: compiled, the spread loses its
// brackets and Nuxt no longer replaces `import.meta.dev` after the dots.
const items = computed<DropdownMenuItem[][]>(() => {
  const all: DropdownMenuItem[][] = []
  if (import.meta.dev && !archived.value)
    all.push([
      {
        type: 'checkbox',
        label: t('files.showAll'),
        checked: showAll.value,
        onUpdateChecked: (checked: boolean) => (showAll.value = checked),
      },
    ])
  return [...all, ...groups.value]
})

const renaming = ref(false)
const field = useTemplateRef<HTMLInputElement>('field')
const draft = ref('')
const renamable = computed(() => editable.value && !archived.value)
async function startRename() {
  if (!renamable.value) return
  draft.value = props.prototype.title
  renaming.value = true
  await nextTick()
  field.value?.focus()
  field.value?.select()
}
let finishing = false
async function finishRename(save: boolean) {
  if (!renaming.value || finishing) return
  finishing = true
  const title = draft.value.trim()
  renaming.value = false
  try {
    if (!save || !title || title === props.prototype.title) return
    await requestJson(`${base}_studio/files/prototypes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        op: 'rename',
        prototype: props.prototype.id,
        title,
      }),
    })
    await refreshManifest()
  } catch (error) {
    toast.error((error as Error).message)
  } finally {
    finishing = false
  }
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    void finishRename(true)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    void finishRename(false)
  }
}
</script>

<template>
  <UContextMenu
    :items="items"
    :disabled="!local || !items.length"
    class="min-w-0 flex-1"
  >
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <div class="flex min-w-0 items-start gap-1">
        <input
          v-if="renaming"
          ref="field"
          v-model="draft"
          :aria-label="t('prototypes.organize.titleField')"
          spellcheck="false"
          autocomplete="off"
          class="h-7 min-w-0 flex-1 rounded-sm border border-accented bg-default px-1.5 text-sm font-semibold text-highlighted outline-none focus:border-primary"
          @keydown="onKeydown"
          @blur="finishRename(true)"
        />
        <UTooltip
          v-else
          :text="t('prototypes.organize.doubleClickRename')"
          :disabled="!renamable"
        >
          <h1
            class="min-w-0 flex-1 truncate py-1 text-sm font-semibold text-highlighted"
            @dblclick="startRename"
          >
            {{ prototype.title }}
          </h1>
        </UTooltip>
        <UDropdownMenu
          v-if="items.length"
          :items="items"
          :content="{ align: 'end' }"
          :ui="{ content: 'min-w-44' }"
        >
          <UTooltip :text="t('prototypes.actions')">
            <UButton
              icon="i-lucide-ellipsis"
              color="neutral"
              variant="ghost"
              size="xs"
              square
              :aria-label="t('prototypes.actions')"
            />
          </UTooltip>
        </UDropdownMenu>
      </div>
      <p class="truncate text-xs text-muted">
        <template v-if="system">
          {{ t('prototypes.system', { name: '' }) }}
          <ULink
            :to="`/systems/${system.id}`"
            :aria-label="
              t('prototypes.organize.openSystem', { name: system.label })
            "
            class="hover:text-highlighted hover:underline"
          >
            {{ system.label }} ↗
          </ULink>
        </template>
        <UTooltip
          v-else-if="system === null"
          :text="t('prototypes.organize.noSystemHint')"
        >
          <span>{{
            t('prototypes.system', { name: t('prototypes.noSystem') })
          }}</span>
        </UTooltip>
        <template v-else>
          {{
            t('prototypes.system', { name: t('prototypes.systemUnavailable') })
          }}
        </template>
      </p>
      <PrototypeRebuildNotice :prototype="prototype" />
      <UTooltip v-if="archived" :text="t('prototypes.organize.archivedHint')">
        <p class="flex items-center gap-1.5 text-xs text-muted">
          <UIcon name="i-lucide-archive" class="size-3" />
          {{ t('prototypes.organize.archived') }}
        </p>
      </UTooltip>
    </div>
  </UContextMenu>
</template>
