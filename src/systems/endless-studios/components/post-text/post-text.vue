<!--
  The text of a feed post or comment: the app's own PostText (components/CommunityFeed/PostText.vue), copied
  unchanged. Screens import `~/components/CommunityFeed/PostText.vue` directly; this file gives the component page its
  examples and props table.
-->
<script setup lang="ts">
import PostText from '~/components/CommunityFeed/PostText.vue';

withDefaults(
  defineProps<{
    /**
     * The post's description as HTML, as the feed stores it. `@username` becomes a link to that profile; images show
     * as square thumbnails.
     */
    html?: string;
  }>(),
  {
    html: '<p>Finished the first boss fight for Lantern Keeper! Thanks @priya for the tip about telegraphing attacks.</p>',
  },
);
</script>

<template>
  <PostText :html="html" />
</template>
