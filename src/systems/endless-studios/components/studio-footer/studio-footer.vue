<!--
  The Endless Studios footer: the app's own StudioFooter (components/App/StudioFooter.vue), copied unchanged.
  Screens don't use this file: they get the footer with `system: { shell: true }`, or import
  `~/components/App/StudioFooter.vue` beside their own layout. This file gives the component page its examples and
  props table, and lets each example choose its language.
-->
<script setup lang="ts">
import { provide } from 'vue';
import StudioFooter from '~/components/App/StudioFooter.vue';
import { createI18n } from '../../runtime/i18n';
import { NUXT_APP_KEY, useNuxtApp } from '../../runtime/nuxt-app';

const props = withDefaults(
  defineProps<{
    /**
     * The footer's language: `en` or `es`. It translates the links and lights the current one in the language
     * switch. Leave it out to use the screen's own `system.locale`, which is how a view chooses it.
     */
    locale?: 'en' | 'es';
  }>(),
  { locale: undefined },
);

// The copied footer reads its translations from useNuxtApp(), so a nearer app in another language changes only it.
if (props.locale !== undefined) provide(NUXT_APP_KEY, { ...useNuxtApp(), $i18n: createI18n(props.locale) });
</script>

<template>
  <StudioFooter class="w-full" />
</template>
