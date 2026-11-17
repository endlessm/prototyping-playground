import type { StudioModule } from '../../../tooling/modules/contract.ts'

// The Lab: a bench for one system component at a time, beside the list of
// the system's components. It reads the Systems module's build data and
// reuses its pieces, and lists experiments from the manifest; only making
// experiments writes files, through its handler on the local dev server, so
// the deployed site has the rest too.
export default {
  id: 'lab',
  label: 'Lab',
  description:
    'A bench for each system component: its overview, its variants side by side, a playground for its props and everyone’s experiments with it.',
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
            { path: 'experiments', file: 'pages/experiments.vue' },
            { path: 'experiments/:experiment', file: 'pages/experiment.vue' },
            { path: ':tab(.*)', file: 'pages/missing.vue' },
          ],
        },
      ],
    },
  ],
  server: { experiments: 'server/experiments.ts' },
} satisfies StudioModule
