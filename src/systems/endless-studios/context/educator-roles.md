---
title: Educator Roles
description: The proposed educator role model, approved by Bernardo on 11 November 2026 and not built. Covers the three entities (Organization, Team, Cohort), the Independent Educator, which Programs each can run, each role's permissions and who awards and strips it, the rules every role follows, how each role maps to today's roles, and the open questions.
toc: true
---

Source: Educator Role Permissions, approved by Bernardo on 11 November 2026. It replaces the Institutions and Teams roles study of 14 October 2026. Learner roles are defined separately and are not covered here.

## Using this model

Nothing here is built. Today's roles are in [Platform model](platform-model.md). Label a view that follows this model as **Proposed**.

1. Name the entity the screen is about (Organization, Team or Cohort) and the viewer's role in it.
2. Show an action only to the roles that have it in "Roles", directly or through inheritance and "Acts as". Show a role-management control only to the roles that award or strip that role.
3. A person who holds roles in several entities sees each entity with that entity's role only.

## Rules for every role

- Every role is scoped to its entity: an Organization, a Team or a Cohort. The Independent Educator is the exception, because it isn't scoped to an Organization.
- A role in one entity grants nothing in another.
- One person can hold roles in several entities at once, for example Team Owner of two Teams and Facilitator in a Cohort outside any Organization.
- Anyone can give up a role they hold. The exception is the last Owner of an Organization, Team or Cohort, who must award the role to someone else first.
- A higher role holds every permission of the roles it lists as included. "Acts as" gives a role the permissions of another role in every entity below it.
- A Team or Cohort with no Organization is **Independent**.

## Roles

### Organization

| Role | Permissions | Awarded by | Stripped by |
|---|---|---|---|
| **Org Owner** | Award Org Owner. Award and strip Org Manager. Rename the Organization (open question). Everything an Org Manager can do. | Endless Admin | Endless Admin only |
| **Org Manager** | Award and strip Org Educator, Org Reviewer and Team Owner. Everything an Org Educator can do. Acts as Team Owner for every Team in the Organization. | Org Owner | Org Owner |
| **Org Reviewer** | View everything inside the Organization and its Teams and Cohorts (scope is an open question). | Org Manager | Org Manager |
| **Org Educator** | Create Teams in the Organization. | Org Manager | Org Manager |

Only an Endless Admin archives an Organization.

### Independent Educator

| Role | Permissions | Awarded by |
|---|---|---|
| **Independent Educator** | Create Independent Teams. | Self |

- An educator who signs up outside an Organization automatically gets an Independent Team, with the educator as its Team Owner.
- An Independent Educator can join Organizations. They can still create Independent Teams, and their existing Independent Teams stay Independent. Creating a Team inside the Organization needs the Org Educator role.

### Team

| Role | Permissions | Awarded by | Stripped by |
|---|---|---|---|
| **Team Owner** | Award Team Owner. Award and strip Team Manager. Strip Cohort Owner. View consolidated reports from every Cohort. Edit the Team. Archive and unarchive the Team. Everything a Team Manager can do. Acts as Cohort Owner for every Cohort in the Team. | Org Manager; a Team Owner of the same Team; self, when creating a Team | Org Manager. In an Independent Team, Endless Admin only. |
| **Team Manager** | Create Cohorts. | Org Manager; a Team Owner of the same Team | Team Owner |

A Team Owner of several Teams awards Team roles in each of their own Teams only.

### Cohort

| Role | Permissions | Awarded by | Stripped by |
|---|---|---|---|
| **Cohort Owner** | Award Cohort Owner. Award and strip Cohort Manager. Edit the Cohort. Archive and unarchive the Cohort. Everything a Cohort Manager can do. | Team Owner; a Cohort Owner of the same Cohort; self, when creating a Cohort | Team Owner |
| **Cohort Manager** | Award and strip Cohort Facilitator. View consolidated reports from the Cohort. Everything a Cohort Facilitator can do. | Cohort Owner | Cohort Owner |
| **Cohort Facilitator** | See the Cohort's information. Manage sessions. Manage learner tasks. Award and strip Cohort Learner. Grant certificates. | Cohort Manager | Cohort Manager |

A Cohort Owner of several Cohorts awards Cohort roles in each of their own Cohorts only.

## Programs

- A Cohort is one run of a Program. A Cohort can only run a Program its Organization has access to.
- Every Organization has access to the Programs open to everyone by default. It can also have access to custom Programs.
- Independent Teams have access only to the Programs open to everyone by default.
- To get access to custom Programs, an educator or Organization contacts Endless Access and requests a Partnership.

Today a Program may belong to one institution, and a restricted institution keeps an allowlist of the programs its members may join ([Platform model](platform-model.md), [Programs](programs.md)).

## Mapping to today

**Assumption** (from what each role can do, not a product decision): the nearest role in [Platform model](platform-model.md) for each proposed role.

| Proposed role | Nearest role today | Difference |
|---|---|---|
| Endless Admin | Admin (1) | Same role. |
| Organization | Institution | Today's institution has members (`students`) and no Teams. |
| Org Owner, Org Manager | Institution Admin (20) | Today's Institution Admin has no power over programs or cohorts. Only one level exists. |
| Org Reviewer | none | **Gap** today: no read-only reporting role. |
| Org Educator, Team Owner, Team Manager | Manager (23), Program Admin (14) | Today a Manager creates cohorts and sees only their own. No Team exists. |
| Cohort Owner, Cohort Manager | Program Admin (14) for editing cohorts | Today only a Program Admin edits or deletes a cohort. No per-cohort owner exists. |
| Cohort Facilitator | Facilitator, stored as Cohort Admin (22) | Close match. |
| Cohort Learner | Learner, stored as Cohort Member (21) | Defined in the separate learner roles. |

## Words

- Use "Organization" in copy for this model. Today's app and data say "Institution".
- "Team" already has two meanings in the app (see "Words" in [Platform model](platform-model.md)). In this model it means a group of educators that holds Cohorts.
- Write role names in full ("Team Owner", "Cohort Manager"). "Owner" or "Manager" alone is ambiguous across entities.

## Open questions

- Can the Org Owner rename the Organization, or only an Endless Admin?
- Org Reviewer scope: aggregated reports only, or learner-level data too? Recommendation: aggregated only, because of minors' data (Safeguarding in [User types](user-types.md)).
