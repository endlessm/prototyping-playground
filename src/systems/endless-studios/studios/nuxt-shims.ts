// Stand-ins for the Nuxt composables that Endless Studios components use without importing them. The preview
// build auto-imports every name exported here (`app.standIns` in ../system.ts), so a new stand-in is its file in
// ../runtime plus one export line here. Not an app file.
export { navigateTo, useRouter, useRoute } from '../runtime/navigation';
export { useNuxtApp, useI18n, useGraphQLQuery, useState } from '../runtime/nuxt-app';
export { useStore } from '../runtime/store';
export { useNotificationsCount } from '../runtime/composables';
