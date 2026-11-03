---
studioId: bdcabdvzsneajbqx
---
# Flow 4 · Create Cohort

**Option 4: Wizard.** Four short steps with smart defaults: program from the link, a suggested name, a plain "US school?" question, and a review. Each step gets room to explain itself, with context and an educator quote beside it. The wizard opens over the current page, so any Create Cohort button in the app can call it (the empty dashboard and the dashboard with cohorts both do). A program link such as `studio.endlessstudios.com/classes/new?program=explore-threadbare` opens it with that program chosen.

## Notes

Each number matches a marker on the screens; hover a marker to read its note there.

**[4.1 From a Link](./4.1%20From%20a%20Link.vue)**

1. Create Cohort is a four-step wizard (Program, Class name, Where you teach, Review) that opens over the current page, so any Create Cohort button in the app can call it. Each step has a context column beside it: why the step matters and a short quote from another educator. Arriving from a program link (draft 1, Option 4), the program is already selected and a banner says why; without a link, nothing is selected. Programs are a short list on the left; the selected one opens in full beside it (what learners make, skills, ages, the first workshops, the teacher guide), so the choice is informed without leaving the step.
2. The class name is suggested from the season, so most educators just continue. A preview shows the invite the way learners will see it.
3. The NDPA question in plain words, No by default, with a hint for homeschool groups, co-ops and clubs. Most Type 8 educators never need to change it. The answer explains, in place, what an open or closed class means.
4. The Review step sums up the answers, each with Change to jump back to its step, and says what learners will get (open class, workshops, how they join).

**[4.2 Missing Info](./4.2%20Missing%20Info.vue)**

5. Validation state: Continue with nothing chosen says what that step is missing. Earlier answers are kept, and the steps already done can be revisited from the progress bar.

**[4.3 US School](./4.3%20US%20School.vue)**

6. Yes (shown with a sample school teacher's class) expands the explanation and a School name field in place; at Review, the button becomes Send for Review.

**[4.4 In Review](./4.4%20In%20Review.vue)**

7. Pending review: learners can be added now and their invites wait for approval, so the educator doesn't lose momentum while Endless reviews.

## Risk

Trade-off: four steps instead of one page add clicks for an educator who accepts every default (Continue three times, then Create Class). The defaults and the review keep each click short; if testing shows it drags, the Class name and Where you teach steps could merge.
