import type { StudioModule } from '../../../tooling/modules/contract.ts'

// Contributors & Permissions: who works in the studio and what each person
// may change. The studio is always in team use, so it can't be turned off.
export default {
  id: 'contributors',
  label: 'Contributors & Permissions',
  description:
    'Contributor profiles, Admins and system maintainers, and the studio command that registers people.',
  required: true,
  localOnly: true,
  pages: [{ path: '/contributors', file: 'pages/ContributorsPage.vue' }],
  rail: {
    position: 'bottom',
    icon: 'i-lucide-users',
    order: 10,
    to: '/contributors',
  },
  palette: [
    {
      label: 'Contributors',
      to: '/contributors',
      icon: 'i-lucide-users',
      keywords: ['permissions', 'team', 'access'],
    },
  ],
  skills: [
    {
      path: 'skills/use-contributors/',
      when: 'asks to join the studio, change their profile, or assign or review Admin and system-maintainer roles',
    },
  ],
} satisfies StudioModule
