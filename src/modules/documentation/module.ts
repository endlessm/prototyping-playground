import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { StudioModule } from '../../../tooling/modules/contract.ts'
import { manualChapters } from './manual.ts'

// The Manual: chapters about using the studio, read at
// /documentation/manual, from the Markdown files in `pages/`. The Context &
// Skills browser beside it belongs to the studio and stays when this module
// is off.
const PAGES = 'pages'
const pages = path.join(import.meta.dirname, PAGES)

/** The modules the configuration turns on, for chapters that need one. */
function configured(root: string) {
  try {
    const config = JSON.parse(
      readFileSync(
        path.resolve(root, process.env.STUDIO_CONFIG || 'studio.config.json'),
        'utf8',
      ),
    ) as { modules?: Record<string, boolean> }
    return Object.keys(config.modules ?? {}).filter((id) => config.modules![id])
  } catch {
    return []
  }
}

const address = (slug: string) =>
  `/documentation/manual${slug === 'index' ? '' : `/${slug}`}`

export default {
  id: 'documentation',
  label: 'Manual',
  paletteOrder: 30,
  description: 'The Manual: how to use the studio, chapter by chapter.',
  rail: {
    position: 'top',
    icon: 'i-lucide-book-open',
    order: 30,
    to: '/documentation/manual',
  },
  pages: [
    {
      path: '/documentation/manual',
      file: 'components/ManualFrame.vue',
      children: [
        { path: '', file: 'components/ManualChapterPage.vue' },
        { path: ':slug', file: 'components/ManualChapterPage.vue' },
      ],
    },
  ],
  // Chapters by title, as they were when the studio started.
  palette: manualChapters(pages, PAGES, configured(process.cwd())).chapters.map(
    (chapter) => ({
      label: chapter.title,
      to: address(chapter.slug),
      icon: 'i-lucide-book-open',
      group: 'Manual',
    }),
  ),
  skills: [
    {
      path: 'skills/write-manual/',
      when: 'asks to add or change the human Manual',
    },
  ],
  data: {
    // The chapters and their text. Broken chapters warn while the studio
    // runs, and stop the build; source mode can still open them.
    manual: {
      watch: [
        `${process.env.STUDIO_MODULES || 'src/modules'}/documentation/${PAGES}/*.md`,
      ],
      load: ({ root, dir, enabled, dev }) => {
        const folder = path.join(dir, PAGES)
        const { chapters, problems, files } = manualChapters(
          folder,
          PAGES,
          enabled,
        )
        if (problems.length && !dev)
          throw new Error(
            `The Manual has chapters that can’t be read:\n${problems.join('\n')}`,
          )
        for (const problem of problems)
          console.warn(`Warning: The Manual skipped ${problem}`)
        return {
          // The module's folder, repository-relative, which chapter files
          // are named from.
          folder: path.relative(root, dir).split(path.sep).join('/'),
          chapters,
          problems: dev ? problems : [],
          texts: Object.fromEntries(
            chapters.map((chapter) => [
              chapter.slug,
              readFileSync(path.join(dir, chapter.file), 'utf8'),
            ]),
          ),
          // Locally, every chapter file opens in source mode, broken or not.
          files: dev ? files : [],
        }
      },
    },
  },
} satisfies StudioModule
