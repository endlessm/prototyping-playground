# Data shapes

How the stand-ins answer a view's sample, the rules every response follows, what the copied components read, and the shapes they most often need. Verified against the stand-ins in `runtime/`, the copied components (app revision `11517cbee`, 25 September 2026) and the app's schema and test fixtures on `dev` (`eaa7d5f`, 5 November 2026). Values for enums and permissions are in [state enums](state-enums.md); users are in [users by role](users-by-role.md).

## How the stand-ins answer

GraphQL (`runtime/graphql.ts`, `streaming-graphql.ts`, `composables.ts`):

- `sample.queries` is keyed by operation name: the name after the first `query`, `mutation` or `subscription` in the document, or the first field of an anonymous one. Two documents with one name share a response.
- A response is the operation's `data` object, or a function `(variables) => data`, rerun when the variables change.
- `$graphqlRequest.query` and `.mutate` resolve to `{ data }`, with `data: {}` when there is no sample. A sample function that throws rejects the call: the only way to show a failed request (see Errors below).
- `useGraphQLQuery` unwraps `data` when it has exactly one key (`flattenData`, on by default), then applies `transform`. An extra top-level key, even `__typename`, stops the unwrap.
- Auth decides before the sample: `required` (the default) gives the query's `default()`, or `[]`, to a signed-out screen; `anonymous` does the same for a signed-in one; `optional` always answers.
- `status` is always `success` and `error` null: loading and error states of a query can't come from a sample.
- `useStreamingGraphQLQuery` takes the first value of the response as its one page of items, has no further pages, and is empty signed out. `InfiniteScroll` hands each item to its slot as `{ item, index }`, keyed by `item.id`.
- `useNotificationsCount` is the `NOTIFICATIONS_COUNT` query: `{ getUnreadNotificationsCount: { unread_notifications_count: 2 } }`. The shell's sidebar and top bar ask for it, so every signed-in `shell: true` screen needs it.

Store (`runtime/store.ts`):

- `state` deep-merges over the app's initial state: objects merge, arrays and values replace. The initial state is `user` (`joinedIndividualProgramsIdsSet`, `joinedTeamsProgramsIdsSet`, `adminForProgramsIdSet`, `individualPrograms`, `teamPrograms`, `completedOnboarding: true`), `loading`, `modalsControl.currentOpenModal { id, show, data }`, `newFeed` and `systemNotificationCount`.
- `getters` are plain values, not functions. The app's store has none.
- `mutations` are `(state, payload) => void`; `actions` are `({ state, commit }, payload) => result`. The app's own actions (`openModal`, `closeModal`, `getUserData`, `setPreferredLanguage`, `joinProject`, `getMyPrograms`, `addNewFeed`, `triggerSystemNotifications`) never run, so their queries never fire: put the state they would have set into `state`.

## Response rules

- **Keys are response keys.** An alias renames the field in the response: `member_count: participants_count(…)` arrives as `member_count`. Nested aliases count too.
- **Only what is selected.** Give the fields the document asks for; the component reads nothing else.
- **Unions need `__typename`.** `getUserByUsername` returns `User` or `LimitedUser` (only `id`, `username`, `public`, `metadata.image_url`), the private-profile view.
- **`Void` is `null`.** A null mutation result is success (`setUserNotificationSeen`, `logout`, most deletes).
- **A lookup can be null.** `getProgramById`, `getCohortById`, `getProjectBySlug` and their kin return `null` for not found or not visible: the screen's not-found state.
- **Short lists are scope.** An empty or partial list is a normal answer, not an error.
- **Legacy types are nullable.** `Program.id` is nullable, `Cohort.cohort_status` is not. Leave a field null only when the state means it.
- **Ids differ by type.** Most are integers; `EventInstance.id` is a string built from the event and its start. Give different entities different numbers, as the app's shared id space does.
- **Field case.** Fields are snake_case, except `joinedProjectsCount`, `certificatesCount`, `memberOfProjects`, `leaderForProjects`, `mentorForProjects`, `adminForPrograms`, `managerForPrograms` (dev), `taskProgressLog`, `newsFeeds`, `pageInfo`, `totalCount`, and the quiz and dashboard types, which are camelCase throughout (`releaseId`, `quizTitle`, `questionCount`).
- **Times.** `DateTimeStr` arrives as `toISOString()` output, ending in `Z`: `'2026-10-29T15:04:00.000Z'`. `DateStr` is `YYYY-MM-DD`: birthdays, and cohort dates on dev.
- **Media.** Image fields hold absolute URLs or `null`. `null` shows the app's placeholder, such as the default profile picture or the program tile's background. For a picture, import an image file in the view and use its URL.
- **Files.** A `File` has no `id`; its key is `file_instance_id`. `file_url` stays `null` until `malware_status` is `NO_THREATS_FOUND`.
- **Other viewers see less.** Unless the viewer is the user or an Admin, `email`, `location`, `metadata.birthday` and `metadata.discord_username` are `null`, and `is_restricted_partner_account` and `has_parental_consent` are `false`.
- **`full_name` is the display name.** It is first plus last name for adults, and the first name alone for digital youth and unclassified users.
- **Text is translated.** The app receives `name`, already in the user's language; a few types also carry `ln_*` maps.
- **Errors.** The app's request plugin throws an error whose `message` is the first error's message and whose `response.errors[0].extensions.code` is one of `BAD_USER_INPUT`, `UNAUTHENTICATED`, `FORBIDDEN` (a policy denial, or `User disabled`), `NOT_FOUND`, `CONFLICT`, `LIMIT_EXCEEDED` (a business cap, such as enrollment or task slots) or `INTERNAL_SERVER_ERROR`. Throw that shape from a sample function: `Object.assign(new Error('Forbidden'), { response: { errors: [{ message: 'Forbidden', extensions: { code: 'FORBIDDEN' } }] } })`.

## Copied components

What each copied component reads at `11517cbee`. Recheck after the copy is refreshed.

| Component | Reads | Sample |
| --- | --- | --- |
| `App/StudioSidebar`, `App/StudioTopBar` (shell) | `$auth.user.username`, `metadata.image_url`, role checks for the Admin menu; `NOTIFICATIONS_COUNT` | `queries.NOTIFICATIONS_COUNT` |
| `Notifications/index` → `List` → `NotificationTile` | `NOTIFICATIONS_LIST` (streaming, signed in only); `SET_NOTIFICATION_SEEN` when the pointer leaves an unseen tile; dispatches `closeModal` and `openModal` for task notifications | queries; `actions.openModal`, `actions.closeModal` |
| `App/StudioFooter` | dispatches `setPreferredLanguage` on a language click; a returned value shows as an error | `actions.setPreferredLanguage` returning nothing |
| `Dashboard/UpcomingEvents` | `UpcomingEventInstances` (auth optional): `id`, `title`, `start`, `event.id` | `queries.UpcomingEventInstances` |
| `Program/ProgramTile` | props `program` (`id`, `name`, `short_description`, `image_url`, `program_kind_id`, `program_status_id`, `tasks_count`), `cohorts` (`id`, `name`), `isMine`, `isLeaderView` | props |
| `Generic/UserCard` | prop `user`: `username`, `full_name`, `disabled`, `metadata.image_url` | props |
| `Profile/UserProfileCard` | prop `user`: `metadata` (required: read unguarded), `metadata.image_url`, `metadata.interests`, `public`, `username`, `joinedProjectsCount`, `certificatesCount`, `created_at`; `canEdit`, `minimal` | props |
| `Profile/UserProfile` | `$auth.user`: `id`, `username`, `metadata.about_me`, `metadata.image_url`, `metadata.interests`, `isMentor` | user |
| `Dashboard/Hero`, `OnboardingCard`, `ProgramTileEmpty`, `Generic/ZeroState`, `App/AppPage`, `AppSimplePage`, `shared/AccessCode`, `Generic/UserAvatar`, `Profile/UserBadges` | props, and `$auth.loggedIn` | props |

## Common shapes

Field lists follow the schema on dev; select what the document asks for. The people and things are from the [demo cast](demo-cast.md).

**Program**, as the home page's program query (`me { cohort_programs { … } }`) and `ProgramTile` take it:

```js
{ id: 9101, name: 'Game Making 101', short_description: 'Learn the full journey of making your first game — design, art, sound, and code.',
  image_url: null, program_kind_id: 'regular', program_status_id: 'inprogress', tasks_count: 10,
  my_cohorts: [{ id: 9111, name: 'Maple Ridge — Spring' }] }
```

A program page adds `description`, `logo_url`, `program_type`, `read_access`, `can_join`, `is_joined`, `can_member_create_project`, `dashboard_enabled`, `admins_ids`, `participants_count`, `my_cohort`, `my_cohorts` and `permissions { join post submit_task create_project }`. `role_id` is the viewer's role there: 14 or 23 for a program role, else 22 or 21 from their cohort, else `null`.

**Cohort** (`getCohortById`, `my_cohort`):

```js
{ id: 9111, program_id: 9101, name: 'Maple Ridge — Spring', cohort_status: 'in_progress',
  start_date: '2026-09-21', end_date: '2026-12-20', timezone: 'America/Vancouver',
  institution_id: 9301, institution_name: 'Maple Ridge Secondary School', role_id: 22,
  participants_count: 4, program: { id: 9101, name: 'Game Making 101' } }
```

**Roster rows.** A cohort's `participants` (`CohortUser`): `id`, `username`, `first_name`, `middle_name`, `last_name`, `email`, `cohort_id`, `cohort_role_id` (21 or 22), `pace_type_id`, `signup_code` (an invented code), `joined_at`, `certificate_id`, `has_certificate`, `metadata.image_url`. A program's `participants` (`ProgramUser`) carry `role_ids`, `roles`, `program_role_id` (14, 23, 22 or 21) and `last_activity_at` instead of the cohort fields.

**Game** (`Project`):

```js
{ id: 9201, slug: 'starlight-drifters', name: 'Starlight Drifters',
  short_description: 'Drift a tiny ship between dying stars, trading light for fuel — a cozy space adventure made by this community.',
  status_id: 'showcase', game_phase: 'live', tech: 'godot', complexity_level: 'beginner',
  application_type: 'application_required', featured: true, home_page_banner: true, feedback_requested: false,
  image_url: null, thumbnail_image_url: null, participants_count: 5, members_count: 4,
  is_member: false, is_leader: false, is_mentor: false, is_joined: false, has_applied: false, discord_url: null,
  permissions: { join: 'application_required', post: 'not_member', submit_task: 'not_member', discord: 'allowed', publish: false } }
```

People lists (`leaders`, `members`, `mentors`) hold users with `id`, `username`, `metadata.image_url`.

**Task** and its instance:

```js
{ id: 9401, name: 'Design Your Hero', short_description: 'Create a character sheet and a first sprite for your hero.',
  status_id: 'published', due_date: null, ip_license_required: false, is_auto_completed: false, sort_order: 3,
  permissions: { submit: 'allowed' } }
// UserTask
{ id: 9501, task_id: 9401, user_id: 302, cohort_id: 9111, user_task_status_id: 'inprogress', is_active: true,
  created_at: '2026-10-22T16:10:00.000Z', updated_at: '2026-10-31T18:45:00.000Z' }
```

`Task.status_id` is `draft` or `published`; the instance statuses are in [state enums](state-enums.md#statuses).

**Notification** (`NOTIFICATIONS_LIST`, root field `getUserNotifications`):

```js
{ getUserNotifications: [
  { id: 9601, user_id: 302, notification_id: 9611, seen: false, created_at: '2026-11-04T09:12:00.000Z',
    notification: { id: 9611, object_id: 9401, object_type_id: 'task', notification_type_id: 'taskapproved',
      title: 'Your task has been approved', message: 'Your task "Design Your Hero" has been approved',
      redirect_url: '/user_tasks/9501', image_url: null } } ] }
```

Other English texts the app receives: "New task created" / `The new task named "…" was created in project "…"`, "New feedback to your task update" / `New feedback for task "…"`, "Certificate awarded" / `You earned a certificate for program "…"`, "New Mention" / `… mentioned you in a post`. `redirect_url` paths: `/tasks/<id>`, `/user_tasks/<id>`, `/group_tasks/<id>`, `/posts/<id>`, `/games/<slug>`, `/programs/<id>`, `/teams/<id>`. For the four task types (`newtask`, `newfeedbacktotaskupdate`, `taskapproved`, `taskdeadline`) the tile opens the task modal with the number that ends the path instead of following the link.

**Event instance** (`upcomingEventInstances`):

```js
{ id: '9701-2026-11-13', title: 'Studio Live', start: '2026-11-13T00:00:00.000Z',
  end: '2026-11-13T01:00:00.000Z', tz: 'America/Los_Angeles', description: 'Our weekly community livestream.', event: { id: 9701 } }
```

The `id` is opaque: any string unique in the list.

**Post** (`ObjectFeed`):

```js
{ id: 9801, object_feed_type_id: 'question', created_at: '2026-10-31T17:20:00.000Z', is_pinned: false,
  description: 'How do you all keep your pixel art consistent? Do you use a fixed palette or something?',
  user: { id: 302, username: 'SunnyOtter512', metadata: { image_url: null }, roles: [{ id: 21, name: 'Cohort Member' }] },
  comment_count: 2, comments: [{ id: 9811, description: 'Pick one palette of about 16 colors and treat it as a rule.',
    created_at: '2026-10-31T18:02:00.000Z', user: { id: 202, username: 'priya', metadata: { image_url: null } } }],
  likes: [{ id: 9821, user_id: 307, like_type: 'HEART' }, { id: 9822, user_id: 309, like_type: 'THUMBS_UP' }],
  files: [], links: [], flagged_by_user: null }
```

`flagged_by_user` is asked for only by admin views.

**Skill progress** (`User.skill_progress`): `{ total_xp, domains: [{ domain, total_xp, subdomains: [{ subdomain, total_xp }] }] }`, with domain and subdomain names from [Skills and recognition](../../../context/skills-and-recognition.md).

**Quiz releases** (`me { quiz_releases(input) }`): `{ timezone, releases: [{ releaseId, quizTitle, questionCount, deadline, closedAt, status, attemptId }] }`; `attemptId` is `null` until the learner starts.

## Copy revision and dev

The copy is `11517cbee`; `dev` is `eaa7d5f`. What changes a sample:

- `Cohort.start_date`, `end_date` (and `UserCohort`'s) are `DateTimeStr` at the copy and `DateStr` on dev.
- Dev removed `getProfileForUser` with its `UserProfile | LimitedUserProfile` union (`UserProfile` carried `isMentor`, which `Profile/UserProfile` still reads) and the `PublicProject` type: signed-out project queries answer with `Project`.
- Dev added `User.managerForPrograms` and `User.institutionsWithRoles` (`[{ institution, role_id, role_name }]`), and dropped `UserMetadata.show_intake_form`.
- Dev has replaced `Generic/UserCard.vue`; recheck its row after a refresh.
