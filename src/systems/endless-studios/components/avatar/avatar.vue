<!--
  The Endless Studios avatar: Nuxt UI's UAvatar as the frontend uses it. Screens write <UAvatar> directly, with
  these props, or the app's own UserAvatar, which wraps it; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** The picture's address. Without one, or when it fails to load, `text` or the initials of `alt` show. */
    src?: string;
    /** Describes the picture; its initials are the fallback. */
    alt?: string;
    /** Up to two letters shown instead of a picture. */
    text?: string;
    /** A Lucide icon name shown instead of a picture. */
    icon?: string;
    /** The sidebar uses `sm`, lists `xl`, profile cards `3xl`. */
    size?: '3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
    /** Classes for each part, as Nuxt UI's `ui` prop: root, image, fallback, icon. */
    ui?: Record<string, string>;
  }>(),
  { size: 'md' },
);
</script>

<template>
  <UAvatar v-bind="props" />
</template>
