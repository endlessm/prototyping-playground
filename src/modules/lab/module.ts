import type { StudioModule } from '../../../tooling/modules/contract.ts'

// The Lab: a bench for one system component at a time, beside the list of
// the system's components. It reads the Systems module's build data and
// reuses its pieces and owns no data, so the deployed site has it too.
// Locally an app component's Playground also makes versions of it, views
// in your own prototype, and edits them as drafts (`server/versions.ts`).
export default {
  id: 'lab',
  label: 'Lab',
  description:
    'A bench for each system component: its overview, its variants side by side and a playground for its props and classes.',
  rail: { position: 'top', icon: 'i-lucide-flask-conical', order: 25 },
  server: { versions: 'server/versions.ts' },
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
            { path: 'versions', file: 'pages/versions.vue' },
            {
              path: 'versions/:version/changes',
              file: 'pages/changes.vue',
            },
            { path: ':tab(.*)', file: 'pages/missing.vue' },
          ],
        },
      ],
    },
  ],
} satisfies StudioModule
