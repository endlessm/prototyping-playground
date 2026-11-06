// The Endless Studios system as the studio and its agents read it from its
// folder: the declaration and what the Systems area shows of it, its agent
// guidance, and the copied app source with its recorded revision,
// adaptations and stand-ins.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, test } from 'vitest'
import { standInNames } from '../../tooling/preview/stand-ins'
import {
  systemCatalog,
  type SystemCatalog,
} from '../../tooling/systems/catalog'
import {
  loadSystems,
  type InstalledSystem,
} from '../../tooling/systems/registry'

const ROOT = path.resolve(import.meta.dirname, '../..')
const DIR = path.join(ROOT, 'src/systems/endless-studios')
const read = (file: string) => readFileSync(path.join(DIR, file), 'utf8')
const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(path.join(dir, entry.name))
      : [path.join(dir, entry.name)],
  )

let system: InstalledSystem
let catalog: SystemCatalog

beforeAll(async () => {
  const config = JSON.parse(
    readFileSync(path.join(ROOT, 'studio.config.json'), 'utf8'),
  )
  const registry = await loadSystems(ROOT, config)
  expect(registry.problems).toEqual([])
  system = registry.systems.find(({ key }) => key === 'endless-studios')!
  catalog = systemCatalog(system, ROOT)
})

describe('the declaration', () => {
  test('[SY-159] Endless Studios is a registered prototype system, light only, with docs warnings and its permanent id', () => {
    expect(system).toBeDefined()
    expect(system.spec).toMatchObject({
      label: 'Endless Studios',
      status: 'active',
      role: 'prototype',
      colorModes: ['light'],
      docs: 'warn',
    })
    expect(system.id).toBe('8x5spen6xtvp96a9')
    expect(catalog.colorModes).toEqual(['light'])
  })

  test('[SY-160] the Overview summary', () => {
    expect(catalog.summary).toBe(
      'The Endless Studios frontend in Vue: Nuxt UI with the app’s own theme and components, for screens that look like the real platform.',
    )
  })

  test('[SY-161] the libraries are Vue, Nuxt UI with its component pages, and Lucide icons, each with a version and docs', () => {
    const libraries = catalog.libraries.map(
      ({ id, label, components, assets, version, docs, description }) => ({
        id,
        label,
        components,
        assets,
        version: Boolean(version),
        docs: Boolean(docs),
        description,
      }),
    )
    expect(libraries).toMatchObject([
      { id: 'vue', label: 'Vue', components: [], version: true, docs: true },
      {
        id: 'nuxt-ui',
        label: 'Nuxt UI',
        components: [
          'button',
          'card',
          'badge',
          'alert',
          'container',
          'navigation-menu',
          'breadcrumb',
          'carousel',
          'input',
          'select',
          'textarea',
          'switch',
          'radio-group',
          'form-field',
          'form',
          'file-upload',
          'select-menu',
          'input-menu',
          'modal',
          'tooltip',
          'dropdown-menu',
          'popover',
          'slideover',
          'table',
          'pagination',
          'separator',
          'avatar',
          'progress',
          'chip',
          'tabs',
          'link',
          'calendar',
          'editor',
          'editor-toolbar',
          'editor-mention-menu',
        ],
        version: true,
        docs: true,
      },
      {
        id: 'lucide',
        label: 'Lucide',
        assets: ['icons'],
        version: true,
        docs: true,
      },
    ])
    expect(libraries[2]!.description).toMatch(/i-lucide-\*/)
    // The React studio's wording ("mounted in a shadow root by VueScreen") is gone.
    expect(JSON.stringify(libraries)).not.toMatch(/VueScreen|shadow root/)
  })

  test('[SY-169] the app’s Nuxt UI customisation: colour roles, button, alert, card, badge, breadcrumb, carousel, container and navigation-menu tweaks', async () => {
    type Variants = { variant: Record<string, unknown> }
    const ui = (
      await import('../../src/systems/endless-studios/nuxt-ui.config')
    ).default as {
      colors: Record<string, string>
      button: { variants: Variants; compoundVariants: unknown[] }
      alert: { slots: { root: string } }
      card: { slots: { root: string }; variants: Variants }
    }
    expect(ui.colors).toEqual({
      primary: 'orange',
      secondary: 'cornflower',
      kids: 'teal',
      info: 'sky',
      warning: 'amber',
      success: 'lime',
      error: 'red',
    })
    expect(Object.keys(ui.button.variants.variant)).toEqual([
      'contrast',
      'gating',
    ])
    expect(ui.button.compoundVariants.length).toBeGreaterThan(0)
    expect(ui.alert.slots.root).toBe('rounded-xl')
    expect(ui.card.slots.root).toBe('rounded-2xl')
    expect(Object.keys(ui.card.variants.variant)).toEqual(
      expect.arrayContaining(['flat', 'outline', 'soft', 'ghost', 'bordered']),
    )
    for (const key of [
      'badge',
      'breadcrumb',
      'carousel',
      'container',
      'navigationMenu',
    ])
      expect(ui, key).toHaveProperty(key)
    expect(system.spec.app.nuxtUi).toMatchObject({
      config: 'nuxt-ui.config.ts',
      colors: expect.arrayContaining(Object.keys(ui.colors)),
    })
    // The studio's own interface keeps Nuxt UI's neutral defaults.
    const studio = readFileSync(path.join(ROOT, 'app/app.config.ts'), 'utf8')
    expect(studio).not.toMatch(/orange|cornflower|gating/)
  })
})

describe('context, skills and agent guidance', () => {
  test('[SY-162] the Context documents, and the User types context: eight types with their fields, the shared jobs, the overlap matrix, evidence and safeguarding', () => {
    expect(catalog.context.map(({ path, title }) => ({ path, title }))).toEqual(
      [
        { path: 'app-conventions.md', title: 'App Conventions' },
        { path: 'design-principles.md', title: 'Design Principles' },
        { path: 'personas.md', title: 'Personas' },
        { path: 'platform-model.md', title: 'Platform Model' },
        { path: 'programs.md', title: 'Programs' },
        { path: 'skills-and-recognition.md', title: 'Skills and Recognition' },
        { path: 'user-types.md', title: 'User Types' },
        { path: 'voice-and-tone.md', title: 'Voice and Tone' },
      ],
    )
    const text = read('context/user-types.md')
    expect(text).toMatch(/^toc: true$/m)
    expect(text).toMatch(/Version 1\.1 .* Owner: Bernardo/)
    const part1 = text.slice(
      text.indexOf('## Part 1'),
      text.indexOf('## Part 2'),
    )
    const types = part1.split(/^### /m).slice(1)
    expect(types).toHaveLength(8)
    for (const type of types)
      for (const field of [
        'Why they show up',
        'Needs',
        'Pain points',
        'Motivations',
        'Jobs to be done',
        'Shared jobs this type has',
      ])
        expect(type, type.split('\n')[0]).toContain(`#### ${field}`)
    expect(text).toContain('### Safeguarding')
    expect(text).toContain('## Part 3 · Where the jobs overlap')
    const part4 = text.slice(
      text.indexOf('## Part 4'),
      text.indexOf('## Sources'),
    )
    expect(part4.split(/^### /m).slice(1)).toHaveLength(13)
    expect(text).toContain('### Confidence levels')
    expect(text).toContain('### How to read the tags')
  })

  test('[SY-163] agents read User types for user-specific work, Safeguarding for under-18 learners, and label Team or Desk evidence as assumptions', () => {
    const agents = read('AGENTS.md')
    expect(agents).toContain('[User types](context/user-types.md)')
    expect(agents).toMatch(/type's section in Part 1 and the overlap matrix/)
    expect(agents).toMatch(/under 18[^.]*Safeguarding/)
    expect(agents).toMatch(/Team or Desk alone[^.]*assumptions/)
  })

  test('[SY-164] the Skills section lists Write sample data with its references, and agents reach it from AGENTS.md', () => {
    expect(
      catalog.skills.map(({ name, file, files }) => ({ name, file, files })),
    ).toEqual([
      {
        name: 'write-sample-data',
        file: 'src/systems/endless-studios/skills/write-sample-data/SKILL.md',
        files: [
          'SKILL.md',
          'references/data-shapes.md',
          'references/demo-cast.md',
          'references/state-enums.md',
          'references/users-by-role.md',
        ],
      },
    ])
    expect(read('AGENTS.md')).toContain(
      '[Write sample data](skills/write-sample-data/SKILL.md)',
    )
  })

  test('[SY-187] the guidance and context describe Vue views, never React ones', () => {
    for (const file of [
      'AGENTS.md',
      'README.md',
      'studios/README.md',
      ...readdirSync(path.join(DIR, 'context')).map(
        (name) => `context/${name}`,
      ),
    ]) {
      if (
        statSync(path.join(DIR, file)).isDirectory() ||
        file.endsWith('.gitkeep')
      )
        continue
      expect(read(file), file).not.toMatch(
        /VueScreen|\.tsx\b|VueInline|shadow root/,
      )
    }
    expect(read('AGENTS.md')).toMatch(/A prototype view is a `\.vue` file/)
  })
})

describe('the copied app source', () => {
  const studios = path.join(DIR, 'studios')

  test('[SY-190] the app’s components and types are copied in the app’s folder layout', () => {
    for (const file of [
      'components/App/AppPage.vue',
      'components/App/AppSimplePage.vue',
      'components/App/StudioSidebar.vue',
      'components/App/StudioTopBar.vue',
      'components/App/StudioFooter.vue',
      'components/Dashboard/Hero.vue',
      'components/Dashboard/OnboardingCard.vue',
      'components/Dashboard/ProgramTileEmpty.vue',
      'components/Dashboard/UpcomingEvents.vue',
      'components/Generic/UserAvatar.vue',
      'components/Generic/UserCard.vue',
      'components/Generic/ZeroState.vue',
      'components/Notifications/index.vue',
      'components/Notifications/List.vue',
      'components/Notifications/NotificationTile.vue',
      'components/Notifications/NotificationTypeIcon.vue',
      'components/Profile/UserBadges.vue',
      'components/Profile/UserProfile.vue',
      'components/Profile/UserProfileCard.vue',
      'components/Program/ProgramTile.vue',
      'components/shared/AccessCode.vue',
      'types/program.ts',
    ])
      expect(statSync(path.join(studios, file)).isFile(), file).toBe(true)
    expect(system.spec.app.source).toBe('studios')
  })

  test('[SY-191] the app’s images are copied, except the two over the 750 KB asset limit', () => {
    const images = files(path.join(studios, 'assets/images'))
    // 163 at the recorded revision, less the two too large to copy.
    expect(images).toHaveLength(161)
    for (const image of images)
      expect(statSync(image).size, image).toBeLessThanOrEqual(750 * 1024)
    const names = images.map((image) => path.basename(image))
    expect(names).not.toContain('bg-threadbare.png')
    expect(names).not.toContain('banner-img.png')
    expect(read('studios/README.md')).toMatch(
      /except `bg-threadbare\.png`[\s\S]*?`banner-img\.png`[\s\S]*?750 KB/,
    )
  })

  test('[SY-192] the stylesheets keep their documented adaptations', () => {
    const main = read('studios/assets/css/main.css')
    // Scans only the system's own sources; the preview build adds the prototypes.
    expect(main).toMatch(/@import 'tailwindcss' source\(none\);/)
    expect(main).toContain("@source '../../components';")
    expect(main).toContain("@source '../../../runtime';")
    expect(main).not.toContain('floating-vue')
    expect(main).toContain("'Inter Variable', Inter,")
    expect(main).toContain("'Figtree Variable', 'Figtree'")
    // The preview document is the screen's own page, so base.css is the app's.
    expect(read('studios/assets/css/base.css')).toMatch(/^html \{/m)
    const readme = read('studios/README.md')
    expect(readme).toMatch(/`assets\/css\/main\.css`[^.]*floating-vue/)
    expect(readme).toMatch(/`base\.css` and `modals\.css` are unchanged/)
  })

  test('[SY-193] the README records the copied revision and lists every stand-in beside the app API it replaces', () => {
    const readme = read('studios/README.md')
    expect(readme).toMatch(
      /`Endless-Game-Making-Studio\/studio` at `11517cbee`/,
    )
    const { app } = system.spec
    const names = standInNames(path.join(DIR, app.standIns!.from))
    expect(names.length).toBeGreaterThan(0)
    const table = readme.slice(readme.indexOf('| App API |'))
    for (const name of names) expect(table, name).toContain(`\`${name}\``)
    for (const [specifier, target] of Object.entries(app.aliases ?? {})) {
      const name = path.basename(specifier).replace(/\.(js|ts)$/, '')
      expect(table, specifier).toContain(name)
      expect(table, target).toContain(target)
    }
  })

  test('[SY-194] the refresh procedure: copy unchanged with gh api, record the revision, add stand-ins in one place', () => {
    for (const file of ['AGENTS.md', 'studios/README.md']) {
      const text = read(file)
      expect(text, file).toContain('Endless-Game-Making-Studio/studio')
      expect(text, file).toContain('gh api')
      expect(text, file).toMatch(/nuxt-shims\.ts/)
    }
    // No hand-kept list of auto-imports or template images remains.
    expect(system.spec.app.standIns).toEqual({ from: 'studios/nuxt-shims.ts' })
    expect(read('AGENTS.md')).not.toMatch(/templateAssets|vue-runtime\.config/)
  })
})
