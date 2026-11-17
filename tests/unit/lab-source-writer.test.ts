// Saving a Breakdown: each unsaved change is written into the tag of its
// piece in the experiment's file, as plain theme classes. A theme slot's
// classes go to that key of the tag's `ui` (an object written into the tag,
// merged into one already there, or spread over a bound expression); a
// change to the piece's root slot replaces a class of its family in the
// tag's static `class`, which would otherwise win over `ui`. A new class
// replaces the one of the same knob family and leaves prefixed classes
// alone. Changes to pieces the file doesn't hold are left unsaved. Fixture
// sources read with the real Endless Studios system.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, test } from 'vitest'
import {
  writeBreakdownChanges,
  type SourceChange,
} from '../../src/modules/lab/experiments/writer'
import { fileTags, nuxtUiCatalog } from '../../tooling/systems/breakdown'
import {
  loadSystems,
  type InstalledSystem,
} from '../../tooling/systems/registry'

const ROOT = path.resolve(import.meta.dirname, '../..')
const FILE = path.join(ROOT, 'src/prototypes/ben/button-experiments/View.vue')
const theme = { colors: ['primary', 'secondary', 'neutral'], textSizes: [] }
let endless: InstalledSystem

beforeAll(async () => {
  const config = JSON.parse(
    readFileSync(path.join(ROOT, 'studio.config.json'), 'utf8'),
  )
  const { systems } = await loadSystems(ROOT, config)
  endless = systems.find(({ key }) => key === 'endless-studios')!
})

function write(template: string, changes: SourceChange[], script = '') {
  const source = `${script}<template>\n${template}\n</template>\n`
  const found = fileTags(source, FILE, {
    system: endless,
    nuxtUi: nuxtUiCatalog(endless, ROOT),
    follow: () => false,
  })
  if (!found.tags) throw new Error(found.problem)
  const result = writeBreakdownChanges(source, changes, {
    tags: found.tags,
    theme,
  })
  return {
    ...result,
    template: result.source
      .slice(script.length + '<template>\n'.length)
      .replace(/\n<\/template>\n$/, ''),
  }
}
const change = (
  node: string,
  slot: string,
  family: SourceChange['family'],
  className: string,
): SourceChange => ({ node, slot, family, className })
const corners = (className: string, node = 'root>UButton', slot = 'base') =>
  change(node, slot, 'corners', className)

describe('a tag without ui', () => {
  test('gets a ui object with the slot’s classes, after its name', () => {
    expect(
      write('  <UButton>Invite</UButton>', [corners('rounded-xl')]).template,
    ).toBe(`  <UButton :ui="{ base: 'rounded-xl' }">Invite</UButton>`)
  })

  test('self-closing stays self-closing; several slots share one object', () => {
    expect(
      write('  <UButton label="Invite" />', [
        corners('rounded-xl'),
        change('root>UButton', 'label', 'weight', 'font-bold'),
        change('root>UButton', 'base', 'paddingX', 'px-4'),
      ]).template,
    ).toBe(
      `  <UButton :ui="{ base: 'rounded-xl px-4', label: 'font-bold' }" label="Invite" />`,
    )
  })
})

describe('a static ui object', () => {
  test('replaces the class of the knob’s family and keeps prefixed ones', () => {
    expect(
      write(
        `  <UButton :ui="{ base: 'rounded-md px-2 hover:rounded-lg md:rounded-none', label: 'text-sm text-muted' }">Go</UButton>`,
        [
          corners('rounded-xl'),
          change('root>UButton', 'label', 'textColor', 'text-primary'),
        ],
      ).template,
    ).toBe(
      `  <UButton :ui="{ base: 'px-2 hover:rounded-lg md:rounded-none rounded-xl', label: 'text-sm text-primary' }">Go</UButton>`,
    )
  })

  test('a missing key is added, in the object’s own layout', () => {
    expect(
      write(`  <UButton :ui="{ base: 'px-2' }">Go</UButton>`, [
        change('root>UButton', 'label', 'weight', 'font-semibold'),
      ]).template,
    ).toBe(
      `  <UButton :ui="{ base: 'px-2', label: 'font-semibold' }">Go</UButton>`,
    )
    expect(
      write(
        [
          '  <UButton',
          '    :ui="{',
          "      base: 'px-2',",
          '    }"',
          '  >Go</UButton>',
        ].join('\n'),
        [change('root>UButton', 'leadingIcon', 'size', 'size-5')],
      ).template,
    ).toBe(
      [
        '  <UButton',
        '    :ui="{',
        "      base: 'px-2',",
        "      leadingIcon: 'size-5',",
        '    }"',
        '  >Go</UButton>',
      ].join('\n'),
    )
  })

  test('single-quoted attributes get double-quoted strings', () => {
    expect(
      write(`  <UButton :ui='{ base: "rounded-md" }'>Go</UButton>`, [
        corners('rounded-xl'),
        change('root>UButton', 'label', 'weight', 'font-bold'),
      ]).template,
    ).toBe(
      `  <UButton :ui='{ base: "rounded-xl", label: "font-bold" }'>Go</UButton>`,
    )
  })

  test('a key bound to an expression keeps it, the class after it', () => {
    expect(
      write(`  <UButton :ui="{ base: active ? 'ring-2' : '' }">Go</UButton>`, [
        corners('rounded-xl'),
      ]).template,
    ).toBe(
      `  <UButton :ui="{ base: [active ? 'ring-2' : '', 'rounded-xl'] }">Go</UButton>`,
    )
  })
})

describe('a dynamic ui binding', () => {
  test('is spread, the slot keeping what the expression gives it', () => {
    const first = write(`  <UNavigationMenu :ui="navMenuUi" />`, [
      corners('rounded-xl', 'root>UNavigationMenu', 'link'),
    ])
    expect(first.template).toBe(
      `  <UNavigationMenu :ui="{ ...navMenuUi, link: [navMenuUi?.link, 'rounded-xl'] }" />`,
    )
    // Saved again, the written class is the one replaced.
    const source = first.template
    expect(
      write(source, [corners('rounded-lg', 'root>UNavigationMenu', 'link')])
        .template,
    ).toBe(
      `  <UNavigationMenu :ui="{ ...navMenuUi, link: [navMenuUi?.link, 'rounded-lg'] }" />`,
    )
  })

  test('an expression is wrapped before it is spread', () => {
    expect(
      write(`  <UButton :ui="open ? openUi : closedUi">Go</UButton>`, [
        corners('rounded-xl'),
      ]).template,
    ).toBe(
      `  <UButton :ui="{ ...(open ? openUi : closedUi), base: [(open ? openUi : closedUi)?.base, 'rounded-xl'] }">Go</UButton>`,
    )
  })
})

describe('the piece’s root slot and class', () => {
  test('a class of the family in the tag’s class is replaced there', () => {
    expect(
      write('  <UButton class="rounded-full shrink-0">Go</UButton>', [
        corners('rounded-xl'),
      ]).template,
    ).toBe('  <UButton class="shrink-0 rounded-xl">Go</UButton>')
  })

  test('otherwise the class stays and the change goes to ui', () => {
    expect(
      write('  <UButton class="lg:hidden">Go</UButton>', [
        corners('rounded-xl'),
      ]).template,
    ).toBe(
      `  <UButton :ui="{ base: 'rounded-xl' }" class="lg:hidden">Go</UButton>`,
    )
  })

  test('the root slot is the piece’s own: an input’s base is not its root', () => {
    expect(
      write('  <UInput class="rounded-full" />', [
        corners('rounded-xl', 'root>UInput'),
      ]).template,
    ).toBe(`  <UInput :ui="{ base: 'rounded-xl' }" class="rounded-full" />`)
  })
})

describe('finding the piece', () => {
  test('by its path: a second tag of a name, a tag inside another, a list once', () => {
    const { template, written } = write(
      [
        '  <div>',
        '    <UButton>One</UButton>',
        '    <UButton>Two</UButton>',
        '    <UCard>',
        '      <UBadge v-for="tag in tags" :key="tag" :label="tag" />',
        '    </UCard>',
        '  </div>',
      ].join('\n'),
      [
        corners('rounded-xl', 'root>UButton~2'),
        corners('rounded-none', 'root>UCard/UBadge'),
      ],
    )
    expect(template).toBe(
      [
        '  <div>',
        '    <UButton>One</UButton>',
        `    <UButton :ui="{ base: 'rounded-xl' }">Two</UButton>`,
        '    <UCard>',
        `      <UBadge :ui="{ base: 'rounded-none' }" v-for="tag in tags" :key="tag" :label="tag" />`,
        '    </UCard>',
        '  </div>',
      ].join('\n'),
    )
    expect(written).toHaveLength(2)
  })

  test('a theme slot’s ID names the piece and its ui key', () => {
    expect(
      write('  <UButton>Go</UButton>', [
        change('root>UButton#label', 'label', 'weight', 'font-bold'),
      ]).template,
    ).toBe(`  <UButton :ui="{ label: 'font-bold' }">Go</UButton>`)
  })

  test('pieces the file doesn’t hold are left unsaved, the file unchanged', () => {
    const template = '  <UButton>Go</UButton>'
    const outside = corners('rounded-xl', 'root>StudioSidebar>USidebar', 'root')
    const missing = corners('rounded-xl', 'root>UBadge')
    const result = write(template, [outside, missing])
    expect(result.template).toBe(template)
    expect(result.written).toEqual([])
    expect(result.skipped).toEqual([outside, missing])
  })
})
