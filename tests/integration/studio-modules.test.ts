import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { tempStudio, type TempStudio } from './setup/temp-studio'

let studio: TempStudio
beforeEach(() => {
  studio = tempStudio()
})
afterEach(() => {
  studio.remove()
})

// Adds a line after the sample module's label in its declaration.
function declare(id: string, line: string) {
  const declaration = `src/modules/${id}/module.ts`
  studio.write(
    declaration,
    studio
      .read(declaration)
      .replace("label: 'Sample',", `label: 'Sample',\n  ${line}`),
  )
}

describe('the studio command', () => {
  test('[CL-01] with no command it lists the commands', () => {
    const result = studio.studio()
    expect(result.status).toBe(0)
    for (const command of [
      'list',
      'enable',
      'disable',
      'remove',
      'create-module',
    ])
      expect(result.stdout).toContain(command)
  })

  test('[CL-01] an unknown command or option stops with one line', () => {
    const command = studio.studio('frobnicate')
    expect(command.status).toBe(1)
    expect(command.stderr.trim().split('\n')).toHaveLength(1)
    expect(command.stderr).toContain('frobnicate')

    const option = studio.studio('list', '--loud')
    expect(option.status).toBe(1)
    expect(option.stderr.trim()).toBe('Unknown option --loud.')
  })
})

describe('switching modules', () => {
  test('[CL-12] list shows each module, its state and whether it can be turned off', () => {
    studio.addModule('sample')
    studio.addModule('extra')
    studio.addModule('stray')
    studio.write(
      'studio.config.json',
      JSON.stringify({
        ...studio.config(),
        modules: { sample: true, extra: false },
      }),
    )
    const result = studio.studio('list')
    expect(result.status).toBe(0)
    expect(result.stdout).toMatch(/sample\s+on\s+can be turned off/)
    expect(result.stdout).toMatch(/extra\s+off\s+can be turned off/)
    expect(result.stdout).toMatch(/stray\s+unregistered/)
    expect(result.stdout).toContain('A sample module for the tests.')
    expect(result.stdout).toMatch(/Systems\s+endless-studios\s+default/)
  })

  test('[CL-21] [CL-38] enable and disable switch a module right away and keep its files', () => {
    studio.addModule('sample')
    const off = studio.studio('disable', 'sample')
    expect(off.status).toBe(0)
    expect(studio.config().modules.sample).toBe(false)
    expect(studio.exists('src/modules/sample/module.ts')).toBe(true)
    expect(off.stdout).toMatch(/Restart the dev server/)

    const on = studio.studio('enable', 'sample')
    expect(on.status).toBe(0)
    expect(studio.config().modules.sample).toBe(true)
    expect(on.stdout).toMatch(/Restart the dev server/)
  })

  test('[CL-21] a required module refuses to turn off', () => {
    studio.addModule('sample')
    declare('sample', 'required: true,')
    const before = studio.read('studio.config.json')
    const result = studio.studio('disable', 'sample')
    expect(result.status).toBe(1)
    expect(result.stderr).toMatch(/Sample is required/)
    expect(studio.read('studio.config.json')).toBe(before)
    expect(studio.studio('list').stdout).toMatch(/sample\s+on\s+required/)
  })

  test('[CL-21] an unknown module is refused with the installed ones', () => {
    studio.addModule('sample')
    const result = studio.studio('enable', 'nope')
    expect(result.status).toBe(1)
    expect(result.stderr.trim()).toBe(
      'No module has the id "nope". Installed: sample.',
    )
  })
})

describe('removing a module', () => {
  function withContent() {
    studio.addModule('sample')
    declare('sample', "content: 'src/sample-pages',")
    studio.write('src/sample-pages/one.md', '# One\n')
    studio.studio('enable', 'sample')
  }

  test('[CL-02] [CL-22] remove previews and changes nothing without --yes', () => {
    withContent()
    const before = studio.read('studio.config.json')
    const result = studio.studio('remove', 'sample')
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('src/modules/sample/')
    expect(result.stdout).toContain('Its content in src/sample-pages/ stays')
    expect(result.stdout).toMatch(/npm packages it used stay installed/)
    expect(result.stdout).toMatch(/Nothing was changed/)
    expect(studio.exists('src/modules/sample/module.ts')).toBe(true)
    expect(studio.read('studio.config.json')).toBe(before)
  })

  test('[CL-22] [CL-38] remove --yes deletes the folder and keeps its content', () => {
    withContent()
    const result = studio.studio('remove', 'sample', '--yes')
    expect(result.status).toBe(0)
    expect(studio.exists('src/modules/sample')).toBe(false)
    expect(studio.exists('src/sample-pages/one.md')).toBe(true)
    expect(studio.config().modules).not.toHaveProperty('sample')
    expect(result.stdout).toMatch(/Restart the dev server/)
  })

  test('[CL-22] remove --content --yes deletes its content too', () => {
    withContent()
    const result = studio.studio('remove', 'sample', '--content', '--yes')
    expect(result.status).toBe(0)
    expect(studio.exists('src/sample-pages')).toBe(false)
  })

  test('[CL-22] remove refuses while other files import the module, unless --force', () => {
    studio.addModule('sample')
    studio.write(
      'app/composables/useSampleThing.ts',
      "export { default } from '../../src/modules/sample/module.ts'\n",
    )
    const refused = studio.studio('remove', 'sample', '--yes')
    expect(refused.status).toBe(1)
    expect(refused.stderr).toContain('app/composables/useSampleThing.ts')
    expect(studio.exists('src/modules/sample')).toBe(true)
    const forced = studio.studio('remove', 'sample', '--force', '--yes')
    expect(forced.status).toBe(0)
    expect(studio.exists('src/modules/sample')).toBe(false)
  })

  test('[CL-22] remove refuses required modules and Contributors', () => {
    studio.addModule('sample')
    declare('sample', 'required: true,')
    const required = studio.studio('remove', 'sample', '--yes')
    expect(required.status).toBe(1)
    expect(required.stderr).toMatch(/Sample is required/)

    studio.addModule('contributors')
    const contributors = studio.studio('remove', 'contributors', '--yes')
    expect(contributors.status).toBe(1)
    expect(contributors.stderr).toMatch(/always in team use/)
    expect(studio.exists('src/modules/contributors')).toBe(true)
  })
})

describe('creating a module', () => {
  test('[CL-02] [CL-30] create-module previews and writes nothing without --yes', () => {
    const before = studio.read('studio.config.json')
    const result = studio.studio('create-module', 'notes')
    expect(result.status).toBe(0)
    for (const file of [
      'src/modules/notes/module.ts',
      'src/modules/notes/pages/index.vue',
      'src/modules/notes/README.md',
      'src/modules/notes/skills/use-notes/SKILL.md',
    ])
      expect(result.stdout).toContain(`Create ${file}`)
    expect(result.stdout).toMatch(/Nothing was changed/)
    expect(studio.exists('src/modules/notes')).toBe(false)
    expect(studio.read('studio.config.json')).toBe(before)
  })

  test('[CL-30] [CL-38] create-module --yes makes a module that is on, with a page, a rail button, a README and a skill', () => {
    const result = studio.studio(
      'create-module',
      'field-notes',
      '--label',
      "Field Notes' Log",
      '--yes',
    )
    expect(result.status).toBe(0)
    expect(result.stdout).toMatch(/Restart the dev server/)
    expect(studio.config().modules['field-notes']).toBe(true)
    expect(studio.read('src/modules/field-notes/pages/index.vue')).toContain(
      '<UDashboardPanel',
    )
    expect(
      studio.read('src/modules/field-notes/skills/use-field-notes/SKILL.md'),
    ).toContain('name: use-field-notes')
    expect(studio.read('src/modules/field-notes/README.md')).toContain(
      "# Field Notes' Log",
    )
    const list = studio.studio('list')
    expect(list.status).toBe(0)
    expect(list.stdout).toMatch(/field-notes\s+on\s+can be turned off/)
  })

  test('[CL-30] [CL-32] create-module refuses taken ids, bad ids and labels that are not plain text', () => {
    studio.addModule('sample')
    studio.write('src/prototypes/somebody/.keep', '')
    expect(studio.studio('create-module', 'sample').stderr).toMatch(
      /already a module called "sample"/,
    )
    expect(studio.studio('create-module', 'ben').stderr).toMatch(
      /contributor's key/,
    )
    expect(studio.studio('create-module', 'somebody').stderr).toMatch(
      /prototype folder/,
    )
    expect(studio.studio('create-module', 'index').stderr).toMatch(
      /already the address of another page/,
    )
    expect(studio.studio('create-module', 'Bad_Id').status).toBe(1)
    const label = studio.studio('create-module', 'ok', '--label', '<b>Bold</b>')
    expect(label.status).toBe(1)
    expect(label.stderr.trim()).toBe('The label should be plain text.')
    expect(studio.exists('src/modules/ok')).toBe(false)
  })
})

describe('dropped module features', () => {
  test('[CL-34] [CL-35] there is no add command for module packs', () => {
    expect(studio.studio('add', 'https://example.test/pack.git').status).toBe(1)
    expect(studio.studio('add', 'x', '--allow-license').status).toBe(1)
  })

  test('[CL-155] there is no update command for upstream releases', () => {
    expect(studio.studio().stdout).not.toMatch(/^ {2}update\b/m)
    for (const args of [
      ['update'],
      ['update', '--dry-run'],
      ['update', '--continue'],
    ]) {
      const result = studio.studio(...args)
      expect(result.status).toBe(1)
      expect(result.stderr.trim()).toBe(
        'There\'s no command "update". Run yarn studio to list them.',
      )
    }
  })

  test('[CL-31] create-module has no --out pack option', () => {
    const result = studio.studio('create-module', 'packed', '--out', 'x')
    expect(result.stderr.trim()).toBe('Unknown option --out.')
  })

  test('[CL-33] new modules record no minimum platform version', () => {
    expect(studio.studio('create-module', 'fresh', '--yes').status).toBe(0)
    expect(studio.read('src/modules/fresh/module.ts')).not.toMatch(
      /requires|version/,
    )
  })

  test.each([
    ["section: { key: 'sample' },", 'section'],
    ['standalone: true,', 'standalone'],
    ["requires: '0.1.0',", 'requires'],
  ])(
    '[CL-36] [SH-13] [SH-21] [PR-72] [CL-33] modules live in one folder and may not declare %s',
    (line, field) => {
      expect(studio.exists('src/platform')).toBe(false)
      studio.addModule('sample')
      declare('sample', line)
      const result = studio.studio('list')
      expect(result.status).toBe(1)
      expect(result.stderr).toContain(`modules don't declare "${field}"`)
    },
  )
})
