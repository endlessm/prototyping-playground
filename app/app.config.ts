// Documents scroll in their own area with no header over it, so going to a
// heading puts it near the top, not below a page header's height.
const heading = { slots: { base: 'scroll-mt-6 lg:scroll-mt-6' } }

export default defineAppConfig({
  ui: {
    // Nuxt UI's default theme, kept neutral: the studio frames systems that
    // bring their own colours.
    colors: {
      primary: 'neutral',
      neutral: 'neutral',
    },
    prose: {
      h1: heading,
      h2: heading,
      h3: heading,
      h4: heading,
    },
  },
})
