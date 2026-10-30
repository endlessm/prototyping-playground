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
const ROW =
  'display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 24px;'

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
            { style: ROW, 'data-example': props.name },
            slots.default?.(),
          )
        : null
  },
})

export default Example
