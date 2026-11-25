import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import { CohortRole, UserRole, type User } from '../types/user'

export type UserRolesLike = Pick<User, 'roles'>

/** Whether the user has any of the given role IDs. */
export const userHasRole = (
  user: MaybeRefOrGetter<UserRolesLike | null>,
  ...roleIds: number[]
): ComputedRef<boolean> =>
  computed(() => !!toValue(user)?.roles?.some((r) => roleIds.includes(r.id)))

/** Whether the user is a system administrator. */
export const userIsAdmin = (
  user: MaybeRefOrGetter<UserRolesLike | null>,
): ComputedRef<boolean> => userHasRole(user, UserRole.ADMIN)

/** Whether the user is a system content editor. */
export const userIsEditor = (
  user: MaybeRefOrGetter<UserRolesLike | null>,
): ComputedRef<boolean> => userHasRole(user, UserRole.CONTENT_EDITOR)

/** Whether the user is a project leader. */
export const userIsProjectLeader = (
  user: MaybeRefOrGetter<UserRolesLike | null>,
): ComputedRef<boolean> => userHasRole(user, UserRole.LEADER)

/** Whether the user is a program administrator. */
export const userIsProgramAdmin = (
  user: MaybeRefOrGetter<UserRolesLike | null>,
): ComputedRef<boolean> => userHasRole(user, UserRole.PROGRAM_ADMIN)

/** Whether the user is a program manager. */
export const userIsProgramManager = (
  user: MaybeRefOrGetter<UserRolesLike | null>,
): ComputedRef<boolean> => userHasRole(user, UserRole.PROGRAM_MANAGER)

/** Whether the user is a cohort administrator. */
export const userIsCohortAdmin = (
  user: MaybeRefOrGetter<UserRolesLike | null>,
): ComputedRef<boolean> => userHasRole(user, CohortRole.COHORT_ADMIN)

/** Whether the user is an institution administrator. */
export const userIsInstitutionAdmin = (
  user: MaybeRefOrGetter<UserRolesLike | null>,
): ComputedRef<boolean> => userHasRole(user, UserRole.INSTITUTION_ADMIN)
