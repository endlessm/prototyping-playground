<!--
  The Endless Studios badge: Nuxt UI's UBadge with the frontend's app.config badge settings. Screens write
  <UBadge> directly, with these props; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** The badge's text. Content in the default slot does the same. */
    label?: string | number;
    /** A semantic role from the theme. */
    color?: 'primary' | 'secondary' | 'kids' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
    /** Secondary soft uses the cornflower 50 tint with 700 text. */
    variant?: 'solid' | 'outline' | 'soft' | 'subtle';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** A Lucide icon name, such as `i-lucide-git-merge`, shown before the label. */
    icon?: string;
    leadingIcon?: string;
    trailingIcon?: string;
    /** Equal padding on every side, for a badge that holds only an icon or a number. */
    square?: boolean;
    /** Classes for each part, as Nuxt UI's `ui` prop: base, label, leadingIcon, trailingIcon. */
    ui?: Partial<Record<'base' | 'label' | 'leadingIcon' | 'trailingIcon', string>>;
  }>(),
  { color: 'primary', variant: 'solid', size: 'md' },
);
</script>

<template>
  <UBadge v-bind="props"><slot /></UBadge>
</template>
