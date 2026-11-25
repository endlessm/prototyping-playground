<!--
  Comments under a feed post. In a view, import `~/components/CommunityFeed/Comment.vue` and choose who is signed in
  with `system.user`; the `user` prop here is only how one page shows several viewers.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
import Comment from './comment.vue';

const mention = {
  id: 9813,
  description: '<p>Thanks @priya, trying the Sweetie 16 palette now! Will post the new sprites tonight.</p>',
  created_at: '2026-11-19T11:48:00.000Z',
  user: { id: 302, username: 'SunnyOtter512', metadata: { image_url: null } },
};

const long = {
  id: 9814,
  description:
    '<p>Love the lighthouse level. Two things from my playtest: the third jump after the checkpoint is hard to read because the platform blends into the background, and I didn’t notice the lantern refills until my second try. Maybe a small glow or a sound when you pass one?</p>',
  created_at: '2026-11-20T08:30:00.000Z',
  user: { id: 307, username: 'BraveFalcon77', metadata: { image_url: null } },
};
</script>

<template>
  <Example name="Default">
    <Comment />
  </Example>
  <Example name="WithMention">
    <Comment :comment="mention" />
  </Example>
  <Example name="LongComment">
    <Comment :comment="long" />
  </Example>
  <Example name="AdminCanDelete">
    <Comment :comment="long" user="admin" />
  </Example>
</template>
