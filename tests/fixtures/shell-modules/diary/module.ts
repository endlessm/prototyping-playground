import type { StudioModule } from '../../../../tooling/modules/contract.ts'

// A local-only module, for the app shell's tests.
export default {
  id: 'diary',
  label: 'Diary',
  description: 'A local-only module, for the shell tests.',
  localOnly: true,
  rail: { position: 'bottom', icon: 'i-lucide-notebook' },
  pages: [{ path: '/diary', file: 'pages/index.vue' }],
  home: { component: 'components/DiaryHome.vue', order: { local: 10 } },
} satisfies StudioModule
