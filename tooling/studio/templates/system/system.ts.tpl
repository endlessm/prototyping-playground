import type { SystemSpec } from '../../../tooling/systems/contract.ts';

// __LABEL__: a new design system. Set it up with an agent from its Overview
// (bring another Vue app in, or start from Nuxt UI).
export default {
  label: '__LABEL_TS__',
  status: 'active',
  role: 'prototype',
  themeClass: '__ID__-theme',
  styling: 'custom',
  colorModes: ['light'],
  docs: 'warn',
  libraries: [
    {
      kind: 'package',
      id: 'vue',
      label: 'Vue',
      package: 'vue',
      description: 'Renders each view in the system’s own preview document',
      docs: 'https://vuejs.org/guide/introduction.html',
    },
  ],
  origin: null,
  studioId: '__STUDIO_ID__',
  app: {
    factory: { from: 'app.ts', name: 'createSystemApp' },
    stylesheet: 'styles/theme.css',
  },
} satisfies SystemSpec;
