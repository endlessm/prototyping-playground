// Stand-ins for the Nuxt composables that Endless Studios components use without importing them. The preview
// build auto-imports these names (`app.standIns` in ../system.ts); the implementations live in ../runtime.
export { navigateTo, useRouter, useRoute } from '../runtime/navigation';
export { useNuxtApp, useI18n, useGraphQLQuery, useState } from '../runtime/nuxt-app';
export { useStore } from '../runtime/store';
export { useNotificationsCount } from '../runtime/composables';
