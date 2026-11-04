import path from 'node:path'
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
  // Each thread is one file in it. Written out (not COMMENTS_FOLDER): the
  // scope check reads this declaration from Git.
  prototypeFolder: { name: '.comments', one: 'comment', other: 'comments' },
  server: { threads: 'server/threads.ts' },
  data: {
    // Every prototype's threads in development, refreshed whenever a thread
    // file changes, whoever changed it. Nothing for the build.
    threads: {
      watch: [`${watchedPrototypes()}/**/${COMMENTS_FOLDER}/*.json`],
      load: async ({ root, dev }) =>
        dev
          ? (await import('./service.ts')).allThreads({ root })
          : { prototypes: {}, problems: [] },
    },
  },
} satisfies StudioModule

// Watch patterns are repository-relative. A prototypes folder outside the
// repository (tests may use the system's temporary folder) can't be watched,
// so its pages pick up thread changes only on the next load.
function watchedPrototypes() {
  const folder = process.env.STUDIO_PROTOTYPES || PROTOTYPES_FOLDER
  const relative = path.relative(process.cwd(), path.resolve(folder))
  return !relative || relative.startsWith('..') || path.isAbsolute(relative)
    ? PROTOTYPES_FOLDER
    : relative.split(path.sep).join('/')
}
