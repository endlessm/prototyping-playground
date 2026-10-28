import type { StudioModule } from '../../../tooling/modules/contract.ts'

// __LABEL__: what the module is and what it adds to the studio. See
// tooling/modules/contract.ts for everything a module can declare.
export default {
  id: '__ID__',
  label: '__LABEL__',
  description: 'Say what __LABEL__ adds, in one sentence.',
  rail: { position: 'top', icon: 'i-lucide-box', order: 50 },
  pages: [{ path: '/__ID__', file: 'pages/index.vue' }],
  palette: [{ label: '__LABEL__', to: '/__ID__' }],
  skills: [{ path: 'skills/use-__ID__/', when: 'asks about __LABEL__' }],
} satisfies StudioModule
