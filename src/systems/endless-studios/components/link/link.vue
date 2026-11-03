<!--
  The Endless Studios link: Nuxt UI's ULink as the frontend uses it. Screens write <ULink> directly, with these
  props; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** Where it goes: a path in the app, such as `/profile/ana/`, or a full address. */
    to?: string;
    /** Opens a full address in a new tab when it's `_blank`. */
    target?: '_blank' | '_self';
    /** Drops ULink's own colours and states, so classes alone style it, as the app's user cards do. */
    raw?: boolean;
    /** The element it renders when it has no `to`. */
    as?: string;
    /** Forces the active style, as when its `to` matches the current address. */
    active?: boolean;
    /** Active only on an exact address match, not on pages under it. */
    exact?: boolean;
    /** Classes added while active. */
    activeClass?: string;
    /** Classes added while not active. */
    inactiveClass?: string;
    disabled?: boolean;
  }>(),
  { as: 'button' },
);
</script>

<template>
  <ULink v-bind="props"><slot /></ULink>
</template>
