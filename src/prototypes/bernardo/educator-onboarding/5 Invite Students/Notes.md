---
studioId: fv1jp8kcxmnsfv8x
---
# Flow 5 · Invite Students

**Option 2: Class Link.** Share one class link in the group chat, and let each learner handle age and parent consent on their own side. It lives at `studio.endlessstudios.com/team/cohorts/spring-game-makers`.

## Notes

Each number matches a marker on the screens; hover a marker to read its note there.

**[5.1 Class Link](./5.1%20Class%20Link.vue)**

1. Main path is one shareable class link and code, built on today's enrollment codes (/signup?code=…). Homeschool co-ops already talk in a group chat, so Maya can paste one link there instead of collecting five addresses.
2. Seats is today's "Max Number Of Users" field. The link stops working when the class is full or after the expiry date, which limits damage if the link leaks. "Approve each learner" is the extra guard for a public link.
3. An NDPA cohort can't have an open link: restricted accounts must be created by the institution. The link card is replaced by the CSV upload, and the cohort waits for Endless's review.

**[5.3 Learner Joins](./5.3%20Learner%20Joins.vue)**

4. Learner side: the link opens today's sign-up with the class attached. The age gate comes first. Under 13 in the US goes to the Age-restricted page (digital minors can't sign up). 16+ goes straight to the sign-up method.

**[5.4 Parent Consent](./5.4%20Parent%20Consent.vue)**

5. 13–15: the learner gives a parent's email and lands on the teal "kids" consent surface (grey here). Consent moves out of Maya's invite step and into the learner's sign-up, so Maya never has to know which families need it.

**[5.5 Team Dashboard](./5.5%20Team%20Dashboard.vue)**

6. Back on the Team Dashboard, the cohort card tracks who's in (Joined, Needs parent consent, Bounced) next to the Cohort Dashboard placeholder (drawn solid, not dotted), and Open Workshop 1 takes Maya into the first class.

## Risk

Email is still there ("Send the link by email") for families who aren't in the group chat. Bounced only applies to those emails.
