<script setup lang="ts">
import { listGroups, quickLabels, type QuickFilters } from './useQuickFilters'

// Magnific's pattern: pill labels on the left ("All" plus the few things people ask for most), and one Filters
// button on the right that opens every other filter as a list. Active labels are filled; the button counts what's
// set in the list.
const props = withDefaults(defineProps<{ filters: QuickFilters; search?: boolean }>(), { search: true })
const f = props.filters
const pill = 'h-9 rounded-full px-3.5 text-sm font-medium transition-colors motion-reduce:transition-none'
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        :class="[pill, !f.quick.value.length ? 'bg-inverted text-inverted' : 'text-muted hover:bg-elevated']"
        :aria-pressed="!f.quick.value.length"
        @click="f.quick.value = []"
      >
        All
      </button>
      <button
        v-for="q in quickLabels"
        :key="q.key"
        type="button"
        :class="[pill, f.quick.value.includes(q.key) ? 'bg-inverted text-inverted' : 'text-muted hover:bg-elevated']"
        :aria-pressed="f.quick.value.includes(q.key)"
        @click="f.toggleQuick(q.key)"
      >
        {{ q.label }}
      </button>

      <div class="ms-auto flex items-center gap-2">
        <UInput v-if="search" v-model="f.search.value" icon="i-lucide-search" placeholder="Search" size="md" variant="outline" class="w-48" aria-label="Search programs" />
        <UPopover :content="{ align: 'end' }">
          <UButton
            color="neutral"
            variant="ghost"
            size="md"
            icon="i-lucide-list-filter"
            :label="f.listCount.value ? `Filters (${f.listCount.value})` : 'Filters'"
            class="rounded-full"
          />
          <template #content>
            <div class="grid w-[34rem] max-w-[calc(100vw-2rem)] grid-cols-1 gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
              <fieldset v-for="g in listGroups" :key="g.key" class="flex flex-col gap-2">
                <legend class="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">{{ g.label }}</legend>
                <div v-for="o in g.options" :key="o" class="flex items-center justify-between gap-3">
                  <UCheckbox :label="o" :model-value="f.list.value[g.key]!.includes(o)" @update:model-value="f.toggleList(g.key, o)" />
                  <span class="text-xs text-dimmed tabular-nums">{{ f.countOf(g, o) }}</span>
                </div>
              </fieldset>
              <p class="text-xs text-muted sm:col-span-2">From the Endless Access program guides. Every Endless Access program runs in English and Spanish.</p>
            </div>
          </template>
        </UPopover>
      </div>
    </div>

    <div class="flex items-center gap-3 text-sm text-muted" aria-live="polite">
      <span>{{ f.visible.value.length }} {{ f.visible.value.length === 1 ? 'program' : 'programs' }}</span>
      <button v-if="f.active.value" type="button" class="font-medium text-highlighted underline-offset-4 hover:underline" @click="f.clear()">
        Clear all
      </button>
    </div>
  </div>
</template>
