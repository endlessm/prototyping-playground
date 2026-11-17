// One example on a component's page, as its examples file writes it:
//
//   <Example name="Default"><UButton>Invite Learners</UButton></Example>
//
// The preview document shows one example at a time: the one it was asked
// for renders its content, laid out in a row; every other example renders
// nothing, so its content never runs. Imported from `#studio/examples`.
import { defineComponent, h, inject, type InjectionKey } from 'vue'

export interface ExampleChoice {
  /** The example to show. */
  name: string
  /** Set when an example of that name rendered. */
  found: boolean
}

export const EXAMPLE: InjectionKey<ExampleChoice> = Symbol('studio-example')

// Inline, since the system's Tailwind doesn't scan the studio's files.
export const EXAMPLE_ROW =
  'display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 24px;'
// A component's playground: the same row, its content centred on a stage at
// least as tall as the studio's stage frame starts.
export const PLAYGROUND_STAGE = `${EXAMPLE_ROW} justify-content: center; min-height: 160px; box-sizing: border-box;`

export const Example = defineComponent({
  name: 'Example',
  props: { name: { type: String, required: true } },
  setup(props, { slots }) {
    const choice = inject(EXAMPLE, null)
    if (choice && choice.name === props.name) choice.found = true
    return () =>
      !choice || choice.name === props.name
        ? h(
            'div',
            { style: EXAMPLE_ROW, 'data-example': props.name },
            slots.default?.(),
          )
        : null
  },
})

export default Example
