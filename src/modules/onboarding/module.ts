import type { StudioModule } from '../../../tooling/modules/contract.ts'

// The welcome: a short introduction for the Endless team that opens over
// Home on a contributor's first local visit, once per contributor per
// studio. It has no page, rail button or palette entry; the Manual keeps
// the same ideas for later.
export default {
  id: 'onboarding',
  label: 'Welcome',
  description:
    'A short welcome on your first visit: the studio, Endless Studios screens, the canvas and asking your agent.',
  localOnly: true,
  home: { component: 'components/WelcomeHome.vue', order: { local: 0 } },
  preferences: { defaults: { welcomeDismissed: false } },
  server: { claim: 'server/claim.ts' },
  skills: [
    {
      path: 'skills/get-started/',
      when: 'is new to the studio, asks for a tour, or wants help making a first prototype',
    },
  ],
} satisfies StudioModule
