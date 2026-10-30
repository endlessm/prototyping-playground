// What the Systems area knows about each system, read from its folder on
// Node: the Overview's summaries and counts, the libraries with their
// installed versions, the theme's token pages, components, local assets,
// and the Context and Skills documents. Also the build's checks of a
// system's Context and Skills.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import {
  systemCatalog,
  systemContentProblems,
  systemDocsReport,
  systemDocuments,
} from '../../tooling/systems/catalog'
import { exampleId, overviewId } from '../../tooling/systems/preview-ids'
import { loadSystems } from '../../tooling/systems/registry'

let root: string

const spec = (extra: Record<string, unknown> = {}) => ({
  label: 'Harbor',
  status: 'active',
  role: 'prototype',
  styling: 'tailwind',
  colorModes: ['light', 'dark'],
  docs: 'warn',
  libraries: [],
  origin: null,
  studioId: 'hrbr000000000001',
  app: {
    factory: { from: 'app.ts', name: 'createApp' },
    stylesheet: 'styles/theme.css',
  },
  ...extra,
})

function write(file: string, text: string) {
  const at = path.join(root, file)
  mkdirSync(path.dirname(at), { recursive: true })
  writeFileSync(at, text)
}

async function harbor(extra: Record<string, unknown> = {}) {
  write(
    'src/systems/harbor/system.ts',
    `export default ${JSON.stringify(spec(extra))}\n`,
  )
  const { systems, problems } = await loadSystems(root, {
    systems: ['harbor'],
  })
  expect(problems).toEqual([])
  return systems[0]!
}

beforeEach(() => {
  root = mkdtempSync(path.join(os.tmpdir(), 'studio-catalog-'))
})
afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('a system’s catalog', () => {
  test('[SY-63] [SY-64] [SY-11] carries the authored summary and guidance, or none', async () => {
    const plain = systemCatalog(await harbor(), root)
    expect(plain.summary).toBeNull()
    expect(plain.guidance).toBeNull()
    expect(plain.code).toBeNull()

    const authored = systemCatalog(
      await harbor({
        overview: {
          summary: 'Harbor’s screens for the dock team.',
          guidance: 'Read the context before building.',
          code: 'Nuxt UI with Harbor’s theme.',
        },
      }),
      root,
    )
    expect(authored.summary).toBe('Harbor’s screens for the dock team.')
    expect(authored.guidance).toBe('Read the context before building.')
    expect(authored.code).toBe('Nuxt UI with Harbor’s theme.')
    expect(authored.colorModes).toEqual(['light', 'dark'])
  })

  test('[SY-80] [SY-81] [SY-82] lists each library with its installed version, or none when it isn’t installed', async () => {
    write(
      'node_modules/@harbor/ui/package.json',
      JSON.stringify({ name: '@harbor/ui', version: '1.2.3' }),
    )
    const system = await harbor({
      libraries: [
        {
          kind: 'package',
          id: 'harbor-ui',
          label: 'Harbor UI',
          package: '@harbor/ui',
          description: 'Components',
          docs: 'https://harbor.example/docs',
          components: ['button'],
        },
        {
          kind: 'package',
          id: 'icons',
          label: 'Icons',
          package: '@harbor/icons',
          description: 'Icon catalog',
          docs: 'https://harbor.example/icons',
          assets: ['icons'],
        },
      ],
    })
    expect(systemCatalog(system, root).libraries).toEqual([
      {
        kind: 'package',
        id: 'harbor-ui',
        label: 'Harbor UI',
        package: '@harbor/ui',
        description: 'Components',
        docs: 'https://harbor.example/docs',
        version: '1.2.3',
        components: ['button'],
        assets: [],
      },
      {
        kind: 'package',
        id: 'icons',
        label: 'Icons',
        package: '@harbor/icons',
        description: 'Icon catalog',
        docs: 'https://harbor.example/icons',
        version: null,
        components: [],
        assets: ['icons'],
      },
    ])
  })

  test('[SY-65] [SY-37] reads theme tokens from the stylesheet and the local files it imports', async () => {
    write(
      'src/systems/harbor/styles/theme.css',
      `@import 'tailwindcss';\n@import './tokens.css';\n.harbor { --color-sea: #0af; --radius-card: 8px; }\n.harbor.dark { --color-sea: #048; }\n`,
    )
    write(
      'src/systems/harbor/styles/tokens.css',
      `@theme static {\n  --font-sans: 'Inter', sans-serif;\n  --spacing-4: 1rem;\n  --shadow-card: 0 1px 2px #0003;\n  --ease-out: cubic-bezier(0, 0, 0.2, 1);\n  --tab-width: 4;\n}\n`,
    )
    const catalog = systemCatalog(await harbor({ themeClass: 'harbor' }), root)
    expect(catalog.tokens.map(({ name, group }) => ({ name, group }))).toEqual([
      { name: '--color-sea', group: 'colors' },
      { name: '--font-sans', group: 'typography' },
      { name: '--radius-card', group: 'radius' },
      { name: '--shadow-card', group: 'shadows' },
      { name: '--spacing-4', group: 'spacing' },
      { name: '--ease-out', group: 'motion' },
      { name: '--tab-width', group: 'other' },
    ])
    expect(catalog.stylesheet).toBe('src/systems/harbor/styles/theme.css')
  })

  test('[SY-37] a system with no stylesheet has no tokens', async () => {
    const catalog = systemCatalog(
      await harbor({ app: { factory: { from: 'app.ts', name: 'createApp' } } }),
      root,
    )
    expect(catalog.tokens).toEqual([])
    expect(catalog.stylesheet).toBeNull()
  })

  test('[SY-38] [SY-65] [SY-102] lists components by title, and local assets by kind', async () => {
    write(
      'src/systems/harbor/components/button/button.md',
      '---\ntitle: Button\ndescription: Starts an action.\nsource: Harbor 2\ndocs: https://example.com/button\n---\n\n## When to use\n',
    )
    write('src/systems/harbor/components/button/Button.vue', '<template/>')
    write(
      'src/systems/harbor/components/button/Button.examples.vue',
      '<template><Example name="Default">x</Example><Example name="WithIcon">y</Example></template>',
    )
    write(
      'src/systems/harbor/components/card/card.md',
      '---\ndescription: No title.\n---\n',
    )
    write('src/systems/harbor/components/IconButton.vue', '<template/>')
    write('src/systems/harbor/assets/icons/anchor.svg', '<svg/>')
    write('src/systems/harbor/assets/logo.png', 'png')
    write('src/systems/harbor/assets/fonts/Harbor.woff2', 'font')
    write('src/systems/harbor/assets/notes.txt', 'not an asset')
    const catalog = systemCatalog(await harbor(), root)
    const at = (file: string) => `src/systems/harbor/components/${file}`
    expect(catalog.components).toEqual([
      {
        slug: 'button',
        name: 'Button',
        title: 'Button',
        description: 'Starts an action.',
        sourceNote: 'Harbor 2',
        docsUrl: 'https://example.com/button',
        files: [
          at('button/button.md'),
          at('button/Button.examples.vue'),
          at('button/Button.vue'),
        ],
        doc: at('button/button.md'),
        examplesFile: at('button/Button.examples.vue'),
        source: at('button/Button.vue'),
        examples: [
          {
            name: 'Default',
            title: 'Default',
            id: exampleId('hrbr000000000001', 'button', 'Default'),
          },
          {
            name: 'WithIcon',
            title: 'With icon',
            id: exampleId('hrbr000000000001', 'button', 'WithIcon'),
          },
        ],
      },
      {
        slug: 'card',
        name: 'card',
        title: 'Card',
        description: 'No title.',
        sourceNote: null,
        docsUrl: null,
        files: [at('card/card.md')],
        doc: at('card/card.md'),
        examplesFile: null,
        source: null,
        examples: [],
      },
      {
        slug: 'icon-button',
        name: 'IconButton',
        title: 'Icon button',
        description: null,
        sourceNote: null,
        docsUrl: null,
        files: [at('IconButton.vue')],
        doc: null,
        examplesFile: null,
        source: at('IconButton.vue'),
        examples: [],
      },
    ])
    expect(catalog.overview).toBeNull()
    write('src/systems/harbor/overview.vue', '<template><p>Ours</p></template>')
    expect(systemCatalog(await harbor(), root).overview).toBe(
      overviewId('hrbr000000000001'),
    )
    expect(catalog.assets).toEqual([
      {
        path: 'fonts/Harbor.woff2',
        kind: 'fonts',
        origin: 'local',
        file: 'assets/fonts/Harbor.woff2',
      },
      {
        path: 'icons/anchor.svg',
        kind: 'icons',
        origin: 'local',
        file: 'assets/icons/anchor.svg',
      },
      {
        path: 'logo.png',
        kind: 'images',
        origin: 'local',
        file: 'assets/logo.png',
      },
    ])
  })

  test('[SY-170] [SY-101] the copied app source’s images are listed too, its Icons folders as icons', async () => {
    write('src/systems/harbor/app/assets/images/logo.svg', '<svg/>')
    write('src/systems/harbor/app/assets/images/Icons/bell.svg', '<svg/>')
    write('src/systems/harbor/app/assets/css/main.css', ':root {}')
    write('src/systems/harbor/app/components/Thing.vue', '<template/>')
    const catalog = systemCatalog(
      await harbor({
        app: {
          factory: { from: 'app.ts', name: 'createApp' },
          source: 'app',
        },
      }),
      root,
    )
    expect(catalog.assets).toEqual([
      {
        path: 'assets/images/Icons/bell.svg',
        kind: 'icons',
        origin: 'app',
        file: 'app/assets/images/Icons/bell.svg',
      },
      {
        path: 'assets/images/logo.svg',
        kind: 'images',
        origin: 'app',
        file: 'app/assets/images/logo.svg',
      },
    ])
  })

  test('[SY-121] [SY-122] [SY-64] lists Context documents in file-tree order and one entry per skill', async () => {
    write('src/systems/harbor/context/voice.md', '# Voice and tone\n')
    write(
      'src/systems/harbor/context/flows/sign-in.md',
      '---\ntitle: Signing in\n---\nBody\n',
    )
    write('src/systems/harbor/context/flows/empty/.gitkeep', '')
    write(
      'src/systems/harbor/skills/build-flow/SKILL.md',
      '---\nname: build-flow\ndescription: Builds a flow. Use when asked for a flow.\n---\n# Build a flow\n',
    )
    write('src/systems/harbor/skills/build-flow/references/steps.md', 'Steps')
    write('src/systems/harbor/skills/build-flow/logo.png', 'png')
    const catalog = systemCatalog(await harbor(), root)
    expect(catalog.context).toEqual([
      {
        path: 'flows/sign-in.md',
        title: 'Signing in',
        file: 'src/systems/harbor/context/flows/sign-in.md',
      },
      {
        path: 'voice.md',
        title: 'Voice and tone',
        file: 'src/systems/harbor/context/voice.md',
      },
    ])
    expect(catalog.contextFolders).toEqual(['flows', 'flows/empty'])
    expect(catalog.skills).toEqual([
      {
        name: 'build-flow',
        title: 'Build flow',
        description: 'Builds a flow. Use when asked for a flow.',
        file: 'src/systems/harbor/skills/build-flow/SKILL.md',
        // SKILL.md first, then the supporting files in file-tree order.
        files: ['SKILL.md', 'references/steps.md', 'logo.png'],
      },
    ])
    expect(catalog.folder).toBe('src/systems/harbor')
  })

  test('[SY-121] [SY-198] documents carry the Context and Skills text, by repository path', async () => {
    write('src/systems/harbor/context/voice.md', '# Voice\n')
    write(
      'src/systems/harbor/skills/build-flow/SKILL.md',
      '---\nname: build-flow\ndescription: Builds.\n---\n',
    )
    write('src/systems/harbor/skills/build-flow/references/steps.md', 'Steps')
    write('src/systems/harbor/skills/build-flow/logo.png', 'png')
    expect(systemDocuments(await harbor(), root)).toEqual({
      'src/systems/harbor/context/voice.md': '# Voice\n',
      'src/systems/harbor/skills/build-flow/SKILL.md':
        '---\nname: build-flow\ndescription: Builds.\n---\n',
      'src/systems/harbor/skills/build-flow/references/steps.md': 'Steps',
    })
  })

  test('[PR-124] documents carry a skill’s other text files too, never binary ones', async () => {
    write(
      'src/systems/harbor/skills/build-flow/SKILL.md',
      '---\nname: build-flow\ndescription: Builds.\n---\n',
    )
    write('src/systems/harbor/skills/build-flow/scripts/check.mjs', 'run()\n')
    write('src/systems/harbor/skills/build-flow/NOTES', 'Plain notes\n')
    write('src/systems/harbor/skills/build-flow/logo.png', 'png')
    write('src/systems/harbor/skills/build-flow/blob', 'a\u0000b')
    expect(Object.keys(systemDocuments(await harbor(), root)).sort()).toEqual([
      'src/systems/harbor/skills/build-flow/NOTES',
      'src/systems/harbor/skills/build-flow/SKILL.md',
      'src/systems/harbor/skills/build-flow/scripts/check.mjs',
    ])
  })
})

describe('the checks of a system’s Context and Skills', () => {
  test('[SY-128] accept Markdown context and well-formed skills', async () => {
    write('src/systems/harbor/context/voice.md', '# Voice\n')
    write(
      'src/systems/harbor/skills/build-flow/SKILL.md',
      '---\nname: build-flow\ndescription: Builds a flow.\n---\n',
    )
    write('src/systems/harbor/skills/build-flow/scripts/run.sh', 'echo')
    expect(systemContentProblems(await harbor(), root)).toEqual([])
  })

  test('[SY-128] name what to fix: non-Markdown context, loose files, missing or mismatched SKILL.md', async () => {
    write('src/systems/harbor/context/diagram.png', 'png')
    write('src/systems/harbor/skills/notes.md', 'loose')
    write('src/systems/harbor/skills/empty/readme.md', 'no skill file')
    write('src/systems/harbor/skills/no-front/SKILL.md', '# No frontmatter\n')
    write(
      'src/systems/harbor/skills/build-flow/SKILL.md',
      '---\nname: other-name\n---\n',
    )
    write(
      'src/systems/harbor/skills/Bad_Name/SKILL.md',
      '---\nname: Bad_Name\ndescription: Something.\n---\n',
    )
    expect(systemContentProblems(await harbor(), root)).toEqual([
      'src/systems/harbor/context/diagram.png isn’t a Markdown file. context/ holds Markdown documents only.',
      'The skill folder "Bad_Name" in src/systems/harbor/skills can use only lowercase letters, numbers and single hyphens, and can’t start or end with a hyphen.',
      'The "name" in src/systems/harbor/skills/Bad_Name/SKILL.md can use only lowercase letters, numbers and single hyphens, and can’t start or end with a hyphen.',
      'The "name" in src/systems/harbor/skills/build-flow/SKILL.md is "other-name", but the folder is "build-flow". They have to match.',
      'The "description" in src/systems/harbor/skills/build-flow/SKILL.md is missing: say what the skill does and when to use it.',
      'src/systems/harbor/skills/empty/ has no SKILL.md, so no agent will find the skill. Add one, or move the folder out of skills/.',
      'src/systems/harbor/skills/no-front/SKILL.md has to start with frontmatter (a block between --- lines) holding the skill’s name and description.',
      'src/systems/harbor/skills/notes.md is loose in skills/. A skill is a folder with a SKILL.md in it.',
    ])
  })
})

describe('component documentation', () => {
  const gaps = () => {
    for (const name of ['a', 'b', 'c', 'd', 'e', 'f'])
      write(`src/systems/harbor/components/${name}/${name}.vue`, '<template/>')
  }

  test('[CL-106] [SY-113] docs: warn lists the first five gaps in one warning and lets the build go on', async () => {
    gaps()
    const report = systemDocsReport(await harbor({ docs: 'warn' }), root)
    expect(report.fails).toBe(false)
    expect(report.warning).toContain(
      'Harbor has 6 component documentation gaps',
    )
    expect(report.warning).toContain(
      'src/systems/harbor/components/a/a.vue has no examples or page yet',
    )
    expect(report.warning).not.toContain('f/f.vue')
    expect(report.warning).toContain('and 1 more')
  })

  test('[CL-106] [SY-113] docs: strict fails the build; docs: off is silent', async () => {
    gaps()
    expect(systemDocsReport(await harbor({ docs: 'strict' }), root).fails).toBe(
      true,
    )
    expect(systemDocsReport(await harbor({ docs: 'off' }), root)).toEqual({
      warning: null,
      fails: false,
    })
  })

  test('[SY-104] a complete page has no gaps', async () => {
    write(
      'src/systems/harbor/components/button/button.md',
      '---\ntitle: Button\ndescription: Starts an action.\n---\n\n## When to use\n',
    )
    write('src/systems/harbor/components/button/button.vue', '<template/>')
    write(
      'src/systems/harbor/components/button/button.examples.vue',
      '<template><Example name="Default">x</Example></template>',
    )
    expect(systemDocsReport(await harbor({ docs: 'strict' }), root)).toEqual({
      warning: null,
      fails: false,
    })
  })
})

test('[SY-109] no system comes from shadcn, so nothing links components to its docs', async () => {
  write(
    'src/systems/harbor/system.ts',
    `export default ${JSON.stringify(spec({ origin: 'shadcn' }))}\n`,
  )
  const { systems, problems } = await loadSystems(root, { systems: ['harbor'] })
  expect(systems).toEqual([])
  expect(problems.join(' ')).toContain('shadcn systems are not supported')
})
