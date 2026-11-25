<!--
  The app's own AccessCode card (components/shared/AccessCode.vue), copied unchanged: the home page's "Access Code"
  box beside the programs. Screens import `~/components/shared/AccessCode.vue`; this file gives the component page its
  examples and props table, and lets an example choose who is signed in.
-->
<script setup lang="ts">
import { provide } from 'vue';
import AccessCode from '~/components/shared/AccessCode.vue';
import { createAuth, type UserOption } from '../../runtime/auth';
import { NUXT_APP_KEY, useNuxtApp } from '../../runtime/nuxt-app';

const props = withDefaults(
  defineProps<{
    /** The card's heading. The home page passes `$t('access_code')`. */
    title?: string;
    /** One line under the heading saying what a code is for. */
    description?: string;
    /** The button's label. The home page passes `$t('i_have_a_code')`. */
    buttonText?: string;
    /**
     * Who is signed in: `learner`, `mentor`, `admin`, a user object, or `null` for signed out, where the button asks
     * to log in instead of opening the enrollment modal. Leave it out to use the screen's own `system.user`.
     */
    user?: UserOption;
  }>(),
  {
    title: 'Access Code',
    description: 'If you are part of a program or a game, you can access it here.',
    buttonText: 'I have a code',
    user: undefined,
  },
);

const emit = defineEmits<{
  /** The button was pressed while signed in: the home page opens its enrollment-code modal. */
  open: [];
}>();

// The copied card reads `$auth` from useNuxtApp(), so a nearer app with its own sample user changes only this card.
if (props.user !== undefined) provide(NUXT_APP_KEY, { ...useNuxtApp(), $auth: createAuth(props.user) });
</script>

<template>
  <AccessCode :title="title" :description="description" :button-text="buttonText" @open="emit('open')" />
</template>
