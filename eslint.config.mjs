import withNuxt from './.nuxt/eslint.config.mjs'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'

export default withNuxt([
  {
    // Content and generated output; prototypes and systems get their own
    // checks.
    ignores: [
      'src/prototypes/**',
      'src/systems/**',
      '.nuxt*/**',
      '.output*/**',
      '.yarn/**',
    ],
  },
  eslintPluginPrettierRecommended,
  eslintConfigPrettier,
  {
    rules: {
      // Pages and layouts are single words by Nuxt's convention.
      'vue/multi-word-component-names': 'off',
    },
  },
])
