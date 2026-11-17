import path from 'node:path'
import type { StudioModule } from '../../../tooling/modules/contract.ts'
import { PROTOTYPES_FOLDER } from '../../../tooling/manifest/build.ts'
import { posix, within } from '../../../tooling/paths.ts'

// The Lab: a bench for one system component at a time, beside the list of
// the system's components. It reads the Systems module's build data and
// reuses its pieces, and lists experiments from the manifest; only making
// and saving experiments writes files, through its handlers on the local dev
// server, so the deployed site has the rest too.
export default {
  id: 'lab',
  label: 'Lab',
  description:
    'A bench for each system component: its overview, its variants side by side, a playground for its props, its breakdown into pieces with knobs, and everyone’s experiments with it.',
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
  server: { experiments: 'server/experiments.ts', save: 'server/save.ts' },
  data: {
    // Each experiment's Breakdown (its tree, preview and file version),
    // read again whenever a view changes, the deployed site's too.
    experiments: {
      watch: [
        `${watchedPrototypes()}/**/*.vue`,
        `${watchedPrototypes()}/**/meta.json`,
      ],
      load: async ({ root, dev }) => {
        const [{ experimentBreakdowns }, { labContext }] = await Promise.all([
          import('./experiments/trees.ts'),
          import('./experiments/context.ts'),
        ])
        return experimentBreakdowns({ ...(await labContext(root)), dev })
      },
    },
  },
} satisfies StudioModule

// Watch patterns are repository-relative. A prototypes folder outside the
// repository can't be watched, so its experiments' Breakdowns follow their
// files only on the next load.
function watchedPrototypes() {
  const folder = process.env.STUDIO_PROTOTYPES || PROTOTYPES_FOLDER
  const absolute = path.resolve(folder)
  return absolute !== process.cwd() && within(absolute, process.cwd())
    ? posix(path.relative(process.cwd(), absolute))
    : PROTOTYPES_FOLDER
}
