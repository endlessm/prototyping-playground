<script setup lang="ts">
import type {
  CatalogSkill,
  SystemCatalog,
} from '../../../../tooling/systems/catalog'
import SystemSource from './SystemSource.vue'

// A skill's source: its SKILL.md and, through the picker, its supporting
// files. Text files open in the editor; other files (images, archives) are
// edited outside the studio. Switching files with unsaved changes asks
// first.
const props = defineProps<{
  system: SystemCatalog
  skill: CatalogSkill
  /** Inside the skill's folder. */
  file: string
}>()
const emit = defineEmits<{ done: [] }>()
const { t } = useI18n()

const TEXT =
  /\.(md|markdown|txt|json|ya?ml|toml|csv|js|mjs|cjs|ts|vue|css|html|sh|py)$/i
const current = ref(props.file)
const editor = useTemplateRef<{ mayLeave: () => Promise<boolean> }>('editor')
const text = computed(() => TEXT.test(current.value))
const choices = computed(() => props.skill.files)

async function choose(next: string) {
  if (next === current.value) return
  if (editor.value && !(await editor.value.mayLeave())) return
  current.value = next
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <SystemSource
      v-if="text"
      ref="editor"
      :key="current"
      :system="system"
      :path="`skills/${skill.name}/${current}`"
      @done="emit('done')"
    >
      <template #actions>
        <USelect
          :model-value="current"
          :items="choices"
          size="sm"
          class="w-56"
          :aria-label="t('systems.source.skillFile')"
          @update:model-value="choose"
        />
      </template>
    </SystemSource>
    <div v-else class="space-y-4 p-4">
      <div class="flex items-center gap-2">
        <USelect
          :model-value="current"
          :items="choices"
          size="sm"
          class="w-56"
          :aria-label="t('systems.source.skillFile')"
          @update:model-value="choose"
        />
        <UButton
          size="sm"
          color="neutral"
          variant="outline"
          :label="t('source.done')"
          @click="emit('done')"
        />
      </div>
      <p class="text-sm text-muted">{{ t('systems.source.binary') }}</p>
    </div>
  </div>
</template>
