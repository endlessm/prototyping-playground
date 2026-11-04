---
studioId: 790q17j4we2q9vzg
---
# Flow 2 · Sign Up

**Option 4: Confirm Card.** Fill in what we already know, and ask only for what's missing, on one screen. It lives at `account.endlessstudios.com/signup/confirm`. Age is no longer asked here: it was checked before Join ([Flow 0 · Verify Age](../0%20Verify%20Age/Notes.md)).

## Notes

Each number matches a marker on the screens; hover a marker to read its note there.

**[2.1 Google Confirm](./2.1%20Google%20Confirm.vue)**

1. Single sign-on gets one confirmation screen, the same for Google, GitHub and Microsoft. What the system already knows is filled in: first and last name from the provider, and Joining as from the Join path, both fields that can be changed directly, with no Edit step. The email comes from the provider and is locked. When a provider shares no name (GitHub's is optional), the name fields start empty.
2. No date of birth here: age was checked before Join (Verify Age, flow 0). The Terms of Use are a box the educator ticks themselves, never consent by default, and the Privacy Policy line is gone.

**[2.2 Terms Not Accepted](./2.2%20Terms%20Not%20Accepted.vue)**

3. Error state: Create Account without the box ticked says what's missing, next to the box, and keeps everything else that was typed.

**[2.3 Email Confirm](./2.3%20Email%20Confirm.vue)**

4. Email sign-ups use the single sign-on page with Password added. The same fields are filled in from the Join step, but the email stays open, since the educator typed it, and no row has a Change link. The live checklist stays (all rules met here), and a Repeat Password field below it confirms the password was typed as intended, with its own check that the two match. The same Terms box comes last. A Google link offers a way to skip the password.

**[2.6 GitHub Unverified](./2.6%20GitHub%20Unverified.vue)**

5. GitHub lets anyone add an email to their account without proving it's theirs; GitHub marks it Unverified until its link is clicked. Google and most Microsoft accounts send emails that are already confirmed, so in practice this comes up with GitHub. Accepting an unconfirmed email would let someone sign up, or reach an existing account, with another person's email, so no account is created. The page names the problem, lists the steps to fix it on GitHub, and keeps joining with an email one click away.

**13 to 17** (a state of [2.1](./2.1%20Google%20Confirm.vue) and [2.3](./2.3%20Email%20Confirm.vue))

6. 13 to 17: Verify Age already knows the age, so Joining as starts on Learner and Educator can't be chosen; the hint says educators must be 18 or older. Create Account makes a learner account with no Team, and the educator path ends here.

## Risk

Only a verified email counts when the system looks for an existing profile after single sign-on. A Microsoft work account's email, or GitHub's, isn't always verified, and matching on it would let someone reach another person's account.
