import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const read = (file: string) => fs.readFileSync(file, 'utf8')
const STALE =
  /shadcn|ownership tiers|upstream updates|React view|pnpm |src\/platform\/modules|newer Design Studio release|starter/i

// A shared context document: titled frontmatter, nothing left from the React
// studio, and every term the row promises.
function context(name: string, ...terms: string[]) {
  const text = read(`src/platform/context/${name}.md`)
  expect(text).toMatch(/^---\r?\ntitle:/)
  expect(text).not.toMatch(STALE)
  for (const term of terms) expect(text, `${name}: ${term}`).toContain(term)
}

// A platform skill: named after its folder, and every step the row promises.
function skill(name: string, ...terms: string[]) {
  const text = read(`src/platform/skills/${name}/SKILL.md`)
  expect(text).toContain(`name: ${name}`)
  expect(text).not.toMatch(STALE)
  for (const term of terms) expect(text, `${name}: ${term}`).toContain(term)
  return text
}

describe('platform skills', () => {
  test('[CL-73] configure-studio inspects status, registers, previews and applies, hands off, verifies and leaves the app running', () => {
    skill(
      'configure-studio',
      'yarn studio status',
      '[setup-contributor](../setup-contributor/SKILL.md) in registration-only mode',
      'Preview the requested settings, then apply with --yes',
      'recovery mode',
      'setup-design-system',
      '[maintain-context](../maintain-context/SKILL.md)',
      'an affected prototype',
      'leaving the app available',
    )
  })

  test('[CL-74] setup-contributor registers, verifies, updates a profile, links emails and uses --as', () => {
    skill(
      'setup-contributor',
      'Preview `yarn studio join`',
      'rerun with --yes',
      'Verify with whoami',
      '`yarn studio profile`',
      '--link',
      '--as',
      'registration-only mode',
    )
  })

  test('[CL-75] [CL-135] manage-modules previews, keeps required modules, trusts installed code, removes a removed module’s tests, never edits generated files, and restarts', () => {
    const text = skill(
      'manage-modules',
      'create-module, enable, disable or remove',
      'Preview before --yes',
      'Required modules remain installed and enabled',
      'trusted executable code',
      // Tests live in tests/, not in the module, so they don't go with it.
      'also remove its tests',
      'grep -rl "src/modules/<id>" tests',
      'creation, rename, archive, restore or deletion',
      'rather than generated adapters or lockfiles',
      'restart the recorded dev server',
    )
    // Packs and their licence check are gone (CL-34, CL-35).
    expect(text).not.toMatch(/--allow-license|studio add/)
  })

  test('[CL-76] maintain-context picks the owner, writes context and skills, updates READMEs, syncs and checks triggers', () => {
    skill(
      'maintain-context',
      'Choose platform, module or system as the canonical owner',
      'skills/<name>/SKILL.md',
      "Update the owner's README",
      'Run yarn studio sync and sync --check',
      'Walk through intended triggers',
    )
  })

  test('[CL-77] maintain-documentation revises READMEs, coordinates the Manual and audits guidance by subtraction', () => {
    skill(
      'maintain-documentation',
      'owner READMEs',
      'write-manual',
      'vocabulary, links and task routing',
      'Remove stale duplication',
    )
  })

  test('[CL-78] check-design-system audits a surface with source checks, studio checks and rendered evidence, reporting before fixing', () => {
    skill(
      'check-design-system',
      'Studio UI, prototype or system preview',
      'Inspect source and capture rendered evidence',
      'states and viewport sizes',
      '`yarn check`',
      'stable IDs',
      'Report findings for human review before applying fixes',
    )
  })
})

describe('shared context documents', () => {
  test('[CL-80] agent-context: guidance owners, skill exposure, system resolution and validation boundaries', () => {
    context(
      'agent-context',
      'src/platform/skills, src/modules/<id>/skills and src/systems/<id>/skills',
      '.agents/skills',
      '.claude/skills',
      'Resolve the system with studio context',
      'Skill discovery grants no permission',
      '`sync --check` writes nothing',
    )
  })

  test('[CL-81] assets: where fonts, icons, images and logos live, and the asset size guard', () => {
    context(
      'assets',
      'fonts, icons, images and logos in their assigned system',
      'prototype-only assets stay with the prototype',
      '750 KB',
      '.studio/asset-allowlist.json',
    )
  })

  test('[CL-82] build-assets: named, lazily computed and cached module data with declared watches', () => {
    context(
      'build-assets',
      'named JSON loaders in module.ts data',
      'computes a value on demand',
      'caches it until a watched file changes',
      'include every source dependency in watch',
    )
  })

  test('[CL-83] checks: where checks run (hooks, build, tests, CI) and how to respond', () => {
    context(
      'checks',
      'Pre-commit',
      'Pre-push',
      'CI runs the full suite and production build',
      'yarn studio sync --check',
      'diagnose failures instead of suppressing them',
      'tooling/checks/README.md owns their implementations and remedies',
    )
  })

  test('[CL-84] config: configuration fields, roles, profiles and the recovery path', () => {
    context(
      'config',
      'defaultSystem, admins and systemMaintainers',
      'Admins manage shared settings; maintainers manage their assigned systems',
      'Contributor profiles live in contributors/',
      'Admin recovery',
    )
    // The recovery path it points to exists.
    expect(read('src/modules/contributors/README.md')).toContain('--recovery')
  })

  test('[CL-85] contracts-and-instructions: who owns which context and skills', () => {
    context(
      'contracts-and-instructions',
      'Platform context and cross-module skills live in src/platform/',
      'src/modules/<id>/',
      'System guidance lives in src/systems/<id>/',
      'put repeatable task decisions in skills',
    )
  })

  test('[CL-86] contributor-preferences: module-owned preference schemas and the initialisation transaction', () => {
    context(
      'contributor-preferences',
      'preferences.defaults',
      'yarn studio preferences --plan <file>',
      '--apply <file>',
    )
  })

  test('[CL-87] contributor-scope: authority table, before-side review and identity rules', () => {
    context(
      'contributor-scope',
      '| Admin ',
      '| System maintainer ',
      'Review the before-side owner',
      'yarn studio whoami',
      'Use --as only for your own registered profile',
    )
  })

  test('[CL-88] diagrams: Mermaid authoring and colours', () => {
    context(
      'diagrams',
      'Mermaid fence',
      'accTitle and accDescr',
      "legible in the studio's light colours",
      "use the shared renderer's theme",
    )
  })

  test('[CL-89] documentation-standards: where and how to write platform documentation', () => {
    context(
      'documentation-standards',
      'canonical owner',
      'title and description frontmatter',
      'name and description frontmatter',
      'Write the Manual as a human reference',
    )
  })

  test('[CL-90] file-types: what artifacts and file types are, and how modules declare them', () => {
    context(
      'file-types',
      'A prototype contains artifacts supplied by enabled modules',
      'Views are .vue single-file components',
      'ModuleFileType',
    )
  })

  test('[CL-91] formats: format versions of stored files and explicit migration', () => {
    context(
      'formats',
      'explicit version fields',
      'A format change needs a deliberate migration',
      'does not silently migrate files',
    )
  })

  test('[CL-93] modules: declaration, pages, library, skills and removal', () => {
    context(
      'modules',
      'All modules live in src/modules/<id>/',
      'module.ts declares label, pages',
      'imported as @module/<id>',
      'Skills use module-relative paths and when triggers',
      'Removal keeps content unless explicitly requested',
    )
  })

  test('[CL-95] personas and principles are rewritten for the Endless team', () => {
    context(
      'personas',
      '## Endless designers',
      '## Endless Studios team',
      '## Agents',
    )
    context(
      'principles',
      '## Give people ownership',
      '## Let the human direct and the agent execute',
      '[Personas](personas.md)',
    )
  })

  test('[CL-96] publishing: how to build and host the static site, with no hosting prescribed', () => {
    context(
      'publishing',
      'yarn build generates .output/public',
      'STUDIO_BASE_PATH',
      'STUDIO_PUBLIC_URL',
      'yarn preview',
      'No hosting provider or deployment workflow is prescribed',
    )
  })

  test('[CL-98] resource-identity: permanent IDs, adapters and authority', () => {
    context(
      'resource-identity',
      'Resource IDs are permanent',
      'yarn studio identify',
      'yarn studio identity-audit',
      '@studio-id',
      '@studio-state',
      'Builds validate rather than assign',
    )
  })

  test('[CL-99] source: Edit source, Open in editor, the reveal action and Copy link/path', () => {
    context(
      'source',
      'Edit source',
      'Open in editor',
      'Show in Explorer on Windows, Reveal in Finder on macOS and Show in folder on Linux',
      'Copy link',
      'Copy path',
    )
  })

  test('[CL-100] stack: the Nuxt, Vue and Nuxt UI stack reference', () => {
    context(
      'stack',
      'Nuxt 4',
      'Vue 3',
      'Nuxt UI 4',
      'yarn 4',
      'Vitest',
      'Excalidraw is the one lazy-loaded React island',
    )
  })

  test('[CL-101] system-services: reading systems and the preview and theme boundaries', () => {
    context(
      'system-services',
      'tooling/systems/registry.ts',
      'Never hardcode a system key',
      'same-origin preview document',
      'The system owns its theme',
    )
  })

  test('[CL-102] working-in-studio: preserve work, select context, verify changes', () => {
    context(
      'working-in-studio',
      'Preserve existing work',
      'yarn studio context',
      "read its assigned system's AGENTS.md",
      'Run applicable tests and the production build',
      'Save verbose output to a temporary log',
    )
  })

  test('[SY-145] ui-copy: the writing rules for interface copy', () => {
    context('ui-copy', 'Saving', 'i18n/locales/en.json')
  })

  test('[CL-92] installing.md, the install-from-a-release guide, is absent', () => {
    expect(fs.existsSync('src/platform/context/installing.md')).toBe(false)
  })

  test('[CL-94] ownership.md, the upstream ownership tiers, is absent', () => {
    expect(fs.existsSync('src/platform/context/ownership.md')).toBe(false)
  })

  test('[CL-97] releasing.md, the release guide, is absent', () => {
    expect(fs.existsSync('src/platform/context/releasing.md')).toBe(false)
  })
})

describe('root guidance', () => {
  test('[CL-70] [CL-71] [CL-72] root guidance routes to one shared source and preserves team conventions', () => {
    const text = read('AGENTS.md')
    expect(read('CLAUDE.md').trim()).toBe('@AGENTS.md')
    expect(text).toContain('working-in-studio.md')
    expect(text).toContain('src/platform/README.md')
    for (const name of [
      'configure-studio',
      'setup-contributor',
      'manage-modules',
      'maintain-context',
      'maintain-documentation',
      'check-design-system',
    ])
      expect(text).toContain(`src/platform/skills/${name}/SKILL.md`)
    expect(text).toContain('`yarn studio whoami`')
    expect(text).toContain('`yarn studio context`')
    expect(text).toContain('Save verbose check output to a log')
    expect(text).toContain('docs/agents/issue-tracker.md')
    expect(text).toContain('docs/agents/triage-labels.md')
    expect(text).toContain('docs/agents/domain.md')
    expect(fs.existsSync('AGENTS.team.md')).toBe(false)
  })

  test('[CL-71] shared guidance links resolve to canonical local files', () => {
    for (const folder of ['src/platform/context', 'src/platform/skills']) {
      for (const entry of fs.readdirSync(folder, { recursive: true })) {
        const file = path.join(folder, String(entry))
        if (!file.endsWith('.md')) continue
        for (const match of read(file).matchAll(/\]\(([^)]+)\)/g)) {
          expect(
            fs.existsSync(path.resolve(path.dirname(file), match[1]!)),
            `${file}: ${match[1]}`,
          ).toBe(true)
        }
      }
    }
  })
})
