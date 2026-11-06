// The walkthrough's design notes, in order. A screen's numbered marker n shows notes[flow][n - 1].
export const notes: Record<number, string[]> = {
  0: [
    "Age comes first, before Join. One date of birth covers every path (email, Google, GitHub, Microsoft), so the sign-up pages no longer ask for it.",
    "Under 13: the error sits under the date and no account is made. The date stays filled in, so a mistyped year is fixed in place.",
    "An impossible date says what to check, and keeps what was typed.",
    "13 to 17: the kID Safety page says some features are limited and that a parent or trusted adult can unlock them later. Ok! continues to Join, but only as a learner: educators must be 18 or older. In hi-fi this is the teal youth surface (grey here).",
  ],
  1: [
    "One door. The page never asks \"log in or sign up?\", the question new users most often get wrong, so returning and new educators follow the same path.",
    "Provider hint: a gmail.com, outlook.com or hotmail.com address suggests the matching single sign-on, which removes a password from the journey.",
    "Returning: the password field appears on the same page, under the email. The email stays an open field, so fixing a typo needs no Change step or going back.",
    "New: no in-between page. Continue with an email that has no profile goes straight to the sign-up form (draft 2) with the email filled in, still an open field, so a typo is fixed there.",
    "Single sign-on works the same way: coming back from Google, GitHub or Microsoft, the provider's verified email decides. A profile with that email signs in; no profile goes straight to the confirm page in Sign-up (draft 2), one page for all three providers, with what the provider shared already filled in.",
  ],
  2: [
    "Single sign-on gets one confirmation screen, the same for Google, GitHub and Microsoft. What the system already knows is filled in: first and last name from the provider, and Joining as from the Join path, both fields that can be changed directly, with no Edit step. The email comes from the provider and is locked. When a provider shares no name (GitHub's is optional), the name fields start empty.",
    "No date of birth here: age was checked before Join (Verify Age, flow 0). The Terms of Use are a box the educator ticks themselves, never consent by default, and the Privacy Policy line is gone.",
    "Error state: Create Account without the box ticked says what's missing, next to the box, and keeps everything else that was typed.",
    "Email sign-ups use the single sign-on page with Password added. The same fields are filled in from the Join step, but the email stays open, since the educator typed it, and no row has a Change link. The live checklist stays (all rules met here), and a Repeat Password field below it confirms the password was typed as intended, with its own check that the two match. The same Terms box comes last. A Google link offers a way to skip the password.",
    "GitHub lets anyone add an email to their account without proving it's theirs; GitHub marks it Unverified until its link is clicked. Google and most Microsoft accounts send emails that are already confirmed, so in practice this comes up with GitHub. Accepting an unconfirmed email would let someone sign up, or reach an existing account, with another person's email, so no account is created. The page names the problem, lists the steps to fix it on GitHub, and keeps joining with an email one click away.",
    "13 to 17: Verify Age already knows the age, so Joining as starts on Learner and Educator can't be chosen; the hint says educators must be 18 or older. Create Account makes a learner account with no Team, and the educator path ends here.",
  ],
  3: [
    "No Create Team step. After sign-up the system creates \"Maya's Team\", named with her first name, with her as owner. This follows the vault's Project 1 question: the Team exists to scope \"her cohorts\", and the vault itself suggests creating that grouping automatically for an independent teacher. Sign-up (draft 2) has no Account Created screen: Create Account hands off straight to the Team Dashboard.",
    "A one-time banner explains in one line what the team is for and offers Rename. Nothing blocks the next step.",
    "Empty state: the first thing Maya decides is her class (Create Cohort, draft 4), which is why she came.",
    "Rename opens a modal, from the banner or from the edit button beside the team name, so the dashboard stays in place. Error state: the name is too long, with a one-click fix. With one cohort, the dashboard shows the table and the \"Cohort Dashboard\" placeholder (solid here, dotted in the PDF).",
    "Open problem, answered \"later and elsewhere\": Invite Team members leaves onboarding for Team Settings › Co-Teachers. The page says learners are added inside each cohort, not here. Back and the breadcrumb return to the Team Dashboard, sending nothing.",
    "Joined from a co-teacher invite: the invite already names the team, so no team is made for her. Dana lands on Okafor Homeschool Co-op's dashboard, marked Co-teacher, with a one-time banner saying who invited her. She can create cohorts and see the team's learners; renaming the team and inviting others stay with the owner. If the invite expired or was withdrawn, she gets her own team like any new educator.",
  ],
  4: [
    "Create Cohort is a four-step wizard (Program, Class name, Where you teach, Review) that opens over the current page, so any Create Cohort button in the app can call it. Each step has a context column beside it: why the step matters and a short quote from another educator. Arriving from a program link (draft 1, Option 4), the program is already selected and a banner says why; without a link, nothing is selected. Programs are a short list on the left; the selected one opens in full beside it (what learners make, skills, ages, the first workshops, the teacher guide), so the choice is informed without leaving the step.",
    "The class name is suggested from the season, so most educators just continue. A preview shows the invite the way learners will see it.",
    "The NDPA question in plain words, No by default, with a hint for homeschool groups, co-ops and clubs. Most Type 8 educators never need to change it. The answer explains, in place, what an open or closed class means.",
    "The Review step sums up the answers, each with Change to jump back to its step, and says what learners will get (open class, workshops, how they join).",
    "Validation state: Continue with nothing chosen says what that step is missing. Earlier answers are kept, and the steps already done can be revisited from the progress bar.",
    "Yes (shown with a sample school teacher's class) expands the explanation and a School name field in place; at Review, the button becomes Send for Review.",
    "Pending review: learners can be added now and their invites wait for approval, so the educator doesn't lose momentum while Endless reviews.",
  ],
  5: [
    "Main path is one shareable class link and code, built on today's enrollment codes (/signup?code=…). Homeschool co-ops already talk in a group chat, so Maya can paste one link there instead of collecting five addresses.",
    "Seats is today's \"Max Number Of Users\" field. The link stops working when the class is full or after the expiry date, which limits damage if the link leaks. \"Approve each learner\" is the extra guard for a public link.",
    "An NDPA cohort can't have an open link: restricted accounts must be created by the institution. The link card is replaced by the CSV upload, and the cohort waits for Endless's review.",
    "Upload CSV adds learners from a class list instead of the link: one row per learner (First Name, Last Name, an optional Email), checked against the class's seats. It opens as a modal over the class page, and nothing is added until Maya sees the rows and confirms. For an NDPA class it's the only way in: Endless creates restricted accounts after review.",
    "Rows to fix are listed by row number with what to change. Maya can add the rows that are ready now, or upload a fixed file; the file name stays on screen with Replace.",
    "Back on the Team Dashboard, the cohort card tracks who's in (Joined, Needs parent consent, Bounced) next to the Cohort Dashboard placeholder (drawn solid, not dotted), and Open Workshop 1 takes Maya into the first class.",
  ],
};
