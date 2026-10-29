// The browser scenarios' default system: libraries, a theme, a component,
// an icon, Context documents and a skill.
export default {
  status: 'active',
  role: 'prototype',
  label: 'Harbor',
  styling: 'tailwind',
  colorModes: ['light'],
  docs: 'warn',
  overview: {
    summary: 'Screens for the dock team.',
    guidance: 'Read the voice guide before writing copy.',
    code: 'Plain Vue with Harbor’s theme.',
  },
  libraries: [
    {
      kind: 'package',
      id: 'vue',
      label: 'Vue',
      package: 'vue',
      description: 'The framework Harbor’s screens are written in',
      docs: 'https://vuejs.org/guide/',
      components: ['button'],
    },
    {
      kind: 'package',
      id: 'harbor-icons',
      label: 'Harbor Icons',
      package: '@harbor-fixture/icons',
      description: 'Icon catalog for the docks',
      docs: 'https://icons.harbor.example/',
      assets: ['icons'],
    },
  ],
  origin: null,
  studioId: 'hrbr000000000001',
  app: {
    factory: { from: 'app.ts', name: 'createFixtureApp' },
    stylesheet: 'styles/theme.css',
  },
}
