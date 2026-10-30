<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type {
  ComponentPropsDoc,
  PropDoc,
} from '../../../../tooling/systems/props'
import TruncatedText from './TruncatedText.vue'

// A component's props, read from its code: a disclosure, closed at first,
// labelled with how many components and props it holds, then a table of
// each prop's name, type and default. Required props are marked "*";
// descriptions are tooltips on the names, and long types and defaults end
// in an ellipsis with the whole text on hover or focus.
const props = defineProps<{ components: ComponentPropsDoc[] }>()
const { t } = useI18n()
const open = ref(false)

const propCount = computed(() =>
  props.components.reduce((total, entry) => total + entry.props.length, 0),
)
// Fixed shares of the width, so a long type can't crowd out the others.
const columns: TableColumn<PropDoc>[] = [
  {
    accessorKey: 'name',
    header: () => t('systems.component.prop'),
    meta: { class: { th: 'w-[28%]', td: 'whitespace-normal break-words' } },
  },
  {
    accessorKey: 'type',
    header: () => t('systems.component.type'),
    meta: { class: { th: 'w-[52%]', td: 'max-w-0' } },
  },
  {
    accessorKey: 'default',
    header: () => t('systems.component.default'),
    meta: { class: { th: 'w-[20%]', td: 'max-w-0' } },
  },
]
const note = (entry: ComponentPropsDoc) =>
  entry.native
    ? t(
        entry.props.length
          ? 'systems.component.native'
          : 'systems.component.nativeOnly',
      )
    : entry.props.length
      ? ''
      : t('systems.component.noProps')
</script>

<template>
  <section class="mt-12">
    <h2 class="text-lg font-semibold tracking-tight text-highlighted">
      <button
        type="button"
        :aria-expanded="open"
        class="flex w-full cursor-pointer flex-wrap items-center gap-2 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-primary"
        @click="open = !open"
      >
        <UIcon
          name="i-lucide-chevron-down"
          class="size-4 text-muted transition-transform"
          :class="{ '-rotate-90': !open }"
        />
        <span>{{ t('systems.component.props') }}</span>
        <span class="text-xs font-normal text-muted">
          {{ t('systems.component.componentCount', components.length) }} ·
          {{ t('systems.component.propCount', propCount) }}
        </span>
      </button>
    </h2>
    <UCollapsible v-model:open="open">
      <template #content>
        <div class="mt-4 space-y-6">
          <div v-for="entry in components" :key="entry.name">
            <h3
              v-if="components.length > 1"
              class="mb-2 font-mono text-sm text-highlighted"
            >
              {{ entry.name }}
            </h3>
            <UTable
              v-if="entry.props.length"
              :data="entry.props"
              :columns="columns"
              class="rounded-lg border border-default"
              :ui="{
                base: 'table-fixed',
                th: 'px-3 py-2 text-xs font-medium text-muted',
                td: 'px-3 py-2 align-top font-mono text-xs text-default',
              }"
            >
              <template #name-cell="{ row }">
                <UTooltip
                  v-if="row.original.description"
                  :text="row.original.description"
                  :content="{ side: 'right', sideOffset: 12 }"
                  :ui="{
                    content: 'h-auto max-w-xs',
                    text: 'whitespace-normal',
                  }"
                >
                  <span
                    tabindex="0"
                    class="cursor-help text-highlighted underline decoration-dotted decoration-(--ui-text-dimmed) underline-offset-4 outline-none focus-visible:decoration-(--ui-text-highlighted)"
                  >
                    {{ row.original.name }}
                  </span>
                </UTooltip>
                <span v-else class="text-highlighted">
                  {{ row.original.name }}
                </span>
                <span
                  v-if="row.original.required"
                  class="text-error"
                  :title="t('systems.component.required')"
                >
                  *</span
                >
              </template>
              <template #type-cell="{ row }">
                <TruncatedText :text="row.original.type" />
              </template>
              <template #default-cell="{ row }">
                <TruncatedText
                  v-if="row.original.default"
                  :text="row.original.default"
                  class="text-muted"
                />
                <span v-else class="text-muted">—</span>
              </template>
            </UTable>
            <p
              v-if="note(entry)"
              class="text-sm text-muted"
              :class="{ 'mt-2': entry.props.length }"
            >
              {{ note(entry) }}
            </p>
          </div>
        </div>
      </template>
    </UCollapsible>
  </section>
</template>
