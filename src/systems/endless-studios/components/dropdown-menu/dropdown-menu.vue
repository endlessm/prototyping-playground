<!--
  The Endless Studios dropdown menu: Nuxt UI's UDropdownMenu as the frontend uses it. Screens write <UDropdownMenu>
  directly around the button that opens it, with these props; this file gives the component page its props table.
-->
<script setup lang="ts">
defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /**
     * The actions, each with `label`, `icon`, `color`, `to`, `onSelect`, `disabled`, or `type: 'separator'` /
     * `'label'`. An array of arrays makes groups with dividers between them.
     */
    items?: Record<string, unknown>[] | Record<string, unknown>[][];
    /** Where it opens. Row menus use `{ align: 'end' }` so they open toward the page. */
    content?: { side?: 'top' | 'right' | 'bottom' | 'left'; align?: 'start' | 'center' | 'end'; sideOffset?: number };
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** Draws a small arrow toward the button. */
    arrow?: boolean;
    disabled?: boolean;
    /** Classes for each part, as Nuxt UI's `ui` prop: content, group, label, separator, item, itemLeadingIcon… */
    ui?: Record<string, string>;
    /** Whether the menu shows, bound with `v-model:open`. Without it the button opens and closes it. */
    open?: boolean;
    /** The Lab's switch for the empty state: with no `items`, opens a menu without actions instead of the sample ones. */
    empty?: boolean;
  }>(),
  { size: 'md', empty: false },
);

const sampleItems = [
  [
    { label: 'Edit', icon: 'i-lucide-pencil' },
    { label: 'Duplicate', icon: 'i-lucide-copy' },
    { label: 'Copy Link', icon: 'i-lucide-link' },
  ],
  [{ label: 'Delete', icon: 'i-lucide-trash-2', color: 'error' as const }],
];

const forwarded = computed(() => {
  const { empty: _empty, items: _items, ...rest } = props;
  return rest;
});
</script>

<template>
  <!-- The open menu floats outside the layout, so this keeps room for it on the Lab's stage, as the examples do. -->
  <div class="flex h-56 items-start justify-center">
    <UDropdownMenu v-bind="{ ...$attrs, ...forwarded }" :items="items ?? (empty ? [] : sampleItems)">
      <slot>
        <UButton icon="i-lucide-ellipsis" color="neutral" variant="ghost" aria-label="More actions for Lantern Keeper" />
      </slot>
    </UDropdownMenu>
  </div>
</template>
