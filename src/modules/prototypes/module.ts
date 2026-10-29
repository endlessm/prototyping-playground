import type { StudioModule } from '../../../tooling/modules/contract.ts'

// Prototypes and their artifacts, with views: Vue files that render in their
// system's preview document.
export default {
  id: 'prototypes',
  label: 'Prototypes',
  description: 'Prototypes with views that render in their design system.',
  required: true,
  // Your work first locally; on the deployed site, after what colleagues
  // come for.
  home: {
    component: 'components/PrototypesHome.vue',
    order: { local: 10, deployed: 20 },
  },
  pages: [
    { path: '/prototypes/:prototypeId', file: 'pages/prototype.vue' },
    {
      path: '/prototypes/:prototypeId/artifacts/:artifactId',
      file: 'pages/artifact.vue',
    },
  ],
  skills: [
    {
      path: 'skills/build-prototype/',
      when: 'asks to create or edit interactive prototype views',
    },
  ],
  content: 'src/prototypes',
  fileTypes: [
    {
      id: 'view',
      label: 'View',
      extensions: ['.vue'],
      identity: 'types/view/identity.ts',
      check: 'types/view/states.ts',
      fidelity: 'types/view/fidelity.ts',
      icon: 'i-lucide-app-window',
      page: 'types/view/ViewPage.vue',
    },
  ],
} satisfies StudioModule
