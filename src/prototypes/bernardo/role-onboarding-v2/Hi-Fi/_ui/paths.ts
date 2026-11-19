import type { RoleKey } from '../../_wire/world'

// Every Hi-Fi page's path, written out in full so links stay inside Hi-Fi: the studio rewrites literal paths when
// pages move or folders are renamed, but never paths built from parts, so a rename keeps every link working.
const hifiPages: Record<RoleKey, string[]> = {
  orgOwner: [
    'Hi-Fi/Pages/1 Org Owner/1.1 Invite',
    'Hi-Fi/Pages/1 Org Owner/1.2 Accept',
    'Hi-Fi/Pages/1 Org Owner/1.3 Welcome',
    'Hi-Fi/Pages/1 Org Owner/1.4 Add Org Managers',
    'Hi-Fi/Pages/1 Org Owner/1.5 Managers Invited',
  ],
  orgManager: [
    'Hi-Fi/Pages/2 Org Manager/2.1 Invite',
    'Hi-Fi/Pages/2 Org Manager/2.2 Accept',
    'Hi-Fi/Pages/2 Org Manager/2.3 Welcome',
    'Hi-Fi/Pages/2 Org Manager/2.4 Add Org Reviewers',
    'Hi-Fi/Pages/2 Org Manager/2.5 Reviewers Invited',
    'Hi-Fi/Pages/2 Org Manager/2.6 Create a Team',
    'Hi-Fi/Pages/2 Org Manager/2.7 Team Created',
  ],
  orgReviewer: [
    'Hi-Fi/Pages/3 Org Reviewer/3.1 Invite',
    'Hi-Fi/Pages/3 Org Reviewer/3.2 Accept',
    'Hi-Fi/Pages/3 Org Reviewer/3.3 Welcome',
    'Hi-Fi/Pages/3 Org Reviewer/3.4 Team Report',
  ],
  teamOwner: [
    'Hi-Fi/Pages/4 Team Owner/4.1 Invite',
    'Hi-Fi/Pages/4 Team Owner/4.2 Accept',
    'Hi-Fi/Pages/4 Team Owner/4.3 Welcome',
    'Hi-Fi/Pages/4 Team Owner/4.4 Add Team Managers',
    'Hi-Fi/Pages/4 Team Owner/4.5 Managers Invited',
  ],
  teamManager: [
    'Hi-Fi/Pages/5 Team Manager/5.1 Invite',
    'Hi-Fi/Pages/5 Team Manager/5.2 Accept',
    'Hi-Fi/Pages/5 Team Manager/5.3 Welcome',
    'Hi-Fi/Pages/5 Team Manager/5.4 Create a Cohort',
    'Hi-Fi/Pages/5 Team Manager/5.5 New Cohort',
  ],
  cohortOwner: [
    'Hi-Fi/Pages/6 Cohort Owner/6.1 Invite',
    'Hi-Fi/Pages/6 Cohort Owner/6.2 Accept',
    'Hi-Fi/Pages/6 Cohort Owner/6.3 Welcome',
    'Hi-Fi/Pages/6 Cohort Owner/6.4 Invite Facilitators',
    'Hi-Fi/Pages/6 Cohort Owner/6.5 Facilitators Invited',
  ],
  facilitator: [
    'Hi-Fi/Pages/7 Facilitator/7.1 Invite',
    'Hi-Fi/Pages/7 Facilitator/7.2 Accept',
    'Hi-Fi/Pages/7 Facilitator/7.3 Welcome',
    'Hi-Fi/Pages/7 Facilitator/7.4 Add Learners',
    'Hi-Fi/Pages/7 Facilitator/7.5 Learners Joined',
  ],
}

/** A Hi-Fi page's path inside the prototype: `hifi('orgOwner', 3)` → `Hi-Fi/Pages/1 Org Owner/1.3 Welcome`. */
export const hifi = (key: RoleKey, n: number): string => hifiPages[key][n - 1]!
