---
title: Platform Model
description: Who can do what on Endless Studios, for choosing a view's actions, gates and labels. Covers the containers (institution, program, cohort, game), account types and age, role names and IDs, a role-by-action table, the actions that wait for parental consent, the sign-up order, the proposed Teams, and each thing's UI and code name.
---

Sources: the app, `Endless-Game-Making-Studio/studio` `dev` at `eaa7d5f` (5 November 2026): its permission rules for institutions, programs, cohorts, enrollment codes, games, tasks, quizzes, certificates and parental consent, its GraphQL schema, the account service's sign-up and sign-in flow, and its English locale. This system's copy (`11517cbee`, 25 September 2026) for the `$auth` stand-in, the sidebar and every string cited. The Institutions and Teams roles study and its glossary (14 October 2026), checked against `dev`. The playground's `docs/brain` at `ffe336d` (9 September 2026): Company & Platform Overview and Community Needs.

## Choosing the person a view is for

**Today** is the app at `dev`. **Rule** is a standing company rule from the playground's docs. **Proposed** is planned and not built. Unlabelled facts are Today.

1. Name the container the screen is about (institution, program, cohort or game) and the person's role in it. People hold roles per container: Facilitator in one cohort, Learner in another. `$auth.isProgramAdmin`, `isCohortAdmin` and the other checks are true when the person holds that role anywhere. They suit navigation, not a screen's actions. A screen's actions come from its own data: `role_id` on a program or cohort (the viewer's role there, or `null`) and the `permissions` object on programs, games, tasks and users. [Data shapes](../skills/write-sample-data/references/data-shapes.md) has the fields and [state enums](../skills/write-sample-data/references/state-enums.md) their values.
2. Choose the account type and age category. They gate actions whatever the role.
3. Show an action only to the roles that "Who can do what" gives it. When the account type or missing consent blocks an action the role allows, keep the control in view, locked, with its reason ("Gated actions").
4. Pick the signed-in user. `user: 'admin'` (Alex) is a sitewide Admin. The `learner` (Ana) and `mentor` (Marco) samples hold no program or cohort role. Ready-made users for each role are in [Users by role](../skills/write-sample-data/references/users-by-role.md).

**Assumption** (from what each role can do, not a product rule): the nearest role today for each type in [User types](user-types.md).

| User type | Nearest role today |
|---|---|
| Young learner by choice, at school; adult learner | Learner in a cohort. Restricted Partner when the school's institution is restricted. |
| Classroom educators; independent non-formal educator | Facilitator of their class's cohort. Manager to set up cohorts of their own. |
| Partner facilitator | Facilitator. |
| Partner program leader | Manager, or Program Admin of the partner's own program. Institution Admin to manage the partner's accounts. |
| Reporting partner or buyer | Program Admin, the only role besides Admin that sees a program's dashboard. **Gap:** no read-only reporting role exists. |

## Containers

Institution → Program → Cohort → people, with games made inside cohorts or on their own.

- **Institution**: a partner organization, such as a school or NGO. It has Institution Admins and members; the schema calls the members `students` (label "Student").
  - `restricted_partner`: its members' accounts are Restricted Partner accounts, and it keeps an allowlist of the programs they may join.
  - `email_domains`: a new account whose email address is on one of these domains joins the institution.
- **Program**: a curriculum run many times. It may belong to one institution. For the catalog and enrollment, see [Programs](programs.md).
- **Cohort**: one run of a program, with its people and dates. It belongs to one program. It may carry an institution: the program's own, or any institution when the program has none. Redeeming a cohort's enrollment code also adds the person to the cohort's institution.
- **Game** (code `project`): made by its members. It may sit in a cohort, and through it in the cohort's program. A game can't move to another program.

**Proposed** (overview doc): the platform hosts several content providers beside institutions, and every game, course and certificate shows the provider that owns it. Today Endless Access is effectively the only provider; the certificate reads "Endless Access celebrates that" (`certificate.endless_access_celebrates_that`).

## Account types and age

Every account has an account type and an age category, set independently.

**Restricted Partner** (label "Restricted Partner", `is_restricted_partner_account: true`) is any account in an institution flagged `restricted_partner`, however it joined. Such accounts can be created in bulk from a CSV file. The account is siloed: its profile and what it makes are visible only to people who share a restricted-partner institution with it, and to Admins. It can't:

- create or join games; an Institution Admin of its institution, or an Admin, can add it to a game as a Member;
- post, comment or like in feeds;
- join a program missing from its institution's allowlist;
- change its email address.

Its locked controls open "Want to keep going on your own?", "Your {institution} account is set up for your program only." and "You can create a personal account for yourself and unlock all features available in the platform." (`restricted_partner_data.*`). Every other account is a personal account.

**Rule** (overview doc): Restricted Partner serves US schools under the NDPA. What a learner makes there is student data the school owns. It stays siloed and moves to a personal account only when the learner starts the transfer. **Gap:** the app has no transfer flow; the message above points to a separate personal account.

**Age category** (`age_category`) comes from the date of birth and k-ID's thresholds for the region the person signs up from. When the region is unknown, the defaults are 13 and 18.

- Below the region's digital-consent age: no account. Sign-up stops on an age-restricted page ("You are too young to use this service.", `age_limit_error`).
- `digital_youth` (label "Digital Youth"): from that age to below the civil age, 13 to 17 by default. Only the first name shows, never the last. The username is generated at sign-up and can be regenerated, not typed. Until a parent consents, only Admins see the profile, and others see the person only on the member lists of their own cohorts and programs.
- `adult`: at or above the civil age.
- `null`: no birthday on record yet. `$auth.isMinor` is true and only the first name shows; the consent gates don't apply. The account service asks for the birthday at the next sign-in.

The date of birth is self-declared at sign-up. Afterwards the person can't change it ("To update your birthday, please contact support.", `to_update_birthday_contact_support`); an Admin can.

## Gated actions

A digital youth without parental consent can't:

- add or change a profile picture or cover image (the user's `permissions.profile_images`);
- change their username ("A parent must give permission before you can change your username.");
- make their profile public (`permissions.publish_profile`; "To make it public, please ask a trusted adult for consent");
- open a game's Discord server (the game's `permissions.discord`);
- start or submit a task marked IP License Required (the task's `permissions.submit`).

Each answers `parental_consent_required`. Apart from these and the hidden profile, nothing in the app waits for consent. For what consent involves and who the under-18 learners are, see Safeguarding in [User types](user-types.md).

The app keeps a gated control in view: a `UButton` with `color="kids"`, `variant="gating"` and a trailing `i-lucide-shield` (consent) or `i-lucide-lock` (Restricted Partner). Its tooltip says "Parental consent required. Click for more information" (`kid_challenge.restricted_feature_click_for_more_information`) or "Restricted feature. Click for more information" (`restricted_partner_data.restricted_feature_click_for_more_information`). Clicking starts the consent request or opens the Restricted Partner message. For colour, see [App conventions](app-conventions.md).

**Discord.** Today the app hides a game's Discord link from a digital youth without consent and from signed-out visitors. **Rule** (overview doc, Community Needs), stricter than the app: never invite, encourage or reward a minor to use Discord, even with consent. Discord is the home of the 18+ contributor community, and minors stay on the platform. **Gap:** the profile form shows every account a Discord username field with the hint "Be part of our community in Discord"; leave that invitation out of a view a digital youth sees.

## Roles

Program, game, institution and sitewide roles share one ID space; cohort roles have their own.

| ID | Stored name | Held in | UI label | `$auth` check |
|---|---|---|---|---|
| 1 | Admin | the whole platform | | `isAdmin` |
| 19 | Content Editor | the whole platform | Content Editor | `isEditor` |
| 20 | Institution admin | an institution | Institution Admin | `isInstitutionAdmin` |
| 14 | Program Admin | a program | Admin | `isProgramAdmin` |
| 23 | Program manager | a program | Manager | `isProgramManager` |
| 22 | Cohort Admin | a cohort | Facilitator | `isCohortAdmin` |
| 21 | Cohort Member | a cohort | Learner | `hasRole(21)` |
| 3 | Project leader | a game | Leader | `isLeader`, also true for Admin |
| 5 | Project mentor | a game; also a sitewide flag | Mentor | |
| 2 | Project member | a game; an institution | Member; Student | |

Who grants each:

- Admin, Content Editor and the sitewide Mentor flag: an Admin, in the person's user settings. What the sitewide Mentor flag unlocks is unverified.
- Institution Admin: an Admin. Institution membership: an Admin, a matching email domain, or an enrollment code for the institution or for one of its cohorts.
- Program Admin and Manager: an Admin directly, or a program enrollment code, which only a Program Admin creates.
- Facilitator: a Program Admin, or a Facilitator of the same cohort, directly or with a Facilitator enrollment code. A Manager becomes Facilitator of each cohort they create.
- Learner: a Learner enrollment code, a Program Admin or Facilitator adding them, or a CSV import.
- Game Leader: the game's creator. Adding another Leader or a Mentor is Admin only.

An enrollment code keeps working only while its creator could still grant what it gives: a demoted Program Admin's or a removed Facilitator's codes stop working.

## Who can do what

An Admin can do everything, so the table leaves them out. "Own" means in the cohorts where the person is Facilitator.

| Action | Program Admin | Manager | Facilitator | Learner |
|---|---|---|---|---|
| Edit the program's settings and scoring | ✓ | | | |
| Create program enrollment codes (Admin or Manager) | ✓ | | | |
| Create a cohort | ✓ | ✓, and becomes its Facilitator | | |
| Edit or delete a cohort: name, dates, status | ✓ | | | |
| See the program's cohorts | all | own | own | their own |
| See a cohort's member list | ✓ | own | own | their own; others' emails hidden |
| Add or remove cohort members; switch Learner and Facilitator | ✓ | own | own | |
| Create cohort enrollment codes (Learner or Facilitator) | ✓ | own | own | |
| Import accounts from a CSV file | into the program or its cohorts | own | own | |
| Create, edit, delete and assign program tasks | ✓ | | | assign to themselves |
| Review task progress: approve or send back | ✓ | own | own | submit their own |
| Write, publish and archive quizzes | ✓ | | | |
| Release a quiz; set its deadline, close, reopen; see results | ✓ | own | own | take a released quiz |
| Issue a program certificate | ✓ | own | own | see their own |
| See a dashboard | the program's | own cohorts' | own cohorts' ("Facilitator Dashboard") | their own ("My Dashboard") |
| Edit or delete others' feed posts and comments; clear flags | ✓ | | | |
| Edit a game in the cohort | ✓ | own | own | as the game's member |
| Publish or archive a game in the cohort | ✓ | own | own | |
| Add or remove a game's Members | ✓ | own | own | as the game's Leader |

A Program Admin also reads the list of institutions, to attach one to a cohort. A Manager has no admin entry in the copied `StudioSidebar` until they run a cohort (**Gap**).

**Institution Admin**, for members of their own institution only:

- read the institution's members and enrollment codes;
- edit or delete a member's account, or remove its sign-in methods;
- see a member's full profile, even when private;
- start a program for a member;
- add a member's Restricted Partner account to a game, as a Member.

The role gives no power over programs, cohorts or their codes; an Institution Admin who runs a program also holds Program Admin in it. Creating and editing institutions, their admins and members, and a restricted institution's allowlist are Admin only.

**Games**, whether in a cohort or not:

- Any signed-in person can create a game and becomes its Leader. Inside a program, that needs the program to let members create games (`permissions.create_project`).
- People join and leave a game themselves, as the game allows: open, by application or closed (`permissions.join`).
- The game's Members and Leaders edit it; its creator deletes it.
- Leaders create and edit the game's tasks. Leaders and Mentors review progress on them.
- Leaders, the Facilitators of the game's cohort and the Program Admins of its program add and remove Members.
- Only the Facilitators of the game's cohort, the Program Admins of its program and Admins publish or archive it (`permissions.publish`). A game outside a cohort is published by an Admin.

**Feeds:** members of a program or game post in its feed. Signed-in people comment and like, and members flag. Authors edit and delete their own posts; Program Admins moderate.

**Content Editor:** sees every program, whatever its access setting, and manages the Resources library and its categories. The sidebar's admin area also lists Feed Console, Users and Events for them.

## Sign-up and sign-in

Sign-up runs in this order:

1. Date of birth. Below the region's digital-consent age, it stops on the age-restricted page.
2. A digital youth acknowledges a safety notice; an adult confirms the age the date gives.
3. Method: email and password, or Google, GitHub or Microsoft.
4. Terms of use.
5. Email and password, or the provider's sign-in.
6. Profile: first name, last name and username. The username is generated; an adult may edit it, a digital youth may only regenerate it.
7. Email verification with a one-time code. A provider's address arrives verified.

An enrollment code in the sign-up link (`signup_code`) enrolls the new account as the code says.

Sign-in takes an email address or username with a password, or one of the three providers. Before it finishes, the account service asks for a missing birthday, for acceptance of the terms, and for email verification if still pending.

The account service serves these screens outside the Vue app, so the copy has no components for them. Build a view of them from Nuxt UI components, following [App conventions](app-conventions.md).

## Proposed: Teams

From the 14 October 2026 study. Nothing here is built.

- A Team is a workspace inside an institution, where Program Managers share cohorts with their Facilitators, Learners and enrollment codes. Each cohort belongs to exactly one Team. A person may belong to several Teams and switches between them with a picker at the top; everything happens in the active Team. Teams share nothing.
- **Team Owner**: the Program Manager who founded the Team. A Program Manager who joins without an invitation gets a Team of their own; anyone may create more. On top of a Member's powers, the Owner invites Program Managers, removes Members, renames the Team, transfers ownership to a Member, and deletes the Team once its cohorts move to another. The Owner is told when removing a Member leaves a cohort without a Facilitator. An Owner sees no other Team, even in the same institution.
- **Team Member**: a Program Manager an Owner invited. Sees everything in the Team, creates cohorts in it and has a Facilitator's powers in its cohorts. Can't invite, remove, rename, transfer or delete. A removed Member loses the Team and every Facilitator role in its cohorts; the cohorts stay.
- An Institution Admin is Owner of every Team in their institution.
- Facilitator stays a role per cohort. Out of scope: a Facilitator role for a whole Team, and a cohort shared by two Teams.
- Moving over: each current Program Manager gets a Team holding the cohorts they created.

The Educator Onboarding prototype's "co-teacher" is a Team Member and maps to nothing today. The nearest is a second Facilitator in the same cohort, who sees and manages that cohort's learners only. A Manager creates cohorts but sees no one else's.

## Words

Use the UI name in copy; use the code name in samples and when pointing at code.

| UI name | Code name | Note |
|---|---|---|
| Game | `project` | Some strings still say "Projects"; see Words in [Voice and tone](voice-and-tone.md). |
| Enrollment code | `signup_code` | Also the sign-up link's parameter. Some team documents say "Signup Code"; copy says "Enrollment code". |
| Facilitator | Cohort Admin (22) | A role in one cohort. Not the user type "facilitator or program leader for a partner" in [User types](user-types.md). |
| Learner | Cohort Member (21) | A role in one cohort. |
| Student | institution member (`students`, role 2) | Membership of an institution, not a cohort role. |
| Admin, Manager (program Users tab) | Program Admin (14), Program manager (23) | Roles in one program. Write "Program Admin" where "Admin" alone could mean the sitewide Admin. |
| Admin | Admin (1) | Sitewide. The Prototyping Playground's own [glossary](../../../../GLOSSARY.md) uses "Admin" for a studio contributor role, unrelated to this one. |
| Institution Admin | Institution admin (20) | |
| Leader, Mentor, Member | Project leader (3), Project mentor (5), Project member (2) | Game roles. |
| Content Editor | Content Editor (19) | Sitewide. |
| Restricted Partner | `is_restricted_partner_account`; the institution's `restricted_partner` | An account type, not a role. |
| Digital Youth | `age_category: 'digital_youth'` | An age category, not a role. |
| Cohort | `cohort` | Admin screens. For learner copy, see Words in [Voice and tone](voice-and-tone.md). |
| Team | `group_type: 'team'`; a game's members | Already two meanings: learners taking a program together ("team programs"), and a game's members ("Team", "Invite other users to join your team"). The proposed Team would be a third; its name is open. |
| Content provider | | The overview doc calls it a "studio", which collides with Endless Studios and the Endless Prototyping Playground. |
