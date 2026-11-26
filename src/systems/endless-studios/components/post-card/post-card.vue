<!--
  The Endless Studios feed post: the app's own PostCard (components/CommunityFeed/PostCard.vue), copied unchanged.
  Screens import `~/components/CommunityFeed/PostCard.vue` directly. This file gives the component page its examples
  and props table, with a sample post as the default, and lets each example choose who is signed in.
-->
<script setup lang="ts">
import { getCurrentInstance, provide } from 'vue';
import PostCard from '~/components/CommunityFeed/PostCard.vue';
import { createAuth, type UserOption } from '../../runtime/auth';
import { NUXT_APP_KEY, useNuxtApp } from '../../runtime/nuxt-app';

const props = withDefaults(
  defineProps<{
    /**
     * The post, as the feed query returns it (`ObjectFeed`): `id`, `object_feed_type_id`, `created_at`, `description`
     * (HTML), `user`, `comments`, `likes`, `files`, `links`, and optionally `image_url`, `tags`, `is_pinned` and
     * `related_object`.
     */
    post?: Record<string, unknown>;
    /** Offers Pin and Unpin in the post's menu to people who can moderate it. */
    enablePinning?: boolean;
    /** Links the post's source (Main Feed, a program, cohort or game) under the author's name. */
    showSourceLink?: boolean;
    /** Opens the comments panel, with the comment box, when the post first shows. */
    showCommentsFromStart?: boolean;
    /** Whether the viewer may comment: `not_member` hides the comment box, `restricted_partner` explains why Comment is off. */
    commentPermission?: 'allowed' | 'not_member' | 'restricted_partner';
    /** Whether the viewer may like: `restricted_partner` explains why Like is off. */
    likePermission?: 'allowed' | 'not_member' | 'restricted_partner';
    /**
     * Who is signed in: `learner`, `mentor`, `admin`, a user object, or `null` for signed out. Leave it out to use the
     * screen's own `system.user`. A view chooses this with `system.user`, not with this prop.
     */
    user?: UserOption;
  }>(),
  {
    post: () => ({
      id: 9801,
      object_id: 4120,
      object_feed_type_id: 'question',
      created_at: '2026-11-18T17:20:00.000Z',
      is_pinned: false,
      description:
        '<p>How do you all keep your pixel art consistent? Do you use a fixed palette or pick colors as you go?</p>',
      user: { id: 302, username: 'SunnyOtter512', metadata: { image_url: null } },
      related_object: { resource_name: 'page', id: 1, name: 'Main Feed' },
      comments: [],
      likes: [
        { id: 9821, user_id: 307, like_type: 'THUMBS_UP' },
        { id: 9822, user_id: 309, like_type: 'THUMBS_UP' },
      ],
      files: [],
      links: [],
      tags: null,
      flagged_by_user: null,
    }),
    enablePinning: false,
    showSourceLink: true,
    showCommentsFromStart: false,
    commentPermission: 'allowed',
    likePermission: 'allowed',
    user: undefined,
  },
);

// The copied card and its comments read `this.$auth`, the app's global. Each example is an app of its own, so
// replacing it here, before the card renders, changes only this example; useNuxtApp() users get the same user.
if (props.user !== undefined) {
  const $auth = createAuth(props.user);
  getCurrentInstance()!.appContext.config.globalProperties.$auth = $auth;
  provide(NUXT_APP_KEY, { ...useNuxtApp(), $auth });
}
</script>

<template>
  <PostCard
    :id="`post-${post.id}`"
    :post="post"
    :enable-pinning="enablePinning"
    :show-source-link="showSourceLink"
    :show-comments-from-start="showCommentsFromStart"
    :comment-permission="commentPermission"
    :like-permission="likePermission"
  />
</template>
