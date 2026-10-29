import { readFileSync } from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import { defineNuxtConfig } from 'nuxt/config'
import { nodeVersionWarning } from './tooling/check-node.ts'
import { basePathFromEnv, publicUrlFromEnv } from './tooling/deployment.ts'
import { COLOR_MODE_KEY } from './tooling/preview/constants.ts'
import { deploymentRecoveryScript } from './tooling/deployment-recovery.ts'
import en from './i18n/locales/en.json'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const warning = nodeVersionWarning(process.version, pkg.engines.node)
if (warning) console.warn(`Warning: ${warning}`)

// The browser scenarios give the studio a configuration of their own.
const studio = JSON.parse(
  readFileSync(process.env.STUDIO_CONFIG || 'studio.config.json', 'utf8'),
)
const baseURL = basePathFromEnv(process.env)
// What link previews and search engines say about the studio.
const DESCRIPTION =
  'Where the Endless team builds and reviews prototypes with Endless Studios’ own screens, alongside their agents.'
const publicUrl = publicUrlFromEnv(process.env)

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  ssr: false,

  // Separate directories let the browser scenarios build and serve the
  // studio without touching a person's own `yarn dev` or build.
  buildDir: process.env.STUDIO_BUILD_DIR || undefined,
  nitro: {
    output: process.env.STUDIO_OUTPUT_DIR
      ? { dir: process.env.STUDIO_OUTPUT_DIR }
      : undefined,
  },

  app: {
    baseURL,
    head: {
      title: studio.name,
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: DESCRIPTION },
        { name: 'theme-color', content: '#171717' },
        // Link previews.
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: studio.name },
        { property: 'og:title', content: `${studio.name}: ${studio.tagline}` },
        { property: 'og:description', content: DESCRIPTION },
        {
          property: 'og:image',
          content: `${publicUrl ?? ''}${baseURL}social.png`,
        },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
        ...(publicUrl
          ? [{ property: 'og:url', content: `${publicUrl}/` }]
          : []),
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: `${baseURL}favicon.svg` },
        { rel: 'icon', href: `${baseURL}favicon.ico`, sizes: '32x32' },
        { rel: 'apple-touch-icon', href: `${baseURL}apple-touch-icon.png` },
      ],
    },
  },

  $production: {
    app: {
      head: {
        script: [
          {
            // Runs before the entry module, which may be the missing file.
            innerHTML: deploymentRecoveryScript(
              baseURL,
              en.deployment.unavailable,
            ),
            tagPosition: 'head',
            tagPriority: 'critical',
          },
        ],
      },
    },
  },

  // The deployment recovery script above owns reloading after a new
  // deployment, with its own limits.
  experimental: {
    emitRouteChunkError: false,
  },

  // Icons ship with the app, so the studio needs no icon service: the
  // deployed site and a phone on the local network may be offline. The scan
  // finds every `i-lucide-*` name in the studio's code, its modules and
  // Nuxt UI's own defaults.
  icon: {
    provider: 'none',
    fallbackToApi: false,
    clientBundle: {
      scan: {
        globInclude: [
          'app/**/*.{vue,ts}',
          'src/modules/**/*.{vue,ts}',
          'tests/fixtures/**/*.{vue,ts}',
          'node_modules/@nuxt/ui/dist/shared/*.mjs',
        ],
        globExclude: [],
      },
    },
  },

  // Remembered in this browser, applied before the first paint.
  colorMode: {
    storageKey: COLOR_MODE_KEY,
  },

  css: ['~/assets/css/main.css'],

  modules: [
    '@nuxtjs/i18n',
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    './tooling/modules/nuxt-module.ts',
    './tooling/dev-server/nuxt-module.ts',
    './tooling/contributors/nuxt-module.ts',
    './tooling/manifest/nuxt-module.ts',
  ],

  runtimeConfig: {
    public: {
      studio: {
        name: studio.name,
        tagline: studio.tagline,
      },
    },
  },

  // Components are imported explicitly, as in Endless Studios.
  components: {
    dirs: [],
  },

  vite: {
    plugins: [tailwindcss()],
  },

  i18n: {
    vueI18n: './i18n.config.ts',
    locales: [
      { name: 'English', code: 'en', language: 'en-US', file: 'en.json' },
    ],
    defaultLocale: 'en',
    strategy: 'no_prefix',
  },

  typescript: {
    // Studio modules' pages are app code; their declarations run on Node.
    tsConfig: {
      include: [
        '../src/modules/**/*.vue',
        '../src/modules/*/composables/**/*.ts',
        '../tests/fixtures/modules/**/*.vue',
      ],
    },
    nodeTsConfig: {
      include: [
        '../tooling/**/*',
        '../tests/**/*.ts',
        '../src/modules/*/module.ts',
        '../src/modules/*/types/*/identity.ts',
        '../vitest.config.ts',
      ],
    },
  },
})
