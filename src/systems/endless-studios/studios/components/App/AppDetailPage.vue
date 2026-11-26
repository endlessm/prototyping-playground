<script setup lang="ts">
/**
 * Layout for a page which drills down into a specific piece of content, such as
 * a user profile or a project. It provides the following slots:
 *
 * - `header`: Full width banners or notifications, as in AppPage.
 * - `banner`: A notice or call-to-action shown above the cover, constrained
 *   to the same width (unlike `header`, which is full width).
 * - `cover`: A cover area, which is constrained according to --ui-container.
 * - `sidebar`: A sidebar, which appears to the left of the main content. It
 *   slightly overlaps the cover area, if one is present. It appears above the
 *   content with narrow viewports.
 * - `navigation`: A navigation bar which appears above the content area.
 * - `default`: The main content of the page.
 *
 * All of these slots are optional. Except for the header slot, they are all
 * constrained according to --ui-container.
 */

import AppPage from '~/components/App/AppPage.vue'
</script>

<template>
  <AppPage>
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>
    <UContainer v-if="$slots.banner" class="my-4 md:my-6">
      <slot name="banner" />
    </UContainer>
    <UContainer
      class="mt-4 md:mt-12"
      :class="{
        'md:mt-6': $slots.banner,
      }"
    >
      <slot name="cover" />
      <div
        class="flex flex-col md:flex-row"
        :class="{ 'md:gap-12 md:mx-8': $slots.sidebar }"
      >
        <section
          v-if="$slots.sidebar"
          class="md:w-1/4 md:min-w-60 md:shrink-0"
          :class="{ '-mt-13': $slots.cover }"
        >
          <slot name="sidebar" />
        </section>
        <section class="flex-auto min-w-0">
          <div v-if="$slots.navigation" class="mt-6 mb-12">
            <slot name="navigation" />
            <USeparator class="mt-6" />
          </div>
          <slot />
        </section>
      </div>
    </UContainer>
  </AppPage>
</template>
