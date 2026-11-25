<!--
  The app's own AppDetailPage (components/App/AppDetailPage.vue), copied unchanged: the layout of a page about one
  thing, such as a profile. Every part is a slot (header, banner, cover, sidebar, navigation and the content), so
  screens import `~/components/App/AppDetailPage.vue` and fill them. This file passes the slots on and gives the
  component page its examples.
-->
<script setup lang="ts">
import AppDetailPage from '~/components/App/AppDetailPage.vue';

defineSlots<{
  /** Full-width banners or notifications above the page. */
  header?: () => unknown;
  /** A notice or call to action above the cover, as wide as the content. */
  banner?: () => unknown;
  /** A cover image or banner, as wide as the content. */
  cover?: () => unknown;
  /** A column left of the content, overlapping the cover a little; above the content on narrow screens. */
  sidebar?: () => unknown;
  /** Tabs above the content, with a separator under them. */
  navigation?: () => unknown;
  /** The page's content. */
  default?: () => unknown;
}>();
</script>

<template>
  <AppDetailPage>
    <template v-for="(_, name) in $slots" #[name]>
      <slot :name="name" />
    </template>
  </AppDetailPage>
</template>
