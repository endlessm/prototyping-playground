<script setup lang="ts">
import { computed } from 'vue'
import { occupantsOf, type Occupant, type Place } from './district'

// The faces of a place's people, each once with every position they hold there. The stack spreads apart when the
// pointer or focus enters it, and the face under the pointer lifts, with its name and positions in a tooltip. Past five
// faces a count lists the rest. `align` says which side the stack and the list of the rest hang from.
const props = withDefaults(defineProps<{ place: Place; align?: 'start' | 'end' }>(), { align: 'start' })

const MAX = 5
const occupants = computed(() => occupantsOf(props.place))
const shown = computed(() => occupants.value.slice(0, MAX))
const rest = computed(() => occupants.value.slice(MAX))

// The stack keeps room for its spread width (24px faces, 4px apart), so spreading never resizes what holds it.
const spreadWidth = computed(() => {
  const items = shown.value.length + (rest.value.length ? 1 : 0)
  return items ? items * 24 + (items - 1) * 4 : 0
})

const roles = (o: Occupant) => o.roles.join(', ')
const spring = 'ease-[cubic-bezier(0.34,1.56,0.64,1)]'
</script>

<template>
  <ul
    v-if="occupants.length"
    :aria-label="`People in ${place.name}`"
    class="group/stack flex items-center"
    :class="{ 'justify-end': align === 'end' }"
    :style="{ minWidth: `${spreadWidth}px` }"
  >
    <li
      v-for="o in shown"
      :key="o.email"
      class="relative transition-[margin] duration-300 not-first:-ms-1.5 not-first:group-hover/stack:ms-1 not-first:group-focus-within/stack:ms-1 hover:z-10 focus-within:z-10 motion-reduce:transition-none"
      :class="spring"
    >
      <UTooltip :content="{ side: 'top', sideOffset: 8 }" :delay-duration="80" :ui="{ content: 'h-auto py-1.5' }">
        <span
          tabindex="0"
          :aria-label="`${o.name}, ${roles(o)}${o.invited ? ', invited' : ''}`"
          class="flex rounded-full transition-transform duration-300 hover:-translate-y-1 hover:scale-110 focus-visible:-translate-y-1 focus-visible:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary motion-reduce:transition-none"
          :class="spring"
        >
          <UAvatar
            :text="o.initials"
            :alt="o.name"
            size="xs"
            class="ring-2 ring-bg"
            :ui="{ fallback: 'text-[10px]' }"
            :class="o.invited ? 'bg-info-50 text-info-700 outline-1 outline-info-300 outline-dashed' : 'bg-secondary-50 text-secondary-700'"
          />
        </span>
        <template #content>
          <span class="flex flex-col">
            <span class="font-medium">{{ o.name }}</span>
            <span class="text-dimmed">{{ roles(o) }}<template v-if="o.invited"> · Invited</template></span>
          </span>
        </template>
      </UTooltip>
    </li>

    <li
      v-if="rest.length"
      class="relative -ms-1.5 transition-[margin] duration-300 group-hover/stack:ms-1 group-focus-within/stack:ms-1 motion-reduce:transition-none"
      :class="spring"
    >
      <UPopover :content="{ side: 'bottom', align }" :ui="{ content: 'w-64 p-1' }">
        <button
          type="button"
          :aria-label="`${rest.length} more people`"
          class="flex size-6 cursor-pointer items-center justify-center rounded-full bg-elevated text-[10px] font-medium text-muted ring-2 ring-bg transition-[transform,background-color] duration-300 hover:scale-110 hover:bg-accented focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary data-[state=open]:bg-accented motion-reduce:transition-none"
          :class="spring"
        >
          +{{ rest.length }}
        </button>
        <template #content>
          <ul class="flex max-h-72 flex-col overflow-y-auto">
            <li v-for="o in rest" :key="o.email" class="flex items-center gap-2.5 rounded-md px-2 py-1.5">
              <UAvatar
                :text="o.initials"
                :alt="o.name"
                size="sm"
                :class="o.invited ? 'bg-info-50 text-info-700' : 'bg-secondary-50 text-secondary-700'"
              />
              <span class="flex min-w-0 flex-col">
                <span class="truncate text-sm text-highlighted">{{ o.name }}</span>
                <span class="truncate text-xs text-muted">
                  {{ roles(o) }}<template v-if="o.invited"> · Invited</template>
                </span>
              </span>
            </li>
          </ul>
        </template>
      </UPopover>
    </li>
  </ul>
  <p v-else class="text-xs text-dimmed">No one yet</p>
</template>
