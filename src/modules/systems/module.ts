import path from 'node:path'
import type { StudioModule } from '../../../tooling/modules/contract.ts'
import { CONFIG_FILE, readConfig } from '../../../tooling/modules/registry.ts'
import {
  componentPages,
  systemCatalog,
  systemDocuments,
} from '../../../tooling/systems/catalog.ts'
import {
  loadSystems,
  systemsFolder,
} from '../../../tooling/systems/registry.ts'

// The browser scenarios point the studio at fixture systems and a
// configuration of their own.
const folder = systemsFolder()
const configFile = () => process.env.STUDIO_CONFIG || CONFIG_FILE

// The systems the area shows: every registered one locally, and only active
// ones on the deployed site.
async function systemsFor(root: string, dev: boolean) {
  const config = readConfig(path.resolve(root, configFile()))
  const { systems } = await loadSystems(root, config, folder)
  return systems.filter(({ spec }) => dev || spec.status === 'active')
}

// The Systems area: each system's Overview, Libraries, Context and Skills,
// with the theme, assets and components its navigation lists. The studio
// always has it.
export default {
  id: 'systems',
  label: 'Systems',
  description:
    'Each design system’s overview, libraries, theme, assets, components, context and skills.',
  required: true,
  paletteSource: 'systems',
  paletteOrder: 20,
  rail: { position: 'top', icon: 'i-lucide-shapes', order: 20 },
  skills: [
    {
      path: 'skills/document-component/',
      when: 'asks to document a system component, or add its page and examples',
    },
    {
      path: 'skills/setup-design-system/',
      when: 'asks to set up a new design system by bringing a Vue app in or starting from Nuxt UI, or to adapt, replace or retire one',
    },
  ],
  home: {
    component: 'components/SystemsHome.vue',
    order: { local: 30, deployed: 30 },
  },
  pages: [
    { path: '/systems', file: 'pages/index.vue' },
    {
      path: '/systems/:systemId',
      file: 'pages/system.vue',
      children: [
        { path: '', file: 'pages/overview.vue' },
        { path: 'libraries', file: 'pages/libraries.vue' },
        { path: 'context', file: 'pages/context.vue' },
        { path: 'context/:path(.+)', file: 'pages/context-document.vue' },
        { path: 'skills', file: 'pages/skills.vue' },
        { path: 'skills/:path(.+)', file: 'pages/skill-document.vue' },
        {
          path: ':page(colors|typography|radius|shadows|spacing|motion|effects|tokens)',
          file: 'pages/theme.vue',
        },
        { path: 'components/:component', file: 'pages/component.vue' },
        { path: ':kind(fonts|icons|images)', file: 'pages/assets.vue' },
        {
          path: ':kind(fonts|icons|images)/:path(.+)',
          file: 'pages/asset.vue',
        },
        { path: ':page(.*)', file: 'pages/missing.vue' },
      ],
    },
  ],
  data: {
    catalog: {
      watch: [`${folder}/**`],
      load: async ({ root, dev }) => ({
        systems: (await systemsFor(root, dev)).map((system) =>
          systemCatalog(system, root),
        ),
      }),
    },
    // The Context and Skills text, loaded when a document first opens.
    documents: {
      watch: [`${folder}/*/context/**`, `${folder}/*/skills/**`],
      load: async ({ root, dev }) =>
        Object.assign(
          {},
          ...(await systemsFor(root, dev)).map((system) =>
            systemDocuments(system, root),
          ),
        ),
    },
    // Each component page's Markdown, examples text and props, read from
    // the component's code when a component page first opens.
    components: {
      watch: [`${folder}/*/components/**`],
      load: async ({ root, dev }) =>
        componentPages(await systemsFor(root, dev)),
    },
  },
} satisfies StudioModule
