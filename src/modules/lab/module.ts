import type { StudioModule } from '../../../tooling/modules/contract.ts'

// The Lab: a bench for one system component at a time, beside the list of
// the system's components. It reads the Systems module's build data and
// reuses its pieces; it owns no data and writes no files, so the deployed
// site has it too.
export default {
  id: 'lab',
  label: 'Lab',
  description:
    'A bench for each system component: its overview, its variants side by side and a playground for its props.',
  rail: { position: 'top', icon: 'i-lucide-flask-conical', order: 25 },
  pages: [
    { path: '/lab', file: 'pages/index.vue' },
    {
      path: '/lab/:systemId',
      file: 'pages/system.vue',
      children: [
        { path: '', file: 'pages/first.vue' },
        {
          path: ':component',
          file: 'pages/component.vue',
          children: [
            { path: '', file: 'pages/overview.vue' },
            { path: 'variants', file: 'pages/variants.vue' },
            { path: 'playground', file: 'pages/playground.vue' },
            { path: 'breakdown', file: 'pages/breakdown.vue' },
            { path: ':tab(.*)', file: 'pages/missing.vue' },
          ],
        },
      ],
    },
  ],
} satisfies StudioModule
