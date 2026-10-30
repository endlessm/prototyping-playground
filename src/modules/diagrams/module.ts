import type { StudioModule } from '../../../tooling/modules/contract.ts'

// Diagrams: a `.mermaid` or `.mmd` file in a prototype opens as a diagram,
// drawn by the studio's shared Mermaid renderer, which also draws Mermaid
// fences in documents whether or not this module is on.
export default {
  id: 'diagrams',
  label: 'Diagrams',
  description: 'A .mermaid or .mmd file in a prototype opens as a diagram.',
  skills: [
    {
      path: 'skills/create-diagram/',
      when: 'asks for a standalone diagram inside a prototype',
    },
  ],
  fileTypes: [
    {
      id: 'diagram',
      label: 'Diagram',
      extensions: ['.mermaid', '.mmd'],
      identity: 'types/diagram/identity.ts',
      template: 'types/diagram/template.ts',
      page: 'components/DiagramPage.vue',
      embed: 'components/DiagramEmbed.vue',
      embedIn: ['document', 'canvas'],
      icon: 'i-lucide-workflow',
      text: true,
    },
  ],
} satisfies StudioModule
