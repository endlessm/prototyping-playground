// The walkthrough's design notes, by flow. A screen's numbered marker n shows notes[flow][n - 1]. Every flow follows
// the same four beats: the invite, accepting it, the welcome, and the role's first task.
export const notes: Record<number, string[]> = {
  0: [
    'Proposed. Nine roles across three levels, from context/educator-roles.md (approved 11 November 2026, not built). Each role is awarded by the one before it here, so the nine flows are one chain: Endless Access makes Grace the Org Owner, and each person in turn brings in the next, down to Sam, the Facilitator.',
    "Every flow has the same four beats, so a person who holds several roles learns the pattern once: an invite from whoever awards the role, accepting it (with or without an account), a welcome on the place the role is about, and the role's first task.",
  ],
  1: [
    'Org Owner is awarded only by an Endless Admin, so the invite comes from Endless Access and names the person at Endless who set it up. Endless creates the Organization first; that step is outside this prototype. Every invite in the prototype expires after 14 days, a proposal that limits a forwarded email.',
    "One accept page for every role: the invite's card on top (role, place, who invited) and the same one door as Join below it, with the invited email already filled in. Someone new goes through Verify Age and Sign Up (Educator Onboarding, flows 0 to 2) and comes back to the Welcome; they skip Choose a Path, since the invite already says what they came to do. Signed in, it's one Accept button. An expired invite says who to ask for a new one.",
    "The Welcome is the Organization's own page with a one-time card on top: the role, who added Grace, and the first things to do. A new Organization has no Teams and nobody else in it, so the Teams tab is empty and the first step is bringing in Org Managers. Rename sits behind the pencil but is marked as an open question: the model hasn't settled whether an Org Owner or only an Endless Admin renames the Organization.",
    'Adding a role opens a modal: emails as chips, the role to give (only the roles this viewer may award: for the Org Owner, Org Manager and Org Owner) and an optional note that goes in the email. The same modal serves every role in the prototype; only its role choices change.',
    "People lists each Organization role in its own section, with the add button at the right of its title. Invited people show as Invited until they accept. Grace can remove an Org Manager, but no Org Owner, herself included: only an Endless Admin strips an Org Owner, and the last Owner can't leave without naming another.",
  ],
  2: [
    'Org Manager comes from an Org Owner. The invite lists what the role adds in the order Marcus will use it: people first, then Teams.',
    'Same accept page as every flow. Marcus works for the district, so his school email signs in with Microsoft or Google; the invite never asks how he joins.',
    "Marcus lands on the same Organization page Grace set up, with his role's card on top. An Org Manager acts as Team Owner for every Team in the district, so later the Teams tab lets him open any of them; no Teams exist yet, so it is empty with Create a Team.",
    'The add modal offers the three roles an Org Manager awards: Org Educator (who creates Teams), Org Reviewer (who reads the reports) and Team Owner of a chosen Team. Team Owner needs a Team, so the Team picker only shows when that role is chosen, and the role is off until a Team exists.',
    'Back on People, the new Org Educator and Org Reviewer are Invited. Marcus can remove both; he sees Org Owners and Org Managers but has no controls on them.',
    "An Org Manager creates Teams too (the role includes the Org Educator's). From the district's Teams tab, Create a Team starts on the district; Independent is the other choice. Because an Org Manager awards Team Owner, the modal can name the Team's owners right away (Priya, Northgate's CS teacher). Left empty, Marcus is the Team Owner, as anyone who creates a Team is.",
    "The district's Teams list, with Priya Invited as Northgate's Team Owner. Marcus can open any Team in the district, since an Org Manager acts as Team Owner for all of them.",
  ],
  3: [
    'Org Reviewer comes from an Org Manager. The invite says plainly that the role is view only, so a principal or superintendent knows nothing they click changes a class.',
    'Same accept page. Org Reviewers are often district leaders who never teach on the platform, so this may be their first Endless account.',
    "Linda lands on Reports, the only thing her role can open. This screen shows the district months on, with two Teams running. Everything is aggregated: counts, progress and certificates per Team, with no learner names. That follows the model's recommendation on its open question (aggregated only, because many learners are minors); the scope is still undecided.",
    "A Team's report breaks the same numbers down by Cohort. It is the deepest Linda goes: no per-learner rows, and no actions anywhere on the page.",
  ],
  4: [
    'Org Educator comes from an Org Manager. It is the role for a teacher who will start their own Team inside the district.',
    'Same accept page. A teacher who already has an Independent Educator account signs in and keeps it: their Independent Teams stay Independent, and this role only adds the power to create Teams in the district.',
    "Daniel's Welcome is the Organization page as he sees it: only his own Teams, none yet, and Create a Team. The district's other Teams and its people aren't his to see.",
    "Create a Team asks for the name and where the Team belongs. From the district's page it starts on the district: its Cohorts can run the Programs open to everyone plus the district's custom ones. Independent is the other choice, with only the Programs open to everyone. Either way Daniel becomes its Team Owner on creation. Only the roles that create Teams in the district (Org Educator, Org Manager, Org Owner) see the district as a choice.",
    'The new Team opens with Daniel as Team Owner, the same Welcome card pattern, and an empty Cohorts tab. From here he is in flow 5\'s shoes: he will add Aisha as a second Team Owner.',
    "Belonging to a district never takes away an educator's own space: anyone can create an Independent Team, whatever roles they hold. Create a Team sits at the foot of the place switcher for every educator in every flow, and starts on Independent there. For someone with no role that creates Teams in a district, Independent is the only choice.",
    "The Independent Team is Daniel's alone: no Organization above it, only the Programs open to everyone, and only an Endless Admin can strip its Team Owner. The switcher lists all his places, each with its own role: Org Educator of the district, Team Owner of Brightwater High Game Design, and Team Owner of Reyes Game Club (Independent). Nothing from the district reaches this Team, and its Cohorts don't show in the district's reports.",
  ],
  5: [
    'Team Owner comes here from another Team Owner of the same Team (Daniel). An Org Manager can award it too, and anyone who creates a Team gets it on creation (flow 4).',
    'Same accept page.',
    "Aisha lands on the Team's page. A Team Owner sees every Cohort in the Team and acts as Cohort Owner of each, so Daniel's Winter Godot Club is listed and opens for her. Her tabs are Cohorts, People, Reports and Settings; Reports are the Team's consolidated reports across Cohorts.",
    'The add modal offers Team Manager and Team Owner, the two Team roles a Team Owner awards. Only Team Manager can be removed by a Team Owner; a Team Owner is removed only by an Org Manager (or an Endless Admin in an Independent Team).',
    'People shows Team Owners and Team Managers. Ben is Invited as Team Manager, with Remove beside him; the Team Owners have no Remove for Aisha.',
  ],
  6: [
    "Team Manager comes from a Team Owner (Aisha). The role's one power is creating Cohorts, which the invite says in one line.",
    'Same accept page.',
    "Ben's Team page shows only the Cohorts he owns. He has none yet, so the tab is empty with Create a Cohort. He sees who is in the Team but can't change it.",
    "Create a Cohort is a short form here (name, Program, start date, seats); Educator Onboarding's Create Cohort page is the full proposal. The Program list shows only what the district can run: the Programs open to everyone, plus any custom Programs the district has a Partnership for.",
    "The new Cohort opens with Ben as its Cohort Owner, the role you get by creating one. From here he is in flow 7's shoes: he will add Sofia as a second Cohort Owner.",
  ],
  7: [
    'Cohort Owner comes here from another Cohort Owner of the same Cohort (Ben). A Team Owner can award it too, and whoever creates a Cohort gets it on creation (flow 6).',
    'Same accept page.',
    "Sofia lands on the Cohort, which hasn't started. Her tabs are everything a Cohort has: Learners, Sessions, People, Reports and Settings. The Welcome's first steps are about the people who will run it with her.",
    'The add modal offers Cohort Manager and Cohort Owner, the Cohort roles a Cohort Owner awards.',
    'People shows the three Cohort roles. Tom is Invited as Cohort Manager. A Cohort Owner can remove Cohort Managers; Facilitators belong to the Cohort Managers.',
  ],
  8: [
    'Cohort Manager comes from a Cohort Owner (Sofia).',
    'Same accept page.',
    "Tom's tabs drop Settings: a Cohort Manager can't edit or archive the Cohort. He gets Reports for this Cohort, and everything a Facilitator does.",
    'Invite Facilitators uses the same add modal with a single role. A Facilitator often comes from outside the district (a volunteer, a parent with game-dev experience), so the email field takes any address.',
    "People shows Sam Invited as Facilitator, with Remove: a Cohort Manager awards and strips Facilitators. Tom sees the Cohort Owners and Managers but can't change them.",
  ],
  9: [
    'Facilitator comes from a Cohort Manager (Tom). The invite comes from outside the district, so it names the district and the school as well as the Cohort.',
    "Same accept page. Sam uses a personal Gmail, so Continue with Google is the quickest door. Facilitators work with learners under 18, so like every educator they must be 18 or older (Verify Age, Educator Onboarding flow 0).",
    "Sam sees only Learners and Sessions: the Cohort's information, its sessions and the learners' tasks. No People, Reports or Settings. His first step is bringing the learners in, since adding and removing learners is a Facilitator's job.",
    "Add Learners is the Cohort's join link (Educator Onboarding flow 5): one link and code for the class, with Copy Link, and Upload CSV for a class list. The link stops at 24 seats or a week after the start.",
    "Learners who followed the link show in Who's in, with their email and the day they joined. Sam can remove one. Grant Certificate shows on each learner once the Cohort runs; that's outside onboarding.",
  ],
}
