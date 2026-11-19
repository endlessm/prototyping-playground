<!-- @studio-id mb41nsen1h447t5r -->
<!-- @studio-state cjqxvyh4jcv6v54v Solid -->
<!-- @studio-state 4dsszgt391msphp4 Outline -->
<!-- @studio-state e9y6v2q23y9jensz Soft -->
<!-- @studio-state frmbe4rm8ek6keaf Subtle -->
<!-- @studio-state 67d50a8hxs0g95x2 Ghost -->
<!-- @studio-state 7t7j8h3aqqk93z3j Link -->
<!-- @studio-state zbxggc6e71gbp5qz Contrast -->
<!-- @studio-state 8ppd8ygmzpmatk08 Kids gating -->
<script setup lang="ts">
type Variant = 'solid' | 'outline' | 'soft' | 'subtle' | 'ghost' | 'link' | 'contrast' | 'gating'
type Color = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral' | 'kids'

const props = defineProps<{ variant: Variant; colors?: Color[] }>()

const allColors: Color[] = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral']
const colors = computed(() => props.colors ?? allColors)
const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const
</script>

<script lang="ts">
export const states = [
  { title: 'Solid', props: { variant: 'solid' } },
  { title: 'Outline', props: { variant: 'outline' } },
  { title: 'Soft', props: { variant: 'soft' } },
  { title: 'Subtle', props: { variant: 'subtle' } },
  { title: 'Ghost', props: { variant: 'ghost' } },
  { title: 'Link', props: { variant: 'link' } },
  { title: 'Contrast', props: { variant: 'contrast', colors: ['neutral'] } },
  { title: 'Kids gating', props: { variant: 'gating', colors: ['kids'] } },
]
</script>

<template>
  <div class="min-h-screen p-6" :class="variant === 'contrast' ? 'bg-secondary-700 text-white' : 'bg-default'">
    <table class="border-separate border-spacing-x-4 border-spacing-y-3 text-left text-xs">
      <thead>
        <tr class="opacity-60">
          <th class="font-medium">Color</th>
          <th v-for="size in sizes" :key="size" class="font-medium">{{ size }}</th>
          <th class="font-medium">Icons</th>
          <th class="font-medium">Icon only</th>
          <th class="font-medium">Loading</th>
          <th class="font-medium">Disabled</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="color in colors" :key="color">
          <td class="pr-2 capitalize opacity-60">{{ color }}</td>
          <td v-for="size in sizes" :key="size">
            <UButton :color="color" :variant="variant" :size="size" label="Button" />
          </td>
          <td>
            <UButton
              :color="color"
              :variant="variant"
              label="Button"
              leading-icon="i-lucide-plus"
              :trailing-icon="variant === 'gating' ? 'i-lucide-shield' : 'i-lucide-arrow-right'"
            />
          </td>
          <td>
            <UButton :color="color" :variant="variant" icon="i-lucide-plus" aria-label="Add" />
          </td>
          <td>
            <UButton :color="color" :variant="variant" label="Button" loading />
          </td>
          <td>
            <UButton :color="color" :variant="variant" label="Button" disabled />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
