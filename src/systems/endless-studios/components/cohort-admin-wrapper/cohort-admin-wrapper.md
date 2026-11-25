---
title: Cohort admin wrapper
description: The frame of every leader page under one cohort, with the breadcrumb back to its program, the cohort's name, status and dates, the page's actions and its content.
source: The app's own components/Cohort/Leader/CohortAdminWrapper.vue, copied unchanged from Endless-Game-Making-Studio/studio 4a5087452. Built on Leader/Generic/AdminPageHeader.vue and Nuxt UI's UBadge.
---

## When to use

Wrap each page under `/leader/programs/<program>/cohorts/<cohort>/`: the cohort's hub, Users, Codes, Task progress, Quizzes and Prompt scores. It keeps the heading and breadcrumb the same from page to page, so moving between them only changes the content.

Leave out `title` on the hub, which shows the cohort's name as its heading. Every other page passes its own name (`:title="t('codes')"`), and the breadcrumb then ends with the cohort.

For pages about a program rather than one of its cohorts, use the program's own frame.

## What it loads

It reads the program and cohort from the address and loads the cohort with `GetCohortById`. A view samples it in response shape:

```ts
export const system = {
  user: 'admin',
  sample: { queries: { GetCohortById: { getCohortById: { id: 12, name: 'Maple Ridge — Spring', cohort_status: 'in_progress', /* … */ program: { id: 3, name: 'Game Making 101', role_id: null } } } } },
}
```

The view's route has no params, so in a view the cohort only shows where a component page provides them; this page's examples do.

## Who sees it

- **System and program admins** see it and may edit the cohort: the `actions` and default slots get `canEditCohort: true`.
- **The cohort's facilitator** (its Cohort Admin, `role_id` 22 on the cohort) sees it with `canEditCohort: false`, so the page leaves out Edit cohort.
- **Anyone else**, or an address pairing one program with another's cohort, sees nothing at all.

## Status

The badge reads the cohort's `cohort_status`: `not_started` shows Upcoming (info), `in_progress` In progress (success), `completed` Completed (neutral).
