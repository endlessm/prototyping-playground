<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'

const props = defineProps<{
  title: string
  /** Ancestor crumbs only; the current page is appended automatically. */
  breadcrumbItems?: BreadcrumbItem[]
}>()

const fullBreadcrumbItems = computed<BreadcrumbItem[]>(() => [
  ...(props.breadcrumbItems ?? []),
  { label: props.title },
])
</script>

<template>
  <!-- The negative margin cancels the admin layout's horizontal padding so the
       separator spans the full width; the matching padding puts the content back. -->
  <div
    class="flex flex-col gap-4 border-b border-default pt-10 pb-8 -mx-16 px-16"
  >
    <UBreadcrumb :items="fullBreadcrumbItems" color="neutral" />

    <div
      class="flex items-center justify-between gap-5 max-sm:flex-col max-sm:items-start"
    >
      <div class="min-w-0">
        <div class="flex items-center gap-3">
          <slot name="title">
            <h1
              class="font-heading font-semibold text-2xl tablet:text-4xl truncate"
            >
              {{ title }}
            </h1>
          </slot>
          <slot name="title-suffix" />
        </div>
        <p v-if="!!$slots.subtitle" class="text-muted mt-1">
          <slot name="subtitle" />
        </p>
      </div>

      <div v-if="!!$slots.actions" class="flex gap-2">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
