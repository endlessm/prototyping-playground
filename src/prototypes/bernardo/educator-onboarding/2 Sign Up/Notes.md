---
studioId: 790q17j4we2q9vzg
---
# Flow 2 · Sign Up

**Option 4: Confirm Card.** Show what we already know as a card to confirm, and ask only for what's missing, on one screen. It lives at `account.endlessstudios.com/signup/confirm`.

## Notes

Each number matches a marker on the screens; hover a marker to read its note there.

**[2.1 Google Confirm](./2.1%20Google%20Confirm.vue)**

1. Single sign-on gets one confirmation screen. What the system already knows (name and email from Google, role from the Join path) shows as a card to confirm, not as fields to fill.
2. Date of birth is the one field left, and the hint says why it's asked and that educators must be 18 or older. The date is checked before the account is created.
3. The Terms page and the policy checkbox are merged into the submit button. All of the PDF's Sign-up fields are still collected, on one screen.

**[2.2 Edit & Error](./2.2%20Edit%20and%20Error.vue)**

4. Edit opens the name row in place, split into first and last name. Error state: an impossible date is called out with what to check.

**[2.3 Email Confirm](./2.3%20Email%20Confirm.vue)**

5. Email sign-ups use the same page with Name, Date of Birth and Password added. The live checklist stays (all rules met here). A Google link offers a way to skip the password.

**[2.5 Under 18](./2.5%20Under%2018.vue)**

6. Under 18, no account is created: the date field says why and the button stays off. Every educator is an adult, so there is no teen or under-13 path here. "Join as a learner" goes to the learner sign-up, with its own age rules. Back returns to the step before (this card, or the email form) with everything kept, so a mistyped date can be fixed.

## Risk

Role shows as "Joining as Educator" with Change, not as a field. If the educator didn't come through a teaching path, the row becomes a three-way choice: Learner, Educator, Parent or Guardian.
