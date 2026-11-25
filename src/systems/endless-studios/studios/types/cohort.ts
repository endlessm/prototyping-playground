/** A cohort as its admin pages read it. */
export interface AdminCohort {
  id: number
  name: string
  cohort_status: string
  institution_id: number | null
  start_date: string | null
  end_date: string | null
  role_id: number | null
  timezone: string
  member_count: number
  cohort_admins: { id: number }[]
  program: {
    id: number
    name: string
    role_id: number | null
    institution_id: number | null
    institution_name: string | null
  }
}

/** The program a cohort runs, as its admin pages read it. */
export interface AdminCohortProgram {
  name: string
  institution_id: number | null
  institution_name: string | null
  role_id: number | null
}

/**
 * i18n keys for each cohort status. not_started reads as "upcoming" so the
 * label speaks of what comes rather than of a missing start.
 */
export const COHORT_STATUS_LABEL_KEYS: Record<string, string> = {
  not_started: 'upcoming',
  in_progress: 'in_progress',
  completed: 'completed',
}

export const COHORT_STATUS_COLORS: Record<
  string,
  'info' | 'success' | 'neutral'
> = {
  not_started: 'info',
  in_progress: 'success',
  completed: 'neutral',
}
