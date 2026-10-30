<script setup lang="ts">
// One line of a table cell. If the cell is too narrow for it, it ends in an
// ellipsis and the whole text shows in a tooltip on hover or focus; text
// that fits needs none, and can't be focused.
defineProps<{ text: string }>()

const line = useTemplateRef('line')
const cut = ref(false)
useResizeObserver(line, () => {
  const element = line.value
  if (element) cut.value = element.scrollWidth > element.clientWidth
})
</script>

<template>
  <UTooltip
    :text="text"
    :disabled="!cut"
    :content="{ side: 'top' }"
    :ui="{
      content: 'h-auto max-w-md',
      text: 'font-mono break-words whitespace-normal',
    }"
  >
    <span
      ref="line"
      :tabindex="cut ? 0 : undefined"
      class="block max-w-full truncate outline-none"
      :class="{ 'cursor-help focus-visible:text-highlighted': cut }"
    >
      {{ text }}
    </span>
  </UTooltip>
</template>
