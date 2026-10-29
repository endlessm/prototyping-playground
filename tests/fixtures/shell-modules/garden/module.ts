import type { StudioModule } from '../../../../tooling/modules/contract.ts'

// A section with its own navigation, for the app shell's tests: beds that
// load slowly, fail once, or crash while rendering.
export default {
  id: 'garden',
  label: 'Garden',
  description: 'A section with its own navigation, for the shell tests.',
  rail: { position: 'top', icon: 'i-lucide-flower', order: 50 },
  pages: [
    { path: '/garden', file: 'pages/index.vue' },
    { path: '/garden/:bed', file: 'pages/bed.vue' },
  ],
  home: {
    component: 'components/GardenHome.vue',
    order: { local: 20, deployed: 10 },
  },
} satisfies StudioModule
