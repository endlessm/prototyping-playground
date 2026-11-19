// The walkthrough's design notes, by flow. A screen's numbered marker n shows notes[flow][n - 1]. Every flow follows
// the same four beats: the invite, accepting it, the welcome, and the role's first task.
export const notes: Record<number, string[]> = {
  0: [
    "Proposed, v2. Seven roles across three levels, after the Product Check-in with Joana and Agustina on 12 November 2026: Org Educator and Cohort Manager are gone. Org Managers create Teams themselves; a Team Manager runs every Cohort in the Team; a Cohort Owner runs one Cohort without being able to create Cohorts. v1 keeps the nine-role model for reference. Each role is awarded by the one before it here, so the seven flows are one chain from Endless Access down to Sam, the Facilitator.",
    "Every flow has the same four beats, so a person who holds several roles learns the pattern once: an invite from whoever awards the role, accepting it (with or without an account), a welcome on the place the role is about, and the role's first task.",
  ],
  1: [
    'Org Owner is awarded only by an Endless Admin, so the invite comes from Endless Access and names the person at Endless who set it up. Endless creates the Organization first; that step is outside this prototype. Every invite in the prototype expires after 14 days, a proposal that limits a forwarded email.',
    "One accept page for every role: the invite's card on top (role, place, who invited) and the same one door as Join below it, with the invited email already filled in. Someone new goes through Verify Age and Sign Up (Educator Onboarding, flows 0 to 2) and comes back to the Welcome; they skip Choose a Path, since the invite already says what they came to do. Signed in, it's one Accept button. An expired invite says who to ask for a new one.",
    "The Welcome is the Organization's own page with a one-time card on top: the role, who added Grace, and the first things to do. A new Organization has no Teams and nobody else holds a role in it, so the Teams tab is empty and the first step is bringing in Org Managers. Roles add up on one account: Grace already volunteers as a Facilitator in Saturday Godot Jam, a Cohort of an Independent Team, so her switcher lists both places and the sidebar's Teach group shows Organization and Cohorts. Rename sits behind the pencil but is marked as an open question: the model hasn't settled whether an Org Owner or only an Endless Admin renames the Organization.",
    "Each add button gives one role, so the modal has no role to choose: Add Org Managers only adds Org Managers (Add Org Owner, beside the Org Owners title, only Org Owners). One field takes everyone: typing a name or an email opens a dropdown with the people in the district who could take the role (whoever holds it already is left out), and a typed email nobody on the list has shows as Invite <email>. Each pick becomes a chip; an optional note goes in the email. Here Grace has typed \"mar\" and Marcus shows. Proposal: the list is the district's people who already have an Endless account (school email); how an Organization knows its people is still open. The same modal serves every role in the prototype; only its title and list change.",
    "People lists each Organization role in its own section, with the add button at the right of its title. Invited people show as Invited until they accept. Grace can remove an Org Manager, but no Org Owner, herself included: only an Endless Admin strips an Org Owner, and the last Owner can't leave without naming another.",
  ],
  2: [
    'Org Manager comes from an Org Owner. The invite lists what the role adds in the order Marcus will use it: people first, then Teams.',
    'Same accept page as every flow. Marcus works for the district, so his school email signs in with Microsoft or Google; the invite never asks how he joins.',
    "Marcus lands on the same Organization page Grace set up, with his role's card on top. An Org Manager acts as Team Owner for every Team in the district, so later the Teams tab lets him open any of them; no Teams exist yet, so it is empty with Create a Team.",
    "Changed in v2: with Org Educator gone, an Org Manager awards two roles, each from its own place: Org Reviewer (who reads the reports) from Add Org Reviewers on People, and Team Owner when creating a Team (step 6). In Add Org Reviewers, Marcus has typed \"lin\" and Linda shows in the dropdown.",
    'Back on People, Linda is Invited as Org Reviewer. Marcus can remove her; he sees Org Owners and Org Managers but has no controls on them.',
    "Changed in v2: creating Teams in the district is the Org Manager's own power now, no longer borrowed from Org Educator. From the district's Teams tab, Create a Team starts on the district; Independent is the other choice. Because an Org Manager awards Team Owner, the modal names the Team's owner right away (Aisha, who teaches game design at Brightwater High). Left empty, Marcus is the Team Owner, as anyone who creates a Team is.",
    "The district's Teams list, with Aisha Invited as Team Owner. Marcus can open any Team in the district, since an Org Manager acts as Team Owner for all of them.",
  ],
  3: [
    'Org Reviewer comes from an Org Manager. The invite says plainly that the role is view only, so a principal or superintendent knows nothing they click changes a class.',
    'Same accept page. Org Reviewers are often district leaders who never teach on the platform, so this may be their first Endless account.',
    "Linda lands on Reports, the only thing her role can open. This screen shows the district once the flows are done, with two Teams: Brightwater High Game Design (Winter Godot Club and Spring Game Makers) and Northgate High CS (Fall Godot Club, already finished). Everything is aggregated: counts, progress and certificates per Team, with no learner names. That follows the model's recommendation on its open question (aggregated only, because many learners are minors); the scope is still undecided.",
    "A Team's report breaks the same numbers down by Cohort. It is the deepest Linda goes: no per-learner rows, and no actions anywhere on the page.",
  ],
  4: [
    'Changed in v2: Team Owner now comes from the Org Manager who created the Team (Marcus). Another Team Owner of the same Team can award it too, and anyone who creates a Team gets it on creation.',
    'Same accept page.',
    "Aisha lands on a Team with no Cohorts yet. A Team Owner holds everything a Team Manager can do, so if nobody else creates Cohorts she can do it herself: roles pile up on whoever has no one below them. Her tabs are Cohorts, People, Reports and Settings; Reports are the Team's consolidated reports across Cohorts.",
    "A Team Owner awards two Team roles, each from its own button: Add Team Managers (open here: Ben is already a chip, and typing \"dan\" finds Daniel) and Add Team Owner. Only Team Manager can be removed by a Team Owner; a Team Owner is removed only by an Org Manager (or an Endless Admin in an Independent Team).",
    "People shows Ben and Daniel Invited as Team Managers, with Remove beside them. Agreed on 12 Nov: the Team Owner is also the only one who removes a Cohort Owner. A Team Manager can add Cohort Owners but not remove them.",
  ],
  5: [
    "Team Manager comes from a Team Owner (Aisha). The invite says the two things the role does: create Cohorts, and run every Cohort in the Team.",
    'Same accept page.',
    "Changed in v2: Ben sees every Cohort in the Team, not only his own, and can open each one as its Cohort Owner. Daniel's Winter Godot Club is already there. Agreed with Joana: a Team Manager runs all the Team's Cohorts and assigns their Facilitators, the way a Program Manager does today. The open risk Bernardo raised stays visible here: Ben could change or archive a Cohort Daniel created. His switcher also lists Fall Godot Club, at Northgate High CS, where Priya made him a Facilitator: a Team Manager in one Team can be a Facilitator in another.",
    "Create a Cohort is a short form here (name, Program, start date, seats); Educator Onboarding's Create Cohort page is the full proposal. The Program list shows only what the district can run: the Programs open to everyone, plus any custom Programs the district has a Partnership for.",
    "The new Cohort opens with Ben as its Cohort Owner, the role you get by creating one. From here he is in flow 6's shoes: he invites Sofia as a second Cohort Owner.",
  ],
  6: [
    "Cohort Owner comes here from another Cohort Owner of the same Cohort (Ben). A Team Manager or Team Owner can award it too, and whoever creates a Cohort gets it on creation. Joana's example: Sofia is a co-teacher, not a Team Manager. She can't create Cohorts, but she runs this one: edits it, starts it, archives it and picks its Facilitators.",
    'Same accept page.',
    "Sofia lands on the Cohort, which hasn't started. Her tabs are everything a Cohort has: Learners, Sessions, People, Reports and Settings. Her switcher lists this Cohort, not the rest of the Team: a Cohort Owner sees the Cohorts she owns. It also lists Saturday Godot Jam, where she is a learner: an educator can learn on the same account. A place where she learns stays out of the Teach group in the sidebar.",
    "Changed in v2: with Cohort Manager gone, a Cohort Owner awards two Cohort roles, each from its own button: Invite Facilitators and Add Cohort Owner. A Facilitator often comes from outside the district (a volunteer, a parent with game-dev experience), so besides the district's people the modal takes any email address: Sam's personal Gmail is typed in, and the dropdown offers Invite sam.rivera@gmail.com.",
    "People shows Cohort Owners and Facilitators. Sam is Invited as Facilitator, with Remove: a Cohort Owner awards and strips Facilitators. The Cohort Owners have no Remove: only the Team Owner removes a Cohort Owner.",
  ],
  7: [
    'Facilitator comes from a Cohort Owner (Sofia). The invite comes from outside the district, so it names the district and the school as well as the Cohort.',
    "Same accept page. Sam uses a personal Gmail, so Continue with Google is the quickest door. Facilitators work with learners under 18, so like every educator they must be 18 or older (Verify Age, Educator Onboarding flow 0).",
    "Sam sees only Learners and Sessions: the Cohort's information, its sessions and the learners' tasks. No People, Reports or Settings. Agreed on 12 Nov: a Facilitator sees only the Cohorts they are assigned to, never the rest of the Team. His first step is bringing the learners in, since adding and removing learners is a Facilitator's job. His switcher also lists Weekend Game Lab, the Independent Team he created and owns outside the district: the same account is a Facilitator here and a Team Owner there.",
    "Add Learners is the Cohort's join link (Educator Onboarding flow 5): one link and code for the class, with Copy Link, and Upload CSV for a class list. The link stops at 24 seats or a week after the start.",
    "Learners who followed the link show in Who's in, with their email and the day they joined. Sam can remove one. Grant Certificate shows on each learner once the Cohort runs; that's outside onboarding.",
  ],
}
