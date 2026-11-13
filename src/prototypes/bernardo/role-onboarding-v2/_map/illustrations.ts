// The role illustration set from Endless Access/artifacts/roles-icons, drawn for older role names. The mapping to
// the proposed roles is provisional until the set is redrawn.
import endlessLogo from '~/assets/images/logo-endless.svg'
import admin from './illustrations/role-admin.svg'
import contentEditor from './illustrations/role-content-editor.svg'
import facilitator from './illustrations/role-facilitator.svg'
import institutionAdmin from './illustrations/role-institution-admin.svg'
import learner from './illustrations/role-learner.svg'
import programAdmin from './illustrations/role-program-admin.svg'
import programManager from './illustrations/role-program-manager.svg'
import projectLeader from './illustrations/role-project-leader.svg'
import projectMentor from './illustrations/role-project-mentor.svg'
import cohort from './illustrations/place-cohort.svg'
import institution from './illustrations/place-institution.svg'
import program from './illustrations/place-program.svg'
import project from './illustrations/place-project.svg'
import type { MapRoleKey, PlaceKind } from './story'

export const roleIllustrations: Record<MapRoleKey, string> = {
  endlessAdmin: admin,
  orgOwner: institutionAdmin,
  orgManager: programManager,
  orgReviewer: contentEditor,
  teamOwner: projectLeader,
  teamManager: programAdmin,
  cohortOwner: projectMentor,
  facilitator,
  learner,
}

export const placeIllustrations: Record<PlaceKind, string> = {
  Platform: endlessLogo,
  Organization: institution,
  Team: project,
  Cohort: cohort,
}

export const programIllustration = program
