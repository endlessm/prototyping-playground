import type { MapRoleKey } from '../../_map/story'
import { cohort, type RoleKey } from '../../_wire/world'

// What each role reads on its place's page while the place has nothing in it yet: an Organization with no Teams, a
// Team with no Cohorts, a Cohort nobody has joined. `crew` is who stands around EmptyStateHuddle's tile: the people
// who will fill the place, and `hub` is the tile's own art: hands stacking where a Team is missing, a classroom where
// a Cohort or its learners are. The buttons stay with each page, since they open that page's own modals.
export interface EmptyState {
  title: string
  lead: string
  crew: MapRoleKey[]
  hub: 'hands' | 'classroom'
}

const noTeams = {
  title: 'No Teams yet',
  crew: ['teamOwner', 'teamManager', 'facilitator', 'learner'] as MapRoleKey[],
  hub: 'hands' as const,
}
const noCohorts = {
  title: 'No Cohorts yet',
  crew: ['cohortOwner', 'facilitator', 'learner'] as MapRoleKey[],
  hub: 'classroom' as const,
}
const noLearners = {
  title: 'No learners yet',
  crew: ['learner', 'facilitator'] as MapRoleKey[],
  hub: 'classroom' as const,
}
const seats = `All ${cohort.seats} seats are open.`

export const emptyStates: Record<RoleKey, EmptyState> = {
  orgOwner: {
    ...noTeams,
    lead: 'Create a Team for each school and name its Team Owner, or bring in the Org Managers who will run the district day to day.',
  },
  orgManager: {
    ...noTeams,
    lead: 'Create a Team for each school and name its Team Owner, or bring in the Org Reviewers who will follow the reports.',
  },
  orgReviewer: {
    ...noTeams,
    lead: 'Reports show up here once the district has Teams.',
  },
  teamOwner: {
    ...noCohorts,
    lead: 'Create a Cohort for each class, or bring in the Team Managers who will create them.',
  },
  teamManager: {
    ...noCohorts,
    lead: 'Create a Cohort for each class this Team runs.',
  },
  cohortOwner: {
    ...noLearners,
    lead: `${seats} Share the join link with your learners, or invite the Facilitators who will run the sessions.`,
  },
  facilitator: {
    ...noLearners,
    lead: `${seats} Share the join link and your learners show up here as they join.`,
  },
}
