<!--
  The Endless Studios file upload: Nuxt UI's UFileUpload as the frontend uses it. Screens write <UFileUpload>
  directly, with these props and v-model; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** The chosen file, or files with `multiple`, bound with `v-model`. */
    modelValue?: File | File[] | null;
    /** The drop area's main line. */
    label?: string;
    /** A line under the label, such as the formats and size allowed. */
    description?: string;
    /** A Lucide icon name for the drop area. */
    icon?: string;
    /** The formats it accepts, as the native `accept`: `.png,.jpg` or `image/*`. */
    accept?: string;
    multiple?: boolean;
    /** `area` is a drop zone; `button` is a single button that opens the file picker. */
    variant?: 'area' | 'button';
    /** A semantic role from the theme; it colours the focus and drag states. */
    color?: 'primary' | 'secondary' | 'kids' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** How chosen files show: a `list` or a `grid` of thumbnails. */
    layout?: 'list' | 'grid';
    /** Shows chosen files. The app hides them and shows its own upload state instead. */
    preview?: boolean;
    /** Accepts files dropped onto it. */
    dropzone?: boolean;
    disabled?: boolean;
    /** Classes for each part, as Nuxt UI's `ui` prop, such as `{ files: 'hidden' }`. */
    ui?: Record<string, string>;
  }>(),
  { variant: 'area', color: 'primary', size: 'md', layout: 'grid', preview: true, dropzone: true },
);
</script>

<template>
  <UFileUpload v-bind="props" />
</template>
