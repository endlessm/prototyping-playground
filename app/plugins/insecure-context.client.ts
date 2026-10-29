import { fillInsecureContext } from '../utils/insecureContext'

// Opened at http://<lan-ip>:<port>, the browser withholds the clipboard,
// `crypto.randomUUID` and `crypto.subtle`. Fill them in before anything uses
// them.
export default defineNuxtPlugin({
  name: 'insecure-context',
  enforce: 'pre',
  setup() {
    fillInsecureContext()
  },
})
