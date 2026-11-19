// The Roles Map's illustrations with more detail (collars, shading, finer objects; still no faces), for the larger
// sizes the Hi-Fi screens show them at. Each keeps the canvas, palette and composition of its original in
// `_map/illustrations`, and this file keeps that one's exports, so a screen moves to this set by changing its import.
import endlessLogo from '~/assets/images/logo-endless.svg'
import cohort from './illustrations/place-cohort.svg'
import organization from './illustrations/place-organization.svg'
import program from './illustrations/place-program.svg'
import team from './illustrations/place-team.svg'
import teamGroup from './illustrations/place-team-group.svg'
import cohortOwner from './illustrations/role-cohort-owner.svg'
import endlessAdmin from './illustrations/role-endless-admin.svg'
import facilitator from './illustrations/role-facilitator.svg'
import learner from './illustrations/role-learner.svg'
import orgManager from './illustrations/role-org-manager.svg'
import orgOwner from './illustrations/role-org-owner.svg'
import orgReviewer from './illustrations/role-org-reviewer.svg'
import teamManager from './illustrations/role-team-manager.svg'
import teamOwner from './illustrations/role-team-owner.svg'
import type { MapRoleKey, PlaceKind } from '../../_map/story'

export const roleIllustrations: Record<MapRoleKey, string> = {
  endlessAdmin,
  orgOwner,
  orgManager,
  orgReviewer,
  teamOwner,
  teamManager,
  cohortOwner,
  facilitator,
  learner,
}

export const placeIllustrations: Record<PlaceKind, string> = {
  Platform: endlessLogo,
  Organization: organization,
  Team: team,
  Cohort: cohort,
}

export const programIllustration = program

// A Team drawn as its people, three shoulder to shoulder, for the empty Teams tab where the game pad read as play.
export const teamGroupIllustration = teamGroup
