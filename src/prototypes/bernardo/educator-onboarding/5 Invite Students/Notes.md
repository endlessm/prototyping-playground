---
studioId: fv1jp8kcxmnsfv8x
---
# Flow 5 · Invite Students

**Option 2: Class Link.** Share one class link in the group chat, or upload a class list, and let each learner handle age and parent consent on their own side (not drawn here). It lives at `studio.endlessstudios.com/team/cohorts/spring-game-makers`.

## Notes

Each number matches a marker on the screens; hover a marker to read its note there.

**[5.1 Class Link](./5.1%20Class%20Link.vue)**

1. Main path is one shareable class link and code, built on today's enrollment codes (/signup?code=…). Homeschool co-ops already talk in a group chat, so Maya can paste one link there instead of collecting five addresses.
2. Seats is today's "Max Number Of Users" field. The link stops working when the class is full or after the expiry date, which limits damage if the link leaks. "Approve each learner" is the extra guard for a public link.
3. An NDPA cohort can't have an open link: restricted accounts must be created by the institution. The link card is replaced by the CSV upload, and the cohort waits for Endless's review.

**[5.3 Upload CSV](./5.3%20Upload%20CSV.vue)**

4. Upload CSV adds learners from a class list instead of the link: one row per learner (First Name, Last Name, an optional Email), checked against the class's seats. It opens as a modal over the class page, and nothing is added until Maya sees the rows and confirms. For an NDPA class it's the only way in: Endless creates restricted accounts after review.
5. Rows to fix are listed by row number with what to change. Maya can add the rows that are ready now, or upload a fixed file; the file name stays on screen with Replace.

**[5.5 Team Dashboard](./5.5%20Team%20Dashboard.vue)**

6. Back on the Team Dashboard, the cohort card tracks who's in (Joined, Needs parent consent, Bounced) next to the Cohort Dashboard placeholder (drawn solid, not dotted), and Open Workshop 1 takes Maya into the first class.

## Risk

Email is still there ("Send the link by email") for families who aren't in the group chat. Bounced only applies to those emails.
