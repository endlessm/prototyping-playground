---
title: Programs
description: "The Endless Studios programs (Core: Threadbare, Explore: Threadbare, Explore: Godot, Educator Training) with each one's shape, sessions or workshops, deliverable, requirements and age; what a published program page holds and the maker tools it lists; how learners enroll in the app today and in the playground's proposals; and where the sources disagree."
---

Sources: the app, `Endless-Game-Making-Studio/studio` at `dev` `eaa7d5f` (5 November 2026), and this system's copy of it at `11517cb` (25 September 2026); the studio design playground's knowledge base at `origin/main` `ffe336d` (`docs/brain/Knowledge Base/`: curricula extracted from the program decks on 4 August 2026, the Core: Threadbare and Explore: Threadbare program pages as published on 7 August 2026, and the portfolio overview of 5 August 2026); the playground's specs of 28 July to 9 August 2026 (`docs/superpowers/specs/`). **Today** marks what the app or a published program page shows. **Proposed** marks the playground's specs, none of which is in the app.

## Decide first

1. Pick a real program from The catalog, with its real counts, titles and deliverable. The offerings under Other offerings have no source material, so anything shown for them is a labelled placeholder.
2. Pick Today or Proposed. A view of the current product follows Enrolling today; a redesign may use Proposed enrollment and says so on the view. Keep one per view, or label each part.
3. Pick the enrollment state from the model you chose, and make each state a named state of the view.
4. Check who sees it. New learner-facing copy follows Saying "cohort". For account types, age and consent, read [Platform model](platform-model.md) and Safeguarding in [User types](user-types.md).
5. Build program, cohort and enrollment-code samples with [write-sample-data](../skills/write-sample-data/SKILL.md).

## The catalog

| Program | Shape | Age | Enrollment | The learner makes | Credential |
|---|---|---|---|---|---|
| Core: Threadbare | 18 sessions in 5 milestones | 15+ | A cohort; the page also supports working self-guided | A StoryQuest with 1 to 3 mini-games, submitted to Threadbare by pull request | Community Game Making microcredential (7 criteria) |
| Explore: Threadbare | 13 standalone one-hour workshops in 5 domains, in any combination | 13+ | One workshop at a time, not a cohort | One community contribution per workshop, submitted on its task | A certificate of completion after 5 workshops; Intro to Game Making microcredential (3 criteria) |
| Explore: Godot | 10 sessions | 13+ | A cohort with start and end dates | A Threadbare-themed platformer level, uploaded as a .zip | Intro to Game Making microcredential (3 criteria) |
| Educator Training | 4 sections | Adults | Facilitators, not learners | None | None |

Tiers: Explore is the shorter, modular series and Core the flagship; More: Threadbare is a follow-on. The ages are the floors educators quote from the public site and the team's educator profiles ([User types](user-types.md)); no program page or app source states one. The certificate comes from the program page and the microcredentials from the portfolio overview; the criteria text of both microcredentials exists in no source. Credentials, skills, XP and badges belong to [Skills and recognition](skills-and-recognition.md).

### Core: Threadbare

About (Today, program page): "In this experience, you will learn how to craft original adventures in the whimsical, worn world of Threadbare." The learner is a Storyweaver. A StoryQuest is their own adventure inside Threadbare, begun from a template: an intro, 1 to 3 mini-games and an outro, with their own characters, setting and story.

Learners work in their own GitHub organization: they fork the Threadbare template, track tasks on a GitHub Project Board grouped by milestone, push each task to a branch and open a pull request for review. To finish, they open a pull request to the main Threadbare repository. Endless's maintainers review it and may ask for changes; once it is approved and merged, the StoryQuest is playable in Threadbare by everyone. Learners work alone, as a team or as a family.

| Milestone (program page) | Sessions (decks) | Deliverables | Tasks |
|---|---|---|---|
| 1. Ideation | 1–3 | A one-page concept, an initial task list on the board, the repository running locally | Play Threadbare; Create a Team (optional); Brainstorm StoryQuest Ideas; Complete the StoryQuest GDD |
| 2. Intro & Outro | 4–5 | A playable start-to-finish flow, a short clip or GIF, commits pushed | Set Up a GitHub Account; Download and Install Godot; Set up Git; Clone the forked repository; Import Threadbare into Godot and run the game; Redesign placeholder tilemap; Design and replace character(s); Create and replace art assets; Connect scene to scene |
| 3. Mini-game | 6–13 | A playable mini-game with clear success or failure feedback, the board updated, a clip | Redesign placeholder tilemap; Design and replace character(s); Add narrative text; Create and replace art assets; Connect scene-to-scene; Add music and/or sound effects (optional) |
| 4. Playtesting & Iteration | 14–16 | Playtest notes, the changes before and after, closed issues | Conduct playtesting sessions; Gather and reflect on player feedback; Refine your game |
| 5. Production & Launch | 17–18 | A tagged release or final commit, a README and credits, a 20–30 second showcase clip, a post to the community | Create your game pitch deck; Present your StoryQuest; Publish your StoryQuest |

Every task has acceptance criteria, the program's only assessment; most build tasks end on "Pushed the changes to a branch. Submitted a pull request for review." A milestone is done when the learner has pushed, ticked the tasks and posted a short clip with a one-line reflection.

Requirements (Today, program page): a computer with Windows, macOS or Linux and internet access, Godot, a Google account for planning documents and a GitHub account; a Studio account is optional ("for connecting with our game-making community, earning skill achievements, and building your portfolio"). Skills: basic familiarity with digital tools, file systems and coding concepts, story structure, and a willingness to iterate. The decks also list Discord and Git, name Godot 4.5 as the latest version (August 2026), and require a platform account (see Source conflicts).

### Explore: Threadbare

About (Today, program page): "a series of hands-on creative sessions that let you explore different parts of game development by contributing to a shared community game." Learners try roles such as artist, designer, engineer and playtester. Each session stands on its own and favours exploration over mastery.

The curriculum says plainly that this is not a cohort: a learner joins one workshop at a time, in any combination, and the platform presents each one as a workshop with a date. It is the only NDPA-compatible program in the MVP, so the default for US school partnerships; a restricted (NDPA) account can enrol only in this program today (team documents, via [User types](user-types.md)). The portfolio overview mentions a 5-session variant for older learners.

Every workshop runs the same arc: an essential question, the open-source contribution framing, playing a Threadbare quest, reflection, a 20 to 40 minute make activity, sharing with Compliment, Coach, Encourage, a Self-Check, and two slides connecting the work to careers. Each workshop has a task page where the learner submits the asset with a short description of their thinking; the work becomes part of the Threadbare community.

| Domain (page colour) | Workshop | The learner makes |
|---|---|---|
| Art (yellow) | Aesthetics & Visual Design | A pixel-art asset for the game world |
| | Animation & Effects | New frames that animate a static asset from the community gallery, shared as a sprite sheet |
| | Music & Sound | A sound effect |
| Game Design (purple) | Narrative & Storytelling | An Artifact, text and concept art, that fits Threadbare's lore |
| | Core Gameplay & Mechanics | A new gameplay loop for an NPC |
| | Game Feel & UX | Sketched visual cues that guide the player |
| | Progression & Motivation | A simple skill tree |
| Engineering (orange) | Gameplay & Systems Programming | An adjusted or activated character mechanic in Godot |
| | Optimization & Performance | A change that improves or stresses performance, posted as a screenshot and description |
| Management & Production (blue) | Project Workflow & Management | A team moodboard and plan for an Adventure Pack, led as Producer |
| | QA & Playtesting | The bugs and design mistakes found playtesting a Threadbare-themed platformer |
| Go-To-Market (red) | Marketing | A merchandise ("swag") concept |
| | Publishing & Distribution | A poster, with assets and a tagline made with AI |

Each workshop is one of the app's 13 skill subdomains, and the five page colours are the app's five skill domains ([Skills and recognition](skills-and-recognition.md)). After 5 workshops, at least one from each colour-coded domain, the learner fills out a short post-survey to receive the certificate of completion; the page then points to Explore: Godot.

Requirements (Today, program page): "A computer or laptop. You need this to run Godot and build games. A phone or tablet will not work." A Game Design Journal, on paper or in a document. Optionally, a friend.

### Explore: Godot

About (Today, from Explore: Threadbare's next step): "Now it's time to use a real game engine to build your own game!" Learners learn Godot and build a level for a Threadbare-themed platformer.

A cohort course with start and end dates. Each session opens with a driving question and closes with a Self-Check; the decks give every session 60 minutes (see Source conflicts).

| Session | Driving question | What happens |
|---|---|---|
| 1 | Why do we play games? Why do we mod them? | Install Godot, then play and mod Pong |
| 2 | Should game makers also be game players? | |
| 3 | How do game makers create a fun and engaging level? | |
| 4 | What helps an idea move from concept to something real? | |
| 5–8 | What makes a level good? What makes it great? | Build and playtest the platformer level; session 8 adds a pitch deck |
| 9 | What makes a level "polished?" | Finish the level and export it as a .zip |
| 10 | Where do you go from here? | The showcase: upload the .zip of the finished level |

Requirements: the first session downloads and runs Godot on a computer. No program page for Explore: Godot was scraped, so its stated device and account requirements are unverified.

### Educator Training

Facilitator-facing: it trains educators to run Core: Threadbare, through an overview, structure and tools, a modelled "Walk the Walk" session, and a wrap-up. For views for educators, read [User types](user-types.md) and [Personas](personas.md).

### Other offerings

The portfolio names these without source material: Explore: Git (version control fundamentals); three self-led On-Ramps, Godot, Game Design and Git, which the Core decks say learners enter with a code; More: Threadbare, a follow-on; and Core: Godot. Show them only as labelled placeholders.

## How the Threadbare programs teach

- **Play, Create, Share, Reflect.** Core's learning approach: play existing games to see what makes them fun, create your own, share it for feedback, reflect on what could be better, and go round again. The milestones run on the same loop.
- **Compliment, Coach, Encourage.** The feedback protocol of the Explore workshops, the Core playbook and the facilitator training: "What I like about your work is…", "I think you could improve your work by…", "I see a lot of potential for…".
- **Learning principles.** The six on the Core page are the first six of the [Design principles](design-principles.md); Safe before anything comes from the team, not from the program pages.
- **Open source.** Threadbare's code and assets are public and openly licensed, so a learner's contribution lives on after the program.
- **Questions and checks.** An Explore session opens with an essential or driving question, which has no right answer, and closes with a Self-Check. Both program pages link a Game Design Glossary.

## What a published program page holds

Today, as published on 7 August 2026:

- **Core: Threadbare:** Introduction (Start Here, a pre-survey; An Overview of Core: Threadbare; Play Threadbare!; Requirements; Let's Get Started!, the GitHub setup; Community; Game Design Glossary), then Threadbare Milestones (an overview, then one topic per milestone with its slides and tasks), then Creator Tools & Guides.
- **Explore: Threadbare:** Introduction (Play Threadbare!; Overview; Frequently Asked Questions; Game Design Glossary), then Workshops (13, each with its slides, session goal and what the learner does), then Creator Tools & Guides, then Keep Exploring (Certification of Completion; Next Steps).

These sections match the shape of the program page's Topics tab in the app: categories that open and close, the first one open, and topic cards that open a modal with embedded slides, rich text or a "Go to link" button. Submissions go through the Tasks tab. The match is inferred from the scrape and the components, not checked in a live account.

## Maker tools

Today, the Creator Tools & Guides of both program pages list the same tools, one line each:

- **Art:** Piskel (web; sprites, animations and sprite sheets); Pixel Stitch (web; sprites, tiles and animated frames); Threadbare Pixel Loom (web; remixes the official Threadbare house and decoration assets); Kleki (web; quick sketches); Krita (download; detailed painting); GIMP (download; image editing and textures).
- **Music & Sound:** Melody Loom (web; melodies, sound effects and recording); Freesound.org (Creative Commons sound library); Incompetech (royalty-free music, credit the creator).
- **Narrative:** The Whispering Well (web; shuffles Who, What, When and Where fragments into story prompts).
- **Brainstorming & Planning:** Excalidraw (whiteboard); mood.site (mood board); TLDraw (whiteboard, no account needed).

Core's page adds Threadbare Guides & Resources: the Threadbare repository's GitHub Discussions, filtered by the Core Threadbare category and by milestone.

No page says who made a tool. Two Endless-made things are verified: Threadbare itself, played in the browser from the app's "Play Threadbare", and Endstar, which the app installs through a launcher for a desktop PC or Mac ("Install Endstar").

Proposed (the playground's Make page, 3 August 2026, ported from a design vision): three engines, the Godot Web Editor (the full Godot editor in the browser), Baby Godot (described as Endless's kid-friendly on-ramp to Godot, in beta, with no working link) and Endstar; a Threadbare Tailor suite of Pixel Stitch, PatchWorkShop, Whispering Well, Melody Loom, Patches, Builder's Bench and Swag Lab, each named as a Threadbare tool; and links out to Unity, Blender, Aseprite and GitHub.

## Enrolling today

Verified in the app at `eaa7d5f`. This system's copy holds only the program card and its empty tile (`~/components/Program/ProgramTile.vue`, `~/components/Dashboard/ProgramTileEmpty.vue`); the program page, the join modals and the cohort menu are not copied yet. Compose them from Nuxt UI with the app's strings, or refresh the copy first ([studios/README.md](../studios/README.md)).

A learner always joins a cohort of a program. Joining an open program places them in one; they do not choose. A program without a cohort cannot be joined. A completed cohort is closed to joining on one's own, but an enrollment code still enrolls into it. The join control shows no dates or seat counts; an enrollment code can carry a maximum number of users.

On the program page, a signed-in visitor who is not a member sees one of these:

| The program | The header shows | Then |
|---|---|---|
| Is open | "Join this Program" (`join_this_program`) | A modal with the program's image, name, description and the same button; the program page opens on the learner's new cohort |
| Needs a code, including when every cohort has completed | "I have a code" (`i_have_a_code`) | "Add your enrollment code" (`add_your_enrollment_code`), a field and "Add code"; then a success card, "Joined" or "You are already enrolled", with "Explore More Programs" and "Start Learning" or "Continue Learning" |
| Is closed to a restricted partner account | "I have a code", marked restricted | The tooltip "Restricted feature. Click for more information" and a modal, "Want to keep going on your own?" |
| Has no cohort | "Enrollment is not open" (`enrollment_is_not_open`) and no button | Nothing |

A signed-out visitor sees the program's public page, and either button asks them to log in first.

A member's header shows the cohort's name, its learners and its facilitators ("{n} Learners", "{n} Facilitators"), with a "Choose cohort" menu when they belong to more than one. The options menu holds Admin Program and Admin Cohort for those who run it, and Leave Cohort, or Leave Program for a program-level member. The tabs are Home (the feed), Overview, Tasks, Topics, Resources, Games, Members, Quizzes and Dashboard, each shown only when the program has that content or the viewer that role. A non-member sees Overview alone, headed "About this program" (written in the component, not a locale key).

Other ways in:

- The Programs page lists "Programs In Progress" and "All Programs" as program cards: image, name, short description, "{n} Tasks", the status of the learner's own programs, and "Cohort:" with the cohort's name, or "Choose cohort" for several.
- The home onboarding card offers "Explore programs" and "I have an access code".
- A cohort's codes page offers "Copy Code" and "Copy Link with Code". The link is `/signup/?code=<code>&redirect=/programs/<id>/?cohort=<id>`: signed out, it carries the code through sign-up; signed in, it applies the code at once. "Copy Link with Code" is newer than this system's copy, whose locale lacks it.

The same code is called an enrollment code, an access code and an invite code on different screens; [Platform model](platform-model.md) owns those names.

## Proposed enrollment

From the playground's program page specs (28 July and 5 August 2026) and onboarding foundations (9 August 2026):

- **Four layers.** Program Template, the content; Program Instance, one delivery, optionally run by an institution, public or private (a private one needs an access code); Cohort, one enrollment option under an instance, dated or self-paced, with or without a seat cap or a code, named like a group ("Night Owls") and either closed or open; and Enrollment record, one learner in one cohort. The app has no instance layer ([Platform model](platform-model.md)).
- **Two models.** A cohort program has one date range, a schedule and seats; its picker lists instances by date range, and the button says "Enroll". A workshop series, which only Explore: Threadbare is, has no range; its picker lists single workshops with their own dates, and the button says "Join this workshop".
- **The card, by how many instances are open.** Several (up to three): a select menu, the details, then the button. One: the same details as text, then the button. None: an email field for news of the next one. A private instance: an access-code field behind "Have an access code?". The details are the schedule, the session count and length, the seats remaining and the mentor; a workshop shows its own date and length.
- **One cohort's status, first match wins.** Already enrolled (a progress bar and "Resume learning"); self-paced, always open (a "Self-paced" badge and "Start learning"); needs an access code (the code field); closed, past its end date (a disabled button); full (a disabled button and a "Join the waitlist" secondary); open with seats ("Enroll in this session", then a confirmation, "Lock in your seat?", and a success view, "You're in!", with the start date).
- **Codes in the URL.** The MVP carries access codes in the URL; the target is cohort invite tokens (portfolio overview). Today's equivalent is the sign-up link above.
- **The learner's phase decides the tabs.** Interested: Overview, Community, Projects. Enrolled, completed or game owner: Home, About, Community, Classroom, Projects, Resources. A tab the phase cannot use is absent, not disabled.
- **Consent at join.** A young learner joining an open cohort meets the parental-consent gate at join; in a closed cohort, consent waits until work or identity leaves it. A restricted (NDPA) account is never gated, because its work never leaves the cohort. See Safeguarding in [User types](user-types.md).
- **What you'll earn.** The certificate section shows a certificate mockup beside three benefits, with nothing to share or download before it is earned.
- **Module deliverables.** Every module ends in a deliverable task with acceptance criteria, submitted as a description and links. Only Core's milestones have a source for this; the Explore deliverables, like every XP value in the playground, are synthesized.

## Saying "cohort"

For new learner-facing copy, follow the research guidance in the portfolio overview, repeated by the playground's program and onboarding specs: "cohort" names the data, and learners read "your group" or "live session" (the July spec says "session"). Name a cohort like a group.

The app does not follow it yet. 51 English strings in its `dev` locale contain "cohort" (43 in this system's copy). Most are on leader screens and dashboards ("Create cohort", "Cohort Health"), which the guidance does not cover. Learners see some: "Leave Cohort", "Choose cohort", "Cohort:" on their program card, "Take quizzes released to your cohort." A Today view uses the app's strings as they are; a view that rewords them labels the change Proposed. For voice, read [Voice and tone](voice-and-tone.md).

## Source conflicts

| Question | The sources say | Do |
|---|---|---|
| How many domains Explore: Threadbare has | Five: the program page's colours, the app's skill domains and the curriculum's opening line. Four: the curriculum's workshop map, the playground's program index and its catalog spec, which merge Engineering with Management & Production | Show five |
| Workshop and domain names | The program page: "Project Workflow & Management", "QA & Playtesting", "Go-To-Market". The curriculum: "Project & Workflow Management". The app's skills: "Project & Workflow Management", "Quality Assurance & Playtesting", "Go to Market" | Name skills as the app does ([Skills and recognition](skills-and-recognition.md)); quote the page's names only when showing the program page as published |
| How long an Explore: Godot session is | 60 minutes in every deck, with an optional 15 minutes of community building in the facilitator notes; 90 minutes in the first Endless-led online cohort (portfolio overview) | State the length of the cohort the view shows; the playground used 60 |
| Core's milestone names | The page: Ideation, Intro & Outro, Mini-game, Playtesting & Iteration, Production & Launch. The decks: An Introduction to Game Design, Getting Set Up and the First Working Session, and Working Sessions, then the same last two | Use the page's |
| Whether Core needs a platform account | The decks: required, joined with "I have a code". The page: optional | Today follows the page |
| Age floors | Explore 13+ and Core 15+ ([User types](user-types.md), from the public site); two of five educators in the usability sessions teach 10 to 12-year-olds; the playground's mock ages (Core 13, Explore: Threadbare 10, Explore: Godot 12) are synthesized | Show 13+ and 15+ |
| Whether Explore: Threadbare has cohorts | The curriculum: not a cohort. The app: every join lands in a cohort | Today it runs through a cohort; the workshop series is Proposed |
| What The Whispering Well does | The page: a story-prompt generator. The Make page: branching dialogue | Use the page's |
