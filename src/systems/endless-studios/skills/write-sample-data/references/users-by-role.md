# Users by role

Ready-to-paste users for a view's `system.user`, one per role and account state, built from the [demo cast](demo-cast.md). What each role is and may do is in [Platform model](../../../context/platform-model.md); this page gives only the data the app receives. Verified against the stand-in (`runtime/auth.ts`), the app's role checks, schema and fixtures on `dev` (`eaa7d5f`) and the stored role names.

## What `$auth` reads

The stand-in answers the app's checks from the user object, as the app does:

| Check | True when |
| --- | --- |
| `isAdmin` | `roles` holds 1 |
| `isLeader` | `roles` holds 3 or 1 |
| `isEditor` | `roles` holds 19 |
| `isProgramAdmin` | `roles` holds 14 |
| `isProgramManager` | `roles` holds 23 |
| `isInstitutionAdmin` | `roles` holds 20 |
| `isCohortAdmin` | `roles` holds 22 |
| `isAdult` | `age_category` is `'adult'` |
| `isMinor` | stand-in: `age_category` is `'digital_youth'`; app: not `isAdult`, so an unclassified user (`null`) counts too |

`roles` holds every role the user has, with its stored name: system roles, roles in games, programs and institutions, and cohort roles. `role_ids` holds only system roles (in the demo cast: 1, 5 and 19). A learner in a cohort has 21 in `roles`; a school's students have 2 from their institution.

In the app, `$auth.user` carries the fields its sign-in query asks `me` for: `id`, `email`, `first_name`, `last_name`, `username`, `permissions.change_username`, `verified`, `disabled`, `public`, `is_restricted_partner_account`, `location`, `auth_methods`, `age_category`, `roles`, `metadata`, `institutions`, `github_user`. The objects below also carry `full_name`, `role_ids`, `has_parental_consent`, the profile counts, `skill_progress`, `created_at` and `isMentor`, so one object can also feed a component's `user` prop. A screen that reads those from `$auth.user` needs its own query in the app.

## The users

Paste into the prototype's `_data/users.ts`, import `users` (and `ROLE` for a variant) into the view's regular `<script>`, and choose with `system: { user: users.learner }`.

```ts
// Sample users for system.user, from the Endless Studios demo cast.
export const ROLE = {
  admin: { id: 1, name: 'Admin' },
  projectMember: { id: 2, name: 'Project member' },
  projectLeader: { id: 3, name: 'Project leader' },
  projectMentor: { id: 5, name: 'Project mentor' },
  programAdmin: { id: 14, name: 'Program Admin' },
  contentEditor: { id: 19, name: 'Content Editor' },
  institutionAdmin: { id: 20, name: 'Institution admin' },
  cohortMember: { id: 21, name: 'Cohort Member' },
  cohortAdmin: { id: 22, name: 'Cohort Admin' },
  programManager: { id: 23, name: 'Program manager' },
} as const

// Interests are illustrative: the demo cast sets none.
const INTEREST = {
  art: { id: 2, name: 'Art', ln_name: { es: 'Arte' }, interest_type_id: 'learningfields' },
  sound: { id: 4, name: 'Sound', ln_name: { es: 'Sonido' }, interest_type_id: 'learningfields' },
  adventure: { id: 8, name: 'Adventure', ln_name: { es: 'Aventura' }, interest_type_id: 'gametypes' },
}

type Role = (typeof ROLE)[keyof typeof ROLE]
type Person = {
  id: number; username: string; first: string; last: string; age: number
  category?: 'adult' | 'digital_youth' | null; consent?: boolean
  roles?: Role[]; systemRoles?: number[]; metadata?: Record<string, unknown>; [field: string]: unknown
}

function person({ id, username, first, last, age, category = age >= 18 ? 'adult' : 'digital_youth',
  consent = false, roles = [], systemRoles = [], metadata = {}, ...rest }: Person) {
  const adult = category === 'adult'
  const gate = adult || consent ? 'allowed' : 'parental_consent_required'
  return {
    id, username, email: `${username.toLowerCase()}@example.org`,
    first_name: first, last_name: last, full_name: adult ? `${first} ${last}` : first,
    verified: true, disabled: false, public: gate === 'allowed' ? true : null,
    age_category: category, has_parental_consent: consent, is_restricted_partner_account: false,
    location: null, auth_methods: ['password'], github_user: null, institutions: [],
    roles, role_ids: systemRoles,
    permissions: { profile_images: gate, change_username: gate, publish_profile: gate },
    created_at: '2026-03-02T15:00:00.000Z', joinedProjectsCount: 0, certificatesCount: 0,
    memberOfProjects: [], leaderForProjects: [], skill_progress: { total_xp: 0, domains: [] },
    ...rest,
    metadata: {
      image_url: null, cover_image_url: null, about_me: null, description: null, interests: [],
      task_slots: 4, discord_username: null, viewed_info_modal: true, show_on_boarding_banner: false,
      onboarding_task_complete: true, preferred_lang_id: 'en', birthday: `${2026 - age}-06-15`,
      ...metadata,
    },
  }
}

const school = { name: 'Maple Ridge Secondary School' }
const partner = { name: 'Horizon Youth Center' }

export const users = {
  platformAdmin: person({ id: 201, username: 'demoadmin', first: 'Peter', last: 'Parker', age: 36, location: 'US-NY',
    systemRoles: [1], roles: [ROLE.admin, ROLE.programAdmin, ROLE.cohortAdmin],
    metadata: { about_me: 'Platform administrator.' } }),
  programAdmin: person({ id: 202, username: 'priya', first: 'Priya', last: 'Raman', age: 34, location: 'US-WA',
    roles: [ROLE.programAdmin, ROLE.cohortAdmin],
    metadata: { about_me: 'Program designer. I build the game making programs here and review your task submissions — say hi in the program feed!' } }),
  mentor: person({ id: 203, username: 'marcus', first: 'Marcus', last: 'Webb', age: 29, location: 'US-TX',
    systemRoles: [5], roles: [ROLE.projectLeader, ROLE.projectMentor, ROLE.cohortMember], isMentor: true, joinedProjectsCount: 2,
    metadata: { about_me: 'Game developer and mentor. I lead Starlight Drifters and help new game makers find their footing.' } }),
  contentEditor: person({ id: 204, username: 'sofia', first: 'Sofia', last: 'Delgado', age: 31, location: 'US-CA',
    systemRoles: [19], roles: [ROLE.contentEditor],
    metadata: { about_me: 'Content editor. I curate the resource library and learning pages.' } }),
  institutionAdmin: person({ id: 205, username: 'evelyn', first: 'Evelyn', last: 'Cho', age: 41, location: 'CA-BC',
    roles: [ROLE.institutionAdmin, ROLE.cohortAdmin], institutions: [school],
    metadata: { about_me: 'Teacher at Maple Ridge Secondary. I run the game making club for my students.' } }),
  partnerAdmin: person({ id: 206, username: 'dana', first: 'Dana', last: 'Whitfield', age: 38, location: 'US-NY',
    roles: [ROLE.institutionAdmin, ROLE.cohortAdmin], institutions: [partner], is_restricted_partner_account: true,
    metadata: { about_me: 'Program coordinator at Horizon Youth Center.' } }),
  // Not in the demo cast, which has no Program Manager.
  programManager: person({ id: 207, username: 'jonah', first: 'Jonah', last: 'Mercer', age: 40, roles: [ROLE.programManager] }),

  firstRun: person({ id: 301, username: 'CuriousHeron742', first: 'Noah', last: 'Tremblay', age: 18, location: 'CA-QC',
    public: null, created_at: '2026-11-04T19:30:00.000Z', metadata: { show_on_boarding_banner: true } }),
  learner: person({ id: 302, username: 'SunnyOtter512', first: 'Maya', last: 'Flores', age: 14, consent: true, location: 'CA-BC',
    roles: [ROLE.projectMember, ROLE.cohortMember], institutions: [school], joinedProjectsCount: 1,
    skill_progress: { total_xp: 1500, domains: [
      { domain: 'Art', total_xp: 1150, subdomains: [
        { subdomain: 'Aesthetics & Visual Design', total_xp: 800 }, { subdomain: 'Animation & Effects', total_xp: 350 }] },
      { domain: 'Game Design', total_xp: 350, subdomains: [{ subdomain: 'Core Gameplay & Mechanics', total_xp: 350 }] }] },
    metadata: { about_me: 'I draw characters and I am learning to put them in real games.', interests: [INTEREST.art, INTEREST.adventure] } }),
  youthNoConsent: person({ id: 303, username: 'QuietLynx318', first: 'Zoe', last: 'Chen', age: 13, location: 'CA-BC',
    roles: [ROLE.projectMember, ROLE.cohortMember], institutions: [school] }),
  graduate: person({ id: 304, username: 'sam', first: 'Sam', last: 'Okafor', age: 19, location: 'US-GA',
    roles: [ROLE.projectMember, ROLE.projectLeader, ROLE.cohortMember], joinedProjectsCount: 3, certificatesCount: 1,
    github_user: { login: 'sam--okafor' },
    metadata: { about_me: 'Finished Game Making 101 last season and never stopped. Now building Moss Golem, a cozy adventure that started life as my game jam entry.' } }),
  flagged: person({ id: 305, username: 'RowdyBadger907', first: 'Tyler', last: 'Brooks', age: 15, consent: true, location: 'US-OH',
    roles: [ROLE.cohortMember] }),
  restrictedPartner: person({ id: 306, username: 'GentleFalcon655', first: 'Amara', last: 'Diallo', age: 16, consent: true, location: 'US-NY',
    roles: [ROLE.projectMember, ROLE.cohortMember], institutions: [partner], is_restricted_partner_account: true, joinedProjectsCount: 1,
    metadata: { about_me: 'Sound and music are my thing. Learning game making at Horizon.', interests: [INTEREST.sound] } }),
  youthTurnedAdult: person({ id: 307, username: 'DriftingHare627', first: 'Riley', last: 'Park', age: 18, category: 'digital_youth',
    consent: true, location: 'CA-ON', roles: [ROLE.cohortMember] }),
  disabled: person({ id: 308, username: 'HastyJackal509', first: 'Hunter', last: 'Voss', age: 21, location: 'US-FL',
    disabled: true, roles: [ROLE.cohortMember] }),
}
```

Counts follow the demo's story; the app computes them, so treat them as display values.

| Key | Person | `$auth` reports | For |
| --- | --- | --- | --- |
| `platformAdmin` | Peter Parker (`demoadmin`) | `isAdmin`, `isLeader`, `isProgramAdmin`, `isCohortAdmin` | platform administration |
| `programAdmin` | Priya Raman | `isProgramAdmin`, `isCohortAdmin` | program staff, who also run every cohort of their programs |
| `mentor` | Marcus Webb | `isLeader` | mentor and game leader |
| `contentEditor` | Sofia Delgado | `isEditor` | resource pages, the leader area without program powers |
| `institutionAdmin` | Evelyn Cho | `isInstitutionAdmin`, `isCohortAdmin` | educator and facilitator of a school cohort |
| `partnerAdmin` | Dana Whitfield | `isInstitutionAdmin`, `isCohortAdmin` | restricted-partner staff |
| `programManager` | Jonah Mercer | `isProgramManager` | program manager (no demo persona) |
| `firstRun` | Noah Tremblay | `isAdult` | first run and empty states |
| `learner` | Maya Flores (demo) | `isMinor` | the happy-path youth, consent granted |
| `youthNoConsent` | Zoe Chen | `isMinor` | every consent-gated state |
| `graduate` | Sam Okafor | `isLeader`, `isAdult` | completed program, certificate, leads a game |
| `flagged` | Tyler Brooks | `isMinor` | a flagged post, author's seat |
| `restrictedPartner` | Amara Diallo | `isMinor` | restricted-partner learner |
| `youthTurnedAdult` | Riley Park | `isMinor` | adult by birthday, still stored as youth |
| `disabled` | Hunter Voss | | rosters and admin lists only: a disabled account cannot sign in |

## Variants

- **Facilitator without an institution role**: `{ ...users.institutionAdmin, roles: [ROLE.cohortAdmin], institutions: [] }`.
- **Program Admin who runs no cohort** (outside the demo, where every program admin runs each cohort): `{ ...users.programAdmin, roles: [ROLE.programAdmin] }`.
- **Program Manager who has created cohorts**, and so facilitates them: `{ ...users.programManager, roles: [ROLE.programManager, ROLE.cohortAdmin] }`.
- **Riley after signing in**, reclassified: `{ ...users.youthTurnedAdult, age_category: 'adult', full_name: 'Riley Park' }`; the consent stays granted.
- **Unclassified**: `{ ...users.firstRun, age_category: null, full_name: 'Noah' }`. The app treats it as a minor; the stand-in's `isMinor` does not.
- **Someone else's view of a user** (a profile or roster): `email`, `location`, `metadata.birthday` and `metadata.discord_username` become `null`, and `has_parental_consent` and `is_restricted_partner_account` `false`.
- **Signed out**: `user: null`.

## The presets

`'learner'`, `'mentor'` and `'admin'` are adults with `public: true` and a password sign-in:

| Preset | Person | `roles` |
| --- | --- | --- |
| `'learner'` (default) | Ana Souza, `ana.learner` | 2 `Member` |
| `'mentor'` | Marco Lima, `marco.mentor` | 2 `Member`, 5 `Mentor` |
| `'admin'` | Alex Reis, `alex.admin` | 2 `Member`, 1 `Admin` |

They lack `full_name`, `role_ids`, `has_parental_consent`, `location`, `isMentor`, `skill_progress` and every `metadata` field but `image_url` and `interests`. Their role names differ from the stored `Project member` and `Project mentor`, the learner holds no cohort role, and none is a youth, a partner, unclassified or disabled. Use them where only "a signed-in learner, mentor or admin" matters.
