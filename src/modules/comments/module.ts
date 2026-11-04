import type { StudioModule } from '../../../tooling/modules/contract.ts'
import { PROTOTYPES_FOLDER } from '../../../tooling/manifest/build.ts'
import { COMMENTS_FOLDER } from './threads.ts'

// Comments: notes pinned to an artifact, or to a place in it, kept as files
// in the prototype's hidden `.comments` folder. The tool over artifact pages
// and the handler that writes exist only while the studio runs locally; the
// deployed site has neither, and its build data is empty. `yarn comments`
// is the agents' side. Nothing outside this folder imports it.
export default {
  id: 'comments',
  label: 'Comments',
  description:
    'Pin comments to views and reply to or resolve them, here or with `yarn comments`.',
  skills: [
    {
      path: 'skills/address-comments/',
      when: 'asks to read, answer or resolve comments on a prototype',
    },
  ],
  artifactTool: 'components/CommentTool.vue',
  server: { threads: 'server/threads.ts' },
  data: {
    // Every prototype's threads in development, refreshed whenever a thread
    // file changes, whoever changed it. Nothing for the build.
    threads: {
      watch: [
        `${process.env.STUDIO_PROTOTYPES || PROTOTYPES_FOLDER}/**/${COMMENTS_FOLDER}/*.json`,
      ],
      load: async ({ root, dev }) =>
        dev
          ? (await import('./service.ts')).allThreads({ root })
          : { prototypes: {}, problems: [] },
    },
  },
} satisfies StudioModule
