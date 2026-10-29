import { describe, expect, test } from 'vitest'
import { identity as view } from '../../src/modules/prototypes/types/view/identity'
import { check } from '../../src/modules/prototypes/types/view/states'

const STATES = `<script lang="ts">
export const states = [
  { title: 'Member', props: { name: 'Ana' } },
  { title: 'New user', props: { name: '' } },
]
</script>

<script setup lang="ts">
defineProps<{ name: string }>()
</script>

<template>
  <p>{{ name ? 'Welcome back, ' + name : 'Welcome' }}</p>
</template>
`
const MEMBER = 'mem0000000000001'
const NEW_USER = 'new0000000000001'

describe('a view’s named states', () => {
  test('[PR-89] are read from the plain list its regular <script> exports, in order, without running it', () => {
    expect(view.children!.read(STATES)).toEqual([
      { key: 'Member', studioId: null },
      { key: 'New user', studioId: null },
    ])
    expect(check(STATES)).toEqual([])
  })
})

describe('a named state’s identity', () => {
  test('[PR-89] assignment writes a comment after the view’s, matched by title', () => {
    const identified = view.write(STATES, 'vew0000000000001')
    const once = view.children!.write(identified, 'Member', MEMBER)
    const both = view.children!.write(once, 'New user', NEW_USER)
    expect(both).toBe(
      `<!-- @studio-id vew0000000000001 -->\n<!-- @studio-state ${MEMBER} Member -->\n<!-- @studio-state ${NEW_USER} New user -->\n${STATES}`,
    )
    expect(view.children!.read(both)).toEqual([
      { key: 'Member', studioId: MEMBER },
      { key: 'New user', studioId: NEW_USER },
    ])
    expect(view.read(both)).toBe('vew0000000000001')
    expect(check(both)).toEqual([])
  })

  test('[PR-89] keeps the line endings and a byte order mark', () => {
    const source = `\uFEFF${STATES.replaceAll('\n', '\r\n')}`
    expect(view.children!.write(source, 'Member', MEMBER)).toBe(
      `\uFEFF<!-- @studio-state ${MEMBER} Member -->\r\n${source.slice(1)}`,
    )
  })

  test('[PR-89] a state renamed in code and comment keeps its identity', () => {
    const source = `<!-- @studio-state ${MEMBER} Signed in -->\n${STATES.replace("'Member'", "'Signed in'")}`
    expect(view.children!.read(source)[0]).toEqual({
      key: 'Signed in',
      studioId: MEMBER,
    })
  })

  test('[PR-89] a second comment for the same state is refused', () => {
    const source = `<!-- @studio-state ${MEMBER} Member -->\n<!-- @studio-state ${NEW_USER} Member -->\n${STATES}`
    expect(() => view.children!.read(source)).toThrow(
      'A view must declare the identity of state "Member" only once.',
    )
  })

  test('[PR-89] a view without states has none', () => {
    expect(
      view.children!.read('<template>\n  <p>Hi</p>\n</template>\n'),
    ).toEqual([])
  })
})

describe('the view’s check', () => {
  test('[PR-90] reports a comment that names no state, as a rename in code alone leaves', () => {
    const source = `<!-- @studio-state ${MEMBER} Member -->\n${STATES.replace("'Member'", "'Signed in'")}`
    expect(check(source)).toEqual([
      `@studio-state ${MEMBER} names no state titled "Member". When renaming a state, change its title in the comment too, which keeps its permanent link; remove the comment only when removing the state.`,
    ])
  })

  test('[PR-90] reports repeated titles', () => {
    const source = STATES.replace("'New user'", "'Member'")
    expect(check(source)).toEqual([
      'two states are titled "Member"; titles must differ.',
    ])
  })

  test('[PR-90] reports titles that are not plain text in quotes, and states without one', () => {
    const computed = STATES.replace("'New user'", '`${"New"} user`')
    expect(check(computed)).toEqual([
      "state 2 needs a title written as plain text in quotes, like title: 'Member'.",
    ])
    const variable = STATES.replace("'Member'", 'MEMBER')
    expect(check(variable)).toEqual([
      "state 1 needs a title written as plain text in quotes, like title: 'Member'.",
    ])
    const untitled = STATES.replace("title: 'Member', ", '')
    expect(check(untitled)).toEqual(['state 1 needs a title.'])
    expect(
      check(
        STATES.replace(
          /export const states = \[[\s\S]*?\n\]/,
          'export const states = list',
        ),
      ),
    ).toEqual([
      'export const states must be a list written in place: [{ title, props }, …].',
    ])
  })

  test('[PR-89] reads titles only from the state objects of the regular <script>', () => {
    const nested = STATES.replace(
      "props: { name: 'Ana' }",
      "props: { title: 'Not a state', name: 'Ana' }",
    )
    expect(view.children!.read(nested).map(({ key }) => key)).toEqual([
      'Member',
      'New user',
    ])
    const inSetup = `<script setup lang="ts">\nconst states = [{ title: 'Nope' }]\n</script>\n<template><p /></template>\n`
    expect(view.children!.read(inSetup)).toEqual([])
    expect(check(inSetup)).toEqual([])
  })
})
