<!--
  The Endless Studios post modal: the app's own PostModal (components/CommunityFeed/PostModal.vue), copied unchanged.
  A view imports `~/components/CommunityFeed/PostModal.vue` and shows it with `v-if` when someone chooses to post.
  This file gives the component page its examples and props table: it lets each example choose who is posting, answers
  the program menu and @-mention queries with demo data, and holds the open modal in a frame of its own.
-->
<script setup lang="ts">
import { getCurrentInstance, provide } from 'vue';
import PostModal from '~/components/CommunityFeed/PostModal.vue';
import { createAuth, type UserOption } from '../../runtime/auth';
import { createGraphQL } from '../../runtime/graphql';
import { NUXT_APP_KEY, useNuxtApp } from '../../runtime/nuxt-app';

/** A post to edit, as the feed passes it: the fields the modal reads. */
type PostToEdit = {
  /** `announcement`, `progress`, `question`, `tip` or `misc`. */
  object_feed_type_id: 'announcement' | 'progress' | 'question' | 'tip' | 'misc';
  /** The post's text, as HTML. */
  description: string;
  image_url?: string | null;
  /** Tags separated by commas. */
  tags?: string | null;
};

const props = withDefaults(
  defineProps<{
    /** The modal's element id. Give each modal on a screen its own. */
    id?: string;
    /**
     * Show the program menu beside Upload Post, to choose where the post goes: Home Page, a program the person
     * started or a game they're in. Upload Post stays off until one is chosen; Home Page starts chosen.
     */
    hasProgramSelector?: boolean;
    /**
     * The feed's program, cohort or game id. With it, typing @ in the description suggests people from that feed
     * (GET_POST_MENTION_USERS); without it, mentions are off.
     */
    feedObjectId?: number | null;
    /** A post to edit. The modal opens filled in with its type, text and tags, and its image reads Change image. */
    post?: PostToEdit;
    /**
     * Who is posting: `learner`, `mentor`, `admin`, a user object, or `null`. Only leaders and admins see
     * Announcement among the post types. Leave it out to use the screen's own `system.user`.
     */
    user?: UserOption;
  }>(),
  { id: 'new-post', hasProgramSelector: false, feedObjectId: null, post: undefined, user: undefined },
);

// Demo data for the program menu and @-mentions, from the demo cast: the programs and game a learner such as Maya
// started or joined, and people in Game Making 101's Maple Ridge cohort.
const queries = {
  PROGRAM_DROPDOWN_GET_PAGES_AND_PROGRAMS_AND_PROJECTS_QUERY: {
    getPages: [{ id: 1, name: 'home', description: 'Home Page' }],
    me: {
      started_programs: {
        individual: [{ program: { id: 9101, name: 'Game Making 101' } }],
        team: [{ program: { id: 9102, name: 'Endless Game Makers Club' } }],
      },
      memberOfProjects: [{ id: 9301, name: 'Starlight Drifters' }],
    },
  },
  GET_POST_MENTION_USERS: ({ username }: Record<string, unknown>) => ({
    users: [
      { id: 302, username: 'SunnyOtter512' },
      { id: 303, username: 'QuietLynx318' },
      { id: 306, username: 'BoldTapir441' },
      { id: 307, username: 'CleverMarmot118' },
      { id: 210, username: 'evelyn' },
    ].filter(user => user.username.toLowerCase().includes(String(username ?? '').toLowerCase())),
  }),
};

// The copied modal is written in the Options API, so it reads `this.$auth` and `this.$graphqlRequest` from the app's
// global properties, and its editor reads useNuxtApp(). Each example is a document of its own, so changing both here
// changes only this example.
const app = useNuxtApp();
const graphql = createGraphQL({ ...app.graphql.samples, ...queries });
const auth = props.user !== undefined ? createAuth(props.user) : app.$auth;
provide(NUXT_APP_KEY, { ...app, $auth: auth, graphql, $graphqlRequest: graphql.request });
Object.assign(getCurrentInstance()!.appContext.config.globalProperties, { $auth: auth, $graphqlRequest: graphql.request });
</script>

<template>
  <!-- The modal is fixed to the window; the transform makes this frame its window, so the page shows it in place. -->
  <div class="post-modal-page">
    <PostModal :id="id" :has-program-selector="hasProgramSelector" :feed-object-id="feedObjectId" :post="post" />
  </div>
</template>

<!--
  Below 764px the app turns the modal into a full screen with a grey page, which is what phones see. The component
  page's frames are narrower than that, so the desktop modal keeps its look here, as wide as the frame allows. A style
  block, since the system's Tailwind scans the copied app, not this folder.
-->
<style scoped>
.post-modal-page {
  position: relative;
  width: 100%;
  height: 960px;
  transform: translateZ(0);
  overflow: hidden;
}
.post-modal-page :deep(.post) {
  width: min(764px, calc(100vw - 2rem));
  height: auto;
  background-color: transparent;
}
</style>
