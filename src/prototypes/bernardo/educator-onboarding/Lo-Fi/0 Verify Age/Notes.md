---
studioId: f0yxnag274hkkxdv
---
# Flow 0 · Verify Age

**Age first.** Before Join, one page asks for the date of birth. Its answer decides the path, so no later page asks for it again.

## Notes

Each number matches a marker on the screens; hover a marker to read its note there.

**[0.1 Verify Age](./0.1%20Verify%20Age.vue)**

1. Age comes first, before Join. One date of birth covers every path (email, Google, GitHub, Microsoft), so the sign-up pages no longer ask for it.
2. Under 13: the error sits under the date and no account is made. The date stays filled in, so a mistyped year is fixed in place.
3. An impossible date says what to check, and keeps what was typed.

**[0.2 kID Safety](./0.2%20kID%20Safety.vue)**

4. 13 to 17: the kID Safety page says some features are limited and that a parent or trusted adult can unlock them later. Ok! continues to Join, but only as a learner: educators must be 18 or older. In hi-fi this is the teal youth surface (grey here).

## Routes

- 18 or older → [1.1 Join](../1%20Join%20and%20Log%20In/1.1%20Join.vue)
- 13 to 17 → [0.2 kID Safety](./0.2%20kID%20Safety.vue), then Join as a learner. Educator can't be chosen at sign-up (the "13 to 17" state of [2.1 Google Confirm](../2%20Sign%20Up/2.1%20Google%20Confirm.vue) and [2.3 Email Confirm](../2%20Sign%20Up/2.3%20Email%20Confirm.vue))
- Under 13 → inline error on [0.1 Verify Age](./0.1%20Verify%20Age.vue), no account
