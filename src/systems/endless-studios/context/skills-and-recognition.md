---
title: Skills and Recognition
description: How Endless Studios labels skills and recognises work. Covers the domain, subdomain and future-ready skill keys, the older contribution types, how program tasks award XP and levels, contribution badges, certificates and microcredentials, each marked Today or Proposed.
---

Sources: the app, `Endless-Game-Making-Studio/studio` `dev` at `eaa7d5f` (5 November 2026): its English locale, GraphQL schema, and profile and task components; this system's copy (`11517cbee`) has the same skill strings. The playground's `docs/brain` at `ffe336d` (9 September 2026): the curriculum's Assessment, the overview's Recognition systems, and Explore: Threadbare.

## Choosing labels

- Use the app's keys below. Where Explore: Threadbare says "QA & Playtesting", "Project Workflow & Management" or "Go-To-Market", the app's strings win.
- Tasks, rewards, profile skills and the leader's XP form use the skill taxonomy. Pull-request contributions and Portfolio badges use contribution types.
- In samples, write the English names exactly as in the tables, such as "Go to Market". The API carries names, not keys, and the app drops any name it doesn't know.
- `SkillToken`, `TaskXpRewards` and the profile skill cards aren't in the copy at `11517cbee`. To bring them in, follow "Refreshing the copy" in `studios/README.md`. For their colours, see [App conventions](app-conventions.md). `Profile/UserBadges.vue` shows interests, not recognition.

## Domains and subdomains

Keys: `user_skills.domain.<key>` and `user_skills.subdomain.<key>`, in the Skills tab's order.

| Domain | Subdomain | Covers |
| --- | --- | --- |
| Game Design `game_design` | Core Gameplay & Mechanics `core_gameplay_and_mechanics` | Movement, abilities, puzzles |
| | Game Feel & UX `game_feel_and_ux` | Feedback and polish |
| | Narrative & Storytelling `narrative_and_storytelling` | Dialogue, cut-scenes |
| | Progression & Motivation `progression_and_motivation` | Scoring, levelling, rewards |
| Art `art` | Animation & Effects `animation_and_effects` | Animation, particles |
| | Aesthetics & Visual Design `aesthetics_and_visual_design` | Sprites, tilesets, palettes |
| | Music & Sound `music_and_sound` | Music, sound effects |
| Go to Market `go_to_market` | Marketing `marketing` | Promotion, audiences |
| | Publishing & Distribution `publishing_and_distribution` | Stores, releases |
| Engineering `engineering` | Gameplay & Systems Programming `gameplay_and_systems_programming` | Scripts, nodes, resources |
| | Optimization & Performance `optimization_and_performance` | Debugging, lag, load times |
| Management & Production `management_and_production` | Quality Assurance & Playtesting `quality_assurance_and_playtesting` | Bugs, playtests |
| | Project & Workflow Management `project_and_workflow_management` | Tasks, deadlines, tracking |

## Future-ready skills

The keys are top-level. `future_ready_skills` is only the heading.

| Skill | Covers |
| --- | --- |
| Problem Solving `problem_solving` | Fixing what doesn't work by iterating and testing |
| Creativity & Design Thinking `creativity_and_design_thinking` | Generating and refining ideas and prototypes |
| Technical Literacy `technical_literacy` | Using the tools to build and polish |

The curriculum's ten broader learner-outcome skills aren't app labels.

## Contribution types

`contribution_type_<value>`: `engineering`, `game_design`, `art_and_sound` (Art & Sound), `management_production`, `go_to_market` and `future_ready` (Future-Ready). The form offers the first four. The last two appear only on existing records.

## Tasks, XP and levels

**Today:**

- Only program tasks carry XP; the app refuses XP on a game's task.
- In XP Assignments, a leader picks up to three subdomains. For each subdomain, they award each skill Minimal (50 XP), Moderate (75 XP) or Extensive (150 XP), labels with no locale keys. The task's XP is the total.
- The learner starts the task and submits it. A reviewer approves it or sends it back. For who reviews, see [Platform model](platform-model.md). For statuses, see [state enums](../skills/write-sample-data/references/state-enums.md).
- XP counts from submission (In Review). Approval keeps it, and sending the task back withdraws it.
- Leaders can also import XP from a GitHub repository's issues with Import skill achievements.
- XP shows on:
  - the task card, as "+ N XP" with a skill token per subdomain;
  - the task's Overview, as "Rewards (+ N XP)" with each skill's share;
  - leader analytics' XP Milestones, counting learners at 150+ and 500+ XP.
- Each subdomain gains a level per 1,000 XP, from Level 0; there's no overall level. The profile's Top Skills shows the three highest subdomains, and the Skills tab shows all thirteen.

**Not enforced:** program documentation calls 150 XP a task's floor; the app sets none, and its smallest award is 50 XP.

## Badges

**Today:** badges recognise contributions, not tasks. Leaders record typed contributions on a game's GitHub pull request. Accepted ones show on the contributor's Portfolio under "Recognition Earned", one badge per type with a count, such as "x2".

**Proposed** (program documentation): badges for assets, ideas, playtests, peer feedback and StoryQuests.

## Certificates and microcredentials

**Today:** a program or cohort admin issues a program certificate with "Issue Certificate" ("Generate Certificate" in the copy). It says the learner "has participated in the program". It shows in the profile's Certificates and on the program page (Open Certificate, Share Certificate). For Explore: Threadbare's certificate of completion, see [Programs](programs.md).

**Outside the app:** program documentation names two microcredentials:

- Community Game Making, for Core: Threadbare;
- Intro to Game Making, for the Explore series.

Their criteria counts (7 and 3) are unverified. Learners claim them on ASU's site; eligibility and handoff are manual. The app has no microcredential screens or strings, so a view that shows one is Proposed. For who needs this proof, see "Proof that counts outside" in [User types](user-types.md).
