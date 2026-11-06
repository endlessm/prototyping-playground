# State enums

The status, kind and permission values the app receives, verbatim from the schema on `dev` (`eaa7d5f`, 5 November 2026), with the copy's revision (`11517cbee`) noted where it differs. What a program or cohort state means for people is in [Programs](../../../context/programs.md); XP, badges and certificates are in [Skills and recognition](../../../context/skills-and-recognition.md).

Values are lowercase snake_case, except five uppercase enums (`MalwareStatus`, `Like`, `TaskModes`, `GitHubPullRequestStatus`, `ParentalConsentResult`). Separators differ between sibling enums, so copy each value as written. Several statuses live in `String` fields; write the enum's value there all the same.

## Statuses

| Enum | Values | Field | Label key in the copied locale |
| --- | --- | --- | --- |
| `ProgramStatus` | `draft` `notstarted` `inprogress` `completed` `hidden` `archived` | `Program.program_status_id`, nullable (`ProgramTile` shows null as `inprogress`) | `program_status.<value>` |
| `ProgramKind` | `regular` `quest` `competition` `club` | `Program.program_kind_id` | `program_kinds.<value>` |
| `ProgramType` | `private` `public` | `Program.program_type` | |
| `ReadAccess` | `open` `restricted` | `read_access` on programs, games, posts and files | |
| `CohortStatus` | `not_started` `in_progress` `completed` | `Cohort.cohort_status` (non-null), `UserCohort.cohort_status` | |
| `PaceType` | `selfpaced` `setpaced` | `CohortUser.pace_type_id`, `UserProgram.pace_type` (both `String`) | |
| Task status (no enum) | `draft` `published` | `Task.status_id` (`String`) | |
| `UserTaskStatus` | `draft` `assigned` `unassigned` `inprogress` `needhelp` `inreview` `testing` `complete` | `UserTask.user_task_status_id`, `TaskProgress.user_task_status_id` (both `String`) | `task_status_List.<value>`: `assigned` "Started", `unassigned` "Abandoned", `complete` "Done"; none for `draft` |
| `ProjectStatus` | `draft` `published` `inreview` `complete` `showcase` `unlisted` `archived` `hidden` | `Project.status_id` (`String`) | |
| `GamePhase` | `recruiting` `pre_production` `production` `alpha` `beta` `live` `expansion` | `Project.game_phase` | `game_phase.<value>` |
| `Tech` | `unity` `unreal` `endstar` `godot` | `Project.tech` | |
| `ComplexityLevel` | `beginner` `proficient` `advanced` `pro` | `Project.complexity_level` | |
| `ApplicationType` | `application_not_needed` `application_required` `no_new_members` | `Project.application_type` | |
| `ProjectApplicationStatus` | `new` `approved` `declined` | `ProjectApplication.status` | |
| `QuizStatus` | `draft` `published` | `QuizSummary.status` | |
| `QuizReleaseStatus` | `available` `in_progress` `completed` `closed_untaken` | `QuizReleaseSummary.status`, the learner's list | |
| `QuizLearnerStatus` | `not_started` `in_progress` `completed` | `QuizReleaseResultRow.status`, the staff view | |
| `ObjectFeedType` | `announcement` `progress` `question` `tip` `misc` `feedback` | `ObjectFeed.object_feed_type_id` | |
| `Like` | `THUMBS_UP` `THUMBS_DOWN` `LAUGH` `HOORAY` `CONFUSED` `HEART` `ROCKET` | `ObjectFeedLike.like_type` (`String`) | |
| `MalwareStatus` | `NOT_SCANNED` `NO_THREATS_FOUND` `THREATS_FOUND` `UNSUPPORTED` `FAILED` | `File.malware_status` (non-null) | |
| `AgeCategory` | `digital_youth` `adult`, or `null` when unclassified | `User.age_category` | |
| `InterestType` | `learningfields` `gametypes` | `Interest.interest_type_id` | |
| `AuthMethod` | `password` `google` `microsoft` `github` | `User.auth_methods` | |
| `Language` | `en` `es` | `metadata.preferred_lang_id` | |
| `GitHubPullRequestStatus` | `PENDING` `ASSIGNED` `DISMISSED` | a pull request's `status` | |

Mind the pairs: a program is `inprogress` while its cohort is `in_progress`, and a program `notstarted` while a cohort `not_started`.

## Notification types

`Notification.notification_type_id` (`NotificationType`) takes 18 values: `newtask` `newproject` `newfeedbacktotaskupdate` `taskapproved` `taskdeadline` `projectnews` `projectnewapplication` `projectapplicationapproved` `projectapplicationdeclined` `userjoinedproject` `teamjoinedprogram` `userwasaddedtoteam` `objectfeedwasadded` `objectfeedcommentwasadded` `objectfeedlikewasadded` `new_object_feed_mention_added` `new_object_feed_comment_mention_added` `certificateawarded`.

The copied `NotificationTypeIcon` draws its own icon for `newtask`, `newproject`, `newfeedbacktotaskupdate`, `taskapproved`, `userjoinedproject`, `taskdeadline`, `projectnews`, `objectfeedcommentwasadded` and `new_object_feed_comment_mention_added`; any other type shows the new-task icon. The four task types open the task modal; the rest link to `redirect_url`.

## Permissions

Every permission is a reason string, compared to its exact value, except `Project.permissions.publish`, a real boolean: whether the viewer may publish or archive the game.

| Field | Values, and when each comes back |
| --- | --- |
| `User.permissions.profile_images`, `change_username`, `publish_profile` | `parental_consent_required` for a digital youth without consent, otherwise `allowed` |
| `Program.permissions.join` | `restricted_partner` when the viewer's partner does not allow the program; `allowed` when it is public and has a cohort open to joining; `code_required` when it is private, or public with only completed cohorts; `unavailable` when it has no cohort |
| `Program.permissions.post` | `restricted_partner` for any restricted-partner account; `allowed` for members; `not_member` |
| `Program.permissions.submit_task` | `allowed` for members; `not_member` |
| `Program.permissions.create_project` | `restricted_partner`; `allowed` for members when `can_member_create_project`; `not_allowed` |
| `Project.permissions.join` | `restricted_partner` for any restricted-partner account; otherwise by `application_type`: `not_allowed` for `no_new_members`, `application_required`, or `allowed` |
| `Project.permissions.post` | `restricted_partner`; `allowed` for members; `not_member` |
| `Project.permissions.submit_task` | `allowed` for members; `not_member` |
| `Project.permissions.discord` | `allowed` when the game has no Discord link; `not_authenticated` signed out; `parental_consent_required` for a digital youth without consent; `allowed`. `discord_url` is `null` unless `allowed` |
| `Task.permissions.submit` | `not_member` signed out; `parental_consent_required` for a digital youth without consent on an `ip_license_required` task, before membership counts; `allowed` for members; `not_member` |

A signed-out visitor reads a program's `join` as the program describes itself: public programs as above, private ones as `code_required` or `unavailable`.

## One story per state

The user and every entity's permissions describe the same person:

| State | User | Permissions the screen should see |
| --- | --- | --- |
| Signed out | `user: null` | `not_member` for posting and submitting, `not_authenticated` for Discord |
| Member learner | a cohort role (21) in `roles` | `allowed` to post and submit in their program, and in games they belong to |
| Youth without consent | `age_category: 'digital_youth'`, `has_parental_consent: false`, `public` not `true` | `parental_consent_required` on the three profile permissions, Discord links and IP-license tasks |
| Restricted partner | `is_restricted_partner_account: true` | `restricted_partner` for posting, creating and joining games, and joining programs outside the partner's list |
| Unclassified | `age_category: null` | consent gates come back `allowed`; the app still reports `$auth.isMinor` (the stand-in does not) |

## Copy revision and dev

Every enum the copy's schema has carries the same values on `dev`. Dev adds `CSVImportRowStatus` (`created` `enrolled` `existing` `failed`, a CSV import's rows), `TimeLocation` (`in_school` `out_of_school`, the dashboards' time panels) and the `timing` value of `ScoringComponentKey` (`quiz` at the copy).
