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
  systemDocuments,
} from '../../tooling/systems/catalog'
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
    const catalog = systemCatalog(await harbor(), root)
    expect(catalog.tokens).toEqual([
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

  test('[SY-38] [SY-65] lists documented components by title, and local assets by kind', async () => {
    write(
      'src/systems/harbor/components/button/button.md',
      '---\ntitle: Button\ndescription: Starts an action.\n---\n\n## When to use\n',
    )
    write('src/systems/harbor/components/button/Button.vue', '<template/>')
    write(
      'src/systems/harbor/components/card/card.md',
      '---\ndescription: No title.\n---\n',
    )
    write('src/systems/harbor/assets/icons/anchor.svg', '<svg/>')
    write('src/systems/harbor/assets/logo.png', 'png')
    write('src/systems/harbor/assets/fonts/Harbor.woff2', 'font')
    write('src/systems/harbor/assets/notes.txt', 'not an asset')
    const catalog = systemCatalog(await harbor(), root)
    expect(catalog.components).toEqual([
      {
        slug: 'button',
        title: 'Button',
        files: [
          'src/systems/harbor/components/button/button.md',
          'src/systems/harbor/components/button/Button.vue',
        ],
      },
      {
        slug: 'card',
        title: 'Card',
        files: ['src/systems/harbor/components/card/card.md'],
      },
    ])
    expect(catalog.assets).toEqual([
      { path: 'fonts/Harbor.woff2', kind: 'fonts' },
      { path: 'icons/anchor.svg', kind: 'icons' },
      { path: 'logo.png', kind: 'images' },
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
