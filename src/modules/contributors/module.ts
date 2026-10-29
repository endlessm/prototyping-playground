import type { StudioModule } from '../../../tooling/modules/contract.ts'

// Contributors & Permissions: who works in the studio and what each person
// may change. The studio is always in team use, so it can't be turned off.
export default {
  id: 'contributors',
  label: 'Contributors & Permissions',
  description:
    'Contributor profiles, Admins and system maintainers, and the studio command that registers people.',
  required: true,
  skills: [
    {
      path: 'skills/use-contributors/',
      when: 'asks to join the studio, change their profile, or review who may change what',
    },
  ],
} satisfies StudioModule
