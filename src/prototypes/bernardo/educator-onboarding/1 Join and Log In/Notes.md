---
studioId: cvbmkkms83yp5tmt
---
# Flow 1 · Join & Log In

**Option 2: Email First.** One adaptive page: type your email and the page itself becomes log-in or account creation. It lives at `account.endlessstudios.com/join`. It comes right after [Flow 0 · Verify Age](../0%20Verify%20Age/Notes.md), so the age is already known.

## Notes

Each number matches a marker on the screens; hover a marker to read its note there.

**[1.1 Join](./1.1%20Join.vue)**

1. One door. The page never asks "log in or sign up?", the question new users most often get wrong, so returning and new educators follow the same path.
2. Provider hint: a gmail.com, outlook.com or hotmail.com address suggests the matching single sign-on, which removes a password from the journey.
4. New: no in-between page. Continue with an email that has no profile goes straight to the sign-up form (draft 2) with the email filled in, still an open field, so a typo is fixed there.
5. Single sign-on works the same way: coming back from Google, GitHub or Microsoft, the provider's verified email decides. A profile with that email signs in; no profile goes straight to the confirm page in Sign-up (draft 2), one page for all three providers, with what the provider shared already filled in.

**[1.2 Returning](./1.2%20Returning.vue)**

3. Returning: the password field appears on the same page, under the email. The email stays an open field, so fixing a typo needs no Change step or going back.

## Risk

Single sign-on buttons sit in one row below the email, so email stays the default and the providers stay one click away.
