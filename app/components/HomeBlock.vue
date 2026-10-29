<script setup lang="ts">
// A module's block on Home: a small heading that links to the module's page,
// then what the module chose to show, or a one-line hint when it has
// nothing yet.
const props = defineProps<{
  title: string
  to?: string
  hint?: string
  empty?: boolean
}>()
const id = useId()
</script>

<template>
  <section :aria-labelledby="id" class="px-2 py-2">
    <h2 :id="id" class="px-2 pt-1 pb-1 text-xs font-medium text-muted">
      <ULink
        v-if="props.to"
        :to="props.to"
        class="group/title -mx-1 inline-flex items-center gap-0.5 rounded px-1 outline-none hover:text-highlighted focus-visible:ring-2 focus-visible:ring-primary"
      >
        {{ props.title }}
        <UIcon
          name="i-lucide-chevron-right"
          class="size-3 transition-transform group-hover/title:translate-x-0.5 motion-reduce:transition-none"
        />
      </ULink>
      <template v-else>{{ props.title }}</template>
    </h2>
    <p v-if="props.empty" class="px-2 py-1.5 text-sm text-muted">
      {{ props.hint }}
    </p>
    <slot v-else />
  </section>
</template>
