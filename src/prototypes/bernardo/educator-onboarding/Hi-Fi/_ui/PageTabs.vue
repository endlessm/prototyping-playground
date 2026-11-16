<script setup lang="ts">
import { computed } from 'vue'
import { usePrototypeNavigate } from '#studio/prototype'

// A page's tabs, drawn as the leader dashboard's: neutral links with a line under the active one. In the app each
// tab is its own page, so a tab with `to` opens that view; one without it switches here (`select`).
const props = defineProps<{ tabs: { id: string; label: string; to?: string }[]; active: string }>()
const emit = defineEmits<{ select: [id: string] }>()

const navigate = usePrototypeNavigate()

const items = computed(() =>
  props.tabs.map((tab) => ({
    label: tab.label,
    active: tab.id === props.active,
    onSelect: () => (tab.to ? navigate(tab.to) : emit('select', tab.id)),
  })),
)
</script>

<template>
  <UNavigationMenu
    color="neutral"
    variant="link"
    highlight
    :items="items"
    :ui="{ link: 'no-underline cursor-pointer' }"
    class="w-full border-b border-default"
  />
</template>
