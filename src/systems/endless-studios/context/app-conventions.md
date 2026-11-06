---
title: App Conventions
description: How the Endless Studios app composes its screens, so a view built from Nuxt UI and the copied components looks and behaves like it. The frame and page layouts, which components to build from, colour roles and contrast, surfaces and shape, type, overlays and feedback, navigation, gated actions, icons, focus and motion, what not to apply, and what is legacy. Rules only; the Theme pages hold the token values.
---

Sources: this system's copy of the app (`studios/` and `nuxt-ui.config.ts`, copied at `11517cbee`, 25 September 2026), checked against the app's `dev` branch at `eaa7d5f` (5 November 2026): `frontend/app/`, `frontend/docs/Components.md`, `frontend/docs/CONTRIBUTING.md` and the code-review skill's `reference.md`. Also Nuxt UI 4.8.2's own theme. Unmarked rules hold in the copy and on `dev`. Rules marked **Draft** come only from the unmerged `agents-md` branch (`frontend/DESIGN.md`, `frontend/docs/Theming.md`, `frontend/AGENTS.md` at `830b633`, 21 October 2026). The Studio Home design playground (`DESIGN.md`, `docs/animation.md` at `ffe336d`, 9 September 2026) is used only where the app agrees.

## Decide first

A hi-fi view is a screen of the real app. Settle four things before any markup:

1. **Frame.** A screen inside the platform takes the app's frame with `shell: true` ([Studio sidebar](../components/studio-sidebar/studio-sidebar.md)). A standalone screen (sign-up, log-in, an onboarding step, a full-screen editor) fills the window without it. Either way the view fills the preview as the app fills the browser, with no floating card, device frame or fixed-width stage around it.
2. **Page layout.** Use the app's page component for the kind of page ([Page frame and layouts](#page-frame-and-layouts)).
3. **Components.** Use a Nuxt UI component first, then a copied app component, then plain markup only when neither fits ([Components to build from](#components-to-build-from)).
4. **Styling.** Override nothing that `nuxt-ui.config.ts` doesn't. Buttons, inputs, badges and cards keep their configured radius, colour and shadow, so a pill (`rounded-full`) button or a re-rounded card is not the app. Style with Tailwind utilities in the markup. Use a `<style>` block only for what utilities can't express.

## Page frame and layouts

- `shell: true` draws the frame of the app's `new` layout: the sidebar, the mobile top bar and the footer. The app's redesigned pages use that layout, and the system stylesheet gives every screen its `bg-slate-50` page.
- Inside the frame, a page is one of the app's page components from `~/components/App/`:
  - `AppSimplePage` is a standalone page. It has a `header` slot (full-width banners flush to the top), a `hero` slot and the default content. It sets each band in a `UContainer` with `mt-4 md:mt-12`, and `full-width` lets the content span the viewport. The home page is one: a live-event banner in `header`, the carousel `Hero` in `hero`, then a 12-column grid (3, 6 and 3 columns from `lg`, `gap-6`).
  - `AppPage` is the bare base: a `header` slot and bottom spacing, for a page that lays out its own bands.
  - `AppDetailPage` (in the app, not yet copied) is a drill-down page such as a profile. It has `banner` and `cover` slots, a `sidebar` that overlaps the cover and stacks above the content on narrow screens, and a `navigation` slot (route tabs, with a separator under them).
- Admin pages put their content straight in a `UContainer` under `AdminPageHeader` (not yet copied; see [Breadcrumb](../components/breadcrumb/breadcrumb.md)). The header holds a breadcrumb, the title with an optional status badge, a muted subtitle and actions on the right, over a bottom border.
- Content takes the container's width and padding ([Container](../components/container/container.md)). Size blocks with padding and gaps, not fixed heights, so they survive small screens and larger text. Use Tailwind's own breakpoints (`sm`, `md`, `lg`, `xl`).

## Components to build from

1. **Nuxt UI 4.8.** The component pages under `components/` say how the app uses each one: when to use it, the Studios variants and accessibility. For a component without a page, Nuxt UI's documentation for 4.8 is the API. Pick the component that fits the meaning, not the look.
2. **Copied app components**, imported by their app paths. There are two kinds:
   - *Built to the conventions, so you can imitate them:* `App/AppPage`, `App/AppSimplePage`, `Generic/UserAvatar` (an avatar that falls back to the app's default picture), `Generic/UserCard` (avatar and username linking to the profile; the app has since replaced it with `Entity/UserToken`, with the same props), `Profile/UserProfileCard` (the app's own example of `UCard` composition), `Dashboard/OnboardingCard` and `Notifications/NotificationTile`.
   - *Screen parts that predate the conventions:* `Dashboard/Hero`, `Dashboard/ProgramTileEmpty`, `Dashboard/UpcomingEvents`, `Program/ProgramTile`, `Profile/UserProfile`, `Profile/UserBadges`, `Generic/ZeroState` and `shared/AccessCode`. Use them as they are to show that part of the app. Keep their scoped styles, raw greys and legacy utilities out of new UI.
3. **In the app's component catalog but not yet copied.** When a view needs one of these, bring it in by following "Refreshing the copy" in [`studios/README.md`](../studios/README.md). A look-alike redrawn in a view from Nuxt UI is an approximation, so say so when you hand the view over.
   - Layout: `AppDetailPage`, and `CohortAdminWrapper` (the cohort admin hub, whose header shows the cohort's name, dates, status and settings).
   - Dialogs: `UConfirmationModal`, `UPromptModal` ([Overlays, forms and feedback](#overlays-forms-and-feedback)).
   - Users: `UserToken` and the other entity tokens (program, game, cohort, institution, certificate), plus `UserRoleBadges`, `ProfileSection`, `ProfileGameCard`, `UserPortfolioCard`, `ContributionTypeBadge`, `CertificateCard`, `ProfileCoverModal` and `EditProfileModal`.
   - Skills: `SkillToken`, `SkillSubdomainIcon`, `SkillDomainCard`, `SkillSubdomainCard`, `SkillSubdomainItem` and `TopSkillsCard`. What they show is in [Skills and recognition](skills-and-recognition.md).
   - Enrollment: `EnrollmentModal`, `JoinConfirmationModal`, `JoinSuccessCard`. See [Programs](programs.md).
   - Gating: `RestrictedButton`, `KIDChallengeModal`, `RestrictedPartnerInfoModal` ([Gated actions](#gated-actions)).
   - Leader analytics: `AnalyticsKPI`, `DateRangePicker`.
   - Generic: `MarkdownBody` (sanitised Markdown shown as prose), `ProgressLollipop`, `SvgSymbol`, `YoutubePlayer`. `InfiniteScroll` imports fine, but a stand-in answers it: it renders the given items and the empty slot, and loads no more.

## Colour

Colour is a role, and a component takes it through its `color` prop. The roles are `primary` (orange), `secondary` (cornflower), `neutral` (slate), `kids` (teal) and the status roles `info`, `success`, `warning` and `error`.

- **Primary** is the screen's one main action. The actions around it are `neutral` outline or ghost buttons ([Button](../components/button/button.md)).
- **Secondary** is for emphasis that isn't the main action: a secondary button on an image or in a card, soft badges, links in prose.
- **Status roles** name a state. Badges, alerts and toasts take their colour from what they report ([Badge](../components/badge/badge.md), [Alert](../components/alert/alert.md)).
- **Kids** is for gating only ([Gated actions](#gated-actions)). The one other place the app uses teal is as one of a chart's band colours.
- **Skill domains** each have their own palette: Game Design is cyan, Art purple, Go to Market green, Engineering orange, and Management & Production rose. Contribution types use the same five. The app applies a palette by pointing the `--ui-color-primary-*` and `--ui-primary` variables at it in a `style` on the domain's element (`getDomainStyle` in its `components/Profile/utils.ts`), so everything inside uses `primary` and comes out in the domain's colour. A view does the same with the palette's `--color-<name>-*` variables. [Skills and recognition](skills-and-recognition.md) says what the domains are.
- **Status lookups.** Map a record's status to a colour with one typed lookup and a `neutral` fallback, and show it as a soft badge. That is how the app colours programs: draft is `warning`, not started is `info`, in progress is `success`, and completed, hidden and archived are `neutral`. Cohorts follow the same pattern: upcoming is `info`, in progress is `success` and completed is `neutral`. [Programs](programs.md) says what the statuses mean, and [write-sample-data](../skills/write-sample-data/SKILL.md) gives their values.
- **Semantic utilities.** For colour on a single element, use the semantic utilities. Raw palette shades (`text-gray-500`, `bg-slate-100`) are for content and charts, not chrome, and hex colours in classes or inline styles are for neither. The utilities are:
  - Text: `text-highlighted`, `text-default`, `text-toned`, `text-muted`, `text-dimmed`, `text-inverted`.
  - Backgrounds: `bg-default`, `bg-muted`, `bg-elevated`, `bg-accented`, `bg-inverted`.
  - Borders: `border-default`, `border-muted`, `border-accented`.
- **Draft: what each utility is for.**
  - Text: highlighted is for headings and emphasis, default for body copy, and toned, muted and dimmed for supporting, secondary and placeholder copy. Inverted goes on dark or coloured fills.
  - Backgrounds: default is a card, muted the page, elevated an inset panel, accented a recessed control, inverted a dark accent.
- The text roles are one step darker than Nuxt UI's defaults. `.prose` already uses them, with links in secondary, so leave prose unstyled.
- **Contrast.** White text on a solid fill fails WCAG AA for normal text on four roles: primary (2.9:1, which fails even for large text), warning (3.2:1), info (4.0:1) and success (4.4:1). Secondary (5.1:1) and error (4.8:1) pass. The app's default button is solid primary, so draw it as the app does; fixing that belongs to the app's theme, not to a view. Wherever else a warm colour fills an area, use the soft or subtle variant (a tint with darker text), as the app's badges and alerts do. Orange text on white measures the same 2.9:1, so in new UI colour words with `text-secondary`, as the onboarding card's title and prose links do. Keep `text-primary` for icons and spinners.

## Surfaces, shape and depth

- Depth comes from white cards on the slate page. [Card](../components/card/card.md) gives the `UCard` variants and when each fits.
- Borders come before shadows. Separate a block with `border-default`, which is Nuxt UI's neutral 200 (slate). The only shadows are the ones the components bring: the outline card's and those on overlays and toasts. Add none of your own.
- Containers are rounder than controls. The config gives cards `rounded-2xl` and alerts `rounded-xl`. Buttons, inputs and badges keep Nuxt UI's own radius (`rounded-md` at the default size).
- **Draft:** a section divider is a `USeparator` ([Separator](../components/separator/separator.md)), not a `border-t` or `border-b` on the next block. Today the app uses both: separators inside cards and under page navigation, borders under admin headers and card headings.
- An empty section is a `soft` card holding one short centred line, padded with `py-6`, as `ProfileSection` does it. `ZeroState` is built from legacy utilities.

## Type

- Inter is the body face and Figtree the heading face. The base layer sets `h1` to `h6` in Figtree semibold. `font-heading` gives the face to an element that isn't a heading, as the hero's slide titles do.
- Make a title a heading element and size it with Tailwind's scale (`text-xs` to `text-4xl`). For example, `AdminPageHeader`'s title is `text-2xl` (`text-4xl` on wide screens), and `ProfileSection`'s section titles are `text-lg`.
- Give every text element a size and a colour utility. The app's base stylesheet still sizes bare elements (a `p` at 15px, an `h1` at 26px, an `h6` at 12px), so unstyled text won't match the app's components.
- Copy, casing and strings are in [Voice and tone](voice-and-tone.md).

## Overlays, forms and feedback

- **Dialogs.** A short task or a decision is a `UModal` ([Modal](../components/modal/modal.md)). A longer form or an editor is a `USlideover` ([Slideover](../components/slideover/slideover.md)). The app opens them from code with `useOverlay` and awaits the result. A view may use `useOverlay` or `v-model:open`.
- **Confirmation.** Follow the shape on [Modal](../components/modal/modal.md), as the app's `UConfirmationModal` draws it. The confirm button is `primary` unless the action calls for another colour.
- **Single-field prompt.** This is `UPromptModal`'s shape: the question as the dialog's text, one `UInput` in a `UForm`, a neutral outline Cancel and a primary submit button.
- **Forms.** Use `UForm` with one state object and a schema, and put each field in a `UFormField` ([Form](../components/form/form.md)).
- **Toasts.** A toast reports an outcome that isn't on screen: a save or create that closes its panel, a copy to the clipboard, a server error. It has a title only, with `color` `success` or `error`. When the result shows where the person acted, the change on screen is the feedback. A field's error stays on the field.
- **Alerts.** A condition that stays true while the person is on the page is an alert ([Alert](../components/alert/alert.md)).

## Navigation and tabs

- **Tabs.** In the app, tabs that change what a page shows are routes. The profile's Overview, Skills, Certificates and Games are separate pages under `AppDetailPage`'s navigation, drawn as a neutral pill `UNavigationMenu` ([Navigation menu](../components/navigation-menu/navigation-menu.md)). In a prototype, make each tab its own view, linked with `PrototypeLink` or `usePrototypeNavigate`, or a named state of one view. Set `active: true` on the item the view shows. `UTabs` only switches between views of the same data on one page ([Tabs](../components/tabs/tabs.md)).
- **Links.** Going to another page is a link (`to` on `UButton`, `ULink` or `NuxtLink`), not a click handler that navigates.
- **Underlines.** `base.css` underlines every link on hover and focus, so a button, card or menu item rendered as a link adds `no-underline`, as the app's do.
- **Clickable rows and cards.** A row or card that opens something is one link around its content, as `NotificationTile` is (`no-underline` with a `hover:bg-elevated/50` fill).

## Gated actions

An action someone can't take yet stays where it is and shows that it's gated. It is `UButton color="kids" variant="gating"`, the Kids gating variant on [Button](../components/button/button.md). Its trailing icon is `i-lucide-shield` when the action waits on parental consent and `i-lucide-lock` for a restricted-partner account. A tooltip reads `kid_challenge.restricted_feature_click_for_more_information` or `restricted_partner_data.restricted_feature_click_for_more_information`. This is what the app's `RestrictedButton` renders (not yet copied); with no gate, it is a plain `UButton`.

Pressing it opens either the consent challenge or the restricted-partner explanation. Both are modals on `bg-gating-gradient`, the kids-tinted glow the stylesheet keeps for gated surfaces. Who meets which gate is in [Platform model](platform-model.md).

## Icons

- Interface icons are Lucide, named `i-lucide-*`, on `UIcon` or a component's `icon`, `leading-icon` and `trailing-icon` props. Only the Lucide set is installed here. The few Heroicons and brand logos (Simple Icons) the app uses won't render, so use Lucide's nearest icon.
- Illustrations and the app's own drawn icons (notification types, medals, the controller) are images under `~/assets/images/`. They are listed on the system's Images and Icons pages.

## Focus, pointer and motion

- **Focus.** Nuxt UI components draw their own focus ring for each variant. An element you build yourself takes `focus-visible:outline-2 focus-visible:outline-offset-2` plus a semantic outline colour, which is how solid buttons and the config's gating variant do it.
- **Pointer.** Every clickable is a real button or link, so it gets focus, a keyboard action and the pointer. The base layer gives `button` and `[role='button']` the pointer cursor, and links have it from the browser.
- **Motion.** The app adds no motion system of its own. Nuxt UI moves its components: dialogs, menus and popovers scale in with ease-out (100 to 200ms), slideovers slide in, and buttons and inputs transition their colour. The easings in `base.css` and `main.css` (such as 0.15s ease-in-out on `.form-control`) belong to legacy classes. When a view adds motion, animate `opacity` and `transform` with Tailwind's transition utilities and ease-out, and add `motion-reduce:transition-none` or `motion-reduce:animate-none`.

## Not these

- **The artifact theme.** The workspace's Endless Studios artifact theme (`endless-studios-theme.md`) styles slides, reports and pages made outside the studio. It does not apply to views. Its 24px and 32px cards, 100px pills, `#dcdce9` hairline border and bold Figtree headings are not the app's. A view needs no font import either, because the system stylesheet bundles Inter and Figtree.
- **The Studio Home playground.** The playground's `DESIGN.md` differs from the app. It uses `UPageCard` at `rounded-3xl`, a 1080px container and `#dcdce9` as the default border. The app uses `UCard` at `rounded-2xl`, its own container width and `border-default`. In the app, `#dcdce9` survives only as the legacy `--color-gray-dark-border`. The playground's motion playbook (`docs/animation.md`) is a target the app hasn't adopted.

## Legacy

Don't build on these. They predate the Nuxt UI theme:

- **The rest of `main.css`'s `@theme` block.** A `FIXME` marker in the block marks everything after it as legacy. Only the two font families after the marker are still in use. The rest covers:
  - the `text-d1` to `text-d3`, `text-h1` to `text-h6`, `text-body` and `text-caption-*` scale (`text-h6` is 18px, not an `h6`'s size);
  - the named one-off colours (such as `gray-light`, `gray-dark-border`, `orange-endless` and `blue-main`);
  - the fractional spacing, width and radius steps;
  - the `xsm`, `tablet` and `1_5xl` breakpoints.
- **Old classes.** The classes in `base.css` and `modals.css` (`.main-btn`, `.form-control`, `.modal-*`) style older markup.
- **Draft:**
  - the `tailwind-btn*`, `card-general-styles`, `menu`, `title`, `caption-*` and `body` utilities and the Bootstrap-style modal and nav utilities in `main.css`;
  - the app's `layouts/default.vue`;
  - everything in `components/shared/`.
