<script setup lang="ts">
// One square button on the rail: a link or an action, with its name in a
// tooltip to its right. The current section's button is raised and
// announced as the current page.
defineOptions({ inheritAttrs: false })

defineProps<{
  label: string
  to?: string
  icon?: string
  current?: boolean
}>()
</script>

<template>
  <UTooltip :text="label" :content="{ side: 'right' }">
    <UButton
      :to="to"
      :icon="icon"
      :aria-label="label"
      :aria-current="current ? 'page' : undefined"
      :active="current"
      color="neutral"
      variant="ghost"
      active-variant="soft"
      square
      class="size-8 justify-center"
      v-bind="$attrs"
    >
      <slot />
    </UButton>
  </UTooltip>
</template>
