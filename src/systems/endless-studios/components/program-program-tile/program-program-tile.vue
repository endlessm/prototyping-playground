<!--
  The program tile: the app's own components/Program/ProgramTile.vue, copied unchanged.
  Screens don't use this file: they import `~/components/Program/ProgramTile.vue` and pass it a `program` object and
  the viewer's cohorts. This file spreads the program into props of its own and picks sample cohorts, so the component
  page and the Lab's Playground can fill it.
-->
<script setup lang="ts">
import { computed } from 'vue';
import ProgramTile from '~/components/Program/ProgramTile.vue';

const props = withDefaults(
  defineProps<{
    /** The program's name. */
    name?: string;
    /** The program's short description, cut at two lines. */
    shortDescription?: string;
    /** The program's image address. Without one the tile shows the app's default background. */
    imageUrl?: string;
    /** How many tasks the program has. Zero hides the count. */
    tasksCount?: number;
    /** The program's status, shown on the viewer's own programs (`is-mine`). */
    programStatusId?: 'draft' | 'notstarted' | 'inprogress' | 'completed' | 'hidden' | 'archived';
    /** The viewer's cohorts in this program: none, one (its name shows) or several (a picker shows). */
    cohorts?: 'none' | 'one' | 'several';
    /** Shows the program as one of the viewer's own, with its status. */
    isMine?: boolean;
    /** Shows the leaders' tile, with a delete button. */
    isLeaderView?: boolean;
  }>(),
  {
    name: 'Make your first platformer',
    shortDescription: 'Build a small platformer over eight weeks, one mechanic at a time: running, jumping, enemies and a final level.',
    imageUrl: undefined,
    tasksCount: 12,
    programStatusId: 'inprogress',
    cohorts: 'several',
    isMine: true,
    isLeaderView: false,
  },
);

const sampleCohorts = [
  { id: 301, name: 'Spring 2026 · Tuesdays' },
  { id: 302, name: 'Spring 2026 · Saturdays' },
];

const program = computed(() => ({
  id: 42,
  name: props.name,
  short_description: props.shortDescription,
  image_url: props.imageUrl || null,
  program_kind_id: null,
  program_status_id: props.programStatusId,
  tasks_count: props.tasksCount,
}));

const cohortList = computed(() => ({ none: [], one: sampleCohorts.slice(0, 1), several: sampleCohorts })[props.cohorts]);
</script>

<template>
  <ProgramTile test-attr-data="program-tile" :program="program" :cohorts="cohortList" :is-mine="isMine" :is-leader-view="isLeaderView" />
</template>
