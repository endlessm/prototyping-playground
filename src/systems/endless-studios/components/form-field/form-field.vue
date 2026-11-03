<!--
  The Endless Studios form field: Nuxt UI's UFormField as the frontend uses it. Screens write <UFormField>
  directly around a control, with these props; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** The label above the control. */
    label?: string;
    /** A line between the label and the control. */
    description?: string;
    /** Small text at the end of the label row, such as "Optional". */
    hint?: string;
    /** A line under the control. An error replaces it. */
    help?: string;
    /** An error message, or `true` for the error state alone. Inside a `UForm`, its validation sets it. */
    error?: boolean | string;
    /** The key in the form's state this field checks; `UForm` matches errors to fields by it. */
    name?: string;
    /** Adds an asterisk to the label. It doesn't validate anything by itself. */
    required?: boolean;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** `horizontal` puts the label beside the control. */
    orientation?: 'vertical' | 'horizontal';
    /** Classes for each part, as Nuxt UI's `ui` prop: root, wrapper, label, description, hint, help, error, container. */
    ui?: Record<string, string>;
  }>(),
  { size: 'md', orientation: 'vertical' },
);
</script>

<template>
  <UFormField v-bind="props"><slot /></UFormField>
</template>
