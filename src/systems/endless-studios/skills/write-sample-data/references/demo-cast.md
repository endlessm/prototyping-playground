# Demo cast

The fictional people, programs and games of the app's demo content on `dev` (`eaa7d5f`, 5 November 2026): what the team sees while developing the app. Write the learner Maya as "Maya Flores (demo)", apart from the Maya in [Personas](../../../context/personas.md). Paste-ready users are in [users by role](users-by-role.md); role meanings are in [Platform model](../../../context/platform-model.md).

## Staff

| Person | Username | Role | Shows |
| --- | --- | --- | --- |
| Peter Parker | `demoadmin` | Admin | platform administration and moderation |
| Priya Raman | `priya` | Program Admin of every demo program, so Cohort Admin of each cohort | program staff: tasks, cohorts, codes, reviews, certificates, moderation |
| Marcus Webb | `marcus` | Mentor; leads Starlight Drifters, mentors Moss Golem | the mentor listing, a staff-led showcase game |
| Sofia Delgado | `sofia` | Content Editor | the public resource pages; the leader area without program powers |
| Evelyn Cho | `evelyn` | Institution Admin of Maple Ridge Secondary School; Cohort Admin of its cohort | the educator: a school cohort and its codes |
| Dana Whitfield | `dana` | Institution Admin of Horizon Youth Center, a restricted partner; Cohort Admin of its cohort | restricted-partner staff: a limited catalog, no posting |

## Learners

| Person | Username | Age | State | Shows |
| --- | --- | --- | --- | --- |
| Noah Tremblay | `CuriousHeron742` | 18, adult | just signed up: no enrollments, posts or picture | first-run and empty states |
| Maya Flores (demo) | `SunnyOtter512` | 14, youth, consent | school cohort of Game Making 101: two tasks approved, one in progress, one started; about 1,500 XP, mostly Art; member of Starlight Drifters | the happy path |
| Zoe Chen | `QuietLynx318` | 13, youth, no consent | the school cohort; no picture | every consent gate: avatar, public profile, Discord, IP-license tasks |
| Sam Okafor | `sam` | 19, adult | completed Game Making 101 with its certificate; jam entrant; leads Moss Golem and the draft Crate Expectations; GitHub-linked | the aspirational end state |
| Tyler Brooks | `RowdyBadger907` | 15, youth, consent | self-paced cohort; a spam post flagged by Ethan, awaiting review | the moderation queue |
| Amara Diallo | `GentleFalcon655` | 16, youth, consent | Horizon Youth Center; Game Making 101 through its cohort; member of Starlight Drifters | the restricted-partner learner |
| Riley Park | `DriftingHare627` | 18 by birthday, stored as youth, consent | long-time Game Makers Club member, not signed in since turning 18 | reclassification at the next sign-in |
| Hunter Voss | `HastyJackal509` | 21, adult | disabled after repeated spam; still on the self-paced roster | a disabled account in rosters, counts and admin lists |

The background cast fills rosters, feeds and review queues, and nobody signs in as them (or as Hunter): Aisha Khan (`AmberFinch203`, 20), Ben Carter (`BoldTapir441`, 15), Chloe Nguyen (`CleverMarmot118`, 14), Ethan Rossi (`EagerPuffin334`, 22), Mia Santos (`MellowGecko568`, 16) and Wen Liu (`WittyCrane281`, 24). The youths among them have consent.

## Institutions

| Institution | Kind | People |
| --- | --- | --- |
| Maple Ridge Secondary School | public secondary school, British Columbia; regular partner | admin Evelyn; students Maya, Zoe, Ben, Chloe |
| Horizon Youth Center | after-school youth center; restricted partner allowed only Game Making 101, whose accounts cannot post, comment or react | admin Dana; students Amara, Mia |

## Programs

All public unless marked; Priya is Program Admin of each.

| Program | Kind · status · access | Cohorts and members | Shows |
| --- | --- | --- | --- |
| Game Making 101 | `regular` · `inprogress` · `open` | Self-paced (default, `selfpaced`): Sam (completed), Tyler, Ethan, Hunter, Aisha. Maple Ridge — Spring (`setpaced`, `in_progress`, America/Vancouver): Maya, Zoe, Ben, Chloe; Evelyn. Horizon Youth Center (`setpaced`, `in_progress`): Amara, Mia; Dana | the flagship, fully populated |
| Endless Game Makers Club | `club` · `inprogress` · `open` | Clubhouse (`selfpaced`): Maya, Sam, Marcus, Aisha, Ben, Riley, Ethan, Wen | a lighter community with no end date |
| Winter Game Jam | `competition` · `completed` · `open` | Jam Weekend (`completed`): Sam, Aisha, Ethan, Wen | a finished program and its results |
| Sound Design Studio | `regular` · `notstarted` · `open` | First Session (`not_started`, starts in three weeks, no members) | the deliberate empty case |
| Studio Apprenticeship | `regular` · `inprogress` · `open`, private | Season One: Sam (joined with a code), Wen (added by Priya) | invitation only: join reads `code_required` |
| Summer Game Camp | `regular` · `archived` · `open` | Summer Campers (`completed`): Sam, Aisha | an archived program |
| ZZZ Stress Test | `regular` · `inprogress` · `restricted` | Self-paced, no members; Peter Parker and Priya admin it | overflow only: long names, 120 posts, unbroken strings, mixed RTL text, a 15:1 banner |

Game Making 101's ten tasks, in order: Play Like a Designer, Paper Prototype Your First Level, Design Your Hero, Write Your World, Build a First Playable Scene, Make It Sound Alive, Run a Playtest, Ship Your First Level, Reflect on Your Journey, Community Build Week (a draft and an auto-completed one among them). Learners' instances span `assigned` to `complete`. Topics: Game Feel, Level Design, Art & Animation. Each cohort's feed opens with a pinned welcome; Maple Ridge and Self-paced add General and Show & Tell channels. The quiz Game Design Basics Check-in (bands Needs Review, Meeting from 60, Exceeding from 85) is closed on Maple Ridge, where Maya scored full marks and two never took it, and open on Self-paced.

## Games

| Game | Status · phase · tech | People | Shows |
| --- | --- | --- | --- |
| Starlight Drifters | `showcase` · `live` · `godot`; featured, home banner; `beginner`; Adventure | leader Marcus; members Maya, Sam, Amara, Aisha, Wen; Ethan's application pending, Ben's declined | the complete game page; `application_required` |
| Moss Golem | `published` · `production` · `godot`; `beginner`; Adventure, RPG; under Winter Game Jam | leader Sam; mentor Marcus; members Ethan, Aisha | a learner-led game; `application_not_needed` |
| Signal & Noise | `published` · `recruiting` · `unity`; `beginner`; Puzzle; under Game Making 101; feedback requested | leader Aisha; Tyler's application pending; feedback from Ethan and Wen | finding a team, giving feedback; `application_required` |
| Crate Expectations | `draft` · `pre_production` · `godot` | Sam | a game before publication |

Events: Studio Live, a weekly livestream on Thursdays at 16:00 America/Los_Angeles for an hour, so an upcoming instance always exists; and the Winter Game Jam Kickoff, a past one-off.

## Content rules

- Real words in the voice of real users, concrete and friendly: no lorem ipsum, "Test" or "Program 37".
- Uneven reactions and comments: a couple of popular posts, many with one or two, some with none.
- Timestamps a few days to weeks old, so feeds show a recency gradient.
- Youth usernames follow Adjective+Animal+Number; staff have readable ones.
- Some people have no picture, as real rosters do.
- A program's posts live in its cohorts' feeds, and everyone on a post belongs to that cohort or administers the program.
