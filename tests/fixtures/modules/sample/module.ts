import { readdirSync } from 'node:fs'
import path from 'node:path'
import type { StudioModule } from '../../../../tooling/modules/contract.ts'

// A module the tests switch on and off.
export default {
  id: 'sample',
  label: 'Sample',
  description: 'A sample module for the tests.',
  rail: { position: 'top', icon: 'i-lucide-box', order: 50 },
  pages: [{ path: '/sample', file: 'pages/index.vue' }],
  palette: [{ label: 'Open Sample', to: '/sample' }],
  skills: [{ path: 'skills/use-sample/', when: 'asks about Sample' }],
  data: {
    notes: {
      watch: ['tests/fixtures/modules/sample/notes/*.md'],
      load: ({ dir }) =>
        readdirSync(path.join(dir, 'notes'))
          .filter((name) => name.endsWith('.md'))
          .sort(),
    },
  },
} satisfies StudioModule
