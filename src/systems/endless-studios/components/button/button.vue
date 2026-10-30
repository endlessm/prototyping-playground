<!--
  The Endless Studios button: Nuxt UI's UButton with the frontend's app.config customization. Screens write
  <UButton> directly, with these props; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** The button's text. Content in the default slot does the same. */
    label?: string;
    /** A semantic role from the theme. */
    color?: 'primary' | 'secondary' | 'kids' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
    /** `contrast` inherits the surrounding text colour; `gating` is for kids surfaces. */
    variant?: 'solid' | 'outline' | 'soft' | 'subtle' | 'ghost' | 'link' | 'contrast' | 'gating';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** A Lucide icon name, such as `i-lucide-user-plus`, shown before the label. */
    icon?: string;
    leadingIcon?: string;
    trailingIcon?: string;
    /** Shows a spinner in place of the leading icon and disables the button. */
    loading?: boolean;
    disabled?: boolean;
    /** Fills the available width. */
    block?: boolean;
    /** Equal padding on every side, for icon-only buttons. */
    square?: boolean;
    /** Renders a link instead of a button. */
    to?: string;
  }>(),
  { color: 'primary', variant: 'solid', size: 'md' },
);
</script>

<template>
  <UButton v-bind="props"><slot /></UButton>
</template>
