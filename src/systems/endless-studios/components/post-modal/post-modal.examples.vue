<!--
  The app's Create Post modal, open. In a view, import `~/components/CommunityFeed/PostModal.vue`, show it with
  `v-if` and choose who is posting with `system.user`; the `user` prop here is only how one page shows several people.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
import PostModal from './post-modal.vue';

const progressUpdate = {
  object_feed_type_id: 'progress' as const,
  description:
    '<p>Finished the paper prototype for level 2! The jump over the river was too long, so I moved the stepping stones closer. Playtesting with my brother on Friday.</p>',
  image_url: null,
  tags: 'level design, paper prototype',
};
</script>

<template>
  <Example name="Default">
    <PostModal id="new-post" user="learner" />
  </Example>
  <Example name="InCohortFeed">
    <PostModal id="new-post" user="learner" :feed-object-id="9111" />
  </Example>
  <Example name="WithProgramSelector">
    <PostModal id="new-post" user="learner" has-program-selector />
  </Example>
  <Example name="Leader">
    <PostModal id="new-post" user="admin" :feed-object-id="9111" has-program-selector />
  </Example>
  <Example name="EditingPost">
    <PostModal id="edit-post" user="learner" :feed-object-id="9111" :post="progressUpdate" />
  </Example>
</template>
