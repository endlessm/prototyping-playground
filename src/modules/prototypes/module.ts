import type { StudioModule } from '../../../tooling/modules/contract.ts'

// Prototypes and their artifacts, with views: Vue files that render in their
// system's preview document. The gallery at /prototypes is the rail's first
// section.
export default {
  id: 'prototypes',
  label: 'Prototypes',
  description: 'Prototypes with views that render in their design system.',
  required: true,
  rail: { position: 'top', icon: 'i-lucide-square-mouse-pointer', order: 0 },
  // Your work first locally; on the deployed site, after what colleagues
  // come for.
  home: {
    component: 'components/PrototypesHome.vue',
    order: { local: 10, deployed: 20 },
  },
  pages: [
    { path: '/prototypes', file: 'pages/gallery.vue' },
    { path: '/prototypes/:prototypeId', file: 'pages/prototype.vue' },
    {
      path: '/prototypes/:prototypeId/artifacts/:artifactId',
      file: 'pages/artifact.vue',
    },
  ],
  skills: [
    {
      path: 'skills/build-prototype/',
      when: 'asks to create a prototype, or to create or edit its interactive views',
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
      embed: 'types/view/ViewEmbed.vue',
    },
  ],
} satisfies StudioModule
