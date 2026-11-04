// The studio once remembered a Color mode here. It is light only now
// (ADR 0005), so the old preference is cleared once, whatever it held.
export default defineNuxtPlugin({
  name: 'obsolete-color-mode',
  setup() {
    try {
      localStorage.removeItem('design-studio:color-mode')
    } catch {
      // Storage is blocked (a private window): there is nothing to clear.
    }
  },
})
