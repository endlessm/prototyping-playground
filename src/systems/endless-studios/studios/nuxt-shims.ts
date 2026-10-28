// Stand-ins for the Nuxt composables that Endless Studios components use without importing them. The preview build
// auto-imports these names (`app.standIns` in ../system.ts); the implementations live in ../runtime.
export { navigateTo, useRouter, useRoute } from '../runtime/navigation';
export { useNuxtApp, useI18n, useState } from '../runtime/nuxt-app';
