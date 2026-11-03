// The walkthrough's design notes, in order. A screen's numbered marker n shows notes[flow][n - 1].
export const notes: Record<number, string[]> = {
  1: [
    "One door. The page never asks \"log in or sign up?\", the question new users most often get wrong, so returning and new educators follow the same path.",
    "Provider hint: a gmail.com, outlook.com or hotmail.com address suggests the matching single sign-on, which removes a password from the journey.",
    "Returning: the password field appears on the same page under the confirmed email, and Change goes back without losing anything.",
    "New: one confirmation, then straight into the Sign-up area (draft 2) with the email filled in.",
  ],
  2: [
    "Single sign-on gets one confirmation screen. What the system already knows (name and email from Google, role from the Join path) shows as a card to confirm, not as fields to fill.",
    "Date of birth is the one field left, and the hint says why it's asked and that educators must be 18 or older. The date is checked before the account is created.",
    "The Terms page and the policy checkbox are merged into the submit button. All of the PDF's Sign-up fields are still collected, on one screen.",
    "Edit opens the name row in place, split into first and last name. Error state: an impossible date is called out with what to check.",
    "Email sign-ups use the same page with Name, Date of Birth and Password added. The live checklist stays (all rules met here). A Google link offers a way to skip the password.",
    "Under 18, no account is created: the date field says why and the button stays off. Every educator is an adult, so there is no teen or under-13 path here. \"Join as a learner\" goes to the learner sign-up, with its own age rules. Back returns to the step before (this card, or the email form) with everything kept, so a mistyped date can be fixed.",
  ],
  3: [
    "No Create Team step. After sign-up the system creates \"Maya's Team\", named with her first name, with her as owner. This follows the vault's Project 1 question: the Team exists to scope \"her cohorts\", and the vault itself suggests creating that grouping automatically for an independent teacher. Sign-up (draft 2) has no Account Created screen: Agree & Create Account hands off straight to the Team Dashboard.",
    "A one-time banner explains in one line what the team is for and offers Rename. Nothing blocks the next step.",
    "Empty state: the first thing Maya decides is her class (Create Cohort, draft 4), which is why she came.",
    "Rename opens a modal, from the banner or from the edit button beside the team name, so the dashboard stays in place. Error state: the name is too long, with a one-click fix. With one cohort, the dashboard shows the table and the \"Cohort Dashboard\" placeholder (solid here, dotted in the PDF).",
    "Open problem, answered \"later and elsewhere\": Invite Team members leaves onboarding for Team Settings › Co-Teachers. The page says learners are added inside each cohort, not here. Back and the breadcrumb return to the Team Dashboard, sending nothing.",
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
    "Learner side: the link opens today's sign-up with the class attached. The age gate comes first. Under 13 in the US goes to the Age-restricted page (digital minors can't sign up). 16+ goes straight to the sign-up method.",
    "13–15: the learner gives a parent's email and lands on the teal \"kids\" consent surface (grey here). Consent moves out of Maya's invite step and into the learner's sign-up, so Maya never has to know which families need it.",
    "Back on the Team Dashboard, the cohort card tracks who's in (Joined, Needs parent consent, Bounced) next to the Cohort Dashboard placeholder (drawn solid, not dotted), and Open Workshop 1 takes Maya into the first class.",
  ],
};
