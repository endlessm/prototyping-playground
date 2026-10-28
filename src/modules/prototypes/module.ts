import type { StudioModule } from '../../../tooling/modules/contract.ts'

// Prototypes and their artifacts, with views: Vue files that render in their
// system's preview document.
export default {
  id: 'prototypes',
  label: 'Prototypes',
  description: 'Prototypes with views that render in their design system.',
  required: true,
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
      page: 'types/view/ViewPage.vue',
    },
  ],
} satisfies StudioModule
