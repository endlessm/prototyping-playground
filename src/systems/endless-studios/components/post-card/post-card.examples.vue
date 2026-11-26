<!--
  Feed posts in the states screens show them. In a view, import `~/components/CommunityFeed/PostCard.vue` and choose
  who is signed in with `system.user`; the `user` prop here is only how one page shows several viewers.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
import gameShot from '~/assets/images/games/game-built.png';
import PostCard from './post-card.vue';

const priya = { id: 202, username: 'priya', metadata: { image_url: null } };
const sunnyOtter = { id: 302, username: 'SunnyOtter512', metadata: { image_url: null } };
const braveFalcon = { id: 307, username: 'BraveFalcon77', metadata: { image_url: null } };
const ana = { id: 101, username: 'ana.learner', metadata: { image_url: null } };
const alex = { id: 103, username: 'alex.admin', metadata: { image_url: null } };

const base = { object_id: 4120, is_pinned: false, files: [], links: [], tags: null, flagged_by_user: null };

const progressPost = {
  ...base,
  id: 9802,
  object_feed_type_id: 'progress',
  created_at: '2026-11-19T15:40:00.000Z',
  description:
    '<p>Lantern Keeper now has its first full level! The lighthouse climb took three tries to get the jumps right. Next up is the storm effect.</p>',
  image_url: gameShot,
  tags: 'platformer,level-design,pixel-art',
  user: sunnyOtter,
  related_object: { resource_name: 'program', id: 12, name: 'Game Design Foundations' },
  comments: [],
  likes: [
    { id: 9831, user_id: 202, like_type: 'THUMBS_UP' },
    { id: 9832, user_id: 307, like_type: 'THUMBS_UP' },
    { id: 9833, user_id: 309, like_type: 'THUMBS_UP' },
    { id: 9834, user_id: 311, like_type: 'THUMBS_UP' },
    { id: 9835, user_id: 312, like_type: 'THUMBS_UP' },
  ],
};

const questionPost = {
  ...base,
  id: 9801,
  object_feed_type_id: 'question',
  created_at: '2026-11-18T17:20:00.000Z',
  description:
    '<p>How do you all keep your pixel art consistent? Do you use a fixed palette or pick colors as you go?</p>',
  user: sunnyOtter,
  related_object: { resource_name: 'page', id: 1, name: 'Main Feed' },
  comments: [
    {
      id: 9811,
      description: '<p>Pick one palette of about 16 colors and treat it as a rule. Lospec has good ones to start from.</p>',
      created_at: '2026-11-18T18:02:00.000Z',
      user: priya,
    },
    {
      id: 9812,
      description: '<p>I keep a swatch layer at the top of every sprite file so I never guess.</p>',
      created_at: '2026-11-19T09:15:00.000Z',
      user: braveFalcon,
    },
    {
      id: 9813,
      description: '<p>Thanks @priya, trying the Sweetie 16 palette now!</p>',
      created_at: '2026-11-19T11:48:00.000Z',
      user: sunnyOtter,
    },
  ],
  likes: [
    { id: 9821, user_id: 101, like_type: 'THUMBS_UP' },
    { id: 9822, user_id: 309, like_type: 'THUMBS_UP' },
  ],
};

const announcement = {
  ...base,
  id: 9790,
  object_feed_type_id: 'announcement',
  created_at: '2026-11-10T14:00:00.000Z',
  is_pinned: true,
  description:
    '<p>Game Jam week starts Monday! The theme is <strong>Light in the dark</strong>. Share your progress here with the #gamejam tag.</p>',
  tags: 'gamejam',
  user: alex,
  related_object: { resource_name: 'page', id: 1, name: 'Main Feed' },
  comments: [],
  likes: [
    { id: 9791, user_id: 101, like_type: 'THUMBS_UP' },
    { id: 9792, user_id: 202, like_type: 'THUMBS_UP' },
    { id: 9793, user_id: 302, like_type: 'THUMBS_UP' },
  ],
};

const tipPost = {
  ...base,
  id: 9803,
  object_feed_type_id: 'tip',
  created_at: '2026-11-20T10:05:00.000Z',
  description: '<p>Playtest with someone who has never seen your game, and don’t explain anything. Just watch.</p>',
  user: ana,
  related_object: { resource_name: 'cohort', id: 12, association_id: 31, name: 'Game Design Foundations' },
  comments: [],
  likes: [{ id: 9841, user_id: 202, like_type: 'THUMBS_UP' }],
};
</script>

<template>
  <Example name="Default">
    <PostCard comment-permission="allowed" like-permission="allowed" show-source-link />
  </Example>
  <Example name="WithImageAndTags">
    <PostCard :post="progressPost" />
  </Example>
  <Example name="WithComments">
    <PostCard :post="questionPost" user="learner" />
  </Example>
  <Example name="CommentsOpen">
    <PostCard :post="questionPost" user="learner" show-comments-from-start />
  </Example>
  <Example name="PinnedAnnouncement">
    <PostCard :post="announcement" user="admin" enable-pinning />
  </Example>
  <Example name="OwnPost">
    <PostCard :post="tipPost" user="learner" />
  </Example>
  <Example name="NotMember">
    <PostCard :post="questionPost" user="learner" comment-permission="not_member" show-comments-from-start />
  </Example>
  <Example name="RestrictedPartner">
    <PostCard :post="progressPost" comment-permission="restricted_partner" like-permission="restricted_partner" />
  </Example>
  <Example name="SignedOut">
    <PostCard :post="progressPost" :user="null" />
  </Example>
</template>
