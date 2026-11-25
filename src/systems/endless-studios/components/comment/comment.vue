<!--
  A comment under a feed post: the app's own Comment (components/CommunityFeed/Comment.vue), copied unchanged.
  Screens import `~/components/CommunityFeed/Comment.vue` directly. This file gives the component page its examples and
  props table, and lets each example choose who is signed in.
-->
<script setup lang="ts">
import { getCurrentInstance, provide } from 'vue';
import Comment from '~/components/CommunityFeed/Comment.vue';
import { createAuth, type UserOption } from '../../runtime/auth';
import { NUXT_APP_KEY, useNuxtApp } from '../../runtime/nuxt-app';

const props = withDefaults(
  defineProps<{
    /**
     * The comment, as the feed query returns it: `id`, `description` (HTML), `created_at` and `user` (`id`,
     * `username`, `metadata.image_url`).
     */
    comment?: Record<string, unknown>;
    /**
     * Who is signed in: `learner`, `mentor`, `admin`, a user object, or `null` for signed out. Admins see the delete
     * button on hover. A view chooses this with `system.user`, not with this prop.
     */
    user?: UserOption;
  }>(),
  {
    comment: () => ({
      id: 9811,
      description: '<p>Pick one palette of about 16 colors and treat it as a rule. Lospec has good ones to start from.</p>',
      created_at: '2026-11-18T18:02:00.000Z',
      user: { id: 202, username: 'priya', metadata: { image_url: null } },
    }),
    user: undefined,
  },
);

// The copied comment reads `this.$auth`, the app's global. Each example is an app of its own, so replacing it here,
// before the comment renders, changes only this example.
if (props.user !== undefined) {
  const $auth = createAuth(props.user);
  getCurrentInstance()!.appContext.config.globalProperties.$auth = $auth;
  provide(NUXT_APP_KEY, { ...useNuxtApp(), $auth });
}
</script>

<template>
  <Comment :comment="comment" />
</template>
