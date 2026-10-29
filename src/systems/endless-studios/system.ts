import type { SystemSpec } from '../../../tooling/systems/contract.ts';

// The Endless Studios frontend's own Vue code: Nuxt UI 4 with the app's `app.config` customization and stylesheet.
export default {
  status: 'active',
  role: 'prototype',
  label: 'Endless Studios',
  themeClass: 'endless-studios-theme',
  styling: 'tailwind',
  colorModes: ['light'],
  docs: 'warn',
  overview: {
    summary: 'The Endless Studios frontend in Vue: Nuxt UI with the app’s own theme and components, for screens that look like the real platform.',
  },
  libraries: [
    {
      kind: 'package',
      id: 'nuxt-ui',
      label: 'Nuxt UI',
      package: '@nuxt/ui',
      description: 'The Endless Studios frontend component library, with its app.config customization',
      docs: 'https://ui.nuxt.com/docs/getting-started/installation/vue',
      components: ['button', 'card'],
    },
    {
      kind: 'package',
      id: 'lucide',
      label: 'Lucide',
      package: '@iconify-json/lucide',
      description: 'Icon catalog, used as i-lucide-* names',
      docs: 'https://lucide.dev/icons/',
      assets: ['icons'],
    },
  ],
  origin: null,
  studioId: '8x5spen6xtvp96a9',
  app: {
    factory: { from: 'libraries/vue-app.ts', name: 'createStudiosApp' },
    stylesheet: 'styles/studios.css',
    nuxtUi: {
      config: 'nuxt-ui.config.ts',
      colors: ['primary', 'secondary', 'kids', 'info', 'success', 'warning', 'error', 'neutral'],
    },
    standIns: {
      from: 'studios/nuxt-shims.ts',
      imports: [
        'useRouter',
        'useRoute',
        'navigateTo',
        'useNuxtApp',
        'useI18n',
        'useGraphQLQuery',
        'useStore',
        'useState',
        'useNotificationsCount',
      ],
    },
    source: 'studios',
    aliases: {
      'graphql-request': 'runtime/graphql-request.ts',
      vuex: 'runtime/store.ts',
      'vue-i18n': 'runtime/nuxt-app.ts',
      '~/composables/useGraphQLQuery': 'runtime/graphql.ts',
      '~/composables/useStreamingGraphQLQuery.js': 'runtime/streaming-graphql.ts',
      '~/composables/useBackendError': 'runtime/composables.ts',
      '~/components/Generic/InfiniteScroll.vue': 'runtime/InfiniteScroll.vue',
      '~/utils/dashboardRoute': 'runtime/app-modules.ts',
      '~/graphql_schemas/notifications': 'runtime/app-modules.ts',
    },
  },
} satisfies SystemSpec;
