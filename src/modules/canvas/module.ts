import type { StudioModule } from '../../../tooling/modules/contract.ts'

// Canvases: an `.excalidraw` file in a prototype opens as a page to arrange
// views, documents and notes on, drawn with Excalidraw. The studio runs with
// or without this module; nothing outside this folder imports it.
export default {
  id: 'canvas',
  label: 'Canvases',
  description:
    'An .excalidraw file opens as a page to arrange views, documents and notes on.',
  skills: [
    {
      path: 'skills/use-canvas/',
      when: 'asks for a canvas (a page of views, documents, and notes arranged together)',
    },
  ],
  references: 'references.ts',
  fileTypes: [
    {
      id: 'canvas',
      label: 'Canvas',
      extensions: ['.excalidraw'],
      identity: 'types/canvas/identity.ts',
      check: 'types/canvas/check.ts',
      template: 'types/canvas/check.ts',
      icon: 'i-lucide-presentation',
      page: 'components/CanvasPage.vue',
      // A fitted picture of the canvas in a document; on another canvas it
      // stays a card.
      embed: 'components/CanvasEmbed.vue',
      embedIn: ['document'],
      embedPending: 'components/CanvasEmbedPending.vue',
    },
  ],
  data: {
    // The deployed site's canvases, by permanent ID. In development a canvas
    // is read from its file, so this is built only for the static build.
    files: {
      watch: ['src/prototypes/**/*.excalidraw'],
      load: async ({ root }) =>
        (await import('./types/canvas/bundle.ts')).canvasFiles(root),
    },
  },
} satisfies StudioModule
