// `floating-vue`: the app installs it as a plugin, and vue-mention (the @mention list in PostCard's comment box)
// imports `options` and `Dropdown` from it. The preview has no floating-vue, so this answers those two: a theme
// registry vue-mention writes to, and a dropdown that shows its `popper` slot above its anchor while `shown`.
import { defineComponent, h } from 'vue';

export const options: { themes: Record<string, Record<string, unknown>> } = { themes: {} };

export const Dropdown = defineComponent({
  name: 'VDropdown',
  props: {
    shown: { type: Boolean, default: false },
    theme: { type: String, default: 'dropdown' },
    triggers: { type: Array, default: () => [] },
    autoHide: { type: Boolean, default: true },
  },
  setup(props, { slots }) {
    return () =>
      h('div', { class: 'v-popper' }, [
        slots.default?.(),
        props.shown
          ? h(
              'div',
              {
                class: 'v-popper__popper absolute bottom-full left-0 z-50 mb-1 min-w-40 rounded-md bg-white py-1 text-sm shadow-lg ring ring-gray-200',
                role: 'listbox',
              },
              slots.popper?.(),
            )
          : null,
      ]);
  },
});

export default { install() {}, options, Dropdown };
