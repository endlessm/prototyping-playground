import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import { CohortRole, UserRole } from '../types/user'
import { userIsAdmin, type UserRolesLike } from './user'

export interface ProgramRoleLike {
  role_id: number | null
}

/** Whether the user has any of the given role IDs in the program. */
export const hasProgramRole = (
  program: MaybeRefOrGetter<ProgramRoleLike | null | undefined>,
  ...roleIds: number[]
): ComputedRef<boolean> =>
  computed(() => {
    const roleId = toValue(program)?.role_id
    return typeof roleId === 'number' && roleIds.includes(roleId)
  })

/** Whether the user administers the program. */
export const userAdminsProgram = (
  user: MaybeRefOrGetter<UserRolesLike | null>,
  program: MaybeRefOrGetter<ProgramRoleLike | undefined>,
): ComputedRef<boolean> =>
  computed(
    () =>
      userIsAdmin(user).value ||
      hasProgramRole(program, UserRole.PROGRAM_ADMIN).value,
  )

/** Whether the user manages the program. */
export const userManagesProgram = (
  user: MaybeRefOrGetter<UserRolesLike | null>,
  program: MaybeRefOrGetter<ProgramRoleLike | undefined>,
): ComputedRef<boolean> =>
  computed(
    () =>
      userIsAdmin(user).value ||
      hasProgramRole(program, UserRole.PROGRAM_ADMIN, UserRole.PROGRAM_MANAGER)
        .value,
  )

/** Whether the user facilitates the program. */
export const userFacilitatesProgram = (
  user: MaybeRefOrGetter<UserRolesLike | null>,
  program: MaybeRefOrGetter<ProgramRoleLike | undefined>,
): ComputedRef<boolean> =>
  computed(
    () =>
      userIsAdmin(user).value ||
      hasProgramRole(program, UserRole.PROGRAM_ADMIN, CohortRole.COHORT_ADMIN)
        .value,
  )
