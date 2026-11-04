---
studioId: 1zz0rz2bs128jfjc
---
# Flow 3 · Create Team

**Option 3: Auto Team.** Skip the step: create the team for the educator, let them rename it in a modal from the dashboard, and keep co-teachers in Team Settings. It lives at `studio.endlessstudios.com/team`.

## Notes

Each number matches a marker on the screens; hover a marker to read its note there.

**[3.1 After Sign-Up](./3.1%20After%20Sign-Up.vue)**

1. No Create Team step. After sign-up the system creates "Maya's Team", named with her first name, with her as owner. This follows the vault's Project 1 question: the Team exists to scope "her cohorts", and the vault itself suggests creating that grouping automatically for an independent teacher. Sign-up (draft 2) has no Account Created screen: Create Account hands off straight to the Team Dashboard.

**[3.2 Empty Dashboard](./3.2%20Empty%20Dashboard.vue)**

2. A one-time banner explains in one line what the team is for and offers Rename. Nothing blocks the next step.
3. Empty state: the first thing Maya decides is her class (Create Cohort, draft 4), which is why she came.

**[3.3 Rename](./3.3%20Rename.vue)**

4. Rename opens a modal, from the banner or from the edit button beside the team name, so the dashboard stays in place. Error state: the name is too long, with a one-click fix. With one cohort, the dashboard shows the table and the "Cohort Dashboard" placeholder (solid here, dotted in the PDF).

**[3.5 Team Settings](./3.5%20Team%20Settings.vue)**

5. Open problem, answered "later and elsewhere": Invite Team members leaves onboarding for Team Settings › Co-Teachers. The page says learners are added inside each cohort, not here. Back and the breadcrumb return to the Team Dashboard, sending nothing.

**[3.6 Joined as Co-Teacher](./3.6%20Joined%20as%20Co-Teacher.vue)**

6. Joined from a co-teacher invite: the invite already names the team, so no team is made for her. Dana lands on Okafor Homeschool Co-op's dashboard, marked Co-teacher, with a one-time banner saying who invited her. She can create cohorts and see the team's learners; renaming the team and inviting others stay with the owner. If the invite expired or was withdrawn, she gets her own team like any new educator.

## Risk

Risk: learners and parents see "Maya's Team" if she never renames it. That's acceptable for a solo educator and awkward for a co-op, so the banner stays until she renames it or dismisses it.
