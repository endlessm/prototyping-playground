---
title: Personas
description: Ten personas, one or two per user type (Maya, Lina, Diego, Daniel, Rania, Chris, Omar, Beth, Andrés, Carmen), with jobs, goals, behaviour, frustrations, a decision test, messaging and channels for each; two anti-personas; the learner demographics they are set in; and the evidence and confidence behind each card.
toc: true
---

Version 4 · 26 October 2026 · Source: [Design Studio reference, Personas](https://design-studio-mauve.vercel.app/reference/personas), copied 5 November 2026.

## About the personas

Ten people we design Endless Access for. Each one stands for a user type in [User types](user-types.md) and makes it one person you can picture in a meeting. Use them to support a decision, not to replace it.

A persona takes its needs, pain points, motivations, jobs and confidence from its user type, and adds no claim that the user type or the data can't back. The persona's setting comes from the learner surveys (see Learner demographics). A user type gets a second card only when it covers people with different jobs. The details kept are only those that change the product: age decides consent and visibility, country decides language, devices and approval, and program decides the tools.

| Persona | User type | Age · place · language | Confidence |
|---|---|---|---|
| Maya | Young learner by choice | 15 · Atlanta, United States · English | Partial |
| Lina | Young learner at school | 16 · Irbid, Jordan · Arabic | Partial |
| Diego | Adult learner | 20 · Lima, Peru · Spanish | Evidence-based |
| Daniel | Autonomous educator | 46 · Houston, United States · English | Evidence-based |
| Rania | Mandate-driven educator | 38 · Zarqa, Jordan · Arabic | Partial |
| Chris | Partner facilitator or program leader (in the room) | 29 · Chicago, United States · English | Partial |
| Omar | Partner facilitator or program leader (sets up cohorts) | 31 · Amman, Jordan · Arabic and English | Partial |
| Beth | Independent non-formal educator (homeschool parent) | 41 · Ohio, United States · English | Hypothesized |
| Andrés | Independent non-formal educator (community mentor) | 24 · Lima, Peru · Spanish | Hypothesized |
| Carmen | Reporting partner or buyer | 49 · Lima, Peru · Spanish | Partial |

## Using the set

### In a prioritization meeting

Does the proposal solve one of the top two jobs for at least one persona? If not, it waits. Then read that card's frustrations as the questions the decision-maker will ask, and answer them before sending the proposal.

Weigh each decision test by its persona's confidence. A feature that passes one evidence-based test and one partial test is real work plus a research obligation, not two wins. A feature that passes none of the tests waits.

### Confidence tags

- **Evidence-based**: interviews or usage data from Endless Access users. Quotes are verbatim.
- **Partial**: field observations, partner feedback, internal documents or survey counts. Nobody in this role has been interviewed. Quotes are placeholders unless they say otherwise.
- **Hypothesized**: team assumptions and desk research. Treat the card as a research brief.

Label designs that rest on a partial or hypothesized card as assumptions, and never quote a placeholder as something a user said.

### Decision tests, side by side

| Persona | Decision test |
|---|---|
| Maya | Does this give a learner who chose to come a visible win in her first session, keep her project safe between weekends, and pass the three safeguarding checks? |
| Lina | Does this work for a learner who didn't choose to be here, has one lesson to do it in, shares a slow machine, reads Arabic first, and should be seen only by her class? |
| Diego | Does this help an adult with little time get from understanding the plan to contributing to the build, in Spanish, and does it show a quiet team before week three? |
| Daniel | Can a teacher who isn't a coder judge this in minutes without an account, get it through district approval, and run it on Chromebooks in a period or two? |
| Rania | Can a teacher who isn't a game developer deliver this as designed, in Arabic, on a weak connection, and mark it in the authority's vocabulary without extra nights? |
| Chris | Does this work for one adult alone in the room, with drop-in learners on phones, under-13s in the group and nothing prepared the night before? |
| Omar | Does this let a partner run, staff and track many cohorts across schools and universities without asking Endless for every change? |
| Beth | Does this work for a parent with no school, no cohort and no coding, who needs proof of hours and wants to know exactly who can reach her kids? |
| Andrés | Does this work for a volunteer with no school or partner behind him, a few hours a month and fewer computers than kids? |
| Carmen | Does this give a partner lead results in her own framework and vocabulary, before the program ends, without naming a learner? |

### Anti-personas

The product isn't for them. Serving them pulls it away from the personas.

**The Indie Pro-Maker.** Wants a blank engine, 3D, their own IP, and a way to publish and monetize. Threadbare's frame is the product, and they experience it as a constraint; their job belongs to Godot and itch.io. Risk of serving them: open-ended engine features and a weaker learning frame. Diego is the boundary case: he wants a portfolio piece inside Threadbare's limits; the Pro-Maker wants out of them.

**The LMS Shopper.** A teacher or admin who wants a gradebook, attendance and assignments for every subject, and considers Endless for it. Their job is "run my whole classroom"; ours is "run a game-making group well". Rosters and grades overlap only partly. Risk of serving them: building a generic LMS. Carmen's requirement points the other way: work with the platforms her university already runs, don't replace them.

## Learners

### Maya, young learner by choice

15, in a weekend coding club in Atlanta · Learner · United States · English · Partial

She joined a weekend coding club run by a national nonprofit because she likes games and her friends were going. Nobody grades her, and that's the point. She wants to finish a game that's hers, with her own characters and story, and show it at the closing event.

- **Safeguarding:** a minor who chose to come. Three checks before anything reaches her: consent (if she joins an Endless-run open cohort on her own, parental consent comes at join, not only when she publishes), visibility (her work stays inside the club until consent covers more), moderation. Her own username and avatar unlock only after a parent consents.
- **How she got here:** her friends signed up and a mentor at the club said she'd be good at it. An adult opened the door, but the choice still feels like hers.
- **Program:** Explore: Godot at her city's chapter, in a cohort that ends with a closing event.
- **Device and time:** a slow laptop at the club and a phone at home. The game needs a keyboard, so the work happens at the club.
- **Account:** brought by a partner, so it's linked to the club but works like a personal one. An assigned name and a preset avatar until a parent consents.

**Jobs to be done**

- Functional: When I come to the club, I want to make a game that's mine and finish it before the program ends, so I can show it at the closing event.
- Emotional: When I try something and it breaks, I want to fix it without being graded or judged, so I keep trying.
- Social: When the game works, I want friends and family to play it and react, so I count as someone who makes games.

**Goals:** a finished game with her own characters and story, played at the closing event; a first win at the end of onboarding that her friends see and like; a certificate to show at home, and a line for college applications later.

**How she behaves:** comes because her friends do, and stays for the moment the game works and someone else plays it. When stuck, asks a mentor first, and wants one who remembers what she's building. Cares about the art, music and story as much as the code.

**Frustrations:** real code and the tools are a lot at once; one broken step and the game stops. The first 10 to 15 minutes go to installing Godot or hunting for an access code read out loud instead of shown on screen. Missing one weekend means losing the thread of her project.

**Joins · leaves:** joins when her friends sign up and an adult she trusts suggests it. Leaves when the tools stay harder than the fun, when a missed weekend loses her project, or when getting to the club stops working.

**Quote (placeholder):** "I wanted to make a game that's mine, not just play one."

**Messaging:** to her: "Make a game that's yours and show it at the closing event." No "cohort", no "curriculum". To parents: what she'll make, who sees it and what their consent unlocks.

**Reach her through:** the club's facilitators and mentors, and the friends she came with. Parents through the club. A direct channel to a minor is a safeguarding decision first.

### Lina, young learner at school

16, at a public girls' high school in Irbid · Learner · Jordan · Arabic · Partial

Game making came to her school through a program the school joined, so she didn't choose it. It's on the timetable and it counts toward her grade. Still, it's the one lesson where she builds something of her own, and she wants to finish what's set and then make it better than the example.

- **Safeguarding:** a minor, reached through her school. Anything that reaches her passes three checks first: consent, visibility, moderation.
- **How she got here:** her school joined the program. It's on the timetable and graded; she didn't choose it.
- **Program:** Core: Godot, in school, with a delivery partner.
- **Device and time:** a shared lab computer during the lesson, on a slow network. No computer of her own at home.
- **Language:** Arabic first. The tools and most materials are in English.

**Jobs to be done**

- Functional: When the lesson starts, I want to be in my work within minutes, without logins eating the period, so I use the class time I have.
- Emotional: When I have to be here, I want it to feel like building something real, not homework, so I care about it.
- Social: When I share unfinished work, I want only my class and my teacher to see it, so I can try things in front of people I know.

**Goals:** finish the task, pass the skills tasks and the capstone, and understand how her mark is worked out; if there's time, add her own ideas and make the game better than the example; build and playtest with her friends, and present the game to real people.

**How she behaves:** does what's set first, and adds her own ideas once the task is done. With one adult for 25 to 30 students, she often sits waiting until help comes. Treats the platform like homework until something she made is playable.

**Frustrations:** logins and slow shared machines eat the lesson. Class ends just as she gets into it, and next time her work is hard to find. Feedback on her work goes unseen; notifications are off or easy to miss.

**Starts · checks out:** starts when the school puts it on the timetable. She can't leave, but she checks out: when the period goes to logins, when last lesson's work is lost, or when it starts to feel like homework.

**Quote (placeholder):** "It's more fun than other topics. I just wish class didn't end right when I get into it."

**Messaging:** write for the school and the teacher first: "Your class builds a game in the lesson, and only your class sees it." In-product copy for her: short, concrete, no "cohort". Promise Arabic only where it exists.

**Reach her through:** her teacher or the partner instructor in the room. No direct channel: she's a minor, reached through her school.

### Diego, adult learner

20, industrial engineering student in Lima · Learner · Peru · Spanish · Evidence-based

He isn't a computing student. A university email about making your own video game finally landed after he'd ignored it twice, and he joined to find out if games or tech could be a career. He fits GameLab around classes, exams and a part-time job, and he wants something for his portfolio, not just a certificate.

- **How he got here:** a university email, ignored a few times before it landed, and a classmate who signed up too.
- **Program:** Core: Threadbare in a GameLab team cohort, with live sessions and work on his own time.
- **Skill:** not a computing student. New to game engines and to working in Git with a team.
- **Device and time:** a computer he shares at home, or his phone; joining from the phone means missing activities. Spanish first; the Git guides are in English.

**Jobs to be done**

- Functional: When I invest my scarce time, I want to learn tools the industry uses and ship something real, so it counts for a portfolio and a job.
- Emotional: When my team goes quiet, I want to still have something to contribute and someone to talk to, so I don't quit silently.
- Social: When the game ships, I want my name in the credits and strangers playing it, so I'm a game developer, not a student.

**Goals:** a portfolio piece, a credential for LinkedIn and course credit; finish the game with his team, and see strangers play it; know what comes next: a second course, a way to finish the game, or a door to a job.

**How he behaves:** keeps coming for the mentors and the team more than for the content. When the team goes quiet on Discord, moves to WhatsApp to talk at all. Says he left because of his schedule; the real reasons came first: a quiet team and a broken Git project.

**Frustrations:** Git breaks the whole project, not only his part; it's the most common breaking point. Materials, Git guides and instructions are in English only; he translates as he goes. The team goes quiet around week two, and five people become two. Little visible progress for the time he puts in. He doesn't know yet what he doesn't know.

**Joins · leaves:** joins when the email finally lands or a classmate signs up. Leaves quietly when the team goes silent, Git breaks the project and exams arrive in the same week.

**Quote (verbatim, GameLab learner interview):** "I didn't know what I didn't know."

**Messaging:** "Make a real game with a team, and put it in your portfolio." Say the tools are taught from zero and which materials are in Spanish. Explain Threadbare's limits on day one: no custom menus, family-friendly content, free-license assets only.

**Reach him through:** the university's email and channels, his mentor, and the team's WhatsApp group. Not the platform feed.

## Teachers and facilitators

### Daniel, autonomous educator

46, the only computer science teacher at a high school in Houston · Teacher · United States · English · Evidence-based

He came to computer science from another subject and is the only CS teacher in his building. He has eighteen sessions to fill after the AP exam and wants something that engages students who don't see themselves as coders. He decides from the website, in minutes, before he creates an account.

- **How he found it:** a partner network, or a search for game-design material he could teach.
- **Class:** an elective after the AP exam: 18 sessions, a full class of teenagers, school Chromebooks.
- **Approval:** the district privacy office reviews every new tool; software has to be whitelisted and run on Chromebooks.
- **Background:** came to CS without a technical background. He isn't a coder or a game designer.

**Jobs to be done**

- Functional: When I evaluate a program, I want to see one lesson and the facts on devices, age and credentials before creating an account, so I can decide in minutes.
- Emotional: When I'm not a coder, I want to run a good session anyway, so I never improvise in front of 30 teenagers.
- Social: When students ship, I want a credential they can put on college applications and work I can show the school, so the elective earns its place.

**Goals:** ready-to-teach units that fit a period or two, with a pacing guide he can get approved; students who switch on and stay after class, including girls and students who struggle in math; a credential for college applications, and student work the school can see.

**How he behaves:** stops at sign-up and asks to see one lesson first. Looks for plain facts on the page: runs on Chromebooks, yes or no; which Godot version; whether Discord can be skipped. Looks outward for peers: other teachers who have taught it.

**Frustrations:** district privacy reviews, data agreements and whitelisting ("The district privacy person was in my inbox three days later."). The platform speaks to a learner: no educator role at sign-up, an access code lost if he leaves the flow, and no way to create a cohort. Credential rules differ from page to page, and skills and achievements are "coming soon". Age floors: Explore is 13+ and Core is 15+, so younger students are out.

**Adopts · drops:** adopts it when one lesson, the device facts and the credential convince him in minutes and the district approves. Drops it when approval takes months, when the setup doesn't run on Chromebooks, or when he'd have to improvise in front of the class.

**Quote (verbatim, educator interview):** "Eighteen sessions is basically what I've got after the AP exam."

**Messaging:** "Not a CS teacher? Start here." Show one lesson, then the facts: Chromebooks, age, credential. The pitch to his students: "You're going to add a level to a real game."

**Reach him through:** the website, where he decides; partner networks and teacher communities like CSTA; other teachers who have taught it.

### Rania, mandate-driven educator

38, ICT teacher at a public girls' high school in Zarqa · Teacher · Jordan · Arabic · Partial

Her school committed to the program, and the national curriculum now asks for digital skills, so game making is on her timetable. She didn't choose it, but she wants to do it well. She's an ICT teacher, not a game developer, one step ahead of her class and with no time to practice before she teaches.

- **Why she teaches it:** assigned. Her school committed to the program, the national curriculum asks for digital skills, and leadership expects results.
- **Training:** one workshop, after hours and with travel, then nothing. Supervisors are trained first, then teachers.
- **Class:** a full class in the school's lab, within existing hours, on a weak connection.
- **Language:** Arabic. Little game-design material exists in Arabic, which is under 10% of online content.

**Jobs to be done**

- Functional: When the ministry assigns the program, I want lessons that map to the required framework and timetable, so I deliver it as designed.
- Emotional: When I'm one step ahead of the class, I want training that comes back after the first workshop, so I'm not left alone with it.
- Social: When it goes well, I want my supervisor and the ministry to see it and my delivery recognized, so it counts for me too.

**Goals:** deliver every lesson on time and as designed, and keep the whole class engaged; assess games and pitches fairly, in the authority's vocabulary, without hours of marking by hand; show her supervisor it's working, and get her own delivery recognized with a microcredential.

**How she behaves:** follows the materials closely; she has no freedom to change the curriculum. Shares resources and fixes with colleagues in WhatsApp groups. Asks for follow-up after training, again and again.

**Frustrations:** she isn't a CS teacher or a game developer, and has no time to practice before teaching. Devices, logins and weak connectivity eat lesson time. Marking games by hand takes hours, and reports don't use the authority's vocabulary.

**Starts · stalls:** starts when the school or the ministry assigns the program. Stalls when training ends after one workshop, when a lesson fails on the devices she has, or when marking takes her evenings.

**Quote (placeholder):** "I can deliver what's in the plan. When something breaks, I'm on my own."

**Messaging:** write for the system first: lessons mapped to the framework and the timetable. To her: what the lesson needs from her, and what support comes after the training. Promise Arabic only where it exists.

**Reach her through:** the system: the ministry, her supervisor and the implementing partner. Then the teachers' WhatsApp groups.

### Chris, partner facilitator

29, runs weekend sessions for a youth nonprofit in Chicago · Facilitator · United States · English · Partial

A partner organization pays him to run the sessions, and he enjoys it. He walks in with little prep, kids come and go, most of them are on phones, and he runs the hour alone, with no Endless staff in the room. He's the person in the room; someone else set up the cohort.

- **Kids under 13 turn up:** programs start at 13, but younger siblings come along and he has no staff to split the group. He needs clear account rules for staff, volunteers, kids and kids under 13, and a real answer when a parent asks who their child talks to.
- **Role:** paid by the partner to deliver the sessions, for a group he didn't recruit or vet.
- **The room:** drop-in attendance; learners on phones and shared devices; eight working computers in the lab.
- **Prep:** little prep time, and no clear expectations of the mentors in each session.
- **Support:** nobody to call when something breaks mid-session. A WhatsApp group works better than a helpline.

**Jobs to be done**

- Functional: When I walk in with little prep, I want a turnkey session that handles group dynamics, so I can run it alone.
- Emotional: When students are shy or silent, I want ways to get them talking to each other, so the hour works.
- Social: When a parent asks who their kid talks to on the platform, I want a real answer, so I keep their trust.

**Goals:** standalone one-hour sessions that work for kids who drop in; learners who are happy at the end, and a showcase where families see what they built; someone to call, fifteen minutes with a real person, when something breaks.

**How he behaves:** runs the session from what's in front of him; he won't study a curriculum beforehand. When something breaks, messages a trainer or the WhatsApp group instead of a helpline. Works hard to get shy kids talking; awkward silences are the hardest part of the hour.

**Frustrations:** Threadbare doesn't run on touchscreens, and most of his kids are on phones. If sessions build on each other, he loses the drop-ins by week three. Too many surveys, and no view of who's progressing or stuck.

**Stays · burns out:** stays while learners leave happy and the sessions run without improvising. Burns out on little prep time, too many surveys and nobody to call mid-session.

**Quote (verbatim, after-school program director):** "My kids are on phones. Our lab has eight working computers."

**Messaging:** "Run a great hour with no prep." Lead with what the session handles for him, what works on phones, and who to call.

**Reach him through:** his program leader and the partner's WhatsApp group; a trainer he already knows.

### Omar, partner program leader

31, program manager at a delivery partner in Amman · Program leader · Jordan · Arabic and English · Partial

His organization partnered with Endless and runs cohorts in public high schools, universities and community centers. He creates the cohorts, staffs them, partly with the program's own top graduates, trains the instructors and reports the numbers. He's rarely in the room himself.

- **Role:** creates, staffs and oversees cohorts. Reads the curriculum well enough to see problems coming.
- **Team:** grew the instructor team from 6 to 16 by hiring the program's top graduates.
- **Funding:** Endless funds the partner, so he reports to Endless as well as to his own board.
- **Tools:** attendance and progress in spreadsheets; Endless makes the changes to cohorts he can't make himself.

**Jobs to be done**

- Functional: When we start, I want to set up cohorts and rosters myself and see who is progressing, so I don't depend on Endless for every change.
- Emotional: When my instructors run sessions without me, I want them trained well enough to handle what breaks, so I'm not the one everyone calls.
- Social: When I report to my organization and its funders, I want results and stories I can count, so we get the next grant.

**Goals:** high attendance and completion in every cohort; self-serve training for new instructors, so the team can run next year's cohorts without live trainings; results and learner stories for his board and for Endless.

**How he behaves:** hires graduates as instructors, because they know the program from the inside. Tracks attendance and progress by hand and sends Endless the changes he can't make. Asks for live trainings, because self-serve training doesn't exist yet.

**Frustrations:** rosters don't match how accounts are set up, and he can't see who is stuck. Instructors want to see the curriculum before each session, and a quick Git course at the start. Too many surveys, and learners taking the program during their classes.

**Renews · scales back:** renews when attendance holds, instructors run sessions on their own and the report lands well. Scales back when every cohort change goes through Endless, or when funding for staff and devices runs out.

**Quote (placeholder):** "I hired our best graduates as instructors. Now I need them to run a session without calling me."

**Messaging:** talk about running it yourselves: setting up cohorts, training instructors, seeing who's stuck. Report in his organization's terms, not in Endless' program names.

**Reach him through:** his Endless partnership contact, and the partner's own channels with its instructors.

### Beth, homeschool parent

41, homeschools her two teenagers near Columbus, Ohio · Parent educator · United States · English · Hypothesized

She found the programs in a homeschool parent group and liked that they teach making, not only playing. She doesn't code. She wants something structured enough to follow week to week, a few weeks ahead of her kids, and a credential that works as a line on a transcript.

- **How she found it:** a homeschool parent group, then YouTube. The materials were free to take.
- **Learners:** her two kids, 13 and 15.
- **Credit:** needs logged hours and a course description for their transcripts.
- **Setup:** no school and no cohort. There's no educator role at sign-up, so she can't create a group.

**Jobs to be done**

- Functional: When I guide my kids without a school behind me, I want something structured week to week that I can learn a few weeks ahead of them, so I can keep up.
- Emotional: When I pick a platform for my kids, I want to know who can contact them and what they can reach, so I can trust it.
- Social: When the first course ends, I want other parents to compare notes with and a path to continue, so we don't stall.

**Goals:** quality free material she can run at home, week to week; credit that counts: logged hours and a course description; a path after the first course.

**How she behaves:** assembles her own mix of resources and compares notes in parent groups. Learns a few weeks ahead of her kids. Reads the privacy page and looks for visible moderation before anything else.

**Frustrations:** the site assumes a classroom and a roster; it doesn't feel like it's for her. Nobody to ask when she's stuck on something technical. She can't tell whether chat and community features are safe for her kids.

**Tries · stalls:** tries it when a parent group recommends it. Stalls when the first course ends with nothing next, or when she can't answer her kids' technical questions.

**Quote (from desk research, not an Endless user):** "How can I teach kids coding if I don't know how to code?"

**Messaging:** "You don't need to code to guide this." Show the weekly structure, the hours it logs and the safety rules, in plain language.

**Reach her through:** homeschool parent groups on Facebook, YouTube and Discord.

### Andrés, community mentor

24, GameLab graduate who mentors kids at a community center in Lima · Mentor · Peru · Spanish · Hypothesized

He learned game making for himself first, in GameLab, and now gives a few Saturdays a month to a community center in his district. No school or partner is behind him. He wants to keep getting better, be taken seriously as a mentor, and give the kids more than playing.

- **Safeguarding:** he works with minors with no institution behind him. Background checks, who can contact the kids and what they can reach have to be settled before he gets any tool that reaches them.
- **Background:** finished a GameLab cohort and now has his first tech job.
- **Setting:** a community center with five computers for thirteen kids.
- **Time:** a few hours a month, around his job.
- **Account:** no educator role at sign-up and no way to create a group.

**Jobs to be done**

- Functional: When I run a workshop at the center, I want activities that share machines and fit one session, so everyone takes part.
- Emotional: When I don't know the answer, I want someone to ask, so I don't give up.
- Social: When I mentor, I want my skill and my role recognized, so I count as a mentor and not only as a volunteer.

**Goals:** keep getting better at making games himself; use the workshops to support what the center already does, and bring in digital skills; small, clear mentor commitments, 3 to 6 hours a month, that he can keep.

**How he behaves:** explores on his own first and mentors second. Finds help in Discord and YouTube communities, not from Endless. Improvises around having fewer computers than kids.

**Frustrations:** no training, and nobody to ask when he's stuck. The site assumes a classroom and a roster. He isn't sure the platform is safe for the kids, especially chat.

**Shows up · drifts:** shows up when he wants to pass on what he learned. Drifts when there's no support, no recognition and nothing next for the kids.

**Quote (placeholder):** "Five computers, thirteen kids, and I'm the only one who's opened Godot."

**Messaging:** "Bring game making to your community." Lead with what he gets: practice, a mentor credential and other mentors to learn from.

**Reach him through:** GameLab alumni networks, and the Discord and YouTube communities he already uses.

## Partners

### Carmen, reporting partner or buyer

49, heads the innovation office at a private university in Lima · Partner lead · Peru · Spanish · Partial

Her university signed with Endless to run GameLab for students across its faculties. She doesn't teach and doesn't run cohorts. She oversees the program, answers to the rector and the board, and decides whether to renew. She wants a talent pipeline she can show, in her university's own terms.

- **Role:** signs the agreement and oversees the program. Doesn't run cohorts.
- **Reports to:** the rector and the board, and the committees that grant course credit.
- **Wants:** a talent pipeline: graduates hired as interns, instructors or into their first tech job.
- **Constraints:** working with the platforms the university already runs, and settling who owns student marks.

**Jobs to be done**

- Functional: When I report to my board, I want attainment in our framework and bands, and reach and completion against the agreement, with no named learners, so the report stands on its own.
- Emotional: When the program runs, I want to see results before the end, so renewal isn't a gamble.
- Social: When it works, I want stories, footage and student work we can share with our name on them, so our audiences see the impact.

**Goals:** completion and attainment in the university's own bands and vocabulary; a talent pipeline she can show; a program that scales and keeps running without Endless staff.

**How she behaves:** reads reports, not the platform. Measures every new tool against the platforms the university already runs. Uses student work and stories with her own audiences.

**Frustrations:** data that mixes platform usage with attainment, and no clear picture until the end. Reports in Endless' vocabulary (Explore, Core, four skill measures) instead of hers. Footage and student work she can't share because of release forms.

**Renews · walks away:** renews when completion and the talent story hold up in her university's terms. Walks away when the data arrives late, in the wrong vocabulary, or can't be shared.

**Quote (placeholder):** "Show me who finished, in our grading bands, and give me two stories I can take to the rector."

**Messaging:** talk outcomes and pipeline in her terms: completion, attainment bands, hires. Never lead with platform features.

**Reach her through:** her Endless partnership lead, through reports and short briefings, not the platform.

## Learner demographics

Who answered the learner surveys in 2025 and 2026: 4,686 responses, mostly teens and young adults in four countries, in Spanish, Arabic and English. The personas are set where these learners are. Every number is a share of survey responses, not of people.

- 90% come from four countries: the United States, Jordan, Peru and El Salvador.
- 89% of known ages are 16 or older.
- 54% of known languages are Spanish; Arabic is 32%.

### How complete the data is

| Field | Filled in |
|---|---|
| Country | 96% · 4,478 |
| Age group | 61% · 2,839 |
| Preferred language | 56% · 2,635 |
| Gender | 43% · 2,022 |

The gaps aren't random. The Explore: Godot and Explore: Threadbare forms, which most US learners filled in, don't ask age, gender or language, and the On-Ramps form rarely asks gender. Shares below are of the responses that have the field.

### Who answered

| Age (2,839 known) | Share |
|---|---|
| Under 13 | 0.8% · 24 |
| 13 to 15 | 10% · 293 |
| 16 to 18 | 46% · 1,312 |
| Over 18 | 43% · 1,210 |

Under-13s are rare in the data, but they turn up in sessions (see Chris and Daniel).

| Country (all 4,686) | Share |
|---|---|
| United States | 41% · 1,923 (closer to 45% counting 204 SMASH responses with no country) |
| Jordan | 19% · 875 |
| Peru | 18% · 836 |
| El Salvador | 13% · 603 |
| Uruguay | 2% · 107 |
| Nigeria | 1% · 52 |
| Kenya | 0.6% · 27 |
| About 15 others | 1% · 55 |

| Language (2,635 known) | Share |
|---|---|
| Spanish | 54% · 1,431 |
| Arabic | 32% · 835 |
| English | 12% · 310 (undercounted: the US Explore forms don't ask) |
| Arabic and English | 0.8% · 22 |
| Spanish and English | 0.2% · 6 |
| About 13 others | 1% · 31 |

| Program (all 4,686) | Share |
|---|---|
| Explore: Godot | 35% · 1,628 |
| Core: Godot | 22% · 1,014 |
| On-Ramps | 14% · 664 |
| Core: Threadbare (GameLab) | 12% · 574 |
| Explore: Threadbare | 6% · 277 |
| Core: Threadbare | 5% · 211 |
| Core: MakeCode | 3% · 139 |
| Others, each under 100 | 4% · 179 |

Gender is the weakest field (2,022 known): 57% male, 41% female, 0.7% prefer not to say, 0.3% non-binary, 0.1% agender. The male majority comes from one partner: Peru is 76% men (724 answers); without Peru, 52% women and 47% men. Jordan is 55% women, the US 54% women (209 answers).

### Four countries, four settings

- **United States** (1,923, 41%): teens in out-of-school programs. Explore: Godot (1,490) and Explore: Threadbare (256). Partners: seven Black Girls Code chapters (about 1,230), the SMASH summer program (about 460, plus 204 with no country), Urban Arts (136), JA Miami (41) and smaller groups. Only 209 responses have an age, gender or language; of those, 88% are 13 to 18 and 54% are girls. Mostly 2026. Personas: Maya, Daniel, Chris, Beth.
- **Jordan** (875, 19%): high schoolers and university students, in Arabic. Core: Godot (711) and Explore: Godot (131). More than 20 public girls' and boys' high schools (about 410), seven universities (about 150), three community organizations (about 190). 57% are 16 to 18, 30% over 18, 13% 13 to 15; 55% women; 95% prefer Arabic. 2025. Personas: Lina, Rania, Omar.
- **Peru** (836, 18%): university students in GameLab. Core: Threadbare (GameLab) (527), Core: Threadbare (208), More: Threadbare, Collaborative Game Making (70). Partner: UTP, 816 of 836. 99% of known ages over 18; 76% men. Spanish. 2025 and 2026. Personas: Diego, Andrés, Carmen.
- **El Salvador** (603, 13%): teens in On-Ramps (597), no partner recorded. 76% are 16 to 18, 16% over 18, 8% 13 to 15. Spanish. Gender missing for 598. 2026. No persona until we know who these learners are.

### How to read these numbers

- Responses, not people. A learner who took a pre-survey and a post-survey counts twice. Most responses (58%) are pre-surveys.
- Coverage is uneven, and the gaps follow the forms.
- The numbers describe the programs surveyed, not everyone on the platform. Don't generalize to regions with a few dozen responses.

## Evidence and open questions

### Evidence by persona

| Persona | Confidence | Evidence | Validate next |
|---|---|---|---|
| Maya | Partial | Field observations, onboarding specs, the partner feedback log and survey counts; no learner under 18 interviewed. Quote written by colleagues in the learner's voice. | Transcribe the three October student recordings, then observe a first session and a closing event at a club chapter, through the partner's consent process. |
| Lina | Partial | Survey counts, onboarding specs and partner-site observations; no learner under 18 interviewed. | Her account rules aren't settled: the user type describes a school-owned restricted account that today enrolls only in Explore: Threadbare, but her school runs Core: Godot with a delivery partner. Find out who runs the sessions (school teachers or partner instructors) and which account, consent and data rules apply, then observe one lesson with the partner. |
| Diego | Evidence-based | 14+ learner interviews (Game Lab 4.0 and 5), 13 GameLab Peru alumni transcripts and the Lore Jam transcript, at one university. | More interviews would add little. Observe a first Git week and a week-two team check-in; talk to learners outside engineering and to university students in Jordan. |
| Daniel | Evidence-based | Educator Interviews, Website 2025 (five usability sessions) and the KIPP teacher interview; Educator Research 2026 (desk). His students aren't in the learner surveys yet. | Interview three teachers who have run a full unit, not only evaluated the website, and find out how long district approval actually takes. |
| Rania | Partial | Dimensions: Empowering Education in Jordan 2025 report and desk research; no teacher in this role interviewed. Jordan trained 136 supervisors and about 6,500 teachers for its digital-skills curriculum, supervisors first. | Interview two or three teachers in Jordan through the partner, and confirm whether teachers or partner instructors lead the sessions. |
| Chris | Partial | One after-school director in the usability sessions, UTP and train-the-trainer instructor feedback, partner reports. | Five facilitator interviews across two partners. Ask what they keep in a spreadsheet and what they do when something breaks mid-session. |
| Omar | Partial | Jordan partner report, Partner Types and Challenges and the Program Data Results deck; no program leader interviewed. The program grew from 2 to 10 governorates. | Interview the Jordan program lead and two instructors who were learners first; ask what they track by hand. |
| Beth | Hypothesized | Two intake answers, Educators Profiles (Sep 2026) and desk research; no parent interviewed. US homeschooling: 3 to 3.7 million learners, about 6%. Treat as a research brief. | Two or three conversations with homeschool parents before this card guides a decision. |
| Andrés | Hypothesized | One intake answer ("five computers for thirteen kids"), Educators Profiles, desk research and the GameLab Peru alumni transcripts; no mentor interviewed. His setting is an assumption. Treat as a research brief. | Ask GameLab alumni who mentor whether they do it through a partner or on their own. If on their own, interview three. |
| Carmen | Partial | Partner Types and Challenges (Oct 2026) and the Program Data Results deck; no partner lead interviewed about reporting. UTP is the largest single partner: 816 responses, 17% of all. | Transcribe the October partner recordings, then interview three or four partner leads about what they report, to whom, and what would stop a renewal. |

### Known weaknesses

- **Stereotypes:** eight of the ten cards rest on observations, documents or desk research, and six quotes are placeholders.
- **Survey gaps:** the US cards rest on forms that don't ask age, gender or language; the Jordan cards on partner documents nobody has checked with a teacher.
- **El Salvador has no persona:** its 603 responses come from On-Ramps, mostly 16- to 18-year-olds, with no partner recorded.

### Validation plan, in order of risk

1. Jordan's school sessions (Lina, Rania, Omar): find out who leads the sessions and which account and consent rules apply, then observe one lesson with the partner.
2. Facilitators (Chris), five interviews: easiest to reach, and the safest route to young learners.
3. The October recordings (Maya, Carmen): transcribe the three student clips and the partner interviews before anyone else is interviewed.
4. Homeschool parents and community mentors (Beth, Andrés), two or three each, before either card guides a decision.
5. Diego: observation, not interviews. A first Git week and a week-two team check-in.

### Open questions for the team

- Who are the 603 On-Ramps learners in El Salvador, who brought them, and which user type are they? (Learning and Partnerships)
- In Jordan's schools, do teachers or partner instructors lead the sessions, and which account rules apply to the learners? (Partnerships and Product)
- Should the Explore forms ask age, gender and language, so most US learners show up in the data? (Learning)
- Who approves consent, visibility and moderation for anything that reaches a learner under 18, and is that step in the design review? (Product and Communities)

**Sources:** User types (version 1.2, 26 October 2026); Learner Demographics brief (Omni, October 2026) and the Responses table of the Learner Demographics base in Airtable (4,686 responses, read 26 October 2026); the documents each user type cites.
